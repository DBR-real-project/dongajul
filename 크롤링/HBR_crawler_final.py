"""
HBR Korea (하버드비즈니스리뷰) 전체 기사 크롤러 - 최종 버전
컬럼: title, content, url, category, published_date, source, summary
URL 수집: /article/latest?page={n} 순회 (기사 없을 때까지)
배치: 100건마다 CSV 저장 (incremental)
실행: python HBR_crawler_final.py
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
HBR_ID   = 'dbredu1'
HBR_PW   = 'a123456789*'
BASE     = 'https://www.hbrkorea.com'
OUT_CSV  = 'HBR_articles.csv'
BATCH    = 100          # N건마다 저장
SLEEP_ARTICLE = 2.0    # 기사 로드 대기 (초)
SLEEP_LIST    = 2.0    # 목록 페이지 대기 (초)
RETRY    = 3           # 재시도 횟수
COLUMNS  = ['title', 'content', 'url', 'category', 'published_date', 'source', 'summary']

# 카테고리 ID → 이름 매핑
CAT_MAP = {
    '1_1': '전략', '2_1': '인사조직', '3_1': '마케팅', '4_1': '재무회계',
    '5_1': '혁신', '6_1': '자기계발', '7_1': '운영관리', '8_1': '리더십',
    '9_1': '젠더', '10_1': '데이터사이언스', '11_1': '위기관리', '12_1': '지속가능성'
}

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
    """HBR 로그인 → True/False"""
    driver.get(f'{BASE}/member/login')
    time.sleep(3)
    try:
        id_el = driver.find_element(By.CSS_SELECTOR, 'input[name="email"]')
        pw_el = driver.find_element(By.CSS_SELECTOR, 'input[name="password"]')
        id_el.clear(); id_el.send_keys(HBR_ID)
        time.sleep(0.3)
        pw_el.clear(); pw_el.send_keys(HBR_PW)
        time.sleep(0.3)
        # dologin form submit
        driver.execute_script("""
            var forms = document.querySelectorAll('form');
            for (var f of forms) {
                if (f.action && f.action.indexOf('dologin') !== -1) {
                    f.submit(); break;
                }
            }
        """)
        time.sleep(3)
    except Exception as e:
        print(f'  [로그인 오류] {e}')
    try:
        driver.switch_to.alert.accept()
        time.sleep(2)
    except:
        pass
    # 로그아웃 링크 확인
    ok = 'logout' in driver.page_source.lower()
    print(f'  로그인 결과: {"✓ 성공" if ok else "✗ 실패"} ({driver.current_url})')
    return ok

# ── 카테고리 페이지에서 기사 URL 수집 ─────────────
def get_article_urls_from_category(driver, cat_id, page_no):
    """/article/topics/category_id/{cat_id}/page/{page_no} 에서 기사 URL 반환
    참고: ?page=N 방식은 항상 동일 기사 반환 → /page/N 경로 방식 필수"""
    url = f'{BASE}/article/topics/category_id/{cat_id}/page/{page_no}'
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
                links.append(full)
            return links
        except Exception as e:
            print(f'  [카테고리{cat_id} p{page_no} 오류 {attempt+1}/{RETRY}] {e}')
            time.sleep(3)
    return []

# ── article_header 파싱 ───────────────────────────
def parse_article_header(header_text, article_url):
    """
    article_header 텍스트 예시:
      "리더십 리더가 주도적 문화를 조성하는 방법 니르 이얄 (Nir Eyal) 디지털 2026. 5. 13."
      "전략 세라젬의 혁신 성장 최호진 매거진 2026. 5-6월호"
    반환: (category, published_date)
    """
    category = ''
    published_date = ''

    # URL에서 category_id 추출 → 카테고리명
    m = re.search(r'category_id/(\d+_\d)', article_url)
    if m:
        cat_id = m.group(1)
        category = CAT_MAP.get(cat_id, '')

    # 날짜 패턴 추출
    # 디지털형: 2026. 5. 13.
    # 매거진형: 2026. 5-6월호
    date_patterns = [
        r'\d{4}\.\s*\d{1,2}[-–]\d{1,2}월호',   # 2026. 5-6월호
        r'\d{4}년\s*\d{1,2}[-–]\d{1,2}월호',    # 2026년 5-6월호
        r'\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.',      # 2026. 5. 13.
        r'\d{4}년\s*\d{1,2}월\s*\d{1,2}일',     # 2026년 5월 13일
        r'\d{4}\.\s*\d{1,2}월호',                # 2026. 5월호
    ]
    for pat in date_patterns:
        m2 = re.search(pat, header_text)
        if m2:
            published_date = m2.group(0).strip()
            break

    # 카테고리가 없으면 헤더 첫 단어에서 추출
    if not category and header_text:
        first_word = header_text.split()[0] if header_text.split() else ''
        if first_word in CAT_MAP.values():
            category = first_word

    return category, published_date

# ── 기사 파싱 ────────────────────────────────────
def parse_article(driver, url):
    """기사 URL → dict"""
    for attempt in range(RETRY):
        try:
            driver.get(url)
            time.sleep(SLEEP_ARTICLE)
            s = BeautifulSoup(driver.page_source, 'html.parser')

            # ─ 제목 ─
            title = ''
            # h2 중 사이드바가 아닌 것
            for h2 in s.select('h2'):
                cls = h2.get('class', [])
                # 사이드바 h2 제외 (title_right 등)
                if any(c in ['title_right'] for c in cls):
                    continue
                t = h2.get_text(strip=True)
                if t and len(t) > 3:
                    title = t
                    break

            # ─ 헤더에서 카테고리 + 날짜 ─
            category = ''
            published_date = ''
            header_el = s.select_one('.article_header')
            if header_el:
                header_text = header_el.get_text(' ', strip=True)
                category, published_date = parse_article_header(header_text, url)
            if not category:
                # URL에서만 추출
                m = re.search(r'category_id/(\d+_\d)', url)
                if m:
                    category = CAT_MAP.get(m.group(1), '')

            # ─ 본문 정제 ─
            content = ''
            body_el = s.select_one('#article_body')
            if body_el:
                # 노이즈 제거
                for tag in body_el.find_all(['script', 'style']):
                    tag.decompose()
                # 각주 span 제거 (보통 불필요)
                # img alt 텍스트는 남김
                content = body_el.get_text('\n', strip=True)
                # 연속 줄바꿈 정리
                content = re.sub(r'\n{3,}', '\n\n', content)

            # ─ 요약 (리드 텍스트 또는 본문 앞 300자) ─
            summary = ''
            # 목록에서 가져온 description이 없으므로 본문 첫 문단 사용
            if content:
                lines = [l.strip() for l in content.split('\n') if l.strip()]
                # 첫 번째 의미있는 단락 (30자 이상)
                for line in lines:
                    if len(line) >= 30:
                        summary = line[:300]
                        break
            if not summary:
                summary = content[:300] if content else ''

            return {
                'title': title,
                'content': content,
                'url': url,
                'category': category,
                'published_date': published_date,
                'source': 'HBR Korea',
                'summary': summary,
            }

        except Exception as e:
            print(f'  [기사 파싱 오류 {attempt+1}/{RETRY}] {url} | {e}')
            time.sleep(3)

    return {col: '' for col in COLUMNS + ['url']}

# ── 기존 수집 데이터 로드 ─────────────────────────
def load_existing(csv_path):
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
        print('=== HBR Korea 크롤러 시작 ===')
        print(f'  출력: {OUT_CSV}')

        # 로그인
        print('\n[1] 로그인')
        if not login(driver):
            print('  로그인 실패 - 종료')
            return

        # 기존 수집 URL
        existing_urls = load_existing(OUT_CSV)
        print(f'\n[2] 기존 수집 URL: {len(existing_urls)}건')

        buffer = []
        total_collected = 0
        total_skipped   = 0
        total_short     = 0
        seen_article_nos = set()  # article_no 기준 중복 제거 (카테고리 간 중복 방지)

        # 기존 수집 article_no 추출
        if existing_urls:
            for u in existing_urls:
                m = re.search(r'article_no/(\d+)', u)
                if m:
                    seen_article_nos.add(m.group(1))

        MAX_PAGES_PER_CAT = 200  # 카테고리당 최대 페이지 (안전장치)

        print('\n[3] 카테고리별 기사 순회')
        for cat_id, cat_name in CAT_MAP.items():
            print(f'\n  ══ 카테고리: {cat_name} ({cat_id}) ══')
            page_no = 1
            consecutive_empty = 0
            seen_nos_this_cat = set()  # 이 카테고리에서 본 article_no (루프 감지용)

            while page_no <= MAX_PAGES_PER_CAT:
                print(f'\n  ── {cat_name} 페이지 {page_no} ──')
                urls = get_article_urls_from_category(driver, cat_id, page_no)

                # 이 페이지의 article_no 집합
                page_nos = set()
                for u in urls:
                    m = re.search(r'article_no/(\d+)', u)
                    if m:
                        page_nos.add(m.group(1))

                # 새 article_no = 이 카테고리에서 처음 보는 것
                new_nos = page_nos - seen_nos_this_cat

                print(f'  링크 {len(urls)}건 (새 article_no: {len(new_nos)}건)')

                # 종료 조건: 링크 없음 OR 새 article_no가 0 (무한 반복 감지)
                if len(urls) < 3 or len(new_nos) == 0:
                    consecutive_empty += 1
                    if consecutive_empty >= 2:
                        print(f'  → {cat_name} 완료 (페이지 {page_no}에서 종료)')
                        break
                    page_no += 1
                    continue
                else:
                    consecutive_empty = 0

                seen_nos_this_cat.update(page_nos)

                for art_url in urls:
                    m = re.search(r'article_no/(\d+)', art_url)
                    art_no = m.group(1) if m else ''

                    # 전체 실행 기준 중복 체크
                    if art_no and art_no in seen_article_nos:
                        total_skipped += 1
                        continue
                    if art_url in existing_urls:
                        total_skipped += 1
                        if art_no:
                            seen_article_nos.add(art_no)
                        continue

                    data = parse_article(driver, art_url)
                    existing_urls.add(art_url)
                    if art_no:
                        seen_article_nos.add(art_no)

                    content = data.get('content', '')
                    if len(content) < 100:
                        total_short += 1
                        print(f'  [SKIP 본문짧음] {art_url} ({len(content)}자)')
                        continue

                    buffer.append([data.get(c, '') for c in COLUMNS])
                    total_collected += 1
                    print(f'  [{total_collected}] {data["title"][:40]} | {data["category"]} | {len(content)}자')

                    if len(buffer) >= BATCH:
                        save_batch(buffer, OUT_CSV)
                        buffer = []

                page_no += 1

            else:
                print(f'  → {cat_name} 최대 페이지({MAX_PAGES_PER_CAT}) 도달, 다음 카테고리로')

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
