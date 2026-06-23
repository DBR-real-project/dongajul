import os
import glob
import json
import re

# 1. 데이터를 저장해둔 폴더와 파일 이름 패턴 지정
folder_path = "./data"
file_pattern = "raw_news_*.json" 
search_path = os.path.join(folder_path, file_pattern)

json_files = glob.glob(search_path)

if not json_files:
    print(f"📂 '{folder_path}' 폴더에 '{file_pattern}' 파일이 아직 없습니다.")
    exit()

# 2. 연도별로 파일 이름과 기사 개수를 정리할 딕셔너리 생성
year_stats = {}
grand_total = 0

# 3. 파일들을 하나씩 열면서 개수 합산 및 연도별 분류
for file in json_files:
    file_name = os.path.basename(file)
    
    # 정규식으로 파일 이름에서 4자리 연도(YYYY) 추출
    match = re.search(r"raw_news_(\d{4})", file_name)
    year = match.group(1) if match else "Unknown"
    
    if year not in year_stats:
        year_stats[year] = {'total': 0, 'files': []}
        
    try:
        with open(file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            count = len(data)
            year_stats[year]['files'].append((file_name, count))
            year_stats[year]['total'] += count
            grand_total += count
    except json.JSONDecodeError:
        year_stats[year]['files'].append((file_name, "에러(깨짐)"))
    except Exception as e:
        year_stats[year]['files'].append((file_name, "에러(읽기실패)"))

# 4. 결과 출력 (연도별 그룹핑)
print("\n📊 [대규모 크롤링 연도별 수집 현황]")
print("=" * 60)

for year in sorted(year_stats.keys()):
    print(f"\n📅 [ {year}년 ] - 총 {year_stats[year]['total']:>6,}건")
    print("-" * 60)
    
    # 해당 연도의 파일들을 이름순으로 정렬해서 출력
    for f_name, count in sorted(year_stats[year]['files']):
        if isinstance(count, int):
            print(f"   📄 {f_name: <30} : {count:>6,}건")
        else:
            print(f"   ❌ {f_name: <30} : {count}")

print("\n" + "=" * 60)
print(f" 🚀 전체 누적 수집 기사 수         : {grand_total:>6,}건")
print("=" * 60, "\n")