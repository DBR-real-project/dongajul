"""
⑤-v2 UMAP 2D 시각화 + K-means 클러스터링 (개선판)

변경사항:
  - N_CLUSTERS: 12 → 15 (HBR 영어기사 클러스터가 언어 기반으로 뭉치는 문제 해결)
  - 영어 불용어 추가 (the, to, and 등 키워드에서 제거)
  - 한국어 범용어 불용어 추가 (사람, 기업, 생각 등)
  - 출력 파일명에 _v2 suffix (기존 파일 보존)

입력 : 데이터처리/output/embeddings.npy
       데이터처리/output/articles_meta.parquet

출력 : 데이터처리/output/umap_coords_v2.parquet
       데이터처리/output/cluster_info_v2.parquet
       데이터처리/output/semantic_map_v2.json
       데이터처리/output/clusters_v2.json

실행: python 데이터처리/umap_cluster_v2.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer

sys.stdout.reconfigure(encoding="utf-8")

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

N_CLUSTERS   = 15
TOP_KW_COUNT = 10
UMAP_SEED    = 42

# ── 불용어 정의 ──────────────────────────────────────────────────────────────
# 영어 불용어 (HBR 기사에서 the, to, and 등 제거)
ENGLISH_STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
    'that', 'this', 'these', 'those', 'it', 'its', 'they', 'their', 'them',
    'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her', 'i', 'my',
    'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very',
    'just', 'also', 'about', 'above', 'after', 'before', 'between',
    'into', 'through', 'during', 'how', 'what', 'when', 'where', 'which',
    'who', 'why', 'all', 'each', 'every', 'any', 'many', 'much', 'few',
    'if', 'then', 'than', 'while', 'although', 'because', 'since', 'unless',
    'companies', 'company', 'business', 'businesses', 'employees', 'work',
    'new', 'one', 'two', 'three', 'first', 'second', 'make', 'made', 'can',
    'get', 'use', 'used', 'using', 'say', 'said', 'says', 'well', 'even',
    'up', 'out', 'down', 'back', 'way', 'time', 'year', 'years', 'day',
}

# 한국어 범용어 불용어 (어디서나 나오는 단어들)
KOREAN_STOPWORDS = {
    '기업', '사람', '생각', '경우', '통해', '위해', '대한', '관련',
    '것', '수', '및', '등', '이', '가', '를', '은', '는', '에',
    '의', '와', '과', '도', '으로', '로', '이다', '있다', '하다',
    '되다', '않다', '없다', '이런', '저런', '그런', '이것', '저것',
    '그것', '여기', '저기', '거기', '우리', '자신', '스스로', '함께',
    '때문', '따라', '통한', '중심', '기반', '바탕', '측면', '부분',
    '방식', '방법', '과정', '결과', '내용', '상황', '문제', '필요',
    '중요', '다양', '가능', '현재', '이미', '특히', '실제', '또한',
    '하지만', '그러나', '따라서', '그리고', '그래서', '하여', '있는',
    '하는', '되는', '보는', '같은', '다른', '새로운', '더', '가장',
    '많은', '큰', '작은', '높은', '낮은', '좋은', '나쁜', '중', '후',
}

ALL_STOPWORDS = list(ENGLISH_STOPWORDS | KOREAN_STOPWORDS)


def resolve_output_dir() -> Path:
    candidate_dirs = [
        OUT_DIR,
        ROOT / "NLP" / "output",
        Path(__file__).resolve().parent / "output",
    ]
    for path in candidate_dirs:
        if (path / "embeddings.npy").exists() and (path / "articles_meta.parquet").exists():
            return path

    print("\n[오류] 필요한 입력 파일을 찾지 못했습니다.")
    print("필요 파일: embeddings.npy, articles_meta.parquet")
    for path in candidate_dirs:
        print(f"  - {path}")
    raise FileNotFoundError("embeddings.npy 또는 articles_meta.parquet 파일이 없습니다.")


def get_top_keywords(token_strs: list[str], top_n: int = TOP_KW_COUNT) -> str:
    """TF-IDF 기준 상위 키워드 추출 (영어/한국어 불용어 제거)."""
    if not token_strs:
        return ""

    token_strs = [str(x) for x in token_strs if pd.notna(x) and str(x).strip()]
    if not token_strs:
        return ""

    vec = TfidfVectorizer(
        max_features=5000,
        min_df=1,
        stop_words=ALL_STOPWORDS,  # 불용어 적용
    )

    try:
        mat = vec.fit_transform(token_strs)
    except ValueError:
        return ""

    scores = np.asarray(mat.mean(axis=0)).flatten()
    top_idx = scores.argsort()[::-1][:top_n]
    terms = np.array(vec.get_feature_names_out())[top_idx]

    # 추가 필터: 1~2글자 단어 제거 (한국어 조사/단음절 방지)
    terms = [t for t in terms if len(t) >= 3 or (t.isascii() and len(t) >= 3)]

    return ", ".join(terms[:top_n])


def main() -> None:
    global OUT_DIR
    OUT_DIR = resolve_output_dir()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── 데이터 로드 ──────────────────────────────────────────────────────
    print("=" * 60)
    print("⑤-v2 UMAP + K-means (개선판) 시작")
    print(f"  N_CLUSTERS: {N_CLUSTERS} (기존 12 → 15)")
    print(f"  불용어: 영어 {len(ENGLISH_STOPWORDS)}개 + 한국어 {len(KOREAN_STOPWORDS)}개")
    print("=" * 60)

    print("\n데이터 로드...")
    embeddings = np.load(str(OUT_DIR / "embeddings.npy")).astype(np.float32)
    meta       = pd.read_parquet(OUT_DIR / "articles_meta.parquet")
    print(f"임베딩: {embeddings.shape}  메타: {len(meta)}건")

    if len(embeddings) != len(meta):
        raise ValueError(f"임베딩/메타 건수 불일치: {len(embeddings)} vs {len(meta)}")

    # source 분포 확인
    if "source" in meta.columns:
        print("\n소스 분포:")
        print(meta["source"].value_counts().to_string())

    # ── UMAP 2D 변환 ──────────────────────────────────────────────────
    try:
        import umap
    except ImportError:
        print("[오류] umap-learn 미설치: pip install umap-learn")
        return

    n_neighbors = min(15, max(2, len(meta) - 1))
    print(f"\nUMAP 2D 변환 중... (n_neighbors={n_neighbors})")

    t0 = time.time()
    reducer = umap.UMAP(
        n_components=2,
        n_neighbors=n_neighbors,
        min_dist=0.1,
        metric="cosine",
        random_state=UMAP_SEED,
        verbose=False,  # 로그 간소화
    )
    coords_2d = reducer.fit_transform(embeddings)
    print(f"UMAP 완료: {time.time()-t0:.1f}s  shape={coords_2d.shape}")

    # ── K-means 클러스터링 ──────────────────────────────────────────────
    n_clusters = min(N_CLUSTERS, len(meta))
    print(f"\nK-means 클러스터링 (n_clusters={n_clusters}) ...")

    t0 = time.time()
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_ids = km.fit_predict(coords_2d)
    print(f"K-means 완료: {time.time()-t0:.1f}s")

    # 클러스터별 건수 + source 분포 확인
    print("\n클러스터별 건수 및 HBR 비율:")
    for cid in range(n_clusters):
        mask = cluster_ids == cid
        cnt  = mask.sum()
        if "source" in meta.columns:
            src = meta["source"].values[mask]
            hbr_n = (src == "HBR").sum()
            hbr_pct = hbr_n / cnt * 100 if cnt > 0 else 0
            print(f"  클러스터 {cid:2d}: {cnt:4d}건  HBR={hbr_n}건({hbr_pct:.0f}%)")
        else:
            print(f"  클러스터 {cid:2d}: {cnt:4d}건")

    # ── umap_coords_v2 저장 ──────────────────────────────────────────
    df_coords = meta.copy()
    df_coords["umap_x"]     = coords_2d[:, 0].round(6)
    df_coords["umap_y"]     = coords_2d[:, 1].round(6)
    df_coords["cluster_id"] = cluster_ids

    coords_path = OUT_DIR / "umap_coords_v2.parquet"
    df_coords.to_parquet(coords_path, index=False)

    semantic_path = OUT_DIR / "semantic_map_v2.json"
    df_coords.to_json(semantic_path, orient="records", force_ascii=False, indent=2)
    print(f"\n저장: {coords_path}")

    # ── 클러스터 정보 (cluster_info_v2) ─────────────────────────────
    print("\n클러스터 키워드 추출 중...")

    token_str_list = None
    if "token_str" in meta.columns:
        token_str_list = meta["token_str"].tolist()
    else:
        for name in ("DBR", "HBR"):
            lbl_path = OUT_DIR / f"{name}_labeled.parquet"
            if lbl_path.exists():
                df_lbl = pd.read_parquet(lbl_path)
                if "token_str" in df_lbl.columns:
                    token_str_list = (token_str_list or []) + df_lbl["token_str"].tolist()

    cluster_rows = []
    for cid in range(n_clusters):
        mask = cluster_ids == cid
        cnt  = mask.sum()

        # 상위 키워드
        if token_str_list and len(token_str_list) == len(cluster_ids):
            cluster_tokens = [token_str_list[i] for i, m in enumerate(mask) if m]
            top_kw = get_top_keywords(cluster_tokens)
        else:
            top_kw = ""

        cx = coords_2d[mask, 0].mean()
        cy = coords_2d[mask, 1].mean()

        if "label" in meta.columns:
            cluster_labels = meta["label"].values[mask]
            success_n = (cluster_labels == 1).sum()
            failure_n = (cluster_labels == 0).sum()
        else:
            success_n = 0
            failure_n = 0

        # source 정보
        hbr_ratio = 0.0
        if "source" in meta.columns:
            src = meta["source"].values[mask]
            hbr_ratio = round((src == "HBR").sum() / cnt * 100, 1) if cnt > 0 else 0.0

        cluster_rows.append({
            "cluster_id":    cid,
            "cluster_name":  f"cluster_{cid:02d}",   # 이름은 나중에 수동 지정
            "top_keywords":  top_kw,
            "article_count": int(cnt),
            "center_x":      round(float(cx), 4),
            "center_y":      round(float(cy), 4),
            "success_count": int(success_n),
            "failure_count": int(failure_n),
            "hbr_ratio":     hbr_ratio,
        })

        print(f"  클러스터 {cid:2d} ({cnt}건, HBR {hbr_ratio:.0f}%) 키워드: {top_kw[:70]}")

    df_clusters = pd.DataFrame(cluster_rows)

    cluster_path = OUT_DIR / "cluster_info_v2.parquet"
    df_clusters.to_parquet(cluster_path, index=False)

    clusters_json_path = OUT_DIR / "clusters_v2.json"
    df_clusters.to_json(clusters_json_path, orient="records", force_ascii=False, indent=2)

    print(f"\n저장: {cluster_path}")
    print(f"저장: {clusters_json_path}")

    # ── HBR 분포 요약 ─────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("HBR 비율 분포 요약 (높은 순)")
    print("=" * 60)
    df_sorted = df_clusters.sort_values("hbr_ratio", ascending=False)
    for _, row in df_sorted.iterrows():
        bar = "█" * int(row["hbr_ratio"] / 5)
        print(f"  클러스터 {int(row['cluster_id']):2d} | HBR {row['hbr_ratio']:5.1f}% {bar}")
        print(f"           키워드: {row['top_keywords'][:60]}")

    print("\n⑤-v2 완료")
    print("  → 기존 파일(umap_coords.parquet 등) 보존됨")
    print("  → 신규: umap_coords_v2.parquet, cluster_info_v2.parquet")
    print("  → cluster_name은 키워드 확인 후 수동으로 지정 필요")
    print("\n다음 단계: import_umap_to_db_v2.py 실행으로 DB 반영")


if __name__ == "__main__":
    main()
