"""
NAVER 뉴스 55,465건 → 카테고리별 트렌드 키워드 추출

최근 2년치(2024~2025) 데이터 기준 카테고리별 TF-IDF 상위 15개 키워드 추출
→ 데이터처리/output/trend_keywords.json 저장

ai_server startup 시 로드해서 GPT 프롬프트에 트렌드 컨텍스트로 주입

실행: python 데이터처리/extract_trends.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from collections import defaultdict

import pandas as pd
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

# 불용어 (트렌드 분석 의미 없는 단어 제거)
STOP_WORDS = {
    "있다", "하다", "되다", "이다", "그리고", "하지만", "그러나", "또한", "때문",
    "이후", "이전", "현재", "지난", "올해", "지난해", "내년", "올해", "이번",
    "통해", "위해", "따라", "경우", "때문에", "위한", "기업", "회사", "국내",
    "글로벌", "서비스", "플랫폼", "시장", "사업", "비즈니스", "관련", "사례",
    "제공", "이용", "활용", "적용", "구현", "개발", "출시", "확대", "강화",
    "성장", "증가", "감소", "변화", "대한", "통한", "의한", "으로", "에서",
    "부터", "까지", "에게", "처럼", "만큼", "보다", "라는", "이라는",
}


def extract_top_keywords(texts: list[str], top_n: int = 15) -> list[str]:
    """TF-IDF 기반 top_n 키워드 추출"""
    from sklearn.feature_extraction.text import TfidfVectorizer

    if not texts:
        return []

    try:
        vec = TfidfVectorizer(
            max_features=500,
            min_df=2,
            token_pattern=r"[가-힣]{2,}",
        )
        X = vec.fit_transform(texts)
        feature_names = vec.get_feature_names_out()
        mean_scores = np.asarray(X.mean(axis=0)).flatten()
        top_idx = mean_scores.argsort()[::-1]

        keywords = []
        for idx in top_idx:
            word = feature_names[idx]
            if word not in STOP_WORDS and len(word) >= 2:
                keywords.append(word)
                if len(keywords) >= top_n:
                    break
        return keywords
    except Exception as e:
        print(f"  TF-IDF 실패: {e}")
        return []


def main():
    naver_path = OUT_DIR / "NAVER_labeled.parquet"
    if not naver_path.exists():
        print(f"❌ {naver_path.name} 없음")
        sys.exit(1)

    print(f"✅ {naver_path.name} 로드 중...")
    df = pd.read_parquet(naver_path)
    print(f"   전체: {len(df):,}건")

    # 최근 2년치 필터 (2024~2025)
    df["year"] = pd.to_datetime(df["published_date"], errors="coerce").dt.year
    recent = df[df["year"].isin([2024, 2025])].copy()
    print(f"   2024~2025: {len(recent):,}건")

    # token_str 컬럼 사용 (이미 형태소 분석된 텍스트)
    if "token_str" not in recent.columns:
        print("❌ token_str 컬럼 없음")
        sys.exit(1)

    # 카테고리별 그룹화
    cat_groups: dict[str, list[str]] = defaultdict(list)
    for _, row in recent.iterrows():
        cat = str(row.get("category") or "").strip()
        tokens = str(row.get("token_str") or "").strip()
        if cat and tokens:
            # 여러 카테고리가 슬래시/콤마로 구분된 경우 첫 번째만 사용
            main_cat = cat.split("/")[0].split(",")[0].strip()
            cat_groups[main_cat].append(tokens)

    print(f"\n카테고리 {len(cat_groups)}개 발견")

    # 각 카테고리별 키워드 추출 (최소 10건 이상인 카테고리만)
    trend_data: dict[str, list[str]] = {}
    for cat, texts in sorted(cat_groups.items(), key=lambda x: -len(x[1])):
        if len(texts) < 10:
            continue
        keywords = extract_top_keywords(texts, top_n=15)
        if keywords:
            trend_data[cat] = keywords
            print(f"  [{len(texts):4d}건] {cat}: {', '.join(keywords[:5])}...")

    # 전체 트렌드 (카테고리 무관 상위 20개)
    all_texts = list(recent["token_str"].dropna().astype(str))
    trend_data["__all__"] = extract_top_keywords(all_texts, top_n=20)
    print(f"\n전체 트렌드: {', '.join(trend_data.get('__all__', [])[:5])}...")

    # JSON 저장
    out_path = OUT_DIR / "trend_keywords.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(trend_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ trend_keywords.json 저장 완료: {len(trend_data)}개 카테고리")
    print(f"   경로: {out_path}")


if __name__ == "__main__":
    main()
