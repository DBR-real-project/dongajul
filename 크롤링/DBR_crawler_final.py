"""
DBR (동아비즈니스리뷰) 전체 기사 크롤러 - 최종 버전
컬럼: title, content, url, category, published_date, source, summary
URL 수집: 441개 매거진 이슈 페이지 순회
배치: 100건마다 CSV 저장 (incremental)
실행: python DBR_crawler_final.py
"""

import time
import re
import sys
import io
import os
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ── 설정 ──────────────────────────────────────────
DBR_ID   = 'dbredu1'
DBR_PW   = 'a123456789*'
BASE     = 'https://dbr.donga.com'
OUT_CSV  = 'DBR_articles.csv'
BATCH    = 100          # N건마다 저장
MAX_ISSUES = 441        # 전체 이슈 수 (1~441)
SLEEP_ARTICLE = 1.5    # 기사 로드 대기 (초)
SLEEP_LIST    = 1.5    # 목록 페이지 대기 (초)
RETRY    = 3           # 재시도 횟수
COLUMNS  = ['title', 'content', 'url', 'category', 'published_date', 'source', 'summary']

# ── 드라이버 초기화 ───────────────────────────────
def make_driver():
    opts = Options()
    opts.add_argument('--start-maximized')
    opts.add_argument('--disable-blink-features=AutomationControlled')
    opts.add_argument(
        'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    opts.add_experimental_option('excludeSwitches', ['enable-automation'])
    opts.add_experimental_option('useAutomationExtension', False)
    d = webdriver.Chrome(options=opts)
    d.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': 'Object.defineProperty(navigator, "webdriver", {get: () => undefined})'
    })
    return d

# ── 로그인 ───────────────────────────────────────
def login(driver):
    """DBR 로그인 → True/False"""
    driver.get(f'{BASE}/login')
    time.sleep(3)
    try:
        id_el = driver.find_element(By.ID, 'insert-id')
        pw_el = driver.find_element(By.ID, 'insert-pw')
        id_el.clear(); id_el.send_keys(DBR_ID)
        time.sleep(0.3)
        pw_el.clear(); pw_el.send_keys(DBR_PW)
        time.sleep(0.3)
        btn = driver.find_element(By.CSS_SELECTOR, '#loginForm button[type="submit"]')
        btn.click()
        time.sleep(3)
    except Exception as e:
        print(f'  [로그인 오류] {e}')
    try:
        driver.switch_to.alert.accept()
        time.sleep(2)
    except:
        pass
    ok = 'login' not in driver.current_url.lower()
    print(f'  로그인 결과: {"✓ 성공" if ok else "✗ 실패"} ({driver.current_url})')
    return ok

# ── 매거진 이슈에서 기사 URL 수집 ────────────────
def get_article_urls_from_issue(driver, pub_no):
    """pub_no 이슈 페이지에서 기사 URL 리스트 반환"""
    url = f'{BASE}/magazine/mcontents/type/list/pub_number/{pub_no}'
    for attempt in range(RETRY):
        try:
            driver.get(url)
            time.sleep(SLEEP_LIST)
            s = BeautifulSoup(driver.page_source, 'html.parser')
            links = []
            seen = set()
            for a in s.select('a[href*="article_no"]'):
                href = a.get('href', '')
                m = re.search(r'article_no/(\d+)', href)
                if not m:
                    continue
                no = m.group(1)
                if no in seen:
                    continue
                seen.add(no)
                full = href if href.startswith('http') else BASE + href
                # ac/magazine 파라미터 보장
                if '/ac/' not in full:
                    full += '/ac/magazine'
                links.append(full)
            return links
        except Exception as e:
            print(f'  [이슈{pub_no} 오류 {attempt+1}/{RETRY}] {e}')
            time.sleep(3)
    return []

