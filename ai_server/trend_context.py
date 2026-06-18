"""
NAVER 트렌드 컨텍스트 모듈

trend_keywords.json(카테고리별 TF-IDF 상위 키워드) 로드 →
진단 전략과 가장 관련된 카테고리 키워드를 GPT 프롬프트에 주입
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

_KEYWORDS: dict[str, list[str]] = {}
_LOADED = False


def init_trend_context(data_dir: Path) -> None:
    global _KEYWORDS, _LOADED
    trend_path = data_dir / "trend_keywords.json"
    if not trend_path.exists():
        print("[trend] trend_keywords.json 없음 — 트렌드 컨텍스트 비활성화")
        return
    with open(trend_path, encoding="utf-8") as f:
        _KEYWORDS = json.load(f)
    _LOADED = True
    print(f"[trend] 트렌드 키워드 로드 완료: {len(_KEYWORDS)}개 카테고리")


# 클러스터 이름 → 관련 NAVER 카테고리 매핑
_CLUSTER_TO_CATEGORIES: dict[str, list[str]] = {
    "AI/디지털":     ["생성형AI", "AI 자동화", "AI SaaS", "디지털전환"],
    "HR/리더십":     ["생산성", "MZ세대"],
    "마케팅/브랜드":  ["소비트렌드", "로컬브랜드", "MZ세대", "구독경제"],
    "해외시장":      ["투자유치", "신사업"],
    "스타트업/창업":  ["스타트업", "창업", "창업시장", "초기창업", "창업지원사업", "TIPS"],
    "금융/투자":     ["투자유치", "벤처투자", "정책자금"],
    "ESG/지속가능성": ["ESG"],
    "소비재/유통":   ["소비트렌드", "구독경제", "로컬브랜드"],
    "헬스케어/웰니스": ["웰니스", "1인가구"],
    "플랫폼/SaaS":   ["AI SaaS", "구독경제", "디지털전환"],
    "제조/공급망":   ["신사업", "생산성"],
    "공공/정책":     ["정책자금", "창업지원사업", "ESG"],
}


def get_trend_context(cluster_name: Optional[str] = None, strategy_text: str = "") -> str:
    """
    cluster_name 또는 strategy_text 기반으로 관련 트렌드 키워드 반환.
    반환값은 GPT 프롬프트에 삽입할 문자열.
    """
    if not _LOADED or not _KEYWORDS:
        return ""

    collected: dict[str, list[str]] = {}

    # 1. 클러스터 이름 → 카테고리 매핑
    if cluster_name:
        matched_cats = _CLUSTER_TO_CATEGORIES.get(cluster_name, [])
        for cat in matched_cats:
            if cat in _KEYWORDS:
                collected[cat] = _KEYWORDS[cat]

    # 2. 전략 텍스트에 카테고리명이 포함된 경우 직접 매핑
    if strategy_text:
        for cat in _KEYWORDS:
            if cat in strategy_text and cat not in collected:
                collected[cat] = _KEYWORDS[cat]

    # 3. 아무것도 매핑 안 되면 전체 트렌드 사용
    if not collected and "__all__" in _KEYWORDS:
        collected["전체 트렌드"] = _KEYWORDS["__all__"]

    if not collected:
        return ""

    lines = []
    for cat, kws in list(collected.items())[:3]:  # 최대 3개 카테고리
        lines.append(f"- {cat}: {', '.join(kws[:10])}")

    return "\n".join(lines)
