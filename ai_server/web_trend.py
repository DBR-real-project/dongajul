"""
실시간 웹 검색 기반 비즈니스 동향 컨텍스트

DuckDuckGo로 전략 관련 최신 시장 동향을 검색해
GPT 리포트에 주입할 수 있는 텍스트를 반환합니다.
"""
from __future__ import annotations

import re
from typing import Optional

# 클러스터 이름 → 최적화된 검색 쿼리
_CLUSTER_QUERY_MAP: dict[str, str] = {
    "AI/디지털":        "AI 인공지능 디지털전환 기업 시장 동향 2025",
    "HR/리더십":        "HR 인재관리 조직문화 리더십 트렌드 2025",
    "마케팅/브랜드":    "마케팅 브랜드 소비자 트렌드 국내 시장 2025",
    "해외시장":         "해외진출 글로벌 시장 동향 한국기업 2025",
    "스타트업/창업":    "스타트업 창업 벤처 투자 시장 동향 2025",
    "금융/투자":        "금융 투자 자산관리 핀테크 시장 동향 2025",
    "ESG/지속가능성":   "ESG 지속가능경영 탄소중립 기업 트렌드 2025",
    "소비재/유통":      "소비재 유통 이커머스 소비 트렌드 2025",
    "헬스케어/웰니스":  "헬스케어 디지털헬스 웰니스 시장 동향 2025",
    "플랫폼/SaaS":      "플랫폼 SaaS 구독서비스 B2B 시장 동향 2025",
    "제조/공급망":      "제조업 공급망 스마트팩토리 산업 동향 2025",
    "공공/정책":        "정부 정책 지원사업 규제 비즈니스 환경 2025",
    "경영전략/조직관리": "경영전략 조직관리 기업 구조조정 트렌드 2025",
    "재무/투자/위기관리": "재무 기업투자 위기관리 리스크 동향 2025",
    "역사/고전 리더십":  "리더십 경영철학 기업문화 트렌드 2025",
}

_STOP_WORDS = {
    '우리', '회사', '서비스', '있는', '하는', '이를', '으로', '에서', '이다',
    '합니다', '위해', '통해', '전략', '계획', '예정', '이후', '통한', '기반',
    '제공', '운영', '진행', '구축', '활용', '도입', '적용', '개발', '출시',
    '시작', '진행', '추진', '확대', '강화', '개선', '향상', '증가', '확보',
}


def search_business_trends(
    strategy_text: str,
    cluster_name: Optional[str] = None,
    top_k: int = 4,
    timeout: int = 8,
) -> str:
    """
    DuckDuckGo로 전략 관련 최신 비즈니스 동향 검색.

    Returns:
        GPT 프롬프트에 주입할 검색 결과 텍스트. 실패 시 빈 문자열.
    """
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        print("[web_trend] duckduckgo-search 미설치 — pip install duckduckgo-search")
        return ""

    queries = _build_queries(strategy_text, cluster_name)
    all_results: list[dict] = []
    seen_urls: set[str] = set()

    try:
        with DDGS() as ddgs:
            for query in queries[:2]:
                try:
                    results = list(ddgs.text(
                        query,
                        region='kr-kr',
                        max_results=3,
                        timelimit='y',  # 최근 1년
                    ))
                    for r in results:
                        url = r.get('href', '')
                        if url and url not in seen_urls:
                            seen_urls.add(url)
                            all_results.append(r)
                    if len(all_results) >= top_k:
                        break
                except Exception as e:
                    print(f"[web_trend] 쿼리 '{query[:30]}' 실패: {e}")
                    continue
    except Exception as e:
        print(f"[web_trend] DDGS 초기화 실패: {e}")
        return ""

    if not all_results:
        return ""

    lines = []
    for r in all_results[:top_k]:
        title = (r.get('title') or '').strip()
        body = (r.get('body') or '').strip()
        if not title or not body:
            continue
        snippet = body[:160].rstrip()
        if len(body) > 160:
            snippet += '...'
        lines.append(f"• {title}\n  {snippet}")

    return "\n".join(lines) if lines else ""


def _build_queries(strategy_text: str, cluster_name: Optional[str]) -> list[str]:
    queries: list[str] = []

    # 1. 클러스터 기반 쿼리 (가장 정확한 도메인 쿼리)
    if cluster_name and cluster_name in _CLUSTER_QUERY_MAP:
        queries.append(_CLUSTER_QUERY_MAP[cluster_name])
    elif cluster_name:
        queries.append(f"{cluster_name} 시장 동향 트렌드 2025")

    # 2. 전략 텍스트 핵심 명사 기반 쿼리
    keywords = _extract_core_keywords(strategy_text)
    if keywords:
        kw_str = ' '.join(keywords[:3])
        queries.append(f"{kw_str} 시장 동향 비즈니스 트렌드 2025")

    # 3. fallback
    if not queries:
        queries.append("비즈니스 경영 전략 시장 트렌드 2025 한국")

    return queries


def _extract_core_keywords(text: str) -> list[str]:
    """전략 텍스트에서 핵심 한글 명사 추출 (간단 휴리스틱)."""
    words = re.findall(r'[가-힣]{2,6}', text)
    seen: set[str] = set()
    result: list[str] = []
    for w in words:
        if w not in _STOP_WORDS and w not in seen:
            seen.add(w)
            result.append(w)
    return result[:5]
