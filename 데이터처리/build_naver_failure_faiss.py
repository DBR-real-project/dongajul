"""
NAVER 실패 기사 전용 FAISS 인덱스 구축

NAVER_labeled.parquet 에서 failure(label==0) 기사만 추출 →
별도 FAISS 인덱스 저장 (리스크 RAG용)

실행:
  python 데이터처리/build_naver_failure_faiss.py
산출물:
  데이터처리/output/naver_failure.index
  데이터처리/output/naver_failure_meta.parquet
"""
import sys
import numpy as np
import pandas as pd
import faiss
from pathlib import Path
from sklearn.preprocessing import normalize

sys.stdout.reconfigure(encoding="utf-8")

OUT_DIR = Path(__file__).resolve().parent / "output"


def main():
    print("[build] NAVER 데이터 로드 중...")
    meta = pd.read_parquet(OUT_DIR / "NAVER_labeled.parquet")
    emb  = np.load(OUT_DIR / "NAVER_embeddings.npy").astype(np.float32)
    print(f"  전체: {len(meta):,}건  임베딩: {emb.shape}")

    # 실패 기사만 필터
    fail_mask = meta["label"] == 0
    fail_idx  = meta[fail_mask].index.tolist()
    fail_emb  = emb[fail_idx]
    fail_meta = meta[fail_mask].reset_index(drop=True)
    print(f"  실패 기사: {len(fail_meta):,}건")

    # L2 정규화 (코사인 유사도용)
    fail_emb = normalize(fail_emb, norm="l2")

    # FAISS IndexFlatIP 구축
    print("[build] FAISS 인덱스 구축 중...")
    index = faiss.IndexFlatIP(fail_emb.shape[1])
    index.add(fail_emb)
    print(f"  인덱스 크기: {index.ntotal:,}건")

    # 저장 (한글 경로 버그 → bytes로 저장)
    index_path = OUT_DIR / "naver_failure.index"
    index_bytes = faiss.serialize_index(index)
    index_path.write_bytes(index_bytes)
    print(f"  FAISS 저장: {index_path}")

    # 메타데이터 저장 (RAG에서 title/summary/category/url 사용)
    save_cols = ["title", "summary", "category", "url", "published_date",
                 "label_name", "confidence", "failure_hits"]
    save_cols = [c for c in save_cols if c in fail_meta.columns]
    fail_meta[save_cols].to_parquet(OUT_DIR / "naver_failure_meta.parquet", index=False)
    print(f"  메타 저장: naver_failure_meta.parquet  컬럼: {save_cols}")

    print("[build] 완료")


if __name__ == "__main__":
    main()
