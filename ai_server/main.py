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

from .frameworks import find_relevant_frameworks, init_frameworks
from .reporter import generate_report
from .risk_rag import init_risk_rag, score_risk_rag
from .schemas import DiagnoseRequest, DiagnoseResponse, GlobalCasesResponse, ReportResponse, SimilarArticle
from .trend_context import get_trend_context, init_trend_context
from .web_trend import search_business_trends


try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

load_dotenv()


ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"


_sbert: SentenceTransformer | None = None
_faiss_index: Any = None
_faiss_hbs: Any = None
_risk_model: Any = None
_anomaly_model: Any = None          # Isolation Forest
_anomaly_mean: float = -0.435       # 학습 데이터 score 평균
_anomaly_std: float  = 0.02         # 학습 데이터 score 표준편차
_meta: pd.DataFrame | None = None
_meta_hbs: pd.DataFrame | None = None
_umap: pd.DataFrame | None = None
_clusters: pd.DataFrame | None = None
_cluster_risk_map: dict = {}


def _risk_level(score: float) -> str:
    if score >= 0.6:
        return "high"
    if score >= 0.3:
        return "medium"
    return "low"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _sbert, _faiss_index, _faiss_hbs, _risk_model, _anomaly_model, _anomaly_mean, _anomaly_std, _meta, _meta_hbs, _umap, _clusters, _cluster_risk_map

    print("[startup] SentenceTransformer (ko-sroberta, 768차원) 로드 중...")
    _sbert = SentenceTransformer("jhgan/ko-sroberta-multitask")
    init_frameworks(_sbert)
    init_risk_rag(_sbert)

    # 메인 FAISS: faiss_with_hbs.index (DBR+HBR+HBS) 우선, 없으면 faiss.index fallback
    faiss_with_hbs_path = OUT_DIR / "faiss_with_hbs.index"
    faiss_path = OUT_DIR / "faiss.index"
    if faiss_with_hbs_path.exists():
        print("[startup] FAISS 인덱스 (DBR+HBR+HBS) 로드 중...")
        index_bytes = faiss_with_hbs_path.read_bytes()
        _faiss_index = faiss.deserialize_index(np.frombuffer(index_bytes, dtype=np.uint8))
        print(f"[startup] FAISS 인덱스 로드 완료: {_faiss_index.ntotal:,}건 (with HBS)")
    elif faiss_path.exists():
        print("[startup] FAISS 인덱스 (DBR+HBR) 로드 중...")
        index_bytes = faiss_path.read_bytes()
        _faiss_index = faiss.deserialize_index(np.frombuffer(index_bytes, dtype=np.uint8))
        print(f"[startup] FAISS 인덱스 로드 완료: {_faiss_index.ntotal:,}건")
    else:
        _faiss_index = None
        print(f"[startup] WARNING: FAISS 인덱스 파일 없음")

    # HBS 전용 인덱스: 해외 사례 모드 전용
    print("[startup] HBS 전용 인덱스 로드 중...")
    hbs_emb_path = OUT_DIR / "HBS_embeddings.npy"
    hbs_meta_path = OUT_DIR / "HBS_meta.parquet"
    if hbs_emb_path.exists() and hbs_meta_path.exists():
        hbs_emb = np.load(hbs_emb_path).astype(np.float32)
        _faiss_hbs = faiss.IndexFlatIP(hbs_emb.shape[1])
        _faiss_hbs.add(hbs_emb)
        _meta_hbs = pd.read_parquet(hbs_meta_path)
        print(f"[startup] HBS 전용 인덱스 완료: {_faiss_hbs.ntotal:,}건")
    else:
        _faiss_hbs = None
        _meta_hbs = None
        print("[startup] WARNING: HBS 임베딩 파일 없음 — /diagnose/global 비활성화")

    print("[startup] 리스크 모델 로드 중...")
    if (OUT_DIR / "risk_model.pkl").exists():
        with open(OUT_DIR / "risk_model.pkl", "rb") as f:
            _risk_model = pickle.load(f)
        print("[startup] 리스크 모델 로드 완료")
    else:
        _risk_model = None
        print(f"[startup] WARNING: 리스크 모델 파일 없음: {OUT_DIR / 'risk_model.pkl'}")

    print("[startup] 이상감지 모델 로드 중...")
    anomaly_path = OUT_DIR / "anomaly_model.pkl"
    if anomaly_path.exists():
        with open(anomaly_path, "rb") as f:
            _payload = pickle.load(f)
        _anomaly_model = _payload["model"]
        _anomaly_mean  = _payload.get("mean_score", -0.435)
        _anomaly_std   = _payload.get("std_score",  0.02)
        print(f"[startup] 이상감지 모델 로드 완료 (mean={_anomaly_mean:.4f}, std={_anomaly_std:.4f})")
    else:
        _anomaly_model = None
        print("[startup] WARNING: anomaly_model.pkl 없음 — python 데이터처리/train_anomaly.py 실행 필요")

    print("[startup] 메타데이터 로드 중...")
    meta_with_hbs = OUT_DIR / "articles_meta_with_hbs.parquet"
    meta_base = OUT_DIR / "articles_meta.parquet"
    if meta_with_hbs.exists():
        _meta = pd.read_parquet(meta_with_hbs)
        print(f"[startup] articles_meta_with_hbs.parquet 로드 완료: {len(_meta):,}건")
    elif meta_base.exists():
        _meta = pd.read_parquet(meta_base)
        print(f"[startup] articles_meta.parquet 로드 완료: {len(_meta):,}건")
    else:
        _meta = None
        print(f"[startup] WARNING: articles_meta.parquet 없음")

    # v3 우선 로드, 없으면 구버전 fallback
    umap_path = OUT_DIR / "umap_coords_v3.parquet"
    if not umap_path.exists():
        umap_path = OUT_DIR / "umap_coords.parquet"
    if umap_path.exists():
        _umap = pd.read_parquet(umap_path)
        print(f"[startup] {umap_path.name} 로드 완료")
    else:
        _umap = None
        print(f"[startup] WARNING: umap_coords 파일 없음: {umap_path}")

    cluster_path = OUT_DIR / "cluster_info_v3.parquet"
    if not cluster_path.exists():
        cluster_path = OUT_DIR / "cluster_info.parquet"
    if cluster_path.exists():
        _clusters = pd.read_parquet(cluster_path)
        print(f"[startup] {cluster_path.name} 로드 완료")
    else:
        _clusters = None
        print(f"[startup] WARNING: cluster_info 파일 없음: {cluster_path}")

    # 클러스터별 실패율 사전 계산 (3-factor 스코어링에 사용)
    # label 컬럼: 숫자(0=failure,1=success,2=neutral) 또는 텍스트("failure"/"success") 모두 지원
    if _umap is not None and "cluster_id" in _umap.columns:
        label_col = None
        if "label_name" in _umap.columns:
            label_col = "label_name"
        elif "label" in _umap.columns:
            label_col = "label"

        if label_col:
            sample_val = _umap[label_col].dropna().iloc[0] if len(_umap) > 0 else None
            use_numeric = isinstance(sample_val, (int, float, np.integer, np.floating))

            for cid, grp in _umap.groupby("cluster_id"):
                total = len(grp)
                if use_numeric:
                    fail = int((grp[label_col] == 0).sum())
                else:
                    fail = int((grp[label_col] == "failure").sum())
                _cluster_risk_map[int(cid)] = round(fail / total, 4) if total > 0 else 0.35
            print(f"[startup] cluster_risk_map 계산 완료: {len(_cluster_risk_map)}개 클러스터 "
                  f"(컬럼={label_col}, 타입={'numeric' if use_numeric else 'text'})")

    article_count = len(_meta) if _meta is not None else 0
    cluster_count = len(_clusters) if _clusters is not None else 0

    print(f"[startup] 완료 — 아티클 {article_count}건, 클러스터 {cluster_count}개")

    if _faiss_index is not None:
        sbert_dim = _sbert.get_sentence_embedding_dimension() if _sbert else "?"
        print(f"[startup] FAISS 인덱스 차원: {_faiss_index.d}  (SBERT 출력: {sbert_dim})")
        if _faiss_index.d != sbert_dim:
            print(f"[startup] WARNING: FAISS 차원({_faiss_index.d}) ≠ SBERT 차원({sbert_dim})")
    else:
        print("[startup] FAISS 인덱스 없음")

    # 트렌드 컨텍스트 로드 (NAVER 카테고리별 키워드)
    init_trend_context(OUT_DIR)

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
    if _sbert is None:
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

    q_emb = _sbert.encode(
        [req.text],
        normalize_embeddings=True,
        convert_to_numpy=True,
    ).astype(np.float32)

    if _faiss_index.d != q_emb.shape[1]:
        raise HTTPException(
            status_code=500,
            detail=(
                f"FAISS 인덱스 차원({_faiss_index.d})과 SBERT 출력 차원({q_emb.shape[1]})이 맞지 않습니다. "
                f"embed.py를 다시 실행하세요."
            ),
        )

    # 실패 사례 보장을 위해 넓은 풀에서 검색 (실패 비율 ~5%이므로 100건 이상 필요)
    pool_k = min(max(req.top_k * 20, 100), _faiss_index.ntotal)
    scores, ids = _faiss_index.search(q_emb, pool_k)

    # 모델 기반 P(failure)
    _model = _risk_model["model"]
    classes = list(_model.classes_)
    fail_col = classes.index(0)
    model_score = float(_model.predict_proba(q_emb)[0, fail_col])

    # 라벨별 분리 수집
    pool_success: list[dict] = []
    pool_failure: list[dict] = []
    pool_other: list[dict] = []

    for sim, idx in zip(scores[0], ids[0]):
        if int(idx) < 0 or int(idx) >= len(_meta):
            continue
        row = _meta.iloc[int(idx)]
        label = str(row.get("label_name", "") or "")
        entry = {"sim": float(sim), "idx": int(idx), "label": label, "row": row}
        if label == "failure":
            pool_failure.append(entry)
        elif label == "success":
            pool_success.append(entry)
        else:
            pool_other.append(entry)

    # 실패 최소 3건 보장 후 나머지를 성공으로 채움
    min_failure = min(3, len(pool_failure))
    selected = pool_failure[:min_failure] + pool_success[:max(req.top_k - min_failure, 0)]
    # 유사도 내림차순 재정렬 후 top_k 확정
    selected.sort(key=lambda e: e["sim"], reverse=True)
    selected = selected[:req.top_k]

    similar: list[SimilarArticle] = []
    total_weight = 0.0
    fail_weight = 0.0
    max_sim = 0.0

    for rank, entry in enumerate(selected, start=1):
        sim_f = entry["sim"]
        row = entry["row"]
        label = entry["label"]

        similar.append(
            SimilarArticle(
                rank=rank,
                title=str(row.get("title", "") or ""),
                url=str(row.get("url", "") or ""),
                label=label,
                similarity=round(sim_f, 4),
                summary=str(row.get("summary", "") or "") or None,
                category=str(row.get("category", "") or "") or None,
                published_date=str(row.get("published_date", "") or "") or None,
                source=str(row.get("source", "") or "") or None,
            )
        )

        # 스코어링용 가중치 누적
        conf = float(row.get("confidence", 1.0) or 1.0)
        w = sim_f * conf
        total_weight += w
        if label == "failure":
            fail_weight += w
        if sim_f > max_sim:
            max_sim = sim_f

    # 쿼리 클러스터 / UMAP 좌표 계산 (스코어링 전에 먼저 확정)
    query_cluster_id: int | None = None
    query_umap_x: float | None = None
    query_umap_y: float | None = None

    if _umap is not None and "cluster_id" in _umap.columns:
        try:
            from collections import Counter
            top_idx = [int(i) for i in ids[0].tolist() if int(i) >= 0]
            # faiss_with_hbs 인덱스(15,451건)는 umap(13,335건)보다 크므로 반드시 bounds 체크
            umap_valid_idx = [i for i in top_idx if i < len(_umap)]
            cluster_ids = _umap["cluster_id"].iloc[umap_valid_idx].tolist()
            if cluster_ids:
                query_cluster_id = int(Counter(cluster_ids).most_common(1)[0][0])
            if umap_valid_idx and "umap_x" in _umap.columns:
                query_umap_x = float(_umap["umap_x"].iloc[umap_valid_idx].mean())
                query_umap_y = float(_umap["umap_y"].iloc[umap_valid_idx].mean())
        except Exception as e:
            print(f"[/diagnose] 쿼리 클러스터/UMAP 계산 실패: {e}")

    # ── 3-factor 리스크 스코어링 ─────────────────────────────
    # ① confidence-weighted 유사 사례 실패 비율
    case_score = fail_weight / total_weight if total_weight > 0 else 0.0

    # ② 클러스터 기반 기준 리스크 (클러스터 평균 실패율)
    # 클러스터 미식별(코퍼스 외 전략) 시 0.35로 보수적 기본값 적용 (기존 0.10은 너무 낙관적)
    cluster_risk = _cluster_risk_map.get(query_cluster_id, 0.35) if query_cluster_id is not None else 0.35

    # ③ 유사도 신뢰도 보정 (max_sim < 0.65이면 0.60 방향으로 수축 — 불확실할수록 위험으로 기울기)
    reliability = min(max_sim / 0.65, 1.0)
    base_score = 0.35 * model_score + 0.45 * case_score + 0.20 * cluster_risk
    risk_score = round(base_score * reliability + 0.60 * (1 - reliability), 4)

    return DiagnoseResponse(
        risk_score=round(risk_score, 4),
        risk_level=_risk_level(risk_score),
        similar_articles=similar,
        query_cluster_id=query_cluster_id,
        query_umap_x=query_umap_x,
        query_umap_y=query_umap_y,
    )


