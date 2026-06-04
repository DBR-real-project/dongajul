from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class DiagnoseRequest(BaseModel):
    text: str = Field(..., description="사용자 전략 텍스트")
    top_k: int = Field(default=5, description="유사 사례 검색 개수")


class SimilarArticle(BaseModel):
    rank: int
    title: str
    url: str
    label: str
    similarity: float
    summary: Optional[str] = None
    category: Optional[str] = None
    published_date: Optional[str] = None
    source: Optional[str] = None


class DiagnoseResponse(BaseModel):
    risk_score: float
    risk_level: str
    similar_articles: list[SimilarArticle]
    query_cluster_id: Optional[int] = None


class DiagnosisReport(BaseModel):
    summary: str
    risk_factors: list[str]
    improvement: list[str]
    verdict: str


class ReportResponse(BaseModel):
    risk_score: float
    risk_level: str
    similar_articles: list[SimilarArticle]
    query_cluster_id: Optional[int] = None
    report: DiagnosisReport