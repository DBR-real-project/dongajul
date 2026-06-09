"""
AI 진단 리포트 생성 (LangChain + GPT API + Fewshot 프롬프팅)

사용자 전략 텍스트 + FAISS 유사 사례 + 리스크 스코어를 바탕으로
GPT가 경영 전략 리스크 진단 리포트를 생성합니다.
"""
from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
from langchain_openai import ChatOpenAI


load_dotenv()


SYSTEM_PROMPT = """당신은 DBR·HBR 기업 사례를 기반으로 사업 전략의 성공 가능성과 리스크를 진단하는 경영 전략 분석 전문가입니다.

당신의 역할은 단순 요약이 아니라,
사용자의 전략을 유사 성공 사례와 유사 실패 사례에 비교하여
실행 시 발생할 수 있는 핵심 리스크와 구체적인 개선 방향을 제시하는 것입니다.

반드시 아래 JSON 형식만 출력하세요.
JSON 외의 설명, 마크다운, 코드블록은 절대 포함하지 마세요.

{{
  "summary": "전략 전반에 대한 2~3문장 평가",
  "risk_factors": ["리스크 요인1", "리스크 요인2", "리스크 요인3"],
  "improvement": ["개선 제언1", "개선 제언2", "개선 제언3"],
  "verdict": "최종 한 줄 진단"
}}

분석 원칙:
- summary는 사용자의 전략이 무엇을 하려는지 먼저 요약하고, 리스크 수준을 함께 평가하세요.
- 사용자의 전략이 어떤 고객, 시장, 수익모델, 차별화 방식, 고객 확보 방식에 기반한 전략인지 먼저 파악하세요.
- 유사 실패 사례가 있다면 risk_factors에 실패 사례에서 반복되는 원인을 우선 반영하세요.
- 유사 성공 사례가 있다면 improvement에 성공 사례에서 확인되는 실행 방식을 반영하세요.
- 유사 사례의 제목이나 단어만 보고 판단하지 말고, 제공된 label과 사례 요약의 의미를 함께 고려하세요.
- risk_factors는 반드시 3개 작성하세요.
- improvement는 반드시 3개 작성하세요.
- risk_factors는 각각 "문제점 + 발생 가능한 결과"가 드러나게 작성하세요.
- improvement는 각각 "실행 방법 + 확인 지표 또는 검증 방법"이 드러나게 작성하세요.
- 사용자의 전략에 타깃 고객, 수익모델, 차별화, 고객 확보 방식이 부족하면 반드시 리스크로 지적하세요.
- 리스크 스코어가 high이면 실행 전 검증 과제와 경고를 강하게 제시하세요.
- 리스크 스코어가 medium이면 가능성과 위험을 함께 제시하고, 보완 조건을 명확히 작성하세요.
- 리스크 스코어가 low여도 잠재 리스크는 반드시 3개 제시하세요.
- 특정 유형의 유사 사례가 부족한 경우, 사용자의 전략 자체에서 보이는 구조적 리스크와 개선 방향을 기준으로 작성하세요.
- 유사 사례가 부족하면 전략 자체의 구조적 리스크를 기준으로 판단하세요.
- 사용자의 전략 문장에 없는 내용을 과도하게 지어내지 마세요.
- "마케팅 강화", "차별화 필요", "고객 분석 필요"처럼 추상적인 표현만 쓰지 말고 무엇을 어떻게 해야 하는지 구체적으로 작성하세요.
- 너무 어려운 전문용어보다 사용자가 바로 이해할 수 있는 표현을 사용하세요.
"""

