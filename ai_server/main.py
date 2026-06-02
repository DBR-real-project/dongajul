"""
동아줄 FastAPI ML 서비스

엔드포인트
  POST /diagnose  ← 전략 텍스트 → 리스크 스코어 + 유사 사례 (빠름, ~1s)
  POST /report    ← /diagnose + GPT 진단 리포트 (느림, ~5s)
  GET  /health    ← 서버 상태 확인
  GET  /clusters  ← 클러스터 목록 (시맨틱 맵용)

환경변수 (.env):
  OPENAI_API_KEY  : GPT API 키 (/report 엔드포인트에 필요)
  OPENAI_MODEL    : 기본 gpt-4o-mini

실행:
  uvicorn ai_server.main:app --reload --port 8000
"""
from __future__ import annotations

import pickle
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import faiss
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from sentence_transformers import SentenceTransformer

sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
load_dotenv()

from .schemas import DiagnoseRequest, DiagnoseResponse, ReportResponse, SimilarArticle

# ── 경로 설정 ──────────────────────────────────────────────────────────────
ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

# ── 전역 모델 객체 ──────────────────────────────────────────────────────────
_sbert_faiss: SentenceTransformer | None = None  # 384차원 — FAISS 검색용
_sbert_risk:  SentenceTransformer | None = None  # 768차원 — 리스크 스코어용
_faiss_index: Any                        = None
_risk_model:  Any                        = None
_meta:        pd.DataFrame | None        = None
_umap:        pd.DataFrame | None        = None
_clusters:    pd.DataFrame | None        = None


# ── 리스크 레벨 분류 ────────────────────────────────────────────────────────
def _risk_level(score: float) -> str:
    if score >= 0.6:
        return "high"
    if score >= 0.3:
        return "medium"
    return "low"


# ── lifespan: 앱 시작 시 모델 로드 ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _sbert_faiss, _sbert_risk, _faiss_index, _risk_model, _meta, _umap, _clusters

    print("[startup] SentenceTransformer (FAISS용, 384차원) 로드 중...")
    _sbert_faiss = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

    print("[startup] SentenceTransformer (리스크용, 768차원) 로드 중...")
    _sbert_risk = SentenceTransformer("jhgan/ko-sroberta-multitask")

    print("[startup] FAISS 인덱스 로드 중...")
    index_bytes = (OUT_DIR / "faiss.index").read_bytes()
    _faiss_index = faiss.deserialize_index(np.frombuffer(index_bytes, dtype=np.uint8))

    print("[startup] 리스크 모델 로드 중...")
    with open(OUT_DIR / "risk_model.pkl", "rb") as f:
        _risk_model = pickle.load(f)

    print("[startup] 메타데이터 로드 중...")
    _meta     = pd.read_parquet(OUT_DIR / "articles_meta.parquet")
    _umap     = pd.read_parquet(OUT_DIR / "umap_coords.parquet")
    _clusters = pd.read_parquet(OUT_DIR / "cluster_info.parquet")

    print(f"[startup] 완료 — 아티클 {len(_meta)}건, 클러스터 {len(_clusters)}개")
    print(f"[startup] FAISS 인덱스 차원: {_faiss_index.d} / 리스크 모델 입력 차원: 768")

    import os
    if os.getenv("OPENAI_API_KEY"):
        print("[startup] OPENAI_API_KEY 확인됨 — /report 엔드포인트 활성화")
    else:
        print("[startup] OPENAI_API_KEY 없음 — /report 비활성화 (진단만 가능)")

    yield
    print("[shutdown] 서버 종료")


app = FastAPI(
    title="동아줄 ML API",
    description="전략 리스크 진단 서비스 — SBERT + FAISS + MLP",
    version="1.0.0",
    lifespan=lifespan,
)


