"""레이블 품질 검증 - 각 클래스 샘플 확인"""
import sys
sys.stdout.reconfigure(encoding="utf-8")
import pandas as pd
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "output"

df = pd.read_parquet(OUT_DIR / "DBR_labeled.parquet")

for label_val, label_name in [(1, "성공"), (0, "실패"), (2, "모호")]:
    sub = df[df["label"] == label_val]
    print(f"\n=== {label_name} ({len(sub)}건) ===")
    sample = sub.sample(min(8, len(sub)), random_state=42)
    for _, row in sample.iterrows():
        print(f"  [{row['label_stage']:8s}] s={row['success_hits']:2d} f={row['failure_hits']:2d} "
              f"| {row['title'][:60]}")

# 실패 라벨 상세 (키워드 기반 확정분)
print("\n\n=== 실패(keyword 확정) 상위 20건 ===")
failure_kw = df[(df["label"] == 0) & (df["label_stage"] == "keyword")].nlargest(20, "failure_hits")
for _, row in failure_kw.iterrows():
    print(f"  s={row['success_hits']:2d} f={row['failure_hits']:2d} ratio={row['success_ratio']:.2f} | {row['title'][:70]}")
