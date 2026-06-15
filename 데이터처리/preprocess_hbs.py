"""
HBS 전용 텍스트 전처리 파이프라인

기존 preprocess.py는 수정하지 않고,
HBS_articles_ko.csv만 별도로 전처리합니다.

입력 : 크롤링/HBS_articles_ko.csv
출력 : 데이터처리/output/HBS_preprocessed.parquet

실행: python 데이터처리/preprocess_hbs.py
"""
from __future__ import annotations

import sys
import time

import pandas as pd
from kiwipiepy import Kiwi

# 기존 preprocess.py의 함수와 설정을 그대로 재사용
from preprocess import (
    CRAWL_DIR,
    OUT_DIR,
    MIN_DOC_TOKENS,
    load_stopwords,
    clean_text,
    tokenize_corpus,
)

sys.stdout.reconfigure(encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    name = "HBS"
    src = CRAWL_DIR / "HBS_articles_ko.csv"
    out = OUT_DIR / "HBS_preprocessed.parquet"

    print(f"[{name}] 로드: {src}")
    df = pd.read_csv(src, encoding="utf-8")
    n0 = len(df)

    # HBS는 한국어 번역 컬럼을 합쳐서 사용
    # 사용 컬럼: title_ko + summary_ko + content_ko_summary
    required_cols = ["title_ko", "summary_ko", "content_ko_summary"]
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        raise ValueError(f"[{name}] 필수 컬럼 누락: {missing_cols}")

    title = df["title_ko"].fillna("").astype(str)
    summary = df["summary_ko"].fillna("").astype(str)
    content = df["content_ko_summary"].fillna("").astype(str)

    raw = (title + ". " + summary + ". " + content).tolist()

    # source 컬럼은 HBS로 고정
    if "source" not in df.columns:
        df["source"] = "HBS"
    else:
        df["source"] = df["source"].fillna("HBS")

    stopwords = load_stopwords()
    print(f"불용어 {len(stopwords)}개 로드")

    kiwi = Kiwi(num_workers=-1)
    print("Kiwi 초기화 완료\n")

    print(f"[{name}] 텍스트 정제 {n0}건 ...")
    t0 = time.time()
    cleaned = [clean_text(x) for x in raw]

    print(f"[{name}] Kiwi 형태소 분석 ... ({time.time()-t0:.1f}s 경과)")
    tokens = tokenize_corpus(kiwi, cleaned, stopwords)

    df = df.copy()
    df["clean_text"] = cleaned
    df["tokens"] = tokens
    df["token_str"] = [" ".join(tk) for tk in tokens]
    df["n_tokens"] = [len(tk) for tk in tokens]

    before = len(df)
    df = df[df["n_tokens"] >= MIN_DOC_TOKENS].reset_index(drop=True)

    print(
        f"[{name}] 토큰 부족 문서 제거: {before} → {len(df)} "
        f"(평균 토큰 {df['n_tokens'].mean():.0f}, {time.time()-t0:.1f}s)"
    )

    df.to_parquet(out, index=False)
    print(f"[{name}] 저장 완료 → {out}  ({len(df)}건)")
    print("HBS 전처리 완료")


if __name__ == "__main__":
    main()