"""
동아줄 FastAPI ML 서비스

엔드포인트
  POST /diagnose
  POST /report
  GET  /health
  GET  /clusters

실행:
  python -m uvicorn ai_server.main:app --reload --port 8000
"""
from __future__ import annotations

import pickle
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import faiss
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from sentence_transformers import SentenceTransformer

from .reporter import generate_report
from .schemas import DiagnoseRequest, DiagnoseResponse, ReportResponse, SimilarArticle


try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

load_dotenv()


ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"


_sbert_faiss: SentenceTransformer | None = None
_sbert_risk: SentenceTransformer | None = None
_faiss_index: Any = None
_risk_model: Any = None
_meta: pd.DataFrame | None = None
_umap: pd.DataFrame | None = None
_clusters: pd.DataFrame | None = None


def _risk_level(score: float) -> str:
    if score >= 0.6:
        return "high"
    if score >= 0.3:
        return "medium"
    return "low"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _sbert_faiss, _sbert_risk, _faiss_index, _risk_model, _meta, _umap, _clusters

    print("[startup] SentenceTransformer (FAISS용, 384차원) 로드 중...")
    _sbert_faiss = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

    print("[startup] SentenceTransformer (리스크용, 768차원) 로드 중...")
    _sbert_risk = SentenceTransformer("jhgan/ko-sroberta-multitask")

    print("[startup] FAISS 인덱스 로드 중...")
    if (OUT_DIR / "faiss.index").exists():
        index_bytes = (OUT_DIR / "faiss.index").read_bytes()
        _faiss_index = faiss.deserialize_index(np.frombuffer(index_bytes, dtype=np.uint8))
        print("[startup] FAISS 인덱스 로드 완료")
    else:
        _faiss_index = None
        print(f"[startup] WARNING: FAISS 인덱스 파일 없음: {OUT_DIR / 'faiss.index'}")

    print("[startup] 리스크 모델 로드 중...")
    if (OUT_DIR / "risk_model.pkl").exists():
        with open(OUT_DIR / "risk_model.pkl", "rb") as f:
            _risk_model = pickle.load(f)
        print("[startup] 리스크 모델 로드 완료")
    else:
        _risk_model = None
        print(f"[startup] WARNING: 리스크 모델 파일 없음: {OUT_DIR / 'risk_model.pkl'}")

    print("[startup] 메타데이터 로드 중...")
    if (OUT_DIR / "articles_meta.parquet").exists():
        _meta = pd.read_parquet(OUT_DIR / "articles_meta.parquet")
        print("[startup] articles_meta.parquet 로드 완료")
    else:
        _meta = None
        print(f"[startup] WARNING: articles_meta.parquet 없음: {OUT_DIR / 'articles_meta.parquet'}")

    if (OUT_DIR / "umap_coords.parquet").exists():
        _umap = pd.read_parquet(OUT_DIR / "umap_coords.parquet")
        print("[startup] umap_coords.parquet 로드 완료")
    else:
        _umap = None
        print(f"[startup] WARNING: umap_coords.parquet 없음: {OUT_DIR / 'umap_coords.parquet'}")

    if (OUT_DIR / "cluster_info.parquet").exists():
        _clusters = pd.read_parquet(OUT_DIR / "cluster_info.parquet")
        print("[startup] cluster_info.parquet 로드 완료")
    else:
        _clusters = None
        print(f"[startup] WARNING: cluster_info.parquet 없음: {OUT_DIR / 'cluster_info.parquet'}")

    article_count = len(_meta) if _meta is not None else 0
    cluster_count = len(_clusters) if _clusters is not None else 0

    print(f"[startup] 완료 — 아티클 {article_count}건, 클러스터 {cluster_count}개")

    if _faiss_index is not None:
        print(f"[startup] FAISS 인덱스 차원: {_faiss_index.d}")
    else:
        print("[startup] FAISS 인덱스 없음")

    import os
    if os.getenv("OPENAI_API_KEY"):
        print("[startup] OPENAI_API_KEY 확인됨 — /report 활성화")
    else:
        print("[startup] OPENAI_API_KEY 없음 — /report 비활성화")

    yield

    print("[shutdown] 서버 종료")


app = FastAPI(
    title="동아줄 ML API",
    description="전략 리스크 진단 서비스 — SBERT + FAISS + MLP",
    version="1.0.0",
    lifespan=lifespan,
)