@app.post("/diagnose/global", response_model=GlobalCasesResponse)
def diagnose_global(req: DiagnoseRequest):
    if _sbert is None:
        raise HTTPException(status_code=503, detail="모델 로딩 중입니다.")
    if _faiss_hbs is None or _meta_hbs is None:
        raise HTTPException(
            status_code=503,
            detail="HBS 인덱스가 없습니다. embed_hbs.py를 먼저 실행하세요.",
        )

    q_emb = _sbert.encode(
        [req.text],
        normalize_embeddings=True,
        convert_to_numpy=True,
    ).astype(np.float32)

    top_k = min(req.top_k, _faiss_hbs.ntotal)
    if top_k < 1:
        return GlobalCasesResponse(similar_articles=[])
    scores, ids = _faiss_hbs.search(q_emb, top_k)

    articles: list[SimilarArticle] = []
    for rank, (sim, idx) in enumerate(zip(scores[0], ids[0]), start=1):
        if int(idx) < 0 or int(idx) >= len(_meta_hbs):
            continue
        row = _meta_hbs.iloc[int(idx)]
        articles.append(
            SimilarArticle(
                rank=rank,
                title=str(row.get("title", "") or ""),
                url=str(row.get("url", "") or ""),
                label=str(row.get("label_name", "") or ""),
                similarity=round(float(sim), 4),
                summary=str(row.get("summary", "") or "") or None,
                category=str(row.get("category", "") or "") or None,
                published_date=str(row.get("published_date", "") or "") or None,
                source="HBS",
            )
        )

    return GlobalCasesResponse(similar_articles=articles, total=len(articles))


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

        # SBERT 임베딩 1회 계산 (프레임워크 + RAG 공유)
        q_emb_shared: np.ndarray | None = None
        if _sbert is not None:
            try:
                q_emb_shared = _sbert.encode(
                    [req.text],
                    normalize_embeddings=True,
                    convert_to_numpy=True,
                ).astype(np.float32)
            except Exception as enc_err:
                print(f"[/report] SBERT 인코딩 실패: {enc_err}")

        # 전략 프레임워크 컨텍스트 검색
        framework_context = ""
        if q_emb_shared is not None:
            try:
                framework_context = find_relevant_frameworks(q_emb_shared[0])
                if framework_context:
                    print(f"[/report] 프레임워크 컨텍스트 주입됨: {framework_context[:60]}...")
            except Exception as fw_err:
                print(f"[/report] 프레임워크 검색 실패: {fw_err}")

        # 트렌드 컨텍스트 주입 (쿼리 클러스터 이름 기반)
        cluster_name = None
        trend_ctx = ""
        try:
            if diag.query_cluster_id is not None and _clusters is not None:
                c_rows = _clusters[_clusters["cluster_id"] == diag.query_cluster_id]
                if not c_rows.empty:
                    cluster_name = str(c_rows.iloc[0].get("cluster_name", ""))
            trend_ctx = get_trend_context(cluster_name=cluster_name, strategy_text=req.text)
            if trend_ctx:
                print(f"[/report] 트렌드 컨텍스트 주입됨: {trend_ctx[:60]}...")
        except Exception as tr_err:
            print(f"[/report] 트렌드 컨텍스트 실패: {tr_err}")

        # 실시간 웹 검색 (DuckDuckGo) — 최신 시장 동향
        web_trend_ctx = ""
        try:
            web_trend_ctx = search_business_trends(
                strategy_text=req.text,
                cluster_name=cluster_name,
                top_k=4,
            )
            if web_trend_ctx:
                print(f"[/report] 웹 검색 컨텍스트 주입됨: {web_trend_ctx[:60]}...")
            else:
                print("[/report] 웹 검색 결과 없음 (DuckDuckGo 연결 실패 또는 결과 없음)")
        except Exception as wb_err:
            print(f"[/report] 웹 검색 실패: {wb_err}")

        # ── RAG 리스크 점수 (NAVER 실패 FAISS + 비즈니스 저서 원칙 + GPT) ──
        q_emb_rag = q_emb_shared[0] if q_emb_shared is not None else _sbert.encode(
            [req.text], normalize_embeddings=True, convert_to_numpy=True
        ).astype(np.float32)[0]

        rag_result = score_risk_rag(req.text, q_emb_rag)
        rag_score  = rag_result["rag_risk_score"]

        # 앙상블: RAG 75% + ML 25%
        # ML AUC=0.9771을 더 반영해 재현성·일관성 향상
        if rag_score is not None:
            final_risk = round(0.75 * rag_score + 0.25 * diag.risk_score, 4)
            print(f"[/report] RAG={rag_score:.3f} ML={diag.risk_score:.3f} → final={final_risk:.3f}")
        else:
            final_risk = diag.risk_score
            print(f"[/report] RAG 완전 실패 → ML score 사용: {final_risk:.3f}")

        start = time.time()
        raw = generate_report(
            strategy_text=req.text,
            risk_score=final_risk,
            risk_level=_risk_level(final_risk),
            similar_articles=articles_dict,
            framework_context=framework_context,
            trend_context=trend_ctx,
            web_trend_context=web_trend_ctx,
        )
        print(f"[/report] GPT 리포트 완료: {time.time() - start:.2f}초")

        from .schemas import DiagnosisReport

        return ReportResponse(
            risk_score=final_risk,
            risk_level=_risk_level(final_risk),
            similar_articles=diag.similar_articles,
            query_cluster_id=diag.query_cluster_id,
            query_umap_x=diag.query_umap_x,
            query_umap_y=diag.query_umap_y,
            report=DiagnosisReport(**raw),
        )

    except Exception as err:
        print(f"[/report] 오류: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@app.get("/health")
def health():
    return {
        "status": "ok",
        "faiss": _faiss_index is not None,
        "sbert": _sbert is not None,
        "risk_model": _risk_model is not None,
        "umap": _umap is not None,
    }


@app.get("/clusters")
def clusters():
    if _clusters is None:
        return []
    return _clusters.to_dict(orient="records")

### semantic map 추가
@app.get("/semantic-map")
def semantic_map(limit: int = 1000):
    if _umap is None:
        raise HTTPException(
            status_code=503,
            detail="UMAP 좌표 데이터가 없어 시멘틱 맵을 사용할 수 없습니다.",
        )

    if _meta is None:
        raise HTTPException(
            status_code=503,
            detail="메타데이터가 없어 시멘틱 맵을 사용할 수 없습니다.",
        )

    if "umap_x" not in _umap.columns or "umap_y" not in _umap.columns:
        raise HTTPException(
            status_code=500,
            detail="umap_coords.parquet에 umap_x 또는 umap_y 컬럼이 없습니다.",
        )

    n = min(len(_umap), len(_meta), limit)
    points = []

    for i in range(n):
        umap_row = _umap.iloc[i]
        meta_row = _meta.iloc[i]

        cluster_id = None
        if "cluster_id" in _umap.columns and pd.notna(umap_row.get("cluster_id")):
            cluster_id = int(umap_row.get("cluster_id"))

        points.append({
            "id": int(i),
            "x": float(umap_row.get("umap_x", 0)),
            "y": float(umap_row.get("umap_y", 0)),
            "cluster_id": cluster_id,
            "title": str(meta_row.get("title", "") or ""),
            "label": str(meta_row.get("label_name", "") or ""),
            "category": str(meta_row.get("category", "") or ""),
            "source": str(meta_row.get("source", "") or ""),
            "summary": str(meta_row.get("summary", "") or ""),
            "url": str(meta_row.get("url", "") or ""),
        })

    return {
        "count": len(points),
        "points": points,
    }
