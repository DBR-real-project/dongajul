"""
AI 진단 리포트 생성 (LangChain + GPT API + Fewshot 프롬프팅)

사용자 전략 텍스트 + FAISS 유사 사례 + 리스크 스코어 + 전략 프레임워크 컨텍스트를 바탕으로
GPT가 전문 경영 컨설팅 수준의 전략 리스크 진단 리포트를 생성합니다.
"""
from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
from langchain_openai import ChatOpenAI


load_dotenv()


SYSTEM_PROMPT = """당신은 DBR·HBR 기업 사례와 경영전략 이론을 기반으로 사업 전략의 성공 가능성과 리스크를 진단하는 경영 전략 분석 전문가입니다.

당신의 역할은 단순 요약이 아니라,
사용자의 전략 구조를 분석하고, 유사 성공·실패 사례에 비교하여
실행 시 발생할 수 있는 핵심 리스크와 구체적인 개선 방향을 컨설팅 리포트 형식으로 제시하는 것입니다.

반드시 아래 JSON 형식만 출력하세요.
JSON 외의 설명, 마크다운, 코드블록은 절대 포함하지 마세요.

{{
  "summary": "전략 전반에 대한 2~3문장 종합 평가",
  "strategy_analysis": "전략 구조 분석: 타깃 고객·수익모델·차별화 방식·실행 난이도를 2~3문장으로 평가",
  "risk_factors": ["리스크 요인1 (한 줄 핵심 요약)", "리스크 요인2", "리스크 요인3"],
  "risk_details": ["리스크1 심층 분석 (발생 경위·영향·유사 사례와의 연결)", "리스크2 심층 분석", "리스크3 심층 분석"],
  "improvement": ["개선 제언1 (실행 방법 + 검증 지표)", "개선 제언2", "개선 제언3"],
  "framework_insight": "관련 전략 프레임워크 관점의 핵심 인사이트 1~2문장 (없으면 null)",
  "verdict": "최종 한 줄 진단"
}}

분석 원칙:
- summary는 사용자의 전략이 무엇을 하려는지 먼저 요약하고, 리스크 수준을 함께 평가하세요.
- strategy_analysis는 전략의 구조적 완성도를 평가하세요: 타깃 고객이 명확한가, 수익모델이 있는가, 차별화 요소가 있는가, 실행 난이도는 어떤가.
- risk_factors는 반드시 3개, 각각 한 줄 핵심 요약으로 작성하세요.
- risk_details는 risk_factors와 1:1 대응하여 각 리스크의 발생 경위·영향 범위·유사 사례와의 연결을 2~3문장으로 작성하세요.
- improvement는 반드시 3개, 실행 방법과 검증 지표까지 포함해 작성하세요.
- framework_insight는 제공된 전략 프레임워크 컨텍스트가 있을 때만 작성하고, 없으면 반드시 null로 작성하세요.
- 사용자의 전략에 타깃 고객, 수익모델, 차별화, 고객 확보 방식이 부족하면 반드시 리스크로 지적하세요.
- 리스크 스코어가 high이면 실행 전 검증 과제와 경고를 강하게 제시하세요.
- 리스크 스코어가 medium이면 가능성과 위험을 함께 제시하고 보완 조건을 명확히 작성하세요.
- 리스크 스코어가 low여도 잠재 리스크는 반드시 3개 제시하세요.
- 사용자의 전략 문장에 없는 내용을 과도하게 지어내지 마세요.
- "마케팅 강화", "차별화 필요"처럼 추상적인 표현 대신, 무엇을 어떻게 해야 하는지 구체적으로 작성하세요.
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
            '"strategy_analysis": "타깃 고객과 수익모델이 명시되지 않았으며, 가격 경쟁력만이 유일한 차별화 수단입니다. 원가 구조 개선 계획 없이 30% 저가를 유지하면 손익분기점을 달성하기 어렵습니다. 실행 난이도는 낮지만 지속 가능성이 매우 낮은 전략 구조입니다.", '
            '"risk_factors": ["원가 구조 개선 없는 저가 정책으로 수익성 붕괴 위험", "저가 이미지 고착으로 가격 인상 및 프리미엄 전환 불가 위험", "경쟁사 추가 가격 인하 시 장기 출혈 경쟁 함정"], '
            '"risk_details": ["유사 사례에서 원가 절감 없이 가격을 낮춘 기업은 6개월 이내 영업이익이 적자로 전환되는 패턴이 반복됩니다. 매출이 늘어도 마진 구조가 없으면 성장할수록 손실이 커집니다.", "초기 저가 포지셔닝이 소비자 인식에 고착되면 이후 가격 인상 시 기존 고객이 이탈하고 신뢰가 무너집니다. HBR 사례처럼 프리미엄 전환 시도는 브랜드 정체성 충돌로 실패하는 경우가 많습니다.", "경쟁사가 동일 가격대 또는 더 낮은 가격으로 대응할 경우, 가격 우위는 3~6개월 내 소멸됩니다. 수익성 없는 가격 경쟁 시장에 갇히면 자본력이 강한 대형 경쟁사가 유리해집니다."], '
            '"improvement": ["가격 인하 전에 원가 구조 분석과 손익분기점을 먼저 계산하고, 지속 가능한 마진이 확보되는 최저 가격선을 설정해야 합니다.", "저가 전략과 함께 품질·서비스·편의성 등 2차 차별화 요소를 명확히 제시해 가격 이외의 전환 장벽을 구축해야 합니다.", "초기 점유율 확보 후 3~6개월 이내에 가격을 단계적으로 정상화할 수 있는 로드맵을 사전에 수립하고 고객에게 가치를 선제적으로 전달해야 합니다."], '
            '"framework_insight": null, '
            '"verdict": "단기 성장 가능성은 있지만 수익성과 브랜드 훼손 위험이 커서 원가 구조 개선 없이는 실행하기 매우 위험한 전략입니다."}'
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
            '"strategy_analysis": "타깃 고객을 명확히 정의했다는 점에서 전략의 기본 구조는 탄탄합니다. 다만 수익모델(가격 책정 방식, 수익화 전략)과 고객 확보 채널이 구체화되지 않았습니다. 프리미엄 포지셔닝을 지속하려면 브랜드 인식 관리와 일관된 품질 수준 유지가 핵심 실행 과제입니다.", '
            '"risk_factors": ["초기 타깃 시장 규모가 작아 성장 한계에 빠를 가능성", "프리미엄 가격을 정당화할 품질·경험을 지속 유지해야 하는 운영 부담", "경쟁사의 유사 프리미엄 제품 출시로 차별화 소멸 위험"], '
            '"risk_details": ["집중형 전략은 초기에 높은 재구매율과 수익성을 가져오지만, 세그먼트 규모가 작으면 매출 천장이 빨리 옵니다. 확장 시 초기 타깃과의 가치 정합성이 깨지는 딜레마가 발생합니다.", "프리미엄 제품은 고객 기대치가 높아 일관성 없는 품질이나 서비스 저하가 바로 이탈로 이어집니다. 운영 비용이 증가할수록 수익성 유지가 어려워집니다.", "성공한 프리미엄 포지셔닝은 대형 경쟁사의 모방 타겟이 됩니다. 차별화가 기능에만 집중되어 있으면 복제가 쉬우며, 브랜드 자산 없이는 진입장벽이 취약합니다."], '
            '"improvement": ["출시 전 핵심 고객군의 규모(TAM/SAM)와 지불 의사(WTP)를 정량적으로 검증하고, 장기 성장을 위한 인접 세그먼트 확장 경로를 미리 설계해야 합니다.", "제품 기능뿐 아니라 패키징·서비스·커뮤니티까지 포함한 총체적 경험을 프리미엄 기준에 맞춰 설계하고, NPS(순추천고객지수)로 정기 모니터링해야 합니다.", "특허·브랜드 스토리·전용 소재 등 모방이 어려운 차별화 요소를 2~3가지 구축하여 경쟁사 진입 시 전환 장벽으로 활용해야 합니다."], '
            '"framework_insight": null, '
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
            '"strategy_analysis": "수익모델은 구독형으로 명확하지만, 타깃 고객군(어떤 산업·규모의 중소기업인지)이 구체화되지 않았습니다. AI 분석 결과를 의사결정에 활용하는 방식이 불분명하면 전환율이 낮아질 수 있습니다. 성공 가능성은 특정 산업 내 반복적 의사결정 문제를 정확히 겨냥하는 데 달려 있습니다.", '
            '"risk_factors": ["중소기업 고객이 AI 결과를 업무에 어떻게 활용할지 명확하지 않아 결제 전환 저조 위험", "대상 고객군이 넓으면 핵심 가치 제안이 흐려져 차별화 불가 위험", "AI 분석 결과의 신뢰성 부족 시 전략 의사결정 도구로 인정받기 어려움"], '
            '"risk_details": ["DBR 실패 사례에서 보듯 기술 기능이 뛰어나도 고객이 실제 업무에 어떻게 적용해야 할지 모르면 도입이 지연되고 이탈로 이어집니다. 활용 시나리오(언제, 어떤 상황에서, 어떤 결정을 내릴 때 사용하는지)를 명확히 설계해야 합니다.", "범용 서비스로 출시하면 메시지가 분산되어 '우리 서비스'라는 인식이 없는 고객에게는 선택받기 어렵습니다. 특정 산업의 특정 문제를 완벽히 해결한다는 포지셔닝이 없으면 마케팅 비용 대비 전환율이 낮습니다.", "AI 분석 결과가 단순 점수나 확률로만 제공되면 의사결정 근거로 활용하기 어렵습니다. 신뢰성 있는 사례 비교와 구체적 개선 방향이 없으면 고객은 결과를 참고하지 않게 됩니다."], '
            '"improvement": ["초기에는 특정 산업(예: 제조업 신사업 기획팀)으로 타깃을 좁히고, 그 산업에서 반복되는 의사결정 실패 유형을 3가지 이상 사전 검증해야 합니다.", "AI 점수뿐만 아니라 유사 사례 비교·리스크 근거·실행 제안까지 포함한 한 장짜리 리포트 형식으로 제공해 의사결정자가 바로 사용할 수 있게 설계해야 합니다.", "첫 3개 고객에게 3개월 무료 파일럿을 제공하고, 실제로 서비스 사용 후 결정이 달라진 사례를 수집해 마케팅 자료와 구독 전환 근거로 활용해야 합니다."], '
            '"framework_insight": null, '
            '"verdict": "시장성은 있으나 초기 타깃 산업을 좁히고 활용 시나리오를 구체화해야 성공 가능성이 높아지는 전략입니다."}'
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

{framework_section}

아래 순서로 판단한 뒤, 최종 결과는 반드시 JSON만 출력하세요.

판단 절차:
1. 사용자의 전략이 무엇을 하려는 전략인지, 타깃 고객·수익모델·차별화 방식을 파악하세요.
2. 유사 사례 중 failure 사례가 있다면 실패 원인을 우선 확인하세요.
3. 유사 사례 중 success 사례가 있다면 성공 조건을 확인하세요.
4. 현재 전략이 실패 사례와 닮은 부분, 성공 사례와 닮은 부분을 비교하세요.
5. 리스크 스코어와 유사 사례를 함께 고려하여 위험 수준을 판단하세요.
6. 전략에 부족한 요소(타깃 고객, 수익모델, 차별화, 고객 확보 방식)를 명확히 지적하세요.
7. 관련 전략 프레임워크 컨텍스트가 있다면 framework_insight에 그 프레임워크 관점의 핵심 인사이트를 1~2문장으로 작성하세요.

출력 규칙:
- summary는 2~3문장으로 작성하세요.
- strategy_analysis는 2~3문장으로 전략 구조 분석(타깃 고객·수익모델·차별화·실행 난이도)을 작성하세요.
- risk_factors는 정확히 3개, 한 줄 핵심 요약으로 작성하세요.
- risk_details는 정확히 3개, risk_factors와 1:1 대응하여 각 리스크의 심층 분석을 2~3문장으로 작성하세요.
- improvement는 정확히 3개 작성하세요.
- framework_insight는 관련 프레임워크 컨텍스트가 있을 때만 1~2문장으로 작성하고, 없으면 반드시 null로 작성하세요.
- verdict는 한 문장으로 작성하세요.
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
    framework_context: str = "",
) -> dict:
    chain = _get_chain()

    # 프레임워크 컨텍스트 섹션 구성 (있을 때만 삽입)
    fw_section = ""
    if framework_context and framework_context.strip():
        fw_section = f"[관련 전략 프레임워크 참고]\n{framework_context}"

    result = chain.invoke({
        "strategy_text": strategy_text,
        "risk_score": f"{risk_score:.2f}",
        "risk_level": risk_level,
        "k": min(len(similar_articles), 3),
        "similar_cases": _format_similar_cases(similar_articles),
        "framework_section": fw_section,
    })

    if not isinstance(result, dict):
        result = {}

    result.setdefault("summary", "")
    result.setdefault("strategy_analysis", None)
    result.setdefault("risk_factors", [])
    result.setdefault("risk_details", None)
    result.setdefault("improvement", [])
    result.setdefault("framework_insight", None)
    result.setdefault("verdict", "")

    if not isinstance(result["risk_factors"], list):
        result["risk_factors"] = []
    if not isinstance(result["improvement"], list):
        result["improvement"] = []

    if isinstance(result["risk_details"], list):
        result["risk_details"] = result["risk_details"][:3]
    else:
        result["risk_details"] = None

    result["risk_factors"] = result["risk_factors"][:3]
    result["improvement"] = result["improvement"][:3]

    # GPT가 "null" 문자열로 출력할 경우 None으로 변환
    for key in ("strategy_analysis", "framework_insight"):
        if result[key] in ("null", "NULL", ""):
            result[key] = None

    return result
