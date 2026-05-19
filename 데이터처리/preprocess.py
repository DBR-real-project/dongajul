"""
① 텍스트 전처리 파이프라인 (동아줄 - AI 전략 리스크 진단 서비스)

입력 : 크롤링/DBR_articles.csv, 크롤링/HBR_articles.csv  (7컬럼)
출력 : NLP/output/{DBR,HBR}_preprocessed.parquet

처리 단계
  1) CSV 로드 (utf-8-sig, BOM 처리)
  2) 텍스트 정제 (URL/이메일/HTML/캡션/특수문자/공백 정규화)
  3) Kiwi 형태소 분석 → 의미 품사만 추출 (명사/동사/형용사/외국어/어근)
  4) 불용어 제거 + 길이 필터
  5) 토큰 수 부족 문서 제거
  6) parquet 저장 (원본 + clean_text + tokens + token_str + n_tokens)

실행: python NLP/preprocess.py
"""
from __future__ import annotations

import re
import sys
import time
from pathlib import Path

import pandas as pd
from kiwipiepy import Kiwi

# Windows 콘솔(cp949)에서도 한글 깨지지 않게
sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
CRAWL_DIR = ROOT / "크롤링"
OUT_DIR = ROOT / "데이터처리" / "output"
STOPWORD_FILE = ROOT / "데이터처리" / "stopwords_ko.txt"

# Kiwi에서 유지할 품사 태그
#   NNG 일반명사 / NNP 고유명사 / VV 동사 / VA 형용사 / SL 외국어(영문) / XR 어근
KEEP_TAGS = {"NNG", "NNP", "VV", "VA", "SL", "XR"}
LEMMA_TAGS = {"VV", "VA"}          # 어간에 '다'를 붙여 사전형 복원
MIN_TOKEN_LEN = 2                  # 토큰 최소 길이(한/영 공통)
MIN_DOC_TOKENS = 10               # 이보다 토큰이 적은 문서는 제외

# ── 정규식 ──────────────────────────────────────────────────────────────
RE_URL = re.compile(r"https?://\S+|www\.\S+")
RE_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
RE_HTML_TAG = re.compile(r"<[^>]+>")
RE_HTML_ENTITY = re.compile(r"&[a-zA-Z#0-9]+;")
# [사진], (사진=…), <그림 1> 등 캡션/출처 표기 제거
RE_CAPTION = re.compile(r"[\[\(<][^\]\)>]{0,40}(사진|그림|자료|출처|이미지|표)[^\]\)>]{0,40}[\]\)>]")
RE_REPORTER = re.compile(r"[가-힣]{2,4}\s?(기자|특파원|연구원|교수|대표|기고)")
# 한글/영문/숫자/공백만 남김 (그 외 기호 → 공백)
RE_NONTEXT = re.compile(r"[^0-9A-Za-z가-힣\s]")
RE_MULTISPACE = re.compile(r"\s+")


def load_stopwords() -> set[str]:
    words: set[str] = set()
    for line in STOPWORD_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            words.add(line)
    return words


def clean_text(text: str) -> str:
    """노이즈 제거 후 토큰화용 평문 반환."""
    if not isinstance(text, str):
        return ""
    t = text.replace("\xa0", " ")
    t = RE_URL.sub(" ", t)
    t = RE_EMAIL.sub(" ", t)
    t = RE_HTML_TAG.sub(" ", t)
    t = RE_HTML_ENTITY.sub(" ", t)
    t = RE_CAPTION.sub(" ", t)
    t = RE_REPORTER.sub(" ", t)
    t = RE_NONTEXT.sub(" ", t)
    t = RE_MULTISPACE.sub(" ", t)
    return t.strip()


def tokenize_corpus(kiwi: Kiwi, texts: list[str], stopwords: set[str]) -> list[list[str]]:
    """Kiwi 일괄 형태소 분석 → 의미 토큰 리스트."""
    results: list[list[str]] = []
    for tokens in kiwi.tokenize(texts):
        bag: list[str] = []
        for tk in tokens:
            if tk.tag not in KEEP_TAGS:
                continue
            form = tk.form
            if tk.tag in LEMMA_TAGS:
                form = form + "다"          # 사전형 복원 (예: 성장 → 성장하다 어간 '성장하' → 처리상 form='하' 등은 stopword)
            if len(form) < MIN_TOKEN_LEN:
                continue
            if form in stopwords:
                continue
            if form.isdigit():
                continue
            bag.append(form)
        results.append(bag)
    return results


def process_file(name: str, kiwi: Kiwi, stopwords: set[str]) -> pd.DataFrame:
    src = CRAWL_DIR / f"{name}_articles.csv"
    print(f"[{name}] 로드: {src}")
    df = pd.read_csv(src, encoding="utf-8-sig")
    n0 = len(df)

    # 제목+본문 결합 (제목은 핵심 키워드 비중이 높아 함께 사용)
    title = df["title"].fillna("").astype(str)
    content = df["content"].fillna("").astype(str)
    raw = (title + ". " + content).tolist()

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
    print(f"[{name}] 토큰 부족 문서 제거: {before} → {len(df)} "
          f"(평균 토큰 {df['n_tokens'].mean():.0f}, {time.time()-t0:.1f}s)")
    return df


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stopwords = load_stopwords()
    print(f"불용어 {len(stopwords)}개 로드")

    kiwi = Kiwi(num_workers=-1)  # -1 = 가용 CPU 전부 사용
    print("Kiwi 초기화 완료\n")

    for name in ("DBR", "HBR"):
        df = process_file(name, kiwi, stopwords)
        out = OUT_DIR / f"{name}_preprocessed.parquet"
        df.to_parquet(out, index=False)
        print(f"[{name}] 저장 완료 → {out}  ({len(df)}건)\n")

    print("① 전처리 완료")


if __name__ == "__main__":
    main()