EXAMPLES = [
    {
        "input": (
            "[전략] 경쟁사 대비 30% 저가 정책으로 빠르게 시장 점유율을 확보한다\n"
            "[리스크 스코어] 0.72 / high\n"
            "[유사 사례 Top-3 — 벡터 유사도 기반]\n"
            "1. [실패] 무리한 가격 경쟁으로 수익성 악화\n"
            "   유사도: 0.810 | 출처: DBR | 분야: 가격전략\n"
            "   사례 요약: 단기 매출 확대를 위해 가격을 낮췄지만, 원가 구조 개선 없이 할인 경쟁을 지속하면서 영업이익이 급격히 악화되었다.\n\n"
            "2. [실패] 저가 브랜드 이미지 고착으로 프리미엄 전환 실패\n"
            "   유사도: 0.760 | 출처: HBR | 분야: 브랜드전략\n"
            "   사례 요약: 초기 저가 전략으로 고객을 모았으나, 이후 가격 인상과 프리미엄 제품 전환 과정에서 기존 고객 이탈과 브랜드 신뢰 저하가 발생했다."
        ),
        "output": (
            '{"summary": "이 전략은 낮은 가격을 앞세워 빠르게 시장 점유율을 확보하려는 공격적 진입 전략입니다. 단기 고객 유입에는 효과가 있을 수 있지만, 유사 실패 사례처럼 수익성 악화와 저가 이미지 고착 위험이 큽니다.", '
            '"risk_factors": ["원가 구조 개선 없이 가격을 낮출 경우 매출은 늘어도 이익이 줄어들 수 있음", "저가 이미지가 고착되면 이후 가격 인상이나 프리미엄 전환이 어려워질 수 있음", "경쟁사가 추가 가격 인하로 대응하면 장기적인 출혈 경쟁으로 이어질 수 있음"], '
            '"improvement": ["가격 인하 전에 원가 절감 구조와 손익분기점을 먼저 검증해야 함", "저가 전략과 함께 품질·서비스·편의성 등 차별화 요소를 명확히 제시해야 함", "초기 점유율 확보 후 단계적으로 가격을 정상화할 수 있는 로드맵을 마련해야 함"], '
            '"verdict": "단기 성장 가능성은 있지만 수익성과 브랜드 훼손 위험이 커서 보완 없이 실행하기에는 위험한 전략입니다."}'
        ),
    },
    {
        "input": (
            "[전략] 핵심 고객층을 명확히 정의하고 그들의 니즈에 집중한 프리미엄 제품을 출시한다\n"
            "[리스크 스코어] 0.18 / low\n"
            "[유사 사례 Top-3 — 벡터 유사도 기반]\n"
            "1. [성공] 타깃 세분화로 프리미엄 시장 점유율 확대\n"
            "   유사도: 0.840 | 출처: DBR | 분야: 고객전략\n"
            "   사례 요약: 넓은 대중 시장보다 구매력이 높고 문제 인식이 뚜렷한 고객군에 집중해 높은 재구매율과 브랜드 충성도를 확보했다.\n\n"
            "2. [성공] 고객 니즈 기반 제품 혁신으로 충성 고객 확보\n"
            "   유사도: 0.790 | 출처: HBR | 분야: 제품전략\n"
            "   사례 요약: 고객 인터뷰와 사용 데이터 분석을 바탕으로 핵심 기능을 개선하여 가격이 높아도 고객이 납득할 수 있는 가치를 제공했다."
        ),
        "output": (
            '{"summary": "이 전략은 명확한 고객군을 정하고 그들의 니즈에 맞춘 프리미엄 제품을 출시하려는 집중형 차별화 전략입니다. 유사 성공 사례와 방향성이 잘 맞고, 고객 문제가 분명하다면 높은 충성도와 수익성을 기대할 수 있습니다.", '
            '"risk_factors": ["초기 타깃 시장 규모가 작으면 성장 속도가 제한될 수 있음", "프리미엄 가격을 정당화할 만큼의 품질과 경험을 지속적으로 제공해야 함", "경쟁사가 유사한 프리미엄 제품을 빠르게 출시할 가능성이 있음"], '
            '"improvement": ["출시 전 핵심 고객군의 규모와 지불 의사를 정량적으로 검증해야 함", "제품 기능뿐 아니라 브랜드 스토리와 고객 경험까지 프리미엄 기준에 맞춰 설계해야 함", "초기 충성 고객 확보 후 인접 고객군으로 확장하는 단계별 전략을 수립해야 함"], '
            '"verdict": "리스크는 낮은 편이며, 고객 검증과 프리미엄 가치 설계가 충분하다면 실행 가능성이 높은 전략입니다."}'
        ),
    },
    {
        "input": (
            "[전략] AI 기반 구독형 리스크 분석 서비스를 출시하여 중소기업의 전략 의사결정을 지원한다\n"
            "[리스크 스코어] 0.46 / medium\n"
            "[유사 사례 Top-3 — 벡터 유사도 기반]\n"
            "1. [성공] SaaS 분석 도구의 반복 매출 모델 구축\n"
            "   유사도: 0.770 | 출처: HBR | 분야: SaaS\n"
            "   사례 요약: 특정 산업의 반복적인 업무 문제를 해결하는 분석 서비스를 제공해 구독 유지율을 높였다.\n\n"
            "2. [실패] AI 솔루션 도입 장벽으로 초기 고객 확보 지연\n"
            "   유사도: 0.730 | 출처: DBR | 분야: AI서비스\n"
            "   사례 요약: 기술 기능은 우수했지만 고객이 실제 업무에서 어떻게 활용해야 하는지 이해하지 못해 도입과 결제가 지연되었다.\n\n"
            "3. [실패] 범용 서비스 포지셔닝으로 차별화 실패\n"
            "   유사도: 0.690 | 출처: DBR | 분야: 플랫폼전략\n"
            "   사례 요약: 너무 넓은 고객군을 대상으로 서비스를 출시하면서 핵심 고객 문제와 차별점이 불명확해졌다."
        ),
        "output": (
            '{"summary": "이 전략은 AI와 구독형 모델을 결합해 중소기업의 전략 리스크 분석을 지원하려는 SaaS형 서비스 전략입니다. 반복 매출 구조를 만들 수 있다는 장점이 있지만, 초기 고객군과 활용 방식이 불명확하면 도입 장벽이 커질 수 있습니다.", '
            '"risk_factors": ["중소기업 고객이 AI 분석 결과를 실제 의사결정에 어떻게 활용할지 명확하지 않으면 결제 전환이 낮아질 수 있음", "대상 고객군이 넓으면 서비스 메시지와 핵심 기능이 흐려져 차별화가 어려울 수 있음", "분석 결과의 신뢰성과 근거가 부족하면 전략 의사결정 도구로 인정받기 어려울 수 있음"], '
            '"improvement": ["초기에는 특정 산업이나 특정 문제를 가진 중소기업군으로 타깃을 좁혀야 함", "AI 결과를 단순 점수보다 사례 비교, 리스크 근거, 실행 제안까지 포함한 보고서 형태로 제공해야 함", "무료 진단이나 파일럿 프로그램을 통해 고객이 실제 업무 효과를 체감하도록 설계해야 함"], '
            '"verdict": "시장성은 있으나 초기 타깃과 활용 시나리오를 구체화해야 성공 가능성이 높아지는 전략입니다."}'
        ),
    },
]


