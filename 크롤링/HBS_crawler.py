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
    ("Strategy & Innovation",        "/working-knowledge/collections/strategy-innovation"),
    ("Leadership",                   "/working-knowledge/collections/leadership"),
    ("Data & Technology",            "/working-knowledge/collections/data-technology"),
    ("Managing the Business",        "/working-knowledge/collections/managing-the-business"),
    ("Marketing & Consumers",        "/working-knowledge/collections/marketing-consumers"),
    ("Finance & Investing",          "/working-knowledge/collections/finance-investing"),
    ("Economics & Global Commerce",  "/working-knowledge/collections/economics-global-commerce"),
    ("Career & Workplace",           "/working-knowledge/collections/career-workplace"),
    ("Social Responsibility",        "/working-knowledge/collections/social-responsibility"),
    ("Regulation & Compliance",      "/working-knowledge/collections/regulation-compliance"),
    ("Psychology & Behavior",        "/working-knowledge/collections/psychology-behavior"),
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


# ──────────────────────────────────────────────
# 카테고리 페이지 → 기사 URL 목록 수집
# ──────────────────────────────────────────────
def collect_article_urls(driver: webdriver.Chrome, cat_url: str) -> list[str]:
    full_url = BASE_URL + cat_url
    driver.get(full_url)

    try:
        WebDriverWait(driver, PAGE_LOAD_WAIT).until(
            EC.presence_of_element_located((By.TAG_NAME, "a"))
        )
    except TimeoutException:
        print(f"  [WARN] 페이지 로드 타임아웃: {full_url}")
        return []

    # infinite scroll — 더 이상 높이가 안 늘 때까지 스크롤
    last_height = driver.execute_script("return document.body.scrollHeight")
    scroll_attempts = 0
    while scroll_attempts < 30:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(SCROLL_PAUSE)

        # "Load More" 버튼이 있으면 클릭
        try:
            btn = driver.find_element(
                By.XPATH,
                "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'load more') "
                "or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'see more') "
                "or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'show more')]"
            )
            driver.execute_script("arguments[0].click();", btn)
            time.sleep(SCROLL_PAUSE)
        except NoSuchElementException:
            pass

        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height
        scroll_attempts += 1

    # 기사 링크 추출: /working-knowledge/{slug} 패턴
    links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/working-knowledge/']")
    urls = set()
    for a in links:
        href = a.get_attribute("href") or ""
        # 컬렉션/검색 페이지 제외, 실제 기사만
        if (
            "/working-knowledge/" in href
            and "/collections" not in href
            and "/search" not in href
            and href != BASE_URL + "/working-knowledge"
            and href != BASE_URL + "/working-knowledge/"
        ):
            urls.add(href.split("?")[0].rstrip("/"))

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
def main():
    seen_urls = load_existing_urls()
    print(f"[시작] 기존 수집 URL: {len(seen_urls)}건")

    driver = make_driver()
    total_saved = 0

    try:
        for cat_name, cat_path in CATEGORIES:
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
    main()
