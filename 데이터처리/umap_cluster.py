"""
⑤ UMAP 2D 시각화 + K-means 클러스터링 (동아줄)

입력 : NLP/output/embeddings.npy          ← ③ 산출물 (N x 384)
       NLP/output/articles_meta.parquet   ← ③ 산출물

출력 : NLP/output/umap_coords.parquet     ← DB 저장용 (umap_x, umap_y, cluster_id 포함)
       NLP/output/cluster_info.parquet    ← clusters 테이블용 (cluster_name, top_keywords 등)

UMAP 설정
  - n_components=2 (2D 시각화)
  - n_neighbors=15, min_dist=0.1, metric='cosine'
  - 임베딩이 이미 L2-정규화 → cosine metric 그대로 사용

K-means 설정
  - n_clusters=12 (DBR 카테고리 수 참고, 조정 가능)
  - 클러스터별 top 키워드: articles_meta.parquet token_str 기반 TF-IDF

DB 매핑
  - article_vectors: umap_x, umap_y, cluster_id
  - clusters: cluster_id, cluster_name, top_keywords, article_count

실행: python NLP/umap_cluster.py
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

N_CLUSTERS   = 12
TOP_KW_COUNT = 10   # 클러스터 대표 키워드 수
UMAP_SEED    = 42


def get_top_keywords(token_strs: list[str], top_n: int = TOP_KW_COUNT) -> str:
    """문서 목록에서 TF-IDF 기준 상위 키워드 추출."""
    if not token_strs:
        return ""
    vec = TfidfVectorizer(max_features=5000, min_df=1)
    try:
        mat = vec.fit_transform(token_strs)
    except ValueError:
        return ""
    scores = np.asarray(mat.mean(axis=0)).flatten()
    top_idx = scores.argsort()[::-1][:top_n]
    terms = np.array(vec.get_feature_names_out())[top_idx]
    return ", ".join(terms)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── 데이터 로드 ──────────────────────────────────────────────────────
    print("데이터 로드...")
    embeddings = np.load(str(OUT_DIR / "embeddings.npy")).astype(np.float32)
    meta = pd.read_parquet(OUT_DIR / "articles_meta.parquet")
    print(f"임베딩: {embeddings.shape}  메타: {len(meta)}건")

    # ── UMAP 2D 변환 ────────────────────────────────────────────────────
    print(f"\nUMAP 2D 변환 중... (n_neighbors=15, min_dist=0.1, metric=cosine)")
    try:
        import umap
    except ImportError:
        print("[오류] umap-learn 미설치. pip install umap-learn")
        return

    t0 = time.time()
    reducer = umap.UMAP(
        n_components=2,
        n_neighbors=15,
        min_dist=0.1,
        metric="cosine",
        random_state=UMAP_SEED,
        verbose=True,
    )
    coords_2d = reducer.fit_transform(embeddings)
    print(f"UMAP 완료: shape={coords_2d.shape}, {time.time()-t0:.1f}s")

    # ── K-means 클러스터링 ────────────────────────────────────────────────
    print(f"\nK-means 클러스터링 (n_clusters={N_CLUSTERS}) ...")
    t0 = time.time()
    km = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init=10)
    cluster_ids = km.fit_predict(coords_2d)
    print(f"K-means 완료: {time.time()-t0:.1f}s")

    vc = pd.Series(cluster_ids).value_counts().sort_index()
    for cid, cnt in vc.items():
        print(f"  클러스터 {cid:2d}: {cnt}건")

    # ── umap_coords 저장 ─────────────────────────────────────────────────
    df_coords = meta.copy()
    df_coords["umap_x"]    = coords_2d[:, 0].round(6)
    df_coords["umap_y"]    = coords_2d[:, 1].round(6)
    df_coords["cluster_id"] = cluster_ids

    coords_path = OUT_DIR / "umap_coords.parquet"
    df_coords.to_parquet(coords_path, index=False)
    print(f"\n저장: {coords_path}")

    # ── 클러스터 정보 (cluster_info) ─────────────────────────────────────
    # token_str은 meta에 없을 수 있으므로 labeled.parquet에서 가져옴
    print("\n클러스터 키워드 추출 중...")
    token_str_list = None
    for name in ("DBR", "HBR"):
        lbl_path = OUT_DIR / f"{name}_labeled.parquet"
        if lbl_path.exists():
            df_lbl = pd.read_parquet(lbl_path)
            if "token_str" in df_lbl.columns:
                if token_str_list is None:
                    token_str_list = df_lbl["token_str"].tolist()
                else:
                    token_str_list += df_lbl["token_str"].tolist()

    cluster_rows = []
    for cid in range(N_CLUSTERS):
        mask = cluster_ids == cid
        cnt  = mask.sum()

        # 상위 키워드 (token_str 있을 때만)
        if token_str_list and len(token_str_list) == len(cluster_ids):
            cluster_tokens = [token_str_list[i] for i, m in enumerate(mask) if m]
            top_kw = get_top_keywords(cluster_tokens)
        else:
            top_kw = ""

        # 클러스터 중심 좌표
        cx = coords_2d[mask, 0].mean()
        cy = coords_2d[mask, 1].mean()

        # 라벨 분포
        cluster_labels = meta["label"].values[mask]
        success_n = (cluster_labels == 1).sum()
        failure_n = (cluster_labels == 0).sum()

        cluster_rows.append({
            "cluster_id":   cid,
            "cluster_name": f"cluster_{cid:02d}",
            "top_keywords": top_kw,
            "article_count": int(cnt),
            "center_x":     round(float(cx), 4),
            "center_y":     round(float(cy), 4),
            "success_count": int(success_n),
            "failure_count": int(failure_n),
        })
        print(f"  클러스터 {cid:2d} ({cnt}건) 키워드: {top_kw[:60]}")

    df_clusters = pd.DataFrame(cluster_rows)
    cluster_info_path = OUT_DIR / "cluster_info.parquet"
    df_clusters.to_parquet(cluster_info_path, index=False)
    print(f"\n저장: {cluster_info_path}")

    print(f"\n컬럼 확인 (umap_coords):")
    print(f"  {list(df_coords.columns)}")
    print(f"\n컬럼 확인 (cluster_info):")
    print(f"  {list(df_clusters.columns)}")

    print("\n⑤ UMAP + K-means 완료")
    print("   → umap_x, umap_y, cluster_id → article_vectors 테이블 저장 가능")
    print("   → cluster_info → clusters 테이블 저장 가능")


if __name__ == "__main__":
    main()
