"""
trend_keywords.json → trend_summaries.json

카테고리별 TF-IDF 키워드를 GPT-4o-mini로 2~3문장 트렌드 요약으로 변환.
한 번만 실행하면 되는 일회성 배치 스크립트.

실행:
    python 데이터처리/generate_trend_summaries.py
"""
import json
import os
import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

# .env 로드
from dotenv import load_dotenv
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "backend" / ".env")

try:
    from openai import OpenAI
except ImportError:
    print("openai 패키지 필요: pip install openai")
    sys.exit(1)

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("OPENAI_API_KEY 환경변수가 없습니다.")
    sys.exit(1)

client = OpenAI(api_key=api_key)

# trend_keywords.json 로드
trend_path = OUT_DIR / "trend_keywords.json"
if not trend_path.exists():
    print(f"trend_keywords.json 없음: {trend_path}")
    print("먼저 데이터처리/extract_trends.py 를 실행하세요.")
    sys.exit(1)

with open(trend_path, encoding='utf-8') as f:
    trend_data = json.load(f)

print(f"카테고리 수: {len(trend_data)}개")
summaries: dict[str, str] = {}

SYSTEM_MSG = "당신은 한국 비즈니스 트렌드 분석 전문가입니다. 주어진 키워드를 바탕으로 해당 분야의 현재 비즈니스 트렌드를 분석합니다."


def generate_summary(cat: str, kws: list[str]) -> str:
    kw_str = ', '.join(kws[:15])
    if cat == "__all__":
        user_msg = (
            f"다음은 2024~2025년 한국 비즈니스 전반의 핵심 키워드입니다:\n{kw_str}\n\n"
            "이를 바탕으로 현재 한국 비즈니스 환경의 전반적인 트렌드를 "
            "2~3문장으로 요약하세요. 구체적인 시장 흐름과 변화를 중심으로 서술하세요."
        )
    else:
        user_msg = (
            f"다음은 2024~2025년 한국 [{cat}] 분야의 핵심 트렌드 키워드입니다:\n{kw_str}\n\n"
            f"이를 바탕으로 [{cat}] 분야의 현재 한국 비즈니스 동향을 "
            "2~3문장으로 요약하세요. 시장 변화, 주요 이슈, 기업 대응 방향을 중심으로 "
            "구체적으로 서술하세요. 수치나 비율이 추론 가능하면 포함하세요."
        )

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_MSG},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.3,
        max_tokens=250,
    )
    return resp.choices[0].message.content.strip()


# __all__ 먼저
if "__all__" in trend_data:
    print("[전체 트렌드] 생성 중...")
    try:
        summaries["__all__"] = generate_summary("__all__", trend_data["__all__"])
        print(f"  → {summaries['__all__'][:80]}...")
    except Exception as e:
        print(f"  실패: {e}")
    time.sleep(0.5)

# 카테고리별
for cat, kws in trend_data.items():
    if cat == "__all__":
        continue
    if not kws:
        continue
    print(f"[{cat}] 생성 중...")
    try:
        summaries[cat] = generate_summary(cat, kws)
        print(f"  → {summaries[cat][:80]}...")
    except Exception as e:
        print(f"  실패: {e}")
    time.sleep(0.5)  # Rate limit 방지

# 저장
out_path = OUT_DIR / "trend_summaries.json"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(summaries, f, ensure_ascii=False, indent=2)

print(f"\n✅ 완료: {out_path}")
print(f"   총 {len(summaries)}개 카테고리 요약 생성됨")