_EXAMPLE_PROMPT = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}"),
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

아래 순서로 판단한 뒤, 최종 결과는 반드시 JSON만 출력하세요.

판단 절차:
1. 사용자의 전략이 무엇을 하려는 전략인지 한 문장으로 파악하세요.
2. 유사 사례 중 failure 사례가 있다면 실패 원인을 우선 확인하세요.
3. 유사 사례 중 success 사례가 있다면 성공 조건을 확인하세요.
4. 현재 전략이 실패 사례와 닮은 부분, 성공 사례와 닮은 부분을 비교하세요.
5. 리스크 스코어와 유사 사례를 함께 고려하여 위험 수준을 판단하세요.
6. 전략에 부족한 요소가 있으면 타깃 고객, 수익모델, 차별화, 고객 확보 방식, 실행 난이도 중 어디가 부족한지 명확히 지적하세요.
7. 개선 제언은 실제로 실행 가능한 조치로 작성하세요.

출력 규칙:
- summary는 2~3문장으로 작성하세요.
- risk_factors는 정확히 3개 작성하세요.
- improvement는 정확히 3개 작성하세요.
- verdict는 한 문장으로 작성하세요.
- risk_factors에는 유사 실패 사례 또는 전략 자체에서 확인되는 위험을 반영하세요.
- improvement에는 유사 성공 사례 또는 전략 보완에 필요한 실행 방법을 반영하세요.
- JSON 외의 문장은 절대 출력하지 마세요."""


_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    _FEWSHOT_PROMPT,
    ("human", HUMAN_PROMPT),
])


_chain: Any = None


def _get_chain() -> Any:
    global _chain

    if _chain is None:
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        llm = ChatOpenAI(
            model=model,
            temperature=0.3,
            timeout=30,
            max_retries=1,
        )

        _chain = _PROMPT | llm | JsonOutputParser()

    return _chain


def _format_similar_cases(articles: list[dict]) -> str:
    label_kor = {
        "success": "성공",
        "failure": "실패",
        "neutral": "중립",
    }

    lines = []

    for a in articles[:3]:
        lk = label_kor.get(a.get("label", ""), "중립")
        title = str(a.get("title", "") or "")[:80]
        sim = float(a.get("similarity", 0) or 0)
        src = a.get("source", "") or "출처 없음"
        cat = a.get("category", "") or "분류 없음"
        summary = str(a.get("summary", "") or "").strip()

        if len(summary) > 250:
            summary = summary[:250] + "..."

        lines.append(
            f"{a.get('rank', '-')}. [{lk}] {title}\n"
            f"   유사도: {sim:.3f} | 출처: {src} | 분야: {cat}\n"
            f"   사례 요약: {summary if summary else '요약 없음'}"
        )

    if not lines:
        return "유사 사례가 없습니다."

    return "\n\n".join(lines)


def generate_report(
    strategy_text: str,
    risk_score: float,
    risk_level: str,
    similar_articles: list[dict],
) -> dict:
    chain = _get_chain()

    result = chain.invoke({
        "strategy_text": strategy_text,
        "risk_score": f"{risk_score:.2f}",
        "risk_level": risk_level,
        "k": min(len(similar_articles), 3),
        "similar_cases": _format_similar_cases(similar_articles),
    })

    if not isinstance(result, dict):
        result = {}

    result.setdefault("summary", "")
    result.setdefault("risk_factors", [])
    result.setdefault("improvement", [])
    result.setdefault("verdict", "")

    if not isinstance(result["risk_factors"], list):
        result["risk_factors"] = []

    if not isinstance(result["improvement"], list):
        result["improvement"] = []

    result["risk_factors"] = result["risk_factors"][:3]
    result["improvement"] = result["improvement"][:3]

    return result