"""전처리 결과 샘플 확인용"""
import sys
sys.stdout.reconfigure(encoding="utf-8")

import pandas as pd
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "output"

for name in ("DBR", "HBR"):
    df = pd.read_parquet(OUT_DIR / f"{name}_preprocessed.parquet")
    print(f"\n=== {name} ({len(df)}건) ===")
    print(f"컬럼: {list(df.columns)}")
    print(f"n_tokens 분포:\n{df['n_tokens'].describe().to_string()}")
    print(f"\n샘플 제목 5개:")
    for t in df["title"].head(5).tolist():
        print(f"  - {t}")
    print(f"\n샘플 token_str (첫 번째):\n  {df['token_str'].iloc[0][:200]}")
