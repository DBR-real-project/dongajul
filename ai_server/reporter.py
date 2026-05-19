"""
⑧ AI 진단 리포트 생성 (LangChain + GPT API)

사용자 전략 텍스트 + FAISS 유사 사례 + 리스크 스코어를 바탕으로
GPT가 경영 전략 리스크 진단 리포트를 생성합니다.

환경변수:
  OPENAI_API_KEY  : OpenAI API 키 (필수)
  OPENAI_MODEL    : 사용 모델 (기본 gpt-4o-mini)
"""
from __future__ import annotations

import os
from typing import Any

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

SYSTEM_PROMPT = """당신은 경영 전략 리스크 분석 전문가입니다.
DBR·HBR 성공/실패 사례 데이터베이스를 기반으로 사용자의 전략을 진단합니다.
반드시 아래 JSON 형식만 출력하세요. 다른 텍스트는 절대 포함하지 마세요.
{{
  "summary": "전략 전반에 대한 2~3문장 평가",
  "risk_factors": ["리스크 요인1", "리스크 요인2", "리스크 요인3"],
  "improvement": ["개선 제언1", "개선 제언2", "개선 제언3"],
  "verdict": "최종 한 줄 진단"
}}"""

HUMAN_PROMPT = """[분석 대상 전략]
{strategy_text}

[리스크 스코어]
{risk_score} / 1.0  (등급: {risk_level})

[유사 사례 Top-{k} — 벡터 유사도 기반]
{similar_cases}

위 정보를 바탕으로 리스크 진단 리포트를 JSON으로 작성하세요."""

_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human",  HUMAN_PROMPT),
])

_chain: Any = None


def _get_chain() -> Any:
    global _chain
    if _chain is None:
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        llm = ChatOpenAI(model=model, temperature=0.3)
        _chain = _PROMPT | llm | JsonOutputParser()
    return _chain


def _format_similar_cases(articles: list[dict]) -> str:
    label_kor = {"success": "성공", "failure": "실패", "neutral": "중립"}
    lines = []
    for a in articles:
        lk = label_kor.get(a.get("label", ""), "")
        title = str(a.get("title", ""))[:60]
        sim   = a.get("similarity", 0)
        src   = a.get("source", "")
        cat   = a.get("category", "")
        lines.append(f"{a['rank']}. [{lk}] {title}\n"
                     f"   유사도: {sim:.3f} | {src} | {cat}")
    return "\n".join(lines)


def generate_report(
    strategy_text: str,
    risk_score: float,
    risk_level: str,
    similar_articles: list[dict],
) -> dict:
    """
    유사 사례 + 리스크 스코어를 받아 GPT 진단 리포트 반환.

    Returns:
        {
            "summary": str,
            "risk_factors": list[str],
            "improvement": list[str],
            "verdict": str,
        }
    """
    chain = _get_chain()
    result = chain.invoke({
        "strategy_text": strategy_text,
        "risk_score": f"{risk_score:.2f}",
        "risk_level": risk_level,
        "k": len(similar_articles),
        "similar_cases": _format_similar_cases(similar_articles),
    })
    # 필수 키 보정 (GPT가 누락할 경우 대비)
    result.setdefault("summary", "")
    result.setdefault("risk_factors", [])
    result.setdefault("improvement", [])
    result.setdefault("verdict", "")
    return result
