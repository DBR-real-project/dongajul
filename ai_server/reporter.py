"""
AI 진단 리포트 생성 (LangChain + GPT API + Fewshot 프롬프팅)

DBR·HBR 13,000건 사례 데이터베이스에서 추출한 실패/성공 패턴을 기반으로
사용자 전략의 리스크를 패턴 분석 리포트 형식으로 보고합니다.
"""
from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
from langchain_openai import ChatOpenAI


load_dotenv()


SYSTEM_PROMPT = """당신은 DBR·HBR 경영 사례 데이터베이스 13,000건을 기반으로 전략 리스크 패턴을 분석하는 데이터 분석 전문가입니다.

당신의 역할은 "사용자 전략과 유사한 과거 사례에서 어떤 패턴이 반복되었는가"를 보고하는 것입니다.
처방("이렇게 해라")이 아닌, 패턴 경보("이런 조건에서 이런 결과가 나왔다")가 핵심입니다.

반드시 아래 JSON 형식만 출력하세요.
JSON 외의 설명, 마크다운, 코드블록은 절대 포함하지 마세요.

{{
  "summary": "전략 핵심 구조 요약 + 데이터베이스 내 유사 사례 비교 리스크 평가 (2~3문장)",
  "strategy_analysis": "전략 구조 진단: 타깃 고객 명확성·수익모델 유무·차별화 요소·실행 복잡도 (2~3문장)",
  "market_context": "현재 관련 시장 동향과 이 전략이 처한 외부 환경 분석 (2~3문장, 제공된 시장 동향 데이터를 근거로 작성. 데이터 없으면 null)",
  "risk_factors": ["과거 유사 전략에서 반복 관찰된 실패 패턴1 (한 줄 요약)", "실패 패턴2", "실패 패턴3"],
  "risk_details": ["패턴1 상세: 어떤 상황에서 어떻게 실패했으며 유사 사례 결과는 (2~3문장)", "패턴2 상세", "패턴3 상세"],
  "improvement": ["유사 성공 사례들이 공통으로 실행한 조치1 (무엇을 했고 어떤 지표로 검증했는지)", "조치2", "조치3"],
  "framework_insight": "관련 프레임워크 관점 핵심 인사이트 1~2문장 (없으면 null)",
  "verdict": "데이터 기반 최종 리스크 판정 한 문장"
}}

작성 원칙:
- market_context는 제공된 [시장 동향] 데이터를 직접 근거로 사용하세요. 데이터가 없으면 null.
- risk_factors는 "과거 유사 전략에서 ~~패턴이 반복 관찰됨" 형태로 작성하세요.
- risk_details는 실패가 어떤 조건에서, 어떤 결과로 이어졌는지 유사 사례 내용과 연결하세요.
- improvement는 "유사 성공 사례에서는 ~~을 먼저 실행했습니다" 형태를 권장하세요.
- verdict는 "데이터 기반으로 볼 때 ~~한 리스크 수준의 전략입니다" 형태로 작성하세요.
- 리스크 스코어가 high이면 실패 패턴 경고를 강하게 제시하세요.
- 리스크 스코어가 low여도 잠재 위험 패턴 3개는 반드시 제시하세요.
- 사용자 전략에 없는 내용을 가정하거나 지어내지 마세요.
- "마케팅 강화 필요" 같은 추상적 표현 대신 과거 성공 사례의 구체적 조치를 연결하세요.
- 타깃 고객·수익모델·차별화가 부족하면 반드시 리스크로 지적하세요.
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
            '{"summary": "이 전략은 낮은 가격을 앞세워 빠르게 시장 점유율을 확보하려는 공격적 진입 전략입니다. 데이터베이스 내 유사 사례 분석 결과 원가 구조 미확보 상태의 저가 정책에서 수익성 붕괴와 브랜드 이미지 고착이 반복된 패턴이 다수 관찰되었습니다.", '
            '"strategy_analysis": "타깃 고객과 수익모델이 명시되지 않았으며, 가격 경쟁력만이 유일한 차별화 수단입니다. 원가 구조 개선 계획 없이 30% 저가를 유지하면 손익분기점을 달성하기 어렵습니다. 실행 난이도는 낮지만 지속 가능성이 매우 낮은 전략 구조입니다.", '
            '"risk_factors": ["원가 구조 개선 없이 가격만 낮춘 전략에서 6개월 내 영업이익 적자 전환 패턴 반복 관찰", "초기 저가 포지셔닝 고착 이후 가격 인상 시 고객 이탈 및 브랜드 신뢰 저하 패턴 다수", "경쟁사 대응 가격 인하 이후 장기 출혈 경쟁 루프에 진입한 사례 반복"], '
            '"risk_details": ["DBR 유사 사례에서 원가 절감 없이 가격만 낮춘 기업은 매출 증가에도 불구하고 6개월 이내 영업이익이 적자로 전환되는 패턴이 반복되었습니다. 성장할수록 손실이 커지는 구조가 고착되면 이후 가격 회복이 불가능해집니다.", "HBR 사례 분석에서 초기 저가로 고객을 확보한 뒤 가격 인상을 시도한 기업들은 기존 고객 이탈과 브랜드 신뢰 저하를 경험했습니다. 소비자 인식에 한번 고착된 저가 이미지는 단기간에 변경하기 어렵습니다.", "경쟁사가 동일 가격대 또는 더 낮은 가격으로 대응한 사례에서 가격 우위는 3~6개월 내 소멸되었습니다. 자본력이 약한 기업이 대형 경쟁사와 장기 가격 경쟁에 진입하면 결국 시장에서 퇴출된 패턴이 관찰됩니다."], '
            '"improvement": ["유사 성공 사례에서는 출시 전 원가 구조 분석과 손익분기점 계산을 먼저 완료하고 지속 가능한 마진이 확보되는 최저 가격선을 설정한 뒤 가격 전략을 수립했습니다.", "저가 전략으로 성공한 사례들은 가격 외에 품질·서비스·편의성 등 2차 차별화 요소를 병행 구축하여 가격 이외의 전환 장벽을 만들었습니다.", "초기 점유율 확보 후 수익성을 회복한 사례들은 3~6개월 이내에 가격을 단계적으로 정상화하는 로드맵을 사전에 수립하고 고객에게 가치를 선제적으로 전달하는 커뮤니케이션을 병행했습니다."], '
            '"framework_insight": null, '
            '"verdict": "데이터 기반으로 볼 때 원가 구조 미확보 상태의 30% 저가 전략은 단기 고객 유입 이후 수익성이 급격히 악화되는 패턴이 반복된 고위험 전략입니다."}'
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
            '{"summary": "이 전략은 명확한 고객군을 정하고 그들의 니즈에 맞춘 프리미엄 제품을 출시하려는 집중형 차별화 전략입니다. 데이터베이스 내 유사 성공 사례들과 방향성이 잘 맞으며, 고객 문제가 명확히 정의된 경우 높은 충성도와 수익성이 나타난 패턴이 관찰됩니다.", '
            '"strategy_analysis": "타깃 고객을 명확히 정의했다는 점에서 전략의 기본 구조는 탄탄합니다. 다만 수익모델(가격 책정 방식, 수익화 전략)과 고객 확보 채널이 구체화되지 않았습니다. 프리미엄 포지셔닝을 지속하려면 브랜드 인식 관리와 일관된 품질 수준 유지가 핵심 실행 과제입니다.", '
            '"risk_factors": ["좁은 타깃 세그먼트에 집중한 전략에서 매출 천장 도달 후 확장 과정에 브랜드 정합성이 깨진 패턴 관찰", "프리미엄 포지셔닝 이후 운영 비용 증가 및 품질 일관성 저하 시 충성 고객 이탈 패턴 다수", "기능 기반 차별화만 보유한 프리미엄 전략에서 대형 경쟁사 모방 진입 후 차별화 소멸 사례 반복"], '
            '"risk_details": ["집중형 전략은 초기 높은 수익성을 가져오지만, 세그먼트 규모가 작으면 매출 천장이 빠르게 옵니다. 성공한 사례들도 인접 세그먼트 확장 시 초기 타깃과의 가치 정합성이 깨져 어려움을 겪는 딜레마가 반복 관찰되었습니다.", "프리미엄 고객은 기대치가 높아 일관성 없는 품질이나 서비스 저하가 즉각적인 이탈로 이어지는 패턴이 관찰되었습니다. 유사 사례에서 운영 비용 증가 구간에서 품질 유지 실패 사례가 다수 나타났습니다.", "기능 중심 차별화는 대형 경쟁사의 모방 타겟이 됩니다. 브랜드 자산 없이 기능만으로 프리미엄을 유지하려 한 사례에서 경쟁사 진입 후 6~12개월 내 가격 프리미엄이 소멸된 패턴이 나타났습니다."], '
            '"improvement": ["유사 성공 사례에서는 출시 전 핵심 고객군 규모(TAM/SAM)와 지불 의사(WTP)를 정량적으로 검증하고 장기 성장을 위한 인접 세그먼트 확장 경로를 미리 설계했습니다.", "프리미엄 성공 사례들은 제품 기능뿐 아니라 패키징·서비스·커뮤니티까지 포함한 총체적 경험을 프리미엄 기준에 맞춰 설계하고 NPS(순추천고객지수)로 정기 모니터링했습니다.", "경쟁 대응력을 높인 사례들은 특허·브랜드 스토리·전용 소재 등 복제가 어려운 차별화 요소를 2~3가지 이상 구축해 경쟁사 진입 시 전환 장벽으로 활용했습니다."], '
            '"framework_insight": null, '
            '"verdict": "데이터 기반으로 볼 때 고객 검증과 총체적 경험 설계가 뒷받침된다면 성공 패턴과 잘 맞는 전략입니다."}'
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
            '{"summary": "이 전략은 AI와 구독형 모델을 결합해 중소기업의 전략 리스크 분석을 지원하는 SaaS형 서비스 전략입니다. 데이터베이스 내 유사 AI 서비스 사례에서 기술 완성도와 무관하게 활용 방법 불명확과 범용 포지셔닝으로 전환 저조 패턴이 반복 관찰되었습니다.", '
            '"strategy_analysis": "수익모델은 구독형으로 명확하지만, 타깃 고객군(어떤 산업·규모의 중소기업인지)이 구체화되지 않았습니다. AI 분석 결과를 실제 의사결정에 어떻게 활용하는지가 불분명하면 전환율이 낮아질 수 있습니다. 성공 가능성은 특정 산업 내 반복적 의사결정 문제를 정확히 겨냥하는 데 달려 있습니다.", '
            '"risk_factors": ["AI 분석 결과의 업무 활용 방법 불명확으로 기술 완성도와 무관하게 도입·결제 전환이 지연된 패턴 반복", "범용 타깃으로 출시한 B2B SaaS에서 메시지 분산으로 핵심 고객 확보 실패 사례 다수", "점수·확률만 제공한 분석 도구에서 의사결정 근거로 활용되지 않고 이탈한 패턴 관찰"], '
            '"risk_details": ["DBR 실패 사례에서 기술 기능이 뛰어나도 고객이 실제 업무에 적용 방법을 모르면 도입이 지연되고 이탈로 이어지는 패턴이 반복되었습니다. 활용 시나리오(언제, 어떤 상황에서, 어떤 결정을 내릴 때 사용하는지)가 없으면 결제 전환율이 현저히 낮아졌습니다.", "범용 서비스로 출시하면 메시지가 분산되어 특정 고객군의 공감을 얻기 어렵습니다. DBR 사례에서 넓은 타깃을 대상으로 한 B2B 서비스는 마케팅 비용 대비 전환율이 낮아 초기 고객 확보에 실패한 패턴이 반복되었습니다.", "유사 분석 서비스 사례에서 점수와 확률만 제공한 도구는 의사결정자에게 근거로 활용되지 않고 1~3개월 내 이탈로 이어지는 패턴이 관찰되었습니다. 사례 비교와 실행 제안이 없으면 신뢰를 얻기 어렵습니다."], '
            '"improvement": ["유사 성공 사례에서는 초기에 특정 산업으로 타깃을 좁히고 그 산업에서 반복되는 의사결정 실패 유형을 3가지 이상 사전 인터뷰로 검증한 뒤 서비스를 개발했습니다.", "성공한 B2B 분석 도구들은 점수 외에 유사 사례 비교·리스크 근거·실행 제안까지 포함한 한 장짜리 리포트 형식을 제공해 의사결정자가 즉시 활용할 수 있게 설계했습니다.", "초기 고객 확보에 성공한 SaaS 사례들은 첫 3~5개 고객에게 무료 파일럿을 제공하고 실제 사용 후 의사결정이 달라진 사례를 수집해 구독 전환 근거와 마케팅 자료로 활용했습니다."], '
            '"framework_insight": "린스타트업 관점에서 이 전략은 고객 개발(Customer Development) 없이 제품을 구축하는 전형적인 위험 패턴을 따르고 있습니다. 유사 성공 사례에서는 특정 산업 의사결정자 10명 이상을 인터뷰해 \'AI 분석이 실제로 필요한 결정 순간\'을 먼저 검증한 뒤 제품을 개발했습니다.", '
            '"verdict": "데이터 기반으로 볼 때 초기 타깃 좁히기와 활용 시나리오 구체화 없이는 전환율 저조 패턴에 빠질 가능성이 높은 중위험 전략입니다."}'
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

[유사 사례 Top-{k} — 벡터 유사도 기반, DBR·HBR 13,000건 데이터베이스]
{similar_cases}

{trend_section}

{web_trend_section}

{framework_section}

아래 절차로 패턴을 분석한 뒤, 최종 결과는 반드시 JSON만 출력하세요.

패턴 분석 절차:
1. 사용자 전략의 핵심 구조(타깃 고객·수익모델·차별화·실행 방식)를 파악하세요.
2. 유사 사례 중 failure 케이스에서 어떤 조건에서, 왜, 어떻게 실패했는지 패턴을 추출하세요.
3. 유사 사례 중 success 케이스에서 공통으로 갖춘 조건과 실행 조치를 확인하세요.
4. 현재 전략이 실패 패턴과 닮은 부분, 성공 조건과 다른 부분을 비교하세요.
5. risk_factors는 "과거 데이터에서 반복 관찰된 실패 패턴" 형태로 3개 작성하세요.
6. improvement는 "유사 성공 사례에서 공통으로 실행한 조치"를 근거로 3개 작성하세요.
7. 시장 동향 데이터가 있으면 이를 근거로 market_context를 2~3문장으로 작성하세요.
8. 프레임워크 컨텍스트가 있으면 해당 프레임워크 관점의 핵심 인사이트를 작성하세요.

출력 규칙:
- summary: 2~3문장. 전략 요약 + 데이터 기반 리스크 평가.
- strategy_analysis: 2~3문장. 전략 구조 진단.
- market_context: 2~3문장. 시장 동향 데이터 기반 외부 환경 분석. 데이터 없으면 null.
- risk_factors: 정확히 3개, 과거 유사 사례에서 반복된 패턴 중심 한 줄 요약.
- risk_details: 정확히 3개, risk_factors 1:1 대응 심층 분석 2~3문장.
- improvement: 정확히 3개, 유사 성공 사례 조치 중심으로 작성.
- framework_insight: 컨텍스트 있을 때만, 없으면 null.
- verdict: 한 문장. "데이터 기반으로 볼 때~" 형태 권장.
- JSON만 출력, 그 외 절대 포함 금지."""


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
            temperature=0.5,
            timeout=30,
            max_retries=2,
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

    for a in articles[:5]:
        lk = label_kor.get(a.get("label", ""), "중립")
        title = str(a.get("title", "") or "")[:80]
        sim = float(a.get("similarity", 0) or 0)
        src = a.get("source", "") or "출처 없음"
        cat = a.get("category", "") or "분류 없음"
        summary = str(a.get("summary", "") or "").strip()

        if len(summary) > 450:
            summary = summary[:450] + "..."

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
    trend_context: str = "",
    web_trend_context: str = "",
) -> dict:
    chain = _get_chain()

    fw_section = ""
    if framework_context and framework_context.strip():
        fw_section = f"[관련 전략 프레임워크 참고]\n{framework_context}"

    trend_section = ""
    if trend_context and trend_context.strip():
        trend_section = f"[시장 트렌드 분석 (NAVER 2024~2025 데이터 기반)]\n{trend_context}"

    web_trend_section = ""
    if web_trend_context and web_trend_context.strip():
        web_trend_section = f"[최신 시장 조사 (실시간 웹 검색)]\n{web_trend_context}"

    try:
        result = chain.invoke({
            "strategy_text": strategy_text,
            "risk_score": f"{risk_score:.2f}",
            "risk_level": risk_level,
            "k": min(len(similar_articles), 5),
            "similar_cases": _format_similar_cases(similar_articles),
            "trend_section": trend_section,
            "web_trend_section": web_trend_section,
            "framework_section": fw_section,
        })
    except Exception as e:
        print(f"[reporter] GPT 호출 실패, 기본값 반환: {e}")
        result = {}

    if not isinstance(result, dict):
        result = {}

    result.setdefault("summary", "")
    result.setdefault("strategy_analysis", None)
    result.setdefault("market_context", None)
    result.setdefault("risk_factors", [])
    result.setdefault("risk_details", None)
    result.setdefault("improvement", [])
    result.setdefault("framework_insight", None)
    result.setdefault("verdict", "")

    if not result.get("summary") and not result.get("verdict"):
        result["verdict"] = "AI 리포트를 생성할 수 없습니다. GPT API 사용량 한도를 초과했거나 오류가 발생했습니다."

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

    for key in ("strategy_analysis", "market_context", "framework_insight"):
        if result[key] in ("null", "NULL", ""):
            result[key] = None

    return result