# ── 기사 파싱 ────────────────────────────────────
def parse_article(driver, url):
    """기사 URL → dict(title, content, url, category, published_date, source, summary)"""
    for attempt in range(RETRY):
        try:
            driver.get(url)
            time.sleep(SLEEP_ARTICLE)
            s = BeautifulSoup(driver.page_source, 'html.parser')

            # ─ 제목 (기사 제목만) ─
            title = ''
            h4 = s.select_one('div.header-cont h4.title')
            if h4:
                title = h4.get_text(strip=True)

            # ─ 카테고리 ─
            category = ''
            sub = s.select_one('div.header-cont p.subtitle')
            if sub:
                category = sub.get_text(strip=True)

            # ─ 발행일 (호수 정보) ─
            published_date = ''
            jo = s.select_one('div.jounalist_ho')
            if jo:
                full_text = jo.get_text(' ', strip=True)
                m = re.search(r'(\d+호\s*\([^)]+\))', full_text)
                if m:
                    published_date = m.group(1)
                else:
                    # fallback: 날짜 패턴
                    m2 = re.search(r'(\d{4}[.\-]\s*\d{1,2}[.\-]\s*\d{0,2})', full_text)
                    published_date = m2.group(1) if m2 else full_text[:30]

            # ─ 본문 정제 ─
            content = ''
            body_el = s.select_one('div.cont-article')
            if body_el:
                # 노이즈 제거
                for sel in ['section.preview', 'ul.new_author_wrap', 'div.copyright_notice',
                            'div.ta-r', 'ul.relate_article', 'span.footnote', 'a.icon-annotate']:
                    for el in body_el.select(sel):
                        el.decompose()
                # "인기기사" 텍스트 블록 제거
                for el in list(body_el.children):
                    if hasattr(el, 'get_text') and el.get_text(strip=True) == '인기기사':
                        el.decompose()
                for tag in body_el.find_all(['script', 'style']):
                    tag.decompose()
                # article-free-zone 우선 (로그인 후 전체 본문)
                free = body_el.select_one('div.article-free-zone')
                if free:
                    # 자유 영역 내 노이즈 추가 제거
                    for sel in ['section.preview', 'ul.new_author_wrap', 'div.copyright_notice',
                                'div.ta-r', 'ul.relate_article', 'span.footnote', 'a.icon-annotate']:
                        for el in free.select(sel):
                            el.decompose()
                    content = free.get_text('\n', strip=True)
                else:
                    content = body_el.get_text('\n', strip=True)

            # ─ 요약 (Article at a Glance) ─
            summary = ''
            if body_el:
                # article-free-zone 내 첫 번째 strong이 "Article at a Glance" 섹션
                free_zone = s.select_one('div.article-free-zone')
                if free_zone:
                    strong_el = free_zone.select_one('strong')
                    if strong_el:
                        # strong 다음 텍스트 수집 (리스트 항목들)
                        summary_parts = []
                        for sib in strong_el.next_siblings:
                            if hasattr(sib, 'get_text'):
                                t = sib.get_text(strip=True)
                                if t:
                                    summary_parts.append(t)
                                    if len(' '.join(summary_parts)) > 300:
                                        break
                        candidate = ' '.join(summary_parts)[:300]
                        if len(candidate) > 30:
                            summary = candidate
            if not summary:
                summary = content[:300] if content else ''

            result = {
                'title': title,
                'content': content,
                'url': url,
                'category': category,
                'published_date': published_date,
                'source': 'DBR',
                'summary': summary,
            }
            return result

        except Exception as e:
            print(f'  [기사 파싱 오류 {attempt+1}/{RETRY}] {url} | {e}')
            time.sleep(3)

    return {col: '' for col in COLUMNS + ['url']}

# ── 기존 수집 데이터 로드 ─────────────────────────
def load_existing(csv_path):
    """이미 수집된 URL 집합 반환"""
    if not os.path.exists(csv_path):
        return set()
    try:
        df = pd.read_csv(csv_path, encoding='utf-8-sig', usecols=['url'])
        return set(df['url'].dropna().tolist())
    except:
        return set()

# ── 배치 저장 ────────────────────────────────────
def save_batch(records, csv_path):
    df_new = pd.DataFrame(records, columns=COLUMNS)
    if os.path.exists(csv_path):
        df_new.to_csv(csv_path, mode='a', header=False, index=False, encoding='utf-8-sig')
    else:
        df_new.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f'  → {csv_path} 저장: {len(records)}건 추가')

# ── 메인 ─────────────────────────────────────────
def main():
    driver = make_driver()
    try:
        print('=== DBR 크롤러 시작 ===')
        print(f'  출력: {OUT_CSV}')

        # 로그인
        print('\n[1] 로그인')
        if not login(driver):
            print('  로그인 실패 - 종료')
            return

        # 기존 수집 URL
        existing_urls = load_existing(OUT_CSV)
        print(f'\n[2] 기존 수집 URL: {len(existing_urls)}건')

        # 이슈별 URL 수집 + 기사 파싱
        buffer = []
        total_collected = 0
        total_skipped   = 0
        total_short     = 0

        print(f'\n[3] 이슈 순회 (1~{MAX_ISSUES})')
        for pub_no in range(MAX_ISSUES, 0, -1):  # 최신(441)부터 역순
            print(f'\n  ── 이슈 {pub_no}/{MAX_ISSUES} ──')
            urls = get_article_urls_from_issue(driver, pub_no)
            print(f'  링크 {len(urls)}건 발견')

            for art_url in urls:
                if art_url in existing_urls:
                    total_skipped += 1
                    continue

                data = parse_article(driver, art_url)
                existing_urls.add(art_url)

                content = data.get('content', '')
                if len(content) < 100:
                    total_short += 1
                    print(f'  [SKIP 본문짧음] {art_url} ({len(content)}자)')
                    continue

                buffer.append([data.get(c, '') for c in COLUMNS])
                total_collected += 1
                print(f'  [{total_collected}] {data["title"][:40]} | {data["category"]} | {len(content)}자')

                # 배치 저장
                if len(buffer) >= BATCH:
                    save_batch(buffer, OUT_CSV)
                    buffer = []

        # 남은 기록 저장
        if buffer:
            save_batch(buffer, OUT_CSV)

        print(f'\n=== 완료 ===')
        print(f'  수집: {total_collected}건')
        print(f'  스킵(기존): {total_skipped}건')
        print(f'  스킵(본문짧음): {total_short}건')
        print(f'  저장: {OUT_CSV}')

    finally:
        driver.quit()

if __name__ == '__main__':
    main()
