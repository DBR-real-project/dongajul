"""Pydantic 요청/응답 스키마"""
from __future__ import annotations
from pydantic import BaseModel, Field


class DiagnoseRequest(BaseModel):
    text: str = Field(..., min_length=10, description="진단할 전략 텍스트")
    top_k: int = Field(default=5, ge=1, le=20, description="유사 사례 반환 수")


class SimilarArticle(BaseModel):
    rank: int
    title: str
    url: str
    label: str          # success / failure / neutral
    similarity: float
    summary: str | None
    category: str | None
    published_date: str | None
    source: str | None


class DiagnoseResponse(BaseModel):
    risk_score: float           # P(failure), 0~1
    risk_level: str             # low / medium / high
    similar_articles: list[SimilarArticle]
    query_cluster_id: int | None  # 쿼리가 속하는 클러스터


class DiagnosisReport(BaseModel):
    summary: str                   # 전략 전반 2~3문장 요약 평가
    risk_factors: list[str]        # 주요 리스크 요인 목록
    improvement: list[str]         # 구체적 개선 제언 목록
    verdict: str                   # 최종 한 줄 진단


class ReportResponse(DiagnoseResponse):
    report: DiagnosisReport        # GPT 진단 리포트
