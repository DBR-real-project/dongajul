import os
import re
import time
import sqlite3
import calendar
import json
import requests
import random # 휴먼 딜레이를 위한 랜덤 모듈 추가
import pandas as pd
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from html import unescape
from newspaper import Article, Config
from tqdm import tqdm

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ==========================================
# 1. 크롤링 환경 세팅 (키워드, 날짜, SQLite)
# ==========================================
# 현재 파일의 파트 이름 (파일이 꼬이지 않게 명찰을 달아줍니다)
PART_ID = "part1"
# 1번 파일 전용 키워드 (총 20개 중 1~5번)
core_keywords = [
    "스타트업", "창업", "초기창업", "신사업", "소비트렌드"
]

GLOBAL_START_DATE = "2023.01.01"
GLOBAL_END_DATE = "2026.05.21"  
TARGET_COUNT_PER_MONTH = 5

save_dir = "./data"
os.makedirs(save_dir, exist_ok=True)
# DB 이름도 part1 전용으로 분리
db_path = os.path.join(save_dir, f'crawling_history_{PART_ID}.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS crawled_articles (
        url TEXT PRIMARY KEY,
        title TEXT,
        keyword TEXT,
        crawled_at DATETIME
    )
''')
conn.commit()

# ==========================================
# 2. 헬퍼 함수들
# ==========================================
def get_monthly_ranges(start_date_str, end_date_str):
    start_date = datetime.strptime(start_date_str, "%Y.%m.%d")
    end_date = datetime.strptime(end_date_str, "%Y.%m.%d")
    
    ranges = []
    curr = start_date
    while curr <= end_date:
        last_day = calendar.monthrange(curr.year, curr.month)[1]
        month_end = datetime(curr.year, curr.month, last_day)
        
        if month_end > end_date:
            month_end = end_date
            
        ranges.append((curr.strftime("%Y.%m.%d"), month_end.strftime("%Y.%m.%d")))
        curr = month_end + timedelta(days=1)
        
    return ranges

def clean_html(text):
    text = re.sub(r"<.*?>", "", text)
    return unescape(text).strip()

def is_crawled(url, title):
    cursor.execute('SELECT 1 FROM crawled_articles WHERE url = ? OR title = ?', (url, title))
    return cursor.fetchone() is not None

def mark_as_crawled(url, title, keyword):
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT OR IGNORE INTO crawled_articles (url, title, keyword, crawled_at) 
        VALUES (?, ?, ?, ?)
    ''', (url, title, keyword, current_time))
    conn.commit()

def save_data_to_json(data_list):
    if not data_list:
        return
        
    df_new = pd.DataFrame(data_list)
    df_new = df_new[['source', 'title', 'content', 'url', 'published_at', 'collected_at', 'status', 'category', 'summary']]
    
    df_new['pub_year'] = pd.to_datetime(df_new['published_at'], errors='coerce').dt.strftime('%Y')
    df_new['pub_year'] = df_new['pub_year'].fillna('Unknown')
    
    for year, group in df_new.groupby('pub_year'):
        # 저장 파일 이름도 part1 전용으로 분리 (raw_news_2023_part1.json)
        file_name = f"raw_news_{year}_{PART_ID}.json"
        save_path = os.path.join(save_dir, file_name)
        
        clean_group = group.drop(columns=['pub_year'])
        existing_records = []
        
        if os.path.exists(save_path):
            try:
                with open(save_path, 'r', encoding='utf-8') as f:
                    existing_records = json.load(f)
            except Exception as e:
                print(f" ⚠️ 기존 {file_name} 파일 읽기 실패! 건너뜁니다. (에러: {e})")
                continue 
                
        new_records = clean_group.to_dict(orient="records")
        combined_records = existing_records + new_records
        
        seen = set()
        unique_records = []
        for item in reversed(combined_records):
            if item['url'] not in seen:
                seen.add(item['url'])
                unique_records.append(item)
        unique_records.reverse()
            
        try:
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(unique_records, f, ensure_ascii=False, indent=4, default=str)
            print(f"  {file_name} ➔ 누적 저장 완료 (총 {len(unique_records)}건)")
        except Exception as e:
            print(f" 저장 중 에러 발생: {e}")

