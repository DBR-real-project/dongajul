"""
기존 FAISS 산출물에 HBS 임베딩/메타데이터 병합

기존 embeddings.npy, faiss.index, articles_meta.parquet은 덮어쓰지 않고,
with_hbs 버전으로 새로 저장합니다.

입력 : 데이터처리/output/embeddings.npy
       데이터처리/output/articles_meta.parquet
       데이터처리/output/HBS_embeddings.npy
       데이터처리/output/HBS_meta.parquet

출력 : 데이터처리/output/embeddings_with_hbs.npy
       데이터처리/output/faiss_with_hbs.index
       데이터처리/output/articles_meta_with_hbs.parquet

실행: python 데이터처리/merge_hbs_to_faiss.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import faiss
import numpy as np
import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"


def main() -> None:
    base_emb_path = OUT_DIR / "embeddings.npy"
    base_meta_path = OUT_DIR / "articles_meta.parquet"

    hbs_emb_path = OUT_DIR / "HBS_embeddings.npy"
    hbs_meta_path = OUT_DIR / "HBS_meta.parquet"

    out_emb_path = OUT_DIR / "embeddings_with_hbs.npy"
    out_index_path = OUT_DIR / "faiss_with_hbs.index"
    out_meta_path = OUT_DIR / "articles_meta_with_hbs.parquet"

    required_files = [
        base_emb_path,
        base_meta_path,
        hbs_emb_path,
        hbs_meta_path,
    ]

    for path in required_files:
        if not path.exists():
            raise FileNotFoundError(f"필수 파일 없음: {path}")

    print("기존 임베딩 로드 중...")
    base_embeddings = np.load(str(base_emb_path)).astype(np.float32)
    hbs_embeddings = np.load(str(hbs_emb_path)).astype(np.float32)

    print(f"기존 임베딩: {base_embeddings.shape}")
    print(f"HBS 임베딩: {hbs_embeddings.shape}")

    if base_embeddings.shape[1] != hbs_embeddings.shape[1]:
        raise ValueError(
            f"임베딩 차원 불일치: 기존 {base_embeddings.shape[1]} / HBS {hbs_embeddings.shape[1]}"
        )

    print("\n메타데이터 로드 중...")
    base_meta = pd.read_parquet(base_meta_path)
    hbs_meta = pd.read_parquet(hbs_meta_path)

    print(f"기존 메타데이터: {len(base_meta)}건")
    print(f"HBS 메타데이터: {len(hbs_meta)}건")

    if len(hbs_meta) != len(hbs_embeddings):
        raise ValueError(
            f"HBS 메타데이터 건수와 임베딩 건수 불일치: "
            f"meta={len(hbs_meta)}, embeddings={len(hbs_embeddings)}"
        )

    if len(base_meta) != len(base_embeddings):
        raise ValueError(
            f"기존 메타데이터 건수와 임베딩 건수 불일치: "
            f"meta={len(base_meta)}, embeddings={len(base_embeddings)}"
        )

    print("\n임베딩 병합 중...")
    merged_embeddings = np.vstack([base_embeddings, hbs_embeddings]).astype(np.float32)
    print(f"병합 임베딩: {merged_embeddings.shape}")

    print("\n메타데이터 병합 중...")
    merged_meta = pd.concat([base_meta, hbs_meta], ignore_index=True)
    print(f"병합 메타데이터: {len(merged_meta)}건")

    print("\nFAISS 인덱스 재구축 중...")
    dim = merged_embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(merged_embeddings)

    print(f"FAISS 인덱스 완료: {index.ntotal}개 벡터, dim={dim}")

    print("\n병합 산출물 저장 중...")
    np.save(str(out_emb_path), merged_embeddings)

    # faiss C++ 백엔드 한글 경로 문제 방지
    index_bytes = faiss.serialize_index(index)
    out_index_path.write_bytes(index_bytes)

    merged_meta.to_parquet(out_meta_path, index=False)

    print("\n저장 완료:")
    print(f"  {out_emb_path}")
    print(f"  {out_index_path}")
    print(f"  {out_meta_path}")

    print("\nHBS FAISS 병합 완료")


if __name__ == "__main__":
    main()