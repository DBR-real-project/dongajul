import json
import os
from functools import lru_cache
from typing import Any, List

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI


load_dotenv()


class DiagnosisReport(BaseModel):
    summary: str = Field(description="사용자 전략에 대한 핵심 요약")
    risk_factors: List[str] = Field(description="주요 리스크 목록")
    improvement_suggestions: List[str] = Field(description="실행 가능한 개선 제안 목록")
    final_diagnosis: str = Field(description="최종 진단 결과")


def _safe_article_to_dict(article: Any) -> dict:
    if isinstance(article, dict):
        return article

    if hasattr(article, "model_dump"):
        return article.model_dump()

    if hasattr(article, "dict"):
        return article.dict()

    return {
        "title": str(article)
    }


def _cut_text(value: Any, max_len: int = 300) -> str | None:
    if value is None:
        return None

    text = str(value)

    if len(text) <= max_len:
        return text

    return text[:max_len] + "..."


def _format_similar_articles(similar_articles: list) -> str:
    if not similar_articles:
        return "유사 기사 없음"

    formatted_articles = []

    # GPT 프롬프트가 너무 길어지는 걸 방지하기 위해 상위 3개만 사용
    for article in similar_articles[:3]:
        article_dict = _safe_article_to_dict(article)

        formatted_articles.append({
            "rank": article_dict.get("rank"),
            "title": _cut_text(article_dict.get("title"), 120),
            "label": article_dict.get("label"),
            "similarity": article_dict.get("similarity"),
            "summary": _cut_text(article_dict.get("summary"), 300),
            "category": article_dict.get("category"),
            "published_date": article_dict.get("published_date"),
            "source": article_dict.get("source"),
            "url": article_dict.get("url"),
        })

    return json.dumps(
        formatted_articles,
        ensure_ascii=False,
        indent=2
    )


@lru_cache(maxsize=1)
def get_diagnosis_chain():
    model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    llm = ChatOpenAI(
        model=model_name,
        temperature=0,
        timeout=30,
        max_retries=1,
    )

    structured_llm = llm.with_structured_output(DiagnosisReport)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """
너는 창업 전략과 사업 리스크를 분석하는 전문가다.

사용자의 사업 전략과 유사 기사 정보를 바탕으로 진단 보고서를 작성한다.

분석 기준:
1. 시장성
2. 수익성
3. 경쟁 강도
4. 고객 확보 가능성
5. 운영 리스크
6. 차별화 가능성
7. 실패 가능성

작성 규칙:
- 추상적인 말보다 구체적인 판단을 한다.
- 무조건 부정적으로만 평가하지 않는다.
- 전략의 장점과 위험 요소를 함께 본다.
- 개선 제안은 실제로 실행 가능한 방식으로 작성한다.
- 결과는 반드시 지정된 구조에 맞춰 작성한다.
"""),
        ("human", """
사용자 전략:
{text}

유사 기사 정보:
{similar_articles}

위 내용을 바탕으로 진단 보고서를 작성해라.
""")
    ])

    return prompt | structured_llm


def generate_diagnosis_report(text: str, similar_articles: list) -> dict:
    chain = get_diagnosis_chain()

    similar_articles_text = _format_similar_articles(similar_articles)

    result = chain.invoke({
        "text": text,
        "similar_articles": similar_articles_text
    })

    return {
        "summary": result.summary,
        "risk_factors": result.risk_factors,
        "improvement_suggestions": result.improvement_suggestions,
        "final_diagnosis": result.final_diagnosis
    }