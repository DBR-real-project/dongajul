"""
HBS_articles.csv → HBS_articles_ko.csv
영어 title/summary → 한국어 번역, content 앞 500자 한국어 요약 추가

출력 컬럼:
  title, title_ko, content, summary, summary_ko, content_ko_summary,
  url, category, published_date, source

실행:
    python 크롤링/HBS_translate_ko.py
"""

import sys
import csv
import time
import random
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    from deep_translator import GoogleTranslator
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "deep-translator", "-q"])
    from deep_translator import GoogleTranslator

IN_FILE  = Path(__file__).parent / "HBS_articles.csv"
OUT_FILE = Path(__file__).parent / "HBS_articles_ko.csv"

OUT_COLS = [
    "title", "title_ko",
    "content", "summary", "summary_ko", "content_ko_summary",
    "url", "category", "published_date", "source",
]

# 번역 대상 텍스트 길이 제한 (GoogleTranslator 5000자 제한)
MAX_CHARS = 4800


def translate(text: str, retries: int = 3) -> str:
    if not text or not text.strip():
        return ""
    text = text[:MAX_CHARS]
    for attempt in range(retries):
        try:
            result = GoogleTranslator(source="en", target="ko").translate(text)
            return result or ""
        except Exception as e:
            if attempt < retries - 1:
                wait = 2 ** attempt + random.uniform(0, 1)
                print(f"      [RETRY {attempt+1}] {e} → {wait:.1f}초 대기")
                time.sleep(wait)
            else:
                print(f"      [FAIL] 번역 실패: {e}")
                return ""


def load_done_urls() -> set:
    done = set()
    if OUT_FILE.exists():
        with open(OUT_FILE, encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                if row.get("url"):
                    done.add(row["url"].strip())
    return done


def save_row(row: dict):
    write_header = not OUT_FILE.exists()
    with open(OUT_FILE, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=OUT_COLS)
        if write_header:
            writer.writeheader()
        writer.writerow(row)


def main():
    if not IN_FILE.exists():
        print(f"[ERROR] {IN_FILE} 없음")
        return

    done_urls = load_done_urls()
    print(f"[시작] 이미 번역 완료: {len(done_urls)}건")

    with open(IN_FILE, encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))

    todo = [r for r in rows if r.get("url", "").strip() not in done_urls]
    total = len(todo)
    print(f"[번역 대상] {total}건 (전체 {len(rows)}건)")

    for idx, row in enumerate(todo, 1):
        url = row.get("url", "").strip()
        title = row.get("title", "").strip()
        summary = row.get("summary", "").strip()
        content = row.get("content", "").strip()

        print(f"  [{idx}/{total}] {title[:50]}")

        title_ko        = translate(title)
        time.sleep(random.uniform(0.5, 1.0))

        summary_ko      = translate(summary)
        time.sleep(random.uniform(0.5, 1.0))

        # content 앞 500자 → 한국어 요약
        content_snippet = content[:500] if content else ""
        content_ko_summary = translate(content_snippet) if content_snippet else ""
        time.sleep(random.uniform(0.5, 1.2))

        out = {
            "title":             title,
            "title_ko":          title_ko,
            "content":           content,
            "summary":           summary,
            "summary_ko":        summary_ko,
            "content_ko_summary": content_ko_summary,
            "url":               url,
            "category":          row.get("category", ""),
            "published_date":    row.get("published_date", ""),
            "source":            row.get("source", "HBS"),
        }
        save_row(out)
        print(f"    ✅ {title_ko[:40]}")

        # 50건마다 진행 상황 출력
        if idx % 50 == 0:
            print(f"\n  === 진행: {idx}/{total} ({idx/total*100:.1f}%) ===\n")

    print(f"\n[완료] {OUT_FILE} — 총 {total}건 번역")


if __name__ == "__main__":
    main()
