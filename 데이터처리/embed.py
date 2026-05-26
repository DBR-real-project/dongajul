"""
③ Sentence-BERT 임베딩 + FAISS 인덱스 구축 (동아줄)

입력 : 데이터처리/output/{DBR,HBR}_labeled.parquet
출력 : 데이터처리/output/embeddings.npy          ← 전체 임베딩 행렬 (N x 768)
       데이터처리/output/{DBR,HBR}_embeddings.npy ← 소스별 임베딩 (label.py Stage2용)
       데이터처리/output/faiss.index              ← FAISS IndexFlatIP (코사인)
       데이터처리/output/articles_meta.parquet    ← 검색 결과용 메타데이터

사용 모델: jhgan/ko-sroberta-multitask
  - 한국어 특화 SBERT (klue/roberta-base 기반), 768차원
  - 기존 multilingual-MiniLM(384차원) 대비 한국어 이해력 대폭 향상

실행: python 데이터처리/embed.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

sys.stdout.reconfigure(encoding="utf-8")

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

MODEL_NAME = "jhgan/ko-sroberta-multitask"   # 한국어 특화 (768차원)
BATCH_SIZE = 64                               # RoBERTa-base는 MiniLM보다 메모리 큼


def build_embed_text(df: pd.DataFrame) -> list[str]:
    """임베딩할 텍스트 구성: 제목 + 요약(없으면 본문 앞 500자)"""
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

    # ── 데이터 로드 ──────────────────────────────────────────────────────
    dfs = []
    for name in ("DBR", "HBR"):
        path = OUT_DIR / f"{name}_labeled.parquet"
        df = pd.read_parquet(path)
        df["source"] = name
        dfs.append(df)
        print(f"[{name}] {len(df)}건 로드")

    df_all = pd.concat(dfs, ignore_index=True)
    print(f"전체 {len(df_all)}건\n")

    # ── 임베딩 텍스트 준비 ───────────────────────────────────────────────
    texts = build_embed_text(df_all)
    print(f"임베딩 텍스트 샘플: {texts[0][:80]}")

    # ── 모델 로드 ────────────────────────────────────────────────────────
    print(f"\n모델 로드: {MODEL_NAME}")
    t0 = time.time()
    model = SentenceTransformer(MODEL_NAME)
    print(f"모델 로드 완료 ({time.time()-t0:.1f}s)")

    # ── 임베딩 생성 ──────────────────────────────────────────────────────
    print(f"\n임베딩 생성 중... ({len(texts)}건, batch={BATCH_SIZE})")
    t0 = time.time()
    embeddings = model.encode(
        texts,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        normalize_embeddings=True,   # 코사인 유사도 = 내적(IP)
        convert_to_numpy=True,
    )
    print(f"임베딩 완료: shape={embeddings.shape}, {time.time()-t0:.1f}s")

    # ── FAISS 인덱스 구축 ────────────────────────────────────────────────
    print("\nFAISS 인덱스 구축...")
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)          # 내적 = 정규화된 벡터의 코사인
    index.add(embeddings.astype(np.float32))
    print(f"FAISS 인덱스 완료: {index.ntotal}개 벡터, dim={dim}")

    # ── 저장 ─────────────────────────────────────────────────────────────
    emb_path   = OUT_DIR / "embeddings.npy"
    index_path = OUT_DIR / "faiss.index"
    meta_path  = OUT_DIR / "articles_meta.parquet"

    np.save(str(emb_path), embeddings)
    # faiss C++ 백엔드가 한글 경로 미지원 → bytes로 직렬화 후 Python으로 저장
    index_bytes = faiss.serialize_index(index)
    index_path.write_bytes(index_bytes)

    # 검색 결과 반환용 메타데이터 (DB 저장 전 중간 산출물)
    meta_cols = ["title", "url", "summary", "category", "published_date",
                 "source", "label", "label_name", "confidence"]
    meta_cols = [c for c in meta_cols if c in df_all.columns]
    df_all[meta_cols].to_parquet(meta_path, index=False)

    # ── 소스별 임베딩 저장 (label.py Stage2 SBERT 재분류용) ───────────────
    offset = 0
    for name, df_src in zip(("DBR", "HBR"), dfs):
        n = len(df_src)
        src_emb = embeddings[offset:offset + n]
        src_path = OUT_DIR / f"{name}_embeddings.npy"
        np.save(str(src_path), src_emb)
        print(f"  {src_path.name}  ({n}건, shape={src_emb.shape})")
        offset += n

    print(f"\n저장 완료:")
    print(f"  {emb_path}  ({emb_path.stat().st_size//1024//1024}MB)")
    print(f"  {index_path}  ({index_path.stat().st_size//1024//1024}MB)")
    print(f"  {meta_path}")

    # ── 검색 테스트 ──────────────────────────────────────────────────────
    print("\n─── 검색 테스트 ───")
    queries = [
        "해외 신규 시장 진출 전략",
        "스타트업 실패 원인 분석",
        "AI 전환 성공 사례",
    ]
    df_meta = pd.read_parquet(meta_path)

    for q in queries:
        q_emb = model.encode([q], normalize_embeddings=True).astype(np.float32)
        scores, ids = index.search(q_emb, 5)
        print(f"\n검색: '{q}'")
        for rank, (score, idx) in enumerate(zip(scores[0], ids[0]), 1):
            row = df_meta.iloc[idx]
            print(f"  {rank}. [{row['label_name']:8s}] sim={score:.3f} | {row['title'][:55]}")

    print("\n③ 임베딩 + FAISS 완료")


if __name__ == "__main__":
    main()
