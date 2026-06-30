"""
RAG 기반 리스크 스코어러

NAVER 실패 기사 FAISS 검색 + 비즈니스 저서 원칙
→ GPT에게 실제 실패 사례 + 원칙 컨텍스트 제공
→ 0~1 리스크 점수 반환
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd
import faiss
from dotenv import load_dotenv
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from sklearn.preprocessing import normalize

from .failure_principles import find_relevant_principles, format_principles_for_prompt


load_dotenv()

OUT_DIR = Path(__file__).resolve().parent.parent / "데이터처리" / "output"

# ── 전역 상태 ──────────────────────────────────────────────
_faiss_naver_fail: Any = None
_naver_fail_meta: pd.DataFrame | None = None
_chain = None


def init_risk_rag(sbert_model: Any) -> None:
    """ai_server 시작 시 1회 호출"""
    global _faiss_naver_fail, _naver_fail_meta

    index_path = OUT_DIR / "naver_failure.index"
    meta_path  = OUT_DIR / "naver_failure_meta.parquet"

    if index_path.exists() and meta_path.exists():
        index_bytes = index_path.read_bytes()
        _faiss_naver_fail = faiss.deserialize_index(
            np.frombuffer(index_bytes, dtype=np.uint8)
        )
        _naver_fail_meta = pd.read_parquet(meta_path)
        print(f"[risk_rag] NAVER 실패 인덱스 로드 완료: {_faiss_naver_fail.ntotal:,}건")
    else:
        print("[risk_rag] WARNING: naver_failure.index 없음 — python 데이터처리/build_naver_failure_faiss.py 실행 필요")


def _get_chain():
    global _chain
    if _chain is None:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.1,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            request_timeout=30,
        )
        prompt = ChatPromptTemplate.from_template(_PROMPT)
        _chain = prompt | llm | JsonOutputParser()
    return _chain


_PROMPT = """\
당신은 경영전략 리스크 평가 전문가입니다.
아래 전략 텍스트, 유사 실패 사례, 관련 실패 원칙을 종합하여
이 전략의 실패 가능성을 0~1 사이의 점수로 평가하세요.

[평가할 전략]
{strategy_text}

[유사 실패 사례 (NAVER 뉴스 실제 사례)]
{failure_cases}

[관련 비즈니스 실패 원칙 (저서 기반)]
{failure_principles}

[리스크 점수 기준]
- 0.0~0.2: 낮음 — 실패 사례와 거리 멀고, 원칙 위반 없음
- 0.2~0.4: 낮은-중간 — 일부 우려, 보완 가능
- 0.4~0.6: 중간 — 실패 패턴과 유사한 요소 존재
- 0.6~0.8: 높음 — 실패 사례 다수 유사, 원칙 위반 명확
- 0.8~1.0: 매우 높음 — 즉각적 재검토 필요한 구조적 문제

반드시 아래 JSON만 출력하세요:
{{"risk_score": 0.0, "key_risk": "핵심 리스크 한 문장"}}\
"""


def _search_failure_cases(query_emb: np.ndarray, top_k: int = 5) -> tuple[str, float]:
    """NAVER 실패 FAISS에서 유사 실패 사례 검색 → (텍스트, 평균유사도) 반환"""
    if _faiss_naver_fail is None or _naver_fail_meta is None:
        return "유사 실패 사례 데이터 없음", 0.0

    norm_emb = normalize(query_emb.reshape(1, -1), norm="l2").astype(np.float32)
    D, I = _faiss_naver_fail.search(norm_emb, top_k)

    lines = []
    valid_sims = []
    for rank, (sim, idx) in enumerate(zip(D[0], I[0]), 1):
        if idx < 0 or idx >= len(_naver_fail_meta):
            continue
        valid_sims.append(float(sim))
        row = _naver_fail_meta.iloc[idx]
        title    = str(row.get("title", ""))[:60]
        summary  = str(row.get("summary", ""))[:100]
        category = str(row.get("category", ""))
        lines.append(f"{rank}. [{category}] {title} — {summary} (유사도 {sim:.0%})")

    text = "\n".join(lines) if lines else "유사 실패 사례 없음"

    # 가중 평균 유사도 (1위에 더 높은 가중치)
    if valid_sims:
        weights = np.array([1.0 / (i + 1) for i in range(len(valid_sims))])
        weights /= weights.sum()
        avg_sim = float(np.dot(valid_sims, weights))
    else:
        avg_sim = 0.0

    return text, avg_sim


def _naver_sim_to_risk(avg_sim: float) -> float:
    """NAVER 실패 유사도 → 리스크 점수 변환 (GPT fallback용)
    sim 0.25 이하 → 0%, sim 0.70 이상 → 100%
    """
    return float(max(0.0, min(1.0, (avg_sim - 0.25) / 0.45)))


def score_risk_rag(
    strategy_text: str,
    query_emb: np.ndarray,
) -> dict[str, Optional[float]]:
    """
    RAG 기반 리스크 점수 반환.
    GPT 성공: {"rag_risk_score": GPT 판단 0~1, "key_risk": "..."}
    GPT 실패: {"rag_risk_score": NAVER 유사도 기반 점수, "key_risk": "NAVER 실패 유사도 기반"}
    """
    failure_cases, avg_sim = _search_failure_cases(query_emb)
    principles      = find_relevant_principles(strategy_text, top_k=4)
    principles_text = format_principles_for_prompt(principles)

    try:
        result = _get_chain().invoke({
            "strategy_text":     strategy_text,
            "failure_cases":     failure_cases,
            "failure_principles": principles_text,
        })
        score = result.get("risk_score")
        if score is not None:
            score = round(max(0.0, min(1.0, float(score))), 4)
        return {
            "rag_risk_score": score,
            "key_risk": str(result.get("key_risk", "")),
        }
    except Exception as e:
        print(f"[risk_rag] GPT 호출 실패: {e} — NAVER 유사도 fallback 사용 (sim={avg_sim:.3f})")
        fallback = round(_naver_sim_to_risk(avg_sim), 4)
        return {
            "rag_risk_score": fallback,
            "key_risk": "NAVER 실패 사례 유사도 기반 평가",
        }
