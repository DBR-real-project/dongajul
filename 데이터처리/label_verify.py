"""
자동 라벨 검수 스크립트

학습된 MLP 모델의 P(failure) 예측값과 현재 라벨이 크게 다른 경우를 탐지하여
자동으로 재라벨링.

기준:
  - failure 라벨 & P(failure) < PTHRESH  → neutral 로 수정 (모델이 실패 아니라고 봄)
  - success 라벨 & P(failure) > (1-PTHRESH) → 검토 대상 (일단 로그만)
"""
import sys, pickle
from pathlib import Path
import numpy as np
import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

# ── 파라미터 ─────────────────────────────────────────────────────────────────
PTHRESH = 0.20   # P(failure) < 이 값이면 failure 라벨 의심
LOG_TOP = 30     # 교정 전 상위 N건 출력

# ── 모델 로드 ─────────────────────────────────────────────────────────────────
with open(OUT_DIR / "risk_model.pkl", "rb") as f:
    pkg = pickle.load(f)

model     = pkg["model"]
threshold = pkg["threshold"]
print(f"모델: {pkg['model_name']}  threshold={threshold}  입력차원={model.n_features_in_}")

# ── 임베딩 + 라벨 로드 ────────────────────────────────────────────────────────
emb_all  = np.load(str(OUT_DIR / "embeddings.npy")).astype(np.float32)
dbr = pd.read_parquet(OUT_DIR / "DBR_labeled.parquet")
hbr = pd.read_parquet(OUT_DIR / "HBR_labeled.parquet")

# 임베딩 인덱스 오프셋
dbr_emb = emb_all[:len(dbr)]
hbr_emb = emb_all[len(dbr):]

print(f"\nDBR {len(dbr)}건  HBR {len(hbr)}건  임베딩 {emb_all.shape}")

# ── P(failure) 예측 ──────────────────────────────────────────────────────────
def predict_pfail(emb):
    """모델 P(failure=0) 반환"""
    proba = model.predict_proba(emb)        # shape (N, 2)
    # classes_ 확인: 0=failure, 1=success
    cls = list(model.classes_)
    fail_col = cls.index(0)
    return proba[:, fail_col]

dbr["p_failure"] = predict_pfail(dbr_emb)
hbr["p_failure"] = predict_pfail(hbr_emb)

# ── 교정 대상 탐지 (failure 라벨인데 P(failure) < PTHRESH) ────────────────────
def find_suspicious(df, src):
    mask = (df["label"] == 0) & (df["p_failure"] < PTHRESH)
    sus = df[mask].copy()
    sus["데이터소스"] = src
    return sus

sus_dbr = find_suspicious(dbr, "DBR")
sus_hbr = find_suspicious(hbr, "HBR")
sus_all = pd.concat([sus_dbr, sus_hbr]).sort_values("p_failure")

print(f"\n[ 의심 라벨 탐지 ] P(failure) < {PTHRESH}인 failure 기사")
print(f"  DBR: {len(sus_dbr)}건  HBR: {len(sus_hbr)}건  합계: {len(sus_all)}건")

if len(sus_all) > 0:
    print(f"\n▼ 상위 {min(LOG_TOP, len(sus_all))}건 (P(failure) 낮은 순):")
    cols = ["데이터소스", "p_failure", "confidence", "label_stage", "title"]
    cols = [c for c in cols if c in sus_all.columns] + (["title"] if "title" in sus_all.columns else [])
    # dedup
    show_cols = list(dict.fromkeys(cols))
    pd.set_option("display.max_colwidth", 70)
    pd.set_option("display.float_format", "{:.4f}".format)
    print(sus_all[show_cols].head(LOG_TOP).to_string(index=False))

# ── 재라벨링 수행 ─────────────────────────────────────────────────────────────
def relabel(df, sus_idx):
    """의심 인덱스를 neutral(label_name='neutral', label=2로 마킹)로 변경"""
    df = df.copy()
    df.loc[sus_idx, "label"]       = 2          # neutral
    df.loc[sus_idx, "label_name"]  = "neutral"
    df.loc[sus_idx, "label_stage"] = "verify"   # 검수에 의한 변경 표시
    return df

dbr_new = relabel(dbr, sus_dbr.index)
hbr_new = relabel(hbr, sus_hbr.index)

# ── 통계 비교 ─────────────────────────────────────────────────────────────────
def stats(df, name):
    tot = len(df)
    s = (df["label"] == 1).sum()
    f = (df["label"] == 0).sum()
    n = (df["label"] == 2).sum()
    print(f"  [{name}] 총 {tot}건 | 성공 {s} ({s/tot*100:.1f}%) | 실패 {f} ({f/tot*100:.1f}%) | neutral {n} ({n/tot*100:.1f}%)")

print("\n[ 교정 전 ]")
stats(dbr, "DBR"); stats(hbr, "HBR")
print("[ 교정 후 ]")
stats(dbr_new, "DBR"); stats(hbr_new, "HBR")

# ── 저장 ─────────────────────────────────────────────────────────────────────
if len(sus_all) == 0:
    print("\n의심 라벨 없음 — 저장 스킵")
else:
    dbr_new.to_parquet(OUT_DIR / "DBR_labeled.parquet", index=False)
    hbr_new.to_parquet(OUT_DIR / "HBR_labeled.parquet", index=False)

    # articles_meta.parquet 동기화
    meta_path = OUT_DIR / "articles_meta.parquet"
    if meta_path.exists():
        meta = pd.read_parquet(meta_path)
        combined = pd.concat([dbr_new[["label","label_name"]], hbr_new[["label","label_name"]]], ignore_index=True)
        if len(meta) == len(combined):
            meta["label"]      = combined["label"].values
            meta["label_name"] = combined["label_name"].values
            meta.to_parquet(meta_path, index=False)
            print("  articles_meta.parquet 동기화 완료")

    print(f"\n✓ 저장 완료 — failure→neutral 교정: DBR {len(sus_dbr)}건 / HBR {len(sus_hbr)}건")
    print("  다음 단계: python 데이터처리/risk_model.py (재학습)")