@app.post("/diagnose", response_model=DiagnoseResponse)
def diagnose(req: DiagnoseRequest):
    if _sbert_faiss is None or _sbert_risk is None:
        raise HTTPException(
            status_code=503,
            detail="SentenceTransformer 모델 로딩 중입니다. 잠시 후 재시도하세요.",
        )

    if _faiss_index is None:
        raise HTTPException(
            status_code=503,
            detail="FAISS 인덱스가 없어 진단 기능을 사용할 수 없습니다.",
        )

    if _risk_model is None:
        raise HTTPException(
            status_code=503,
            detail="리스크 모델이 없어 진단 기능을 사용할 수 없습니다.",
        )

    if _meta is None:
        raise HTTPException(
            status_code=503,
            detail="메타데이터가 없어 진단 기능을 사용할 수 없습니다.",
        )

    q_emb_faiss = _sbert_faiss.encode(
        [req.text],
        normalize_embeddings=True,
        convert_to_numpy=True,
    ).astype(np.float32)

    q_emb_risk = _sbert_risk.encode(
        [req.text],
        normalize_embeddings=True,
        convert_to_numpy=True,
    ).astype(np.float32)

    if _faiss_index.d == q_emb_faiss.shape[1]:
        scores, ids = _faiss_index.search(q_emb_faiss, req.top_k)
    elif _faiss_index.d == q_emb_risk.shape[1]:
        scores, ids = _faiss_index.search(q_emb_risk, req.top_k)
    else:
        raise HTTPException(
            status_code=500,
            detail=(
                f"FAISS 인덱스 차원({_faiss_index.d})과 임베딩 차원이 맞지 않습니다. "
                f"FAISS용({q_emb_faiss.shape[1]}), 리스크용({q_emb_risk.shape[1]})"
            ),
        )

    _model = _risk_model["model"]
    classes = list(_model.classes_)
    fail_col = classes.index(0)
    risk_score = float(_model.predict_proba(q_emb_risk)[0, fail_col])

    similar: list[SimilarArticle] = []

    for rank, (sim, idx) in enumerate(zip(scores[0], ids[0]), start=1):
        if int(idx) < 0:
            continue

        row = _meta.iloc[int(idx)]

        similar.append(
            SimilarArticle(
                rank=rank,
                title=str(row.get("title", "") or ""),
                url=str(row.get("url", "") or ""),
                label=str(row.get("label_name", "") or ""),
                similarity=round(float(sim), 4),
                summary=str(row.get("summary", "") or "") or None,
                category=str(row.get("category", "") or "") or None,
                published_date=str(row.get("published_date", "") or "") or None,
                source=str(row.get("source", "") or "") or None,
            )
        )

    query_cluster_id: int | None = None

    if _umap is not None and "cluster_id" in _umap.columns:
        try:
            top_idx = [int(i) for i in ids[0].tolist() if int(i) >= 0]
            cluster_ids = _umap["cluster_id"].iloc[top_idx].tolist()

            if cluster_ids:
                from collections import Counter
                query_cluster_id = int(Counter(cluster_ids).most_common(1)[0][0])
        except Exception as e:
            print(f"[/diagnose] 쿼리 클러스터 계산 실패: {e}")
            query_cluster_id = None

    return DiagnoseResponse(
        risk_score=round(risk_score, 4),
        risk_level=_risk_level(risk_score),
        similar_articles=similar,
        query_cluster_id=query_cluster_id,
    )


@app.post("/report", response_model=ReportResponse)
def report(req: DiagnoseRequest):
    import os

    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.",
        )

    try:
        start = time.time()
        diag = diagnose(req)
        print(f"[/report] diagnose 완료: {time.time() - start:.2f}초")

        articles_dict = [a.model_dump() for a in diag.similar_articles]

        start = time.time()
        raw = generate_report(
            strategy_text=req.text,
            risk_score=diag.risk_score,
            risk_level=diag.risk_level,
            similar_articles=articles_dict,
        )
        print(f"[/report] GPT 리포트 완료: {time.time() - start:.2f}초")

        from .schemas import DiagnosisReport

        return ReportResponse(
            risk_score=diag.risk_score,
            risk_level=diag.risk_level,
            similar_articles=diag.similar_articles,
            query_cluster_id=diag.query_cluster_id,
            report=DiagnosisReport(**raw),
        )

    except HTTPException:
        raise

    except Exception as e:
        print(f"[/report] 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"/report 처리 중 오류 발생: {str(e)}",
        )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": _sbert_faiss is not None and _sbert_risk is not None,
        "faiss_loaded": _faiss_index is not None,
        "risk_model_loaded": _risk_model is not None,
        "metadata_loaded": _meta is not None,
        "article_count": len(_meta) if _meta is not None else 0,
        "cluster_count": len(_clusters) if _clusters is not None else 0,
    }


@app.get("/clusters")
def get_clusters():
    if _clusters is None:
        raise HTTPException(status_code=503, detail="클러스터 정보가 없습니다.")

    return _clusters.to_dict(orient="records")