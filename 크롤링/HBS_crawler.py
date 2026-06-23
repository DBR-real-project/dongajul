"""
HBS Working Knowledge 크롤러
https://www.library.hbs.edu/working-knowledge

출력: 크롤링/HBS_articles.csv
컬럼: title, content, url, category, published_date, source, summary
(DBR_articles.csv / HBR_articles.csv 동일 포맷)

실행:
    python 크롤링/HBS_crawler.py
"""

import sys
import time
import csv
import os
import re
import random
from pathlib import Path
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# ──────────────────────────────────────────────
# 설정
# ──────────────────────────────────────────────
BASE_URL = "https://www.library.hbs.edu"
SOURCE   = "HBS"

CATEGORIES = [
    ("Strategy & Innovation",        "/working-knowledge/collections/strategy-and-innovation"),
    ("Leadership",                   "/working-knowledge/collections/leadership"),
    ("Data & Technology",            "/working-knowledge/collections/data-and-technology"),
    ("Managing the Business",        "/working-knowledge/collections/managing-the-business"),
    ("Marketing & Consumers",        "/working-knowledge/collections/marketing-and-consumers"),
    ("Finance & Investing",          "/working-knowledge/collections/finance-and-investing"),
    ("Economics & Global Commerce",  "/working-knowledge/collections/economics-and-global-commerce"),
    ("Social Responsibility",        "/working-knowledge/collections/social-responsibility"),
    ("Regulation & Compliance",      "/working-knowledge/collections/regulation-and-compliance"),
    ("Psychology & Behavior",        "/working-knowledge/collections/psychology-and-behavior"),
    ("Entrepreneurship",             "/working-knowledge/collections/entrepreneurship"),
    ("Artificial Intelligence",      "/working-knowledge/collections/artificial-intelligence"),
]

OUT_DIR  = Path(__file__).parent
OUT_FILE = OUT_DIR / "HBS_articles.csv"
CSV_COLS = ["title", "content", "url", "category", "published_date", "source", "summary"]

SCROLL_PAUSE   = 1.5   # 스크롤 후 대기 (초)
PAGE_LOAD_WAIT = 10    # 페이지 로드 최대 대기 (초)
ARTICLE_DELAY  = (1.5, 3.0)  # 기사 방문 간격 랜덤 범위


# ──────────────────────────────────────────────
# 크롬 드라이버 생성
# ──────────────────────────────────────────────
def make_driver() -> webdriver.Chrome:
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    )
    # 봇 감지 우회
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    driver = webdriver.Chrome(options=opts)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return driver


