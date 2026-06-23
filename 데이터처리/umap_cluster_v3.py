"""
⑤-v3 UMAP 2D 시각화 + K-means 클러스터링 (최종 개선판)

핵심 변경사항:
  - K-means를 2D UMAP 좌표가 아닌 원본 768차원 임베딩에 적용
    → 시각적 거리가 아닌 의미 기반 클러스터링
    → 스포츠/역사, MBA 등 서비스 무관 클러스터 방지
    → 브랜드/마케팅 중복, HR/조직 중복 해소
  - n_clusters=12 (최적 개수, 서비스 주제에 맞게 조정)
  - 소수 클러스터(300건 미만) 자동 병합
  - 불용어: 문법어만 (내용어는 TF-IDF에 맡김)
  - UMAP 2D는 시각화 전용 (cluster_id는 고차원 K-means 결과)

입력 : 데이터처리/output/embeddings.npy (13335 x 768)
       데이터처리/output/articles_meta.parquet

출력 : 데이터처리/output/umap_coords_v3.parquet
       데이터처리/output/cluster_info_v3.parquet
       데이터처리/output/semantic_map_v3.json
       데이터처리/output/clusters_v3.json

실행: python 데이터처리/umap_cluster_v3.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, MiniBatchKMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

sys.stdout.reconfigure(encoding="utf-8")

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

N_CLUSTERS        = 12   # 서비스 주제에 맞는 최적 개수
MIN_CLUSTER_SIZE  = 300  # 이 미만이면 인접 클러스터에 병합
TOP_KW_COUNT      = 8
UMAP_SEED         = 42

# 순수 문법어/접속어만 불용어 처리 (내용어는 TF-IDF 가중치에 맡김)
STOPWORDS = {
    # 영어 문법어
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','as','is','was','are','were','be','been','being','have',
    'has','had','do','does','did','will','would','could','should','may',
    'might','that','this','these','those','it','its','they','their','them',
    'we','our','you','your','he','she','his','her','i','my','not','no',
    'more','most','than','too','very','just','also','about','how','what',
    'when','where','which','who','why','all','each','every','any','many',
    'if','then','while','because','since','new','one','two','can','get',
    'use','say','said','well','even','up','out','down','time','year',
    # 한국어 문법어/조사/접속어만
    '것','수','및','등','이','가','를','은','는','에','의','와','과',
    '도','으로','로','이다','있다','하다','되다','않다','없다',
    '하지만','그러나','따라서','그리고','그래서','하여','있는','하는',
    '되는','같은','다른','더','가장','많은','큰','작은','높은','낮은',
    '좋은','나쁜','중','후','전','많다','좋다','크다','작다','높다',
    '낮다','되다','하다','이다','않다','들다','나다',
    '통해','통한','위해','위한','대한','때문','따라',
}


def resolve_output_dir() -> Path:
    for path in [OUT_DIR, ROOT / "NLP" / "output", Path(__file__).resolve().parent / "output"]:
        if (path / "embeddings.npy").exists() and (path / "articles_meta.parquet").exists():
            return path
    raise FileNotFoundError("embeddings.npy 또는 articles_meta.parquet 파일이 없습니다.")


def get_top_keywords(token_strs: list[str], top_n: int = TOP_KW_COUNT) -> str:
    token_strs = [str(x) for x in token_strs if pd.notna(x) and str(x).strip()]
    if not token_strs:
        return ""
    vec = TfidfVectorizer(max_features=3000, min_df=2, stop_words=list(STOPWORDS))
    try:
        mat = vec.fit_transform(token_strs)
        scores = np.asarray(mat.mean(axis=0)).flatten()
        top_idx = scores.argsort()[::-1][:top_n * 2]
        terms = list(np.array(vec.get_feature_names_out())[top_idx])
        # 2글자 이하 영어 단어 제거
        terms = [t for t in terms if not (t.isascii() and len(t) <= 2)]
        return ", ".join(terms[:top_n])
    except ValueError:
        return ""


def merge_small_clusters(
    cluster_ids: np.ndarray,
    embeddings: np.ndarray,
    min_size: int,
) -> np.ndarray:
    """min_size 미만 클러스터를 가장 가까운 클러스터 중심에 병합."""
    ids = cluster_ids.copy()
    changed = True
    while changed:
        changed = False
        unique, counts = np.unique(ids, return_counts=True)
        small = unique[counts < min_size]
        if len(small) == 0:
            break

        # 전체 클러스터 중심 계산 (소수 클러스터 포함)
        big_ids = unique[counts >= min_size]
        if len(big_ids) == 0:
            break

        centroids = {cid: embeddings[ids == cid].mean(axis=0) for cid in big_ids}

        for cid in small:
            mask = ids == cid
            centroid = embeddings[mask].mean(axis=0)
            # 가장 가까운 대형 클러스터 찾기
            nearest = min(big_ids, key=lambda c: np.linalg.norm(centroid - centroids[c]))
            ids[mask] = nearest
            changed = True
            print(f"  클러스터 {cid} ({mask.sum()}건) → 클러스터 {nearest}에 병합")

    # ID 재정렬 (0, 1, 2, ...)
    old_ids = sorted(np.unique(ids))
    id_map = {old: new for new, old in enumerate(old_ids)}
    return np.array([id_map[i] for i in ids])


def main() -> None:
    global OUT_DIR
    OUT_DIR = resolve_output_dir()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("⑤-v3 UMAP + 고차원 K-means (최종판)")
    print(f"  전략: 768차원 임베딩 기반 K-means (의미 중심 클러스터링)")
    print(f"  N_CLUSTERS: {N_CLUSTERS} / 소수 클러스터 병합: {MIN_CLUSTER_SIZE}건 미만")
    print("=" * 60)

    # ── 데이터 로드 ──────────────────────────────────────────────────
    print("\n데이터 로드...")
    embeddings = np.load(str(OUT_DIR / "embeddings.npy")).astype(np.float32)
    meta       = pd.read_parquet(OUT_DIR / "articles_meta.parquet")
    print(f"임베딩: {embeddings.shape}  메타: {len(meta)}건")

    if "source" in meta.columns:
        print("소스 분포:")
        print(meta["source"].value_counts().to_string())

    # L2 정규화 (코사인 유사도 기반 K-means)
    emb_normed = normalize(embeddings, norm="l2")

    # ── 고차원 K-means ───────────────────────────────────────────────
    print(f"\n고차원 K-means ({embeddings.shape[1]}차원, n_clusters={N_CLUSTERS}) ...")
    t0 = time.time()

    km = KMeans(
        n_clusters=N_CLUSTERS,
        random_state=42,
        n_init=15,       # 안정적인 수렴을 위해 init 횟수 증가
        max_iter=500,
    )
    cluster_ids = km.fit_predict(emb_normed)
    print(f"K-means 완료: {time.time()-t0:.1f}s")

    # 클러스터별 건수 출력
    vc = pd.Series(cluster_ids).value_counts().sort_index()
    print("\n클러스터별 건수:")
    for cid, cnt in vc.items():
        hbr = ""
        if "source" in meta.columns:
            src = meta["source"].values[cluster_ids == cid]
            hbr_pct = (src == "HBR").sum() / cnt * 100
            hbr = f"  HBR {hbr_pct:.0f}%"
        print(f"  클러스터 {cid:2d}: {cnt:5d}건{hbr}")

    # ── 소수 클러스터 병합 ────────────────────────────────────────────
    small_before = (vc < MIN_CLUSTER_SIZE).sum()
    if small_before > 0:
        print(f"\n{MIN_CLUSTER_SIZE}건 미만 소수 클러스터 {small_before}개 병합...")
        cluster_ids = merge_small_clusters(cluster_ids, emb_normed, MIN_CLUSTER_SIZE)
        vc_after = pd.Series(cluster_ids).value_counts().sort_index()
        print(f"병합 후 클러스터 수: {len(vc_after)}")
    else:
        print("\n소수 클러스터 없음 — 병합 불필요")

    n_final = len(np.unique(cluster_ids))

    # ── UMAP 2D (시각화 전용) ────────────────────────────────────────
    try:
        import umap as umap_lib
    except ImportError:
        print("[오류] umap-learn 미설치: pip install umap-learn")
        return

    # v2에서 계산된 UMAP 좌표 재활용 가능하면 재활용
    umap_v2_path = OUT_DIR / "umap_coords_v2.parquet"
    if umap_v2_path.exists():
        print("\nUMAP 2D: v2 좌표 재활용 (재계산 생략)")
        df_v2 = pd.read_parquet(umap_v2_path)
        coords_2d = df_v2[["umap_x", "umap_y"]].values
    else:
        n_neighbors = min(15, max(2, len(meta) - 1))
        print(f"\nUMAP 2D 재계산 중... (n_neighbors={n_neighbors})")
        t0 = time.time()
        reducer = umap_lib.UMAP(
            n_components=2, n_neighbors=n_neighbors,
            min_dist=0.1, metric="cosine",
            random_state=UMAP_SEED, verbose=False,
        )
        coords_2d = reducer.fit_transform(embeddings)
        print(f"UMAP 완료: {time.time()-t0:.1f}s")

    # ── umap_coords_v3 저장 ──────────────────────────────────────────
    df_coords = meta.copy()
    df_coords["umap_x"]     = coords_2d[:, 0].round(6)
    df_coords["umap_y"]     = coords_2d[:, 1].round(6)
    df_coords["cluster_id"] = cluster_ids

    df_coords.to_parquet(OUT_DIR / "umap_coords_v3.parquet", index=False)
    df_coords.to_json(OUT_DIR / "semantic_map_v3.json", orient="records", force_ascii=False, indent=2)

    # ── 키워드 추출 ──────────────────────────────────────────────────
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
    print("\n[클러스터 요약]")
    for cid in sorted(np.unique(cluster_ids)):
        mask = cluster_ids == cid
        cnt  = int(mask.sum())
        cx   = float(coords_2d[mask, 0].mean())
        cy   = float(coords_2d[mask, 1].mean())

        hbr_ratio = 0.0
        if "source" in meta.columns:
            src = meta["source"].values[mask]
            hbr_ratio = round((src == "HBR").sum() / cnt * 100, 1)

        if "label" in meta.columns:
            lbls = meta["label"].values[mask]
            success_n = int((lbls == 1).sum())
            failure_n = int((lbls == 0).sum())
        else:
            success_n = failure_n = 0

        top_kw = ""
        if token_str_list and len(token_str_list) == len(cluster_ids):
            cluster_tokens = [token_str_list[i] for i, m in enumerate(mask) if m]
            top_kw = get_top_keywords(cluster_tokens)

        cluster_rows.append({
            "cluster_id":    cid,
            "cluster_name":  f"cluster_{cid:02d}",
            "top_keywords":  top_kw,
            "article_count": cnt,
            "center_x":      round(cx, 4),
            "center_y":      round(cy, 4),
            "success_count": success_n,
            "failure_count": failure_n,
            "hbr_ratio":     hbr_ratio,
        })

        print(f"  [{cid:2d}] {cnt:5d}건  HBR {hbr_ratio:4.0f}%  {top_kw[:60]}")

    df_clusters = pd.DataFrame(cluster_rows)
    df_clusters.to_parquet(OUT_DIR / "cluster_info_v3.parquet", index=False)
    df_clusters.to_json(OUT_DIR / "clusters_v3.json", orient="records", force_ascii=False, indent=2)

    print(f"\n저장 완료")
    print(f"  umap_coords_v3.parquet  /  cluster_info_v3.parquet")
    print(f"  semantic_map_v3.json    /  clusters_v3.json")
    print(f"\n최종 클러스터 수: {n_final}")
    print("\n⑤-v3 완료 — cluster_name은 키워드 확인 후 확정")
    print("다음 단계: python 데이터처리/import_umap_to_db_v3.py")


if __name__ == "__main__":
    main()
