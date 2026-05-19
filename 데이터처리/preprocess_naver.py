"""
네이버 뉴스 API 데이터 전처리 파이프라인 (동아줄)

입력 : 크롤링/naver/ 폴더 안의 JSON 파일들 (네이버 API 응답 형식)
출력 : NLP/output/NAVER_preprocessed.parquet

네이버 API 응답 구조 (표준):
  {
    "items": [
      {
        "title":        "제목 <b>키워드</b>",
        "originallink": "https://원문URL",
        "link":         "https://news.naver.com/...",
        "description":  "본문 미리보기 <b>키워드</b>",
        "pubDate":      "Mon, 19 May 2026 10:00:00 +0900"
      }, ...
    ]
  }

주의:
  - description은 전문이 아닌 미리보기(200자 내외) → content/summary 겸용
  - 여러 JSON 파일이 있으면 전부 합산 후 URL 기준 중복 제거
  - 파일명에서 카테고리 자동 추출 (예: naver_전략_0.json → category='전략')

실행: python NLP/preprocess_naver.py
"""
from __future__ import annotations

import json
import re
import sys
import time
from datetime import datetime
from email.utils import parsedate_to_datetime
from pathlib import Path

import pandas as pd
from kiwipiepy import Kiwi

sys.stdout.reconfigure(encoding="utf-8")

ROOT     = Path(__file__).resolve().parent.parent
NAVER_DIR = ROOT / "크롤링" / "naver"   # JSON 파일 위치
OUT_DIR  = ROOT / "데이터처리" / "output"
STOPWORD_FILE = ROOT / "데이터처리" / "stopwords_ko.txt"

KEEP_TAGS   = {"NNG", "NNP", "VV", "VA", "SL", "XR"}
LEMMA_TAGS  = {"VV", "VA"}
MIN_TOKEN_LEN  = 2
MIN_DOC_TOKENS = 5   # 뉴스 미리보기는 짧으므로 임계값 낮춤

RE_HTML_TAG    = re.compile(r"<[^>]+>")
RE_HTML_ENTITY = re.compile(r"&[a-zA-Z#0-9]+;")
RE_NONTEXT     = re.compile(r"[^0-9A-Za-z가-힣\s]")
RE_MULTISPACE  = re.compile(r"\s+")


# ── 유틸 ──────────────────────────────────────────────────────────────────

def clean_html(text: str) -> str:
    if not isinstance(text, str):
        return ""
    t = RE_HTML_TAG.sub(" ", text)
    t = RE_HTML_ENTITY.sub(" ", t)
    t = RE_NONTEXT.sub(" ", t)
    return RE_MULTISPACE.sub(" ", t).strip()


def parse_pubdate(raw: str) -> str | None:
    """RFC 2822 날짜 → 'YYYY-MM-DD' 문자열."""
    try:
        return parsedate_to_datetime(raw).strftime("%Y-%m-%d")
    except Exception:
        return None


def category_from_filename(fname: str) -> str:
    """파일명에서 카테고리 추출.
    예: naver_전략경영_0.json → '전략경영'
        articles_20260519.json → 'naver'
    """
    stem = Path(fname).stem
    parts = stem.split("_")
    # 'naver_<카테고리>_<번호>' 패턴 처리
    if len(parts) >= 3 and parts[0].lower() == "naver":
        return parts[1]
    if len(parts) >= 2 and parts[0].lower() == "naver":
        return parts[1]
    return "naver"


def load_stopwords() -> set[str]:
    words: set[str] = set()
    for line in STOPWORD_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            words.add(line)
    return words


# ── JSON 로드 ──────────────────────────────────────────────────────────────

def load_json_files(folder: Path) -> pd.DataFrame:
    """폴더 내 JSON 파일을 모두 읽어 DataFrame으로 반환."""
    if not folder.exists():
        print(f"[경고] 폴더 없음: {folder}")
        print("       JSON 파일을 크롤링/naver/ 폴더에 넣어주세요.")
        return pd.DataFrame()

    files = sorted(folder.glob("*.json"))
    if not files:
        print(f"[경고] JSON 파일 없음: {folder}")
        return pd.DataFrame()

    rows = []
    for f in files:
        cat = category_from_filename(f.name)
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"  [스킵] {f.name}: {e}")
            continue

        # items 키가 있으면 표준 API 응답, 없으면 리스트 자체로 간주
        items = data.get("items", data) if isinstance(data, dict) else data

        for item in items:
            title       = clean_html(item.get("title", ""))
            description = clean_html(item.get("description", ""))
            url         = item.get("originallink") or item.get("link", "")
            pub_raw     = item.get("pubDate", "")
            pub_date    = parse_pubdate(pub_raw) if pub_raw else None

            rows.append({
                "title":          title,
                "content":        description,   # 미리보기 → content 겸용
                "url":            url,
                "category":       cat,
                "published_date": pub_date,
                "source":         "NAVER",
                "summary":        description,
            })

    df = pd.DataFrame(rows)
    print(f"JSON 로드: {len(files)}개 파일, {len(df)}건")

    # URL 기준 중복 제거
    before = len(df)
    df = df[df["url"] != ""].drop_duplicates(subset="url").reset_index(drop=True)
    print(f"중복 제거: {before} → {len(df)}건 (URL 기준)")

    return df


# ── 토큰화 ────────────────────────────────────────────────────────────────

def tokenize_corpus(kiwi: Kiwi, texts: list[str], stopwords: set[str]) -> list[list[str]]:
    results: list[list[str]] = []
    for tokens in kiwi.tokenize(texts):
        bag: list[str] = []
        for tk in tokens:
            if tk.tag not in KEEP_TAGS:
                continue
            form = tk.form + ("다" if tk.tag in LEMMA_TAGS else "")
            if len(form) < MIN_TOKEN_LEN or form in stopwords or form.isdigit():
                continue
            bag.append(form)
        results.append(bag)
    return results


# ── 메인 ──────────────────────────────────────────────────────────────────

def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stopwords = load_stopwords()
    print(f"불용어 {len(stopwords)}개 로드")

    df = load_json_files(NAVER_DIR)
    if df.empty:
        print("처리할 데이터 없음. 종료.")
        return

    # 제목 + 본문 결합
    raw_texts = (df["title"].fillna("") + ". " + df["content"].fillna("")).tolist()

    print(f"Kiwi 초기화 ...")
    kiwi = Kiwi(num_workers=-1)

    t0 = time.time()
    print(f"Kiwi 형태소 분석 {len(df)}건 ...")
    tokens_list = tokenize_corpus(kiwi, raw_texts, stopwords)

    df["clean_text"] = raw_texts
    df["tokens"]     = tokens_list
    df["token_str"]  = [" ".join(t) for t in tokens_list]
    df["n_tokens"]   = [len(t) for t in tokens_list]

    before = len(df)
    df = df[df["n_tokens"] >= MIN_DOC_TOKENS].reset_index(drop=True)
    print(f"토큰 부족 제거: {before} → {len(df)}건  "
          f"(평균 토큰 {df['n_tokens'].mean():.0f}, {time.time()-t0:.1f}s)")

    out = OUT_DIR / "NAVER_preprocessed.parquet"
    df.to_parquet(out, index=False)
    print(f"\n저장 완료 → {out}  ({len(df)}건)")
    print("\n카테고리별 분포:")
    print(df["category"].value_counts().to_string())


if __name__ == "__main__":
    main()