# ──────────────────────────────────────────────
# 중복 체크용 기존 URL 로드
# ──────────────────────────────────────────────
def load_existing_urls() -> set:
    seen = set()
    if OUT_FILE.exists():
        with open(OUT_FILE, encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("url"):
                    seen.add(row["url"].strip())
    return seen


# ──────────────────────────────────────────────
# CSV 저장 (append)
# ──────────────────────────────────────────────
def save_rows(rows: list[dict]):
    write_header = not OUT_FILE.exists()
    with open(OUT_FILE, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLS)
        if write_header:
            writer.writeheader()
        writer.writerows(rows)


# 기사 URL인지 판별 (컬렉션/네비게이션 제외)
_NON_ARTICLE = {
    "/working-knowledge",
    "/working-knowledge/",
    "/working-knowledge/about",
    "/working-knowledge/collections",
    "/working-knowledge/popular-research",
    "/working-knowledge/subscribe-to-working-knowledge-newsletters",
}

def _is_article_url(href: str) -> bool:
    path = href.replace(BASE_URL, "").split("?")[0].rstrip("/")
    if not path.startswith("/working-knowledge/"):
        return False
    if "/collections/" in path:
        return False
    if path in _NON_ARTICLE:
        return False
    return True


# ──────────────────────────────────────────────
# 카테고리 페이지 → 기사 URL 목록 수집 (페이지네이션)
# ──────────────────────────────────────────────
def collect_article_urls(driver: webdriver.Chrome, cat_url: str) -> list[str]:
    urls: set[str] = set()
    page = 1

    while True:
        paged_url = BASE_URL + cat_url + (f"?page={page}" if page > 1 else "")
        driver.get(paged_url)

        # 기사 카드 로드까지 대기 — "Showing N results" 텍스트 또는 기사 링크 등장 확인
        try:
            WebDriverWait(driver, PAGE_LOAD_WAIT).until(
                lambda d: len([
                    a for a in d.find_elements(By.CSS_SELECTOR, "a[href*='/working-knowledge/']")
                    if _is_article_url(a.get_attribute("href") or "")
                ]) >= 3
            )
        except TimeoutException:
            # 기사 카드가 안 뜨면 일반 a 태그라도 기다림
            try:
                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.TAG_NAME, "a"))
                )
            except TimeoutException:
                print(f"  [WARN] 페이지 로드 타임아웃: {paged_url}")
                break

        time.sleep(SCROLL_PAUSE)

        # 이번 페이지의 기사 링크 수집
        links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/working-knowledge/']")
        page_urls: set[str] = set()
        for a in links:
            href = a.get_attribute("href") or ""
            if _is_article_url(href):
                page_urls.add(href.split("?")[0].rstrip("/"))

        if not page_urls:
            print(f"    page {page}: 기사 없음, 종료")
            break

        new_count = len(page_urls - urls)
        urls |= page_urls
        print(f"    page {page}: +{new_count}건 (누적 {len(urls)}건)")

        # 최대 페이지 번호 추출 (pagination에서 가장 큰 숫자)
        import re as _re
        page_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='?page=']")
        page_nums = []
        for a in page_links:
            href = a.get_attribute("href") or ""
            m = _re.search(r"\?page=(\d+)", href)
            if m:
                page_nums.append(int(m.group(1)))
        max_page = max(page_nums) if page_nums else page

        if page >= max_page:
            break

        page += 1
        time.sleep(random.uniform(0.8, 1.5))

    return list(urls)


# ──────────────────────────────────────────────
# 날짜 파싱 헬퍼
# ──────────────────────────────────────────────
def parse_date(text: str) -> str:
    """다양한 날짜 포맷 → YYYY-MM-DD"""
    text = text.strip()
    # "January 12, 2024"
    try:
        return datetime.strptime(text, "%B %d, %Y").strftime("%Y-%m-%d")
    except ValueError:
        pass
    # "Jan 12, 2024"
    try:
        return datetime.strptime(text, "%b %d, %Y").strftime("%Y-%m-%d")
    except ValueError:
        pass
    # "2024-01-12"
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", text)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    # year only
    m = re.search(r"\b(20\d{2})\b", text)
    if m:
        return f"{m.group(1)}-01-01"
    return ""


