"""
NAVER 트렌드 컨텍스트 모듈

우선순위:
  1. trend_summaries.json (GPT 생성 2~3문장 요약) — generate_trend_summaries.py 실행 후 생성
  2. trend_keywords.json (TF-IDF 키워드 목록) — fallback
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

_SUMMARIES: dict[str, str] = {}    # GPT 요약 문장 (우선)
_KEYWORDS: dict[str, list[str]] = {}  # TF-IDF 키워드 (fallback)
_LOADED = False
_USE_SUMMARIES = False


def init_trend_context(data_dir: Path) -> None:
    global _SUMMARIES, _KEYWORDS, _LOADED, _USE_SUMMARIES

    # 1. trend_summaries.json 우선 로드
    summaries_path = data_dir / "trend_summaries.json"
    if summaries_path.exists():
        with open(summaries_path, encoding="utf-8") as f:
            _SUMMARIES = json.load(f)
        _USE_SUMMARIES = True
        _LOADED = True
        print(f"[trend] trend_summaries.json 로드 완료: {len(_SUMMARIES)}개 카테고리 (문장 요약 모드)")
        return

    # 2. trend_keywords.json fallback
    keywords_path = data_dir / "trend_keywords.json"
    if keywords_path.exists():
        with open(keywords_path, encoding="utf-8") as f:
            _KEYWORDS = json.load(f)
        _USE_SUMMARIES = False
        _LOADED = True
        print(f"[trend] trend_keywords.json 로드 완료: {len(_KEYWORDS)}개 카테고리 (키워드 모드)")
        print("[trend] TIP: generate_trend_summaries.py 실행 시 더 풍부한 트렌드 컨텍스트 사용 가능")
        return

    print("[trend] trend_summaries.json / trend_keywords.json 모두 없음 — 트렌드 컨텍스트 비활성화")


# 클러스터 이름 → NAVER 카테고리 매핑
_CLUSTER_TO_CATEGORIES: dict[str, list[str]] = {
    "AI/디지털":          ["생성형AI", "AI 자동화", "AI SaaS", "디지털전환"],
    "HR/리더십":          ["생산성", "MZ세대"],
    "마케팅/브랜드":       ["소비트렌드", "로컬브랜드", "MZ세대", "구독경제"],
    "해외시장":           ["투자유치", "신사업"],
    "스타트업/창업":       ["스타트업", "창업", "창업시장", "초기창업", "창업지원사업", "TIPS"],
    "금융/투자":          ["투자유치", "벤처투자", "정책자금"],
    "ESG/지속가능성":      ["ESG"],
    "소비재/유통":         ["소비트렌드", "구독경제", "로컬브랜드"],
    "헬스케어/웰니스":     ["웰니스", "1인가구"],
    "플랫폼/SaaS":        ["AI SaaS", "구독경제", "디지털전환"],
    "제조/공급망":         ["신사업", "생산성"],
    "공공/정책":           ["정책자금", "창업지원사업", "ESG"],
    "경영전략/조직관리":   ["생산성", "MZ세대", "디지털전환"],
    "재무/투자/위기관리":  ["투자유치", "벤처투자", "정책자금"],
    "역사/고전 리더십":    ["MZ세대", "생산성"],
}


def get_trend_context(cluster_name: Optional[str] = None, strategy_text: str = "") -> str:
    """
    클러스터명·전략 텍스트 기반 트렌드 컨텍스트 반환.

    trend_summaries.json 있으면 2~3문장 요약을,
    없으면 키워드 목록을 반환. GPT 프롬프트에 직접 삽입 가능.
    """
    if not _LOADED:
        return ""

    if _USE_SUMMARIES:
        return _get_from_summaries(cluster_name, strategy_text)
    else:
        return _get_from_keywords(cluster_name, strategy_text)


def _get_from_summaries(cluster_name: Optional[str], strategy_text: str) -> str:
    """trend_summaries.json에서 관련 카테고리 요약 반환."""
    collected: list[str] = []

    # 1. 클러스터 직접 매핑 (클러스터명 == 카테고리명인 경우 우선)
    if cluster_name and cluster_name in _SUMMARIES:
        collected.append(f"[{cluster_name}]\n{_SUMMARIES[cluster_name]}")

    # 2. 클러스터 → NAVER 카테고리 매핑
    if cluster_name and cluster_name in _CLUSTER_TO_CATEGORIES:
        for cat in _CLUSTER_TO_CATEGORIES[cluster_name]:
            if cat in _SUMMARIES and cat not in [c.split(']')[0][1:] for c in collected]:
                collected.append(f"[{cat}]\n{_SUMMARIES[cat]}")
                if len(collected) >= 2:
                    break

    # 3. 전략 텍스트에서 카테고리명 직접 감지
    if strategy_text and len(collected) < 2:
        for cat, summary in _SUMMARIES.items():
            if cat != "__all__" and cat in strategy_text and cat not in [c.split(']')[0][1:] for c in collected]:
                collected.append(f"[{cat}]\n{summary}")
                if len(collected) >= 2:
                    break

    # 4. fallback: 전체 트렌드
    if not collected and "__all__" in _SUMMARIES:
        collected.append(f"[전체 비즈니스 트렌드]\n{_SUMMARIES['__all__']}")

    return "\n\n".join(collected[:2])


def _get_from_keywords(cluster_name: Optional[str], strategy_text: str) -> str:
    """trend_keywords.json에서 키워드 목록 반환 (fallback)."""
    collected: dict[str, list[str]] = {}

    if cluster_name:
        for cat in _CLUSTER_TO_CATEGORIES.get(cluster_name, []):
            if cat in _KEYWORDS:
                collected[cat] = _KEYWORDS[cat]

    if strategy_text:
        for cat in _KEYWORDS:
            if cat in strategy_text and cat not in collected:
                collected[cat] = _KEYWORDS[cat]

    if not collected and "__all__" in _KEYWORDS:
        collected["전체 트렌드"] = _KEYWORDS["__all__"]

    if not collected:
        return ""

    lines = []
    for cat, kws in list(collected.items())[:3]:
        lines.append(f"- {cat}: {', '.join(kws[:10])}")

    return "\n".join(lines)
