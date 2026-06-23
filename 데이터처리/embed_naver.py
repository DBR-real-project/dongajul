"""
네이버 기사 SBERT 임베딩 생성 (모델 학습용 전용, FAISS 인덱스 없음)

입력 : 데이터처리/output/NAVER_labeled.parquet
출력 : 데이터처리/output/NAVER_embeddings.npy  ← SBERT 384차원 임베딩

※ FAISS 검색 대상은 DBR+HBR만 유지.
   이 임베딩은 risk_model.py 재학습 시 학습 데이터로만 사용됩니다.

실행: python 데이터처리/embed_naver.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

sys.stdout.reconfigure(encoding="utf-8")

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

MODEL_NAME = "jhgan/ko-sroberta-multitask"   # 한국어 특화 (768차원)
BATCH_SIZE = 64


def build_embed_text(df: pd.DataFrame) -> list[str]:
    """임베딩 텍스트: 제목 + 요약(없으면 본문 앞 500자)"""
    texts = []
    for _, row in df.iterrows():
        title   = str(row.get("title", "") or "")
        summary = str(row.get("summary", "") or "")
        content = str(row.get("content", "") or "")
        body = summary if len(summary) > 20 else content[:500]
        texts.append(f"{title}. {body}".strip())
    return texts


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── NAVER 라벨 데이터 로드 ─────────────────────────────────────────────
    naver_path = OUT_DIR / "NAVER_labeled.parquet"
    print(f"NAVER 라벨 데이터 로드: {naver_path}")
    df = pd.read_parquet(naver_path)
    print(f"총 {len(df)}건 (success={( df['label']==1).sum()} / "
          f"failure={(df['label']==0).sum()} / neutral={(df['label']==2).sum()})")

    # ── 임베딩 텍스트 준비 ────────────────────────────────────────────────
    texts = build_embed_text(df)
    print(f"\n임베딩 텍스트 샘플: {texts[0][:80]}")

    # ── 모델 로드 ─────────────────────────────────────────────────────────
    print(f"\n모델 로드: {MODEL_NAME}")
    t0 = time.time()
    model = SentenceTransformer(MODEL_NAME)
    print(f"모델 로드 완료 ({time.time()-t0:.1f}s)")

    # ── 임베딩 생성 ───────────────────────────────────────────────────────
    print(f"\n임베딩 생성 중... ({len(texts)}건, batch={BATCH_SIZE})")
    t0 = time.time()
    embeddings = model.encode(
        texts,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    elapsed = time.time() - t0
    print(f"임베딩 완료: shape={embeddings.shape}, {elapsed:.1f}s")

    # ── 저장 ──────────────────────────────────────────────────────────────
    emb_path = OUT_DIR / "NAVER_embeddings.npy"
    np.save(str(emb_path), embeddings)
    size_mb = emb_path.stat().st_size // 1024 // 1024
    print(f"\n저장 완료: {emb_path}  ({size_mb}MB)")
    print("※ FAISS 인덱스 미생성 — 모델 학습 전용 임베딩입니다.")


if __name__ == "__main__":
    main()