def fetch_article_details(url, search_start_date=None):
    result = {"content": "", "source": "일반기사", "published_at": None}
    if pd.isna(url) or not isinstance(url, str) or url.strip() == "":
        return result

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        meta_date = soup.select_one('meta[property="article:published_time"], meta[itemprop="datePublished"], meta[name="publish-date"], meta[name="pubdate"]')
        if meta_date and meta_date.get('content'):
            date_str = meta_date['content'][:10] 
            if re.match(r'20[1-2]\d-[0-1]\d-[0-3]\d', date_str):
                result["published_at"] = f"{date_str} 00:00:00"

        if not result["published_at"] and "n.news.naver.com" in url:
            date_tag = soup.select_one('.media_end_head_info_datestamp_time')
            if date_tag and date_tag.has_attr('data-date-time'):
                result["published_at"] = date_tag['data-date-time']
                
        if not result["published_at"]:
            match = re.search(r'(20[1-2]\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])', url)
            if match:
                result["published_at"] = f"{match.group(1)}-{match.group(2)}-{match.group(3)} 00:00:00"

        if not result["published_at"]:
            date_pattern = r'(20[1-2]\d)[-./년\s]+(0[1-9]|1[0-2]|[1-9])[-./월\s]+(0[1-9]|[12]\d|3[01]|[1-9])[일\s]?'
            match = re.search(date_pattern, res.text)
            if match:
                y = match.group(1)
                m = match.group(2).zfill(2) 
                d = match.group(3).zfill(2)
                result["published_at"] = f"{y}-{m}-{d} 00:00:00"

        if "n.news.naver.com" in url:
            article_body = soup.select_one('#dic_area')
            if article_body:
                result["content"] = article_body.get_text(separator='\n', strip=True)
            media_logo = soup.select_one('.media_end_head_top_logo img')
            if media_logo and media_logo.has_attr('title'):
                result["source"] = media_logo['title']

        if not result["content"]:
            config = Config()
            config.browser_user_agent = headers['User-Agent']
            config.request_timeout = 10
            
            article = Article(url, language='ko', config=config)
            article.set_html(res.text) 
            article.parse()
            
            result["content"] = article.text.strip()
            
            meta_site = article.meta_data.get('og', {}).get('site_name')
            if meta_site:
                result["source"] = meta_site
                
            if not result["published_at"] and article.publish_date:
                result["published_at"] = article.publish_date.strftime("%Y-%m-%d %H:%M:%S")

    except Exception as e:
        pass
        
    if not result.get("published_at") and search_start_date:
        formatted_fallback = search_start_date.replace('.', '-') + " 00:00:00"
        result["published_at"] = formatted_fallback
        
    return result

def search_and_fetch_articles(query, start_date, end_date, target_count):
    options = Options()
    options.add_argument('--headless=new') 
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')
    
    driver = webdriver.Chrome(options=options)
    base_url = "https://search.naver.com/search.naver"
    nso_start = start_date.replace(".", "")
    nso_end = end_date.replace(".", "")
    
    items = []
    seen_urls = set()
    seen_titles = set()
    start_idx = 1
    
    pbar = tqdm(total=target_count, desc=f"   탐색 및 본문 파싱")
    
    try:
        while len(items) < target_count:
            search_url = f"{base_url}?where=news&query={query}&sm=tab_opt&sort=0&pd=3&ds={start_date}&de={end_date}&nso=so:r,p:from{nso_start}to{nso_end}&start={start_idx}"
            driver.get(search_url)
            
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "a[data-heatmap-target='.tit'], .news_tit"))
                )
            except:
                break 
                
            news_boxes = driver.find_elements(By.CSS_SELECTOR, "ul.list_news > li, div.news_area, div.sds-comps-base-layout")
            
            if not news_boxes:
                break
                
            page_added_count = 0 
            
            for box in news_boxes:
                try:
                    target_url = ""
                    title = ""
                    description = ""
                    
                    try:
                        title_a = box.find_element(By.CSS_SELECTOR, "a[data-heatmap-target='.tit']")
                        title = title_a.text.strip()
                        target_url = title_a.get_attribute('href')
                        try:
                            desc_a = box.find_element(By.CSS_SELECTOR, "a[data-heatmap-target='.body']")
                            description = desc_a.text.strip()
                        except:
                            pass
                    except:
                        try:
                            title_tag = box.find_element(By.CSS_SELECTOR, '.news_tit, .tit, a.news_tit')
                            title = title_tag.get_attribute('title') or title_tag.text
                            target_url = title_tag.get_attribute('href')
                            desc_tag = box.find_element(By.CSS_SELECTOR, '.api_txt_lines.dsc_txt_wrap, .dsc_txt')
                            description = desc_tag.text
                        except:
                            continue 
                            
                    if not target_url or "search.naver" in target_url:
                        continue
                        
                    try:
                        all_links = box.find_elements(By.TAG_NAME, 'a')
                        for a in all_links:
                            href = a.get_attribute('href')
                            if href and "n.news.naver.com" in href:
                                target_url = href
                                break
                    except:
                        pass
                    
                    title_clean = clean_html(title)
                    
                    if target_url in seen_urls or title_clean in seen_titles:
                        continue
                    
                    if is_crawled(target_url, title_clean):
                        continue
                        
                    details = fetch_article_details(target_url, start_date)
                    content = details["content"]
                    
                    if len(content) < 50 or "기사 섹션 분류 안내" in content:
                        continue
                        
                    summary = description.strip()
                    if not summary:
                        summary = content[:300] + "..." if len(content) > 300 else content

                    seen_urls.add(target_url)
                    seen_titles.add(title_clean)

                    items.append({
                        "title": title_clean,
                        "url": target_url,
                        "summary": summary,
                        "content": content,
                        "source": details["source"],
                        "published_at": details["published_at"]
                    })
                    
                    page_added_count += 1
                    pbar.update(1)
                    
                    if len(items) >= target_count:
                        break
                        
                except Exception as e:
                    continue 
            
            if page_added_count == 0 and len(items) == 0 and start_idx > 100:
                break

            start_idx += 10
            
            # 네이버 IP 차단 방지: 기계처럼 1초가 아니라 사람처럼 2초~4초 랜덤 휴식!
            time.sleep(random.uniform(2, 4)) 
            
            if start_idx > 1000:
                break
                
    finally:
        pbar.close()
        driver.quit()
        
    return items