# ── POST /diagnose ──────────────────────────────────────────────────────────
@app.post("/diagnose", response_model=DiagnoseResponse)
def diagnose(req: DiagnoseRequest):
    """
    사용자 전략 텍스트를 받아:
    1. SBERT 임베딩
    2. FAISS 유사 사례 Top-K 검색
    3. 리스크 스코어 = P(failure)
    4. 쿼리 클러스터 ID 추론
    """
    if _sbert_faiss is None or _sbert_risk is None or _faiss_index is None or _risk_model is None:
        raise HTTPException(status_code=503, detail="모델 로딩 중입니다. 잠시 후 재시도하세요.")

    # 1. 768차원 임베딩 (FAISS 검색 + 리스크 스코어 공통)
    q_emb_risk = _sbert_risk.encode(
        [req.text],
        normalize_embeddings=True,
        convert_to_numpy=True,
    ).astype(np.float32)

    # 2. FAISS 검색 (768차원 인덱스)
    scores, ids = _faiss_index.search(q_emb_risk, req.top_k)

    # 4. 리스크 스코어 = P(failure)
    _model = _risk_model["model"]
    classes = list(_model.classes_)
    fail_col = classes.index(0)
    risk_score = float(_model.predict_proba(q_emb_risk)[0, fail_col])

    # 4. 유사 사례 구성
    similar: list[SimilarArticle] = []
    for rank, (sim, idx) in enumerate(zip(scores[0], ids[0]), start=1):
        row = _meta.iloc[int(idx)]
        similar.append(SimilarArticle(
            rank=rank,
            title=str(row.get("title", "") or ""),
            url=str(row.get("url", "") or ""),
            label=str(row.get("label_name", "") or ""),
            similarity=round(float(sim), 4),
            summary=str(row.get("summary", "") or "") or None,
            category=str(row.get("category", "") or "") or None,
            published_date=str(row.get("published_date", "") or "") or None,
            source=str(row.get("source", "") or "") or None,
        ))

    # 5. 쿼리 클러스터 (가장 가까운 클러스터 중심)
    query_cluster_id: int | None = None
    if _umap is not None and _clusters is not None:
        # 유사 사례들의 클러스터 중 최빈값으로 근사
        top_idx = ids[0].tolist()
        cluster_ids = _umap["cluster_id"].iloc[top_idx].tolist()
        if cluster_ids:
            from collections import Counter
            query_cluster_id = int(Counter(cluster_ids).most_common(1)[0][0])

    return DiagnoseResponse(
        risk_score=round(risk_score, 4),
        risk_level=_risk_level(risk_score),
        similar_articles=similar,
        query_cluster_id=query_cluster_id,
    )


# ── POST /report ────────────────────────────────────────────────────────────
@app.post("/report", response_model=ReportResponse)
def report(req: DiagnoseRequest):
    """
    /diagnose 결과 + GPT 진단 리포트를 함께 반환.
    OPENAI_API_KEY 환경변수가 없으면 503 반환.
    """
    import os
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요."
        )

    # /diagnose 와 동일한 로직으로 결과 먼저 생성
    diag = diagnose(req)

    # GPT 진단 리포트 생성
    from .reporter import generate_report
    from .schemas import DiagnosisReport

    articles_dict = [a.model_dump() for a in diag.similar_articles]
    raw = generate_report(
        strategy_text=req.text,
        risk_score=diag.risk_score,
        risk_level=diag.risk_level,
        similar_articles=articles_dict,
    )

    return ReportResponse(
        risk_score=diag.risk_score,
        risk_level=diag.risk_level,
        similar_articles=diag.similar_articles,
        query_cluster_id=diag.query_cluster_id,
        report=DiagnosisReport(**raw),
    )


# ── GET /health ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": _sbert_faiss is not None and _sbert_risk is not None,
        "article_count": len(_meta) if _meta is not None else 0,
        "cluster_count": len(_clusters) if _clusters is not None else 0,
    }


# ── GET /clusters ───────────────────────────────────────────────────────────
@app.get("/clusters")
def get_clusters():
    """시맨틱 맵 렌더링용 클러스터 정보 반환."""
    if _clusters is None:
        raise HTTPException(status_code=503, detail="모델 로딩 중")
    return _clusters.to_dict(orient="records")
