"""
HBS 전용 Sentence-BERT 임베딩 생성

기존 embed.py는 수정하지 않고,
HBS_labeled.parquet만 별도로 임베딩합니다.

입력 : 데이터처리/output/HBS_labeled.parquet
출력 : 데이터처리/output/HBS_embeddings.npy
       데이터처리/output/HBS_meta.parquet

실행: python 데이터처리/embed_hbs.py
"""
from __future__ import annotations

import sys
import time

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

# 기존 embed.py의 설정과 함수 재사용
from embed import OUT_DIR, MODEL_NAME, BATCH_SIZE, build_embed_text

sys.stdout.reconfigure(encoding="utf-8")


def main() -> None:
    name = "HBS"

    src = OUT_DIR / "HBS_labeled.parquet"
    emb_out = OUT_DIR / "HBS_embeddings.npy"
    meta_out = OUT_DIR / "HBS_meta.parquet"

    if not src.exists():
        raise FileNotFoundError(f"[{name}] 라벨 파일 없음: {src}")

    print(f"[{name}] 로드: {src}")
    df = pd.read_parquet(src)
    print(f"[{name}] {len(df)}건 로드")

    required_cols = ["title_ko", "summary_ko", "content_ko_summary"]
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        raise ValueError(f"[{name}] 필수 컬럼 누락: {missing_cols}")

    df = df.copy()
    df["source"] = "HBS"

    # 기존 build_embed_text() 함수는 title / summary / content 컬럼을 사용하므로
    # HBS의 한국어 번역 컬럼을 같은 이름으로 맞춰줍니다.
    df["title"] = df["title_ko"].fillna("").astype(str)
    df["summary"] = df["summary_ko"].fillna("").astype(str)
    df["content"] = df["content_ko_summary"].fillna("").astype(str)

    texts = build_embed_text(df)
    print(f"임베딩 텍스트 샘플: {texts[0][:80]}")

    print(f"\n모델 로드: {MODEL_NAME}")
    t0 = time.time()
    model = SentenceTransformer(MODEL_NAME)
    print(f"모델 로드 완료 ({time.time()-t0:.1f}s)")

    print(f"\nHBS 임베딩 생성 중... ({len(texts)}건, batch={BATCH_SIZE})")
    t0 = time.time()
    embeddings = model.encode(
        texts,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    print(f"임베딩 완료: shape={embeddings.shape}, {time.time()-t0:.1f}s")

    np.save(str(emb_out), embeddings)
    print(f"[{name}] 임베딩 저장 완료 → {emb_out}")

    # FAISS 검색 결과 반환용 HBS 메타데이터
    meta_cols = [
        "title",
        "url",
        "summary",
        "category",
        "published_date",
        "source",
        "label",
        "label_name",
        "confidence",
    ]
    meta_cols = [c for c in meta_cols if c in df.columns]

    df[meta_cols].to_parquet(meta_out, index=False)
    print(f"[{name}] 메타데이터 저장 완료 → {meta_out}")

    print("\nHBS 임베딩 완료")


if __name__ == "__main__":
    main()