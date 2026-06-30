"""
LLM 기반 리스크 스코어러 (LangChain)

reporter.py가 "전체 리포트 텍스트 생성"이라면,
이 모듈은 "0~1 리스크 점수 + 한 줄 근거"만 빠르게 반환.

API 키 교체:
  .env의 OPENAI_API_KEY 값만 바꾸면 됨 (GPT → 새 키)
  Groq로 바꾸려면 ChatOpenAI → ChatGroq 한 줄만 교체
"""
from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI


load_dotenv()

# ── 프롬프트 ──────────────────────────────────────────────
_PROMPT_TEMPLATE = """\
당신은 경영전략 리스크 평가 전문가입니다.
전략 텍스트와 유사 사례를 보고 이 전략의 실패 가능성을 0~1로 평가하세요.

[전략 텍스트]
{strategy_text}

[유사 사례 Top5 (출처·성공여부·유사도)]
{similar_cases}

[리스크 점수 기준]
- 0.0~0.2: 낮음 — 검증된 전략, 유사 성공 사례 다수
- 0.2~0.4: 낮은-중간 — 일부 우려 있으나 실행 가능
- 0.4~0.6: 중간 — 성공·실패 요소 혼재, 면밀한 검토 필요
- 0.6~0.8: 높음 — 유사 실패 사례 있음, 주요 리스크 존재
- 0.8~1.0: 매우 높음 — 심각한 구조적 문제, 즉각 재검토 필요

특히 아래 요소 감지 시 점수를 크게 높이세요:
- 전재산·전액·전부를 단일 자산에 집중 투자
- 시장 검증 없는 대규모 자원 투입
- 암호화폐·투기성 상품 베팅
- 수익모델·타깃 고객이 전혀 없는 전략

반드시 아래 JSON만 출력하세요 (다른 텍스트 금지):
{{"llm_risk_score": 0.0, "llm_reason": "한 문장 근거"}}\
"""

# ── 체인 초기화 (지연 로딩) ───────────────────────────────
_chain = None


def _get_chain():
    global _chain
    if _chain is None:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.1,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            request_timeout=30,
        )
        prompt = ChatPromptTemplate.from_template(_PROMPT_TEMPLATE)
        _chain = prompt | llm | JsonOutputParser()
    return _chain


def _format_cases(similar_articles: list[dict]) -> str:
    lines = []
    for art in similar_articles[:5]:
        label = art.get("label_name") or art.get("label") or "?"
        title = art.get("title", "")[:60]
        sim   = art.get("similarity_score", 0)
        src   = art.get("source", "")
        lines.append(f"- [{label}] {title} | {src} | 유사도 {sim:.0%}")
    return "\n".join(lines) if lines else "유사 사례 없음"


def score_with_llm(
    strategy_text: str,
    similar_articles: list[dict],
) -> dict[str, Optional[float]]:
    """
    LLM 리스크 점수 반환.
    성공 시: {"llm_risk_score": 0.0~1.0, "llm_reason": "..."}
    실패 시: {"llm_risk_score": None, "llm_reason": ""}  ← 앙상블에서 자동 제외
    """
    try:
        result = _get_chain().invoke({
            "strategy_text": strategy_text,
            "similar_cases": _format_cases(similar_articles),
        })
        raw_score = result.get("llm_risk_score")
        score = float(raw_score) if raw_score is not None else None
        if score is not None:
            score = round(max(0.0, min(1.0, score)), 4)
        return {
            "llm_risk_score": score,
            "llm_reason": str(result.get("llm_reason", "")),
        }
    except Exception as e:
        print(f"[llm_scorer] 스코어링 실패: {e}")
        return {"llm_risk_score": None, "llm_reason": ""}
