"""
전략 완성도 스코어러

전략 텍스트에서 핵심 비즈니스 요소가 얼마나 명시됐는지 검사.
score가 낮을수록 = 요소 부족 = 리스크 높음
"""
from __future__ import annotations


# 핵심 비즈니스 요소 정의 (패턴 하나라도 히트하면 해당 요소 존재로 판정)
_ELEMENTS: dict[str, dict] = {
    "target_customer": {
        "patterns": [
            "고객", "타깃", "사용자", "소비자", "기업", "B2B", "B2C",
            "개인", "법인", "시장 대상", "고객층", "사용층",
        ],
        "weight": 1.5,
    },
    "revenue_model": {
        "patterns": [
            "수익", "매출", "구독", "수수료", "판매", "유료", "가격",
            "요금", "결제", "수익모델", "비즈니스 모델", "과금",
        ],
        "weight": 1.5,
    },
    "differentiation": {
        "patterns": [
            "차별화", "경쟁", "강점", "장점", "독자", "특화", "혁신",
            "개선", "우위", "차별점", "핵심 역량", "경쟁력",
        ],
        "weight": 1.0,
    },
    "market": {
        "patterns": [
            "시장", "업계", "분야", "산업", "영역", "섹터",
            "국내", "해외", "글로벌",
        ],
        "weight": 1.0,
    },
    "execution": {
        "patterns": [
            "계획", "단계", "일정", "방법", "어떻게", "방식",
            "로드맵", "출시", "런칭", "실행", "추진",
        ],
        "weight": 0.8,
    },
    "validation": {
        "patterns": [
            "검증", "테스트", "파일럿", "MVP", "시범", "실험",
            "피드백", "고객 반응", "수요 확인",
        ],
        "weight": 0.7,
    },
}

_TOTAL_WEIGHT = sum(v["weight"] for v in _ELEMENTS.values())


def score_completeness(text: str) -> float:
    """
    전략 텍스트의 완성도를 0.0~1.0으로 반환.
    1.0 = 모든 요소 갖춤 (리스크 낮음)
    0.0 = 아무 요소도 없음 (리스크 높음)
    """
    hit_weight = 0.0
    for cfg in _ELEMENTS.values():
        for pattern in cfg["patterns"]:
            if pattern in text:
                hit_weight += cfg["weight"]
                break  # 해당 요소 히트 → 다음 요소로
    return round(min(hit_weight / _TOTAL_WEIGHT, 1.0), 4)


def get_missing_elements(text: str) -> list[str]:
    """부족한 요소 이름 리스트 반환 (디버그/UI 표시용)"""
    labels = {
        "target_customer": "타깃 고객",
        "revenue_model": "수익 모델",
        "differentiation": "차별화 요소",
        "market": "목표 시장",
        "execution": "실행 계획",
        "validation": "시장 검증",
    }
    missing = []
    for key, cfg in _ELEMENTS.items():
        if not any(p in text for p in cfg["patterns"]):
            missing.append(labels[key])
    return missing