# ==========================================
# 3. 메인 크롤링 파이프라인 (무한 반복 + 우주 방어 가동)
# ==========================================
monthly_ranges = get_monthly_ranges(GLOBAL_START_DATE, GLOBAL_END_DATE)
total_keywords = len(core_keywords)

cycle_count = 1  # 몇 번째 반복 중인지 세어주는 계기판

while True:  # 무한 반복 시작! 사용자가 강제로 끄기 전까지 영원히 돕니다.
    print(f"\n==================================================")
    # 현재 시간 출력 (밤새 잘 돌았는지 아침에 눈으로 확인용)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"🔄 [대규모 분할 크롤링 - {PART_ID}] {cycle_count}번째 전체 순회 시작 (가동 시간: {now_str})")
    print(f"==================================================")
    
    try:  # 에러 방어막 1단계: 전체 키워드 순회 중 발생하는 에러 차단
        for idx, keyword in enumerate(core_keywords):
            print(f"\n[{idx+1}/{total_keywords}] '{keyword}' 키워드 수집 시작")
            print("-" * 50)
            
            keyword_data = [] 
            
            for start_dt, end_dt in monthly_ranges:
                print(f" 기간: {start_dt} ~ {end_dt}")
                
                try:  # 에러 방어막 2단계: 특정 '달'을 긁다가 인터넷이 팅겨도 다음 달로 넘어가게 방어
                    items = search_and_fetch_articles(keyword, start_dt, end_dt, TARGET_COUNT_PER_MONTH)
                    
                    for item in items:
                        keyword_data.append({
                            "title": item["title"],
                            "content": item["content"],
                            "url": item["url"],
                            "source": item["source"],
                            "published_at": item["published_at"],
                            "collected_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            "status": "수집",
                            "category": keyword,
                            "summary": item["summary"]
                        })
                        
                        mark_as_crawled(item["url"], item["title"], keyword)
                        
                    print(f"   ✔️ 이번 달 유효 기사 {len(items)}건 수집 완료\n")
                    
                    # 수집된 게 있을 때만 안전하게 저장
                    save_data_to_json(keyword_data)
                    keyword_data = [] 
                    
                except Exception as e:
                    print(f"\n [{start_dt} ~ {end_dt}] 크롤링 중 돌발 에러 발생! (패스하고 다음 달로 전진): {e}")
                    time.sleep(10) # 잠시 에러 진정 시간
                    continue

        print(f"\n🎉 [{PART_ID}] {cycle_count}번째 전체 키워드/월 순회 완료!")
        print(f"💤 과도한 트래픽 스팸 방지를 위해 1시간 동안 휴식 후 다시 시작합니다...")
        
        cycle_count += 1
        time.sleep(1800)  # ⭐️ 1시간(3600초) 동안 일꾼들 재우기 (네이버 IP 차단 완벽 방지)

    except Exception as e:
        # 인터넷이 통째로 끊기거나 브라우저가 강제 종료되는 대형 에러 발생 시
        print(f"\n 치명적인 시스템 에러 발생 (10분 후 자동 재시작 시도): {e}")
        time.sleep(600)  # 10분 동안 기다렸다가 와이파이가 다시 잡히면 복귀하도록 대기
        continue