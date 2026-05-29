"""
⑧ AI 진단 리포트 생성 (LangChain + GPT API + Fewshot 프롬프팅)

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
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
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

# ── Fewshot 예시 ────────────────────────────────────────────────────────────
EXAMPLES = [
    {
        "input": (
            "[전략] 경쟁사 대비 30% 저가 정책으로 빠르게 시장 점유율을 확보한다\n"
            "[리스크 스코어] 0.72 / high\n"
            "[유사 사례] 1.[실패] 무리한 가격 경쟁으로 수익성 악화 | 유사도:0.81\n"
            "            2.[실패] 저가 브랜드 이미지 고착으로 프리미엄 전환 실패 | 유사도:0.76"
        ),
        "output": (
            '{{"summary": "공격적 저가 전략은 단기 점유율 확보에 유리하나, 유사 사례에서 수익성 악화와 브랜드 이미지 훼손이 반복적으로 나타났습니다. 특히 저가 포지셔닝이 고착되면 이후 가격 정상화가 어렵습니다.", '
            '"risk_factors": ["지속적 가격 인하로 인한 수익성 악화", "저가 브랜드 이미지 고착 위험", "경쟁사의 추가 가격 인하 대응 가능성"], '
            '"improvement": ["원가 구조 혁신을 통한 가격 경쟁력 확보", "저가와 차별화된 품질·서비스 USP 병행 설정", "점유율 목표 달성 후 단계적 가격 정상화 로드맵 수립"], '
            '"verdict": "단기 점유율 확보 효과는 있으나 수익성·브랜드 훼손 리스크가 높아 전략 수정이 필요합니다."}}'
        ),
    },
    {
        "input": (
            "[전략] 핵심 고객층을 명확히 정의하고 그들의 니즈에 집중한 프리미엄 제품을 출시한다\n"
            "[리스크 스코어] 0.11 / low\n"
            "[유사 사례] 1.[성공] 타깃 세분화로 프리미엄 시장 점유율 확대 | 유사도:0.84\n"
            "            2.[성공] 고객 니즈 기반 제품 혁신으로 충성 고객 확보 | 유사도:0.79"
        ),
        "output": (
            '{{"summary": "명확한 타깃 설정과 프리미엄 포지셔닝 전략은 유사 성공 사례와 높은 일치도를 보입니다. 고객 니즈 기반의 집중 전략은 충성 고객 확보와 수익성 개선에 효과적입니다.", '
            '"risk_factors": ["초기 타깃 시장 규모가 작아 성장 한계 가능", "프리미엄 포지셔닝 유지를 위한 지속적 품질 투자 필요", "경쟁사의 유사 프리미엄 제품 출시 가능성"], '
            '"improvement": ["타깃 세그먼트 확장 로드맵 사전 수립", "브랜드 스토리텔링 강화로 프리미엄 인식 구축", "충성 고객 기반 확보 후 인접 시장 진출 검토"], '
            '"verdict": "리스크가 낮고 성공 사례와 유사한 전략으로 실행 가능성이 높습니다."}}'
        ),
    },
]

_EXAMPLE_PROMPT = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai",    "{output}"),
])

_FEWSHOT_PROMPT = FewShotChatMessagePromptTemplate(
    example_prompt=_EXAMPLE_PROMPT,
    examples=EXAMPLES,
)

HUMAN_PROMPT = """[분석 대상 전략]
{strategy_text}

[리스크 스코어]
{risk_score} / 1.0  (등급: {risk_level})

[유사 사례 Top-{k} — 벡터 유사도 기반]
{similar_cases}

위 정보를 바탕으로 리스크 진단 리포트를 JSON으로 작성하세요."""

_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    _FEWSHOT_PROMPT,
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