# ──────────────────────────────────────────────
# 기사 상세 페이지 파싱
# ──────────────────────────────────────────────
def parse_article(driver: webdriver.Chrome, url: str, category: str) -> dict | None:
    try:
        driver.get(url)
        WebDriverWait(driver, PAGE_LOAD_WAIT).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
    except TimeoutException:
        print(f"    [WARN] 기사 로드 타임아웃: {url}")
        return None
    except Exception as e:
        print(f"    [WARN] 기사 로드 실패: {url} — {e}")
        return None

    # ── 제목 ──
    title = ""
    for sel in ["h1", "article h1", ".article-title", ".post-title"]:
        try:
            title = driver.find_element(By.CSS_SELECTOR, sel).text.strip()
            if title:
                break
        except NoSuchElementException:
            pass

    if not title:
        return None

    # ── 날짜 ──
    published_date = ""
    date_selectors = [
        "time[datetime]",
        ".date", ".pub-date", ".article-date",
        "[class*='date']", "[class*='Date']",
    ]
    for sel in date_selectors:
        try:
            el = driver.find_element(By.CSS_SELECTOR, sel)
            dt_attr = el.get_attribute("datetime") or ""
            raw = dt_attr or el.text
            published_date = parse_date(raw)
            if published_date:
                break
        except NoSuchElementException:
            pass

    # 날짜를 못 찾으면 페이지 텍스트에서 패턴 검색
    if not published_date:
        body_text = driver.find_element(By.TAG_NAME, "body").text
        m = re.search(
            r"(January|February|March|April|May|June|July|August|September|October|November|December)"
            r"\s+\d{1,2},?\s+20\d{2}",
            body_text,
        )
        if m:
            published_date = parse_date(m.group(0))

    # ── 본문 ──
    content = ""
    content_selectors = [
        "article",
        "main article",
        ".article-body",
        ".entry-content",
        ".post-content",
        "[class*='article-content']",
        "[class*='body-content']",
        "main",
    ]
    for sel in content_selectors:
        try:
            el = driver.find_element(By.CSS_SELECTOR, sel)
            content = el.text.strip()
            if len(content) > 200:
                break
        except NoSuchElementException:
            pass

    # 본문이 너무 짧으면 스킵
    if len(content) < 100:
        print(f"    [SKIP] 본문 너무 짧음 ({len(content)}자): {url}")
        return None

    # 제목 첫 줄 중복 제거
    if content.startswith(title):
        content = content[len(title):].strip()

    # ── 요약 ──
    summary = ""
    summary_selectors = [
        "meta[name='description']",
        "meta[property='og:description']",
        ".article-summary", ".summary", ".excerpt", ".dek",
    ]
    for sel in summary_selectors:
        try:
            if sel.startswith("meta"):
                el = driver.find_element(By.CSS_SELECTOR, sel)
                summary = el.get_attribute("content") or ""
            else:
                summary = driver.find_element(By.CSS_SELECTOR, sel).text.strip()
            if summary:
                break
        except NoSuchElementException:
            pass

    if not summary:
        # 본문 앞 300자를 요약으로
        summary = content[:300] + ("..." if len(content) > 300 else "")

    return {
        "title": title,
        "content": content,
        "url": url,
        "category": category,
        "published_date": published_date,
        "source": SOURCE,
        "summary": summary,
    }


# ──────────────────────────────────────────────
# 메인
# ──────────────────────────────────────────────
def main(start_idx: int = 0):
    seen_urls = load_existing_urls()
    print(f"[시작] 기존 수집 URL: {len(seen_urls)}건")

    driver = make_driver()
    total_saved = 0

    try:
        for cat_name, cat_path in CATEGORIES[start_idx:]:
            print(f"\n{'='*55}")
            print(f"[카테고리] {cat_name}")
            print(f"{'='*55}")

            article_urls = collect_article_urls(driver, cat_path)
            new_urls = [u for u in article_urls if u not in seen_urls]
            print(f"  발견: {len(article_urls)}건 / 신규: {len(new_urls)}건")

            cat_saved = 0
            for i, url in enumerate(new_urls, 1):
                print(f"  [{i}/{len(new_urls)}] {url}")
                row = parse_article(driver, url, cat_name)

                if row:
                    save_rows([row])
                    seen_urls.add(url)
                    total_saved += 1
                    cat_saved += 1
                    print(f"    ✅ 저장: {row['title'][:50]} ({row['published_date']})")
                else:
                    seen_urls.add(url)  # 실패해도 재방문 방지

                time.sleep(random.uniform(*ARTICLE_DELAY))

            print(f"  [{cat_name}] 저장 완료: {cat_saved}건")

    except KeyboardInterrupt:
        print("\n[중단] 사용자 인터럽트")
    finally:
        driver.quit()
        print(f"\n[완료] 총 저장: {total_saved}건 → {OUT_FILE}")


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="start_idx", type=int, default=0,
                    help="CATEGORIES 배열에서 시작할 인덱스 (0부터)")
    args = ap.parse_args()
    main(start_idx=args.start_idx)
