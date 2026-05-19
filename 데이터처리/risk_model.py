"""
④ 리스크 스코어링 모델 (동아줄)

입력 : NLP/output/embeddings.npy          ← ③ 산출물 (N x 384)
       NLP/output/articles_meta.parquet   ← ③ 산출물 (label 컬럼 포함)
출력 : NLP/output/risk_model.pkl          ← LogisticRegression 모델
       NLP/output/risk_model_report.txt   ← 성능 리포트

모델: Logistic Regression (C=1.0, class_weight='balanced', max_iter=1000)
  - 입력: 384차원 정규화 임베딩 (L2-norm=1, 이미 정규화됨)
  - 출력: risk_score = P(failure|embedding) ∈ [0, 1]
  - 중립(2) 문서 학습 제외 (애매한 라벨 노이즈 방지)
  - class_weight='balanced' → 실패(4.7%) 과소표현 보정

평가: stratified 5-fold CV + hold-out 20% test set
  → precision/recall/f1 (failure 클래스 중점), ROC-AUC

실행: python NLP/risk_model.py
"""
from __future__ import annotations

import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    average_precision_score,
)
from sklearn.model_selection import StratifiedKFold, train_test_split

sys.stdout.reconfigure(encoding="utf-8")

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── 데이터 로드 ──────────────────────────────────────────────────────
    print("데이터 로드...")
    embeddings = np.load(str(OUT_DIR / "embeddings.npy")).astype(np.float32)
    meta = pd.read_parquet(OUT_DIR / "articles_meta.parquet")
    print(f"임베딩: {embeddings.shape}  메타: {len(meta)}건")

    labels = meta["label"].values  # 0=failure, 1=success, 2=neutral

    # 중립(2) 제외 — 학습에 불확실한 라벨 노이즈 방지
    mask = labels != 2
    X = embeddings[mask]
    y = labels[mask].astype(int)
    print(f"\n학습 대상: {mask.sum()}건 (neutral {(~mask).sum()}건 제외)")
    print(f"클래스 분포: success={( y==1).sum()} / failure={(y==0).sum()} "
          f"({(y==0).sum()/len(y)*100:.1f}%)")

    # ── Train/Test 분할 (stratified) ────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain {len(X_train)}건 / Test {len(X_test)}건")

    # ── 5-fold CV ────────────────────────────────────────────────────────
    print("\n5-fold CV 평가 중...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_aucs: list[float] = []
    cv_aps:  list[float] = []

    for fold, (tr_idx, va_idx) in enumerate(skf.split(X_train, y_train), 1):
        clf = LogisticRegression(
            C=1.0, class_weight="balanced", max_iter=1000,
            solver="lbfgs", random_state=42
        )
        clf.fit(X_train[tr_idx], y_train[tr_idx])
        proba = clf.predict_proba(X_train[va_idx])[:, 0]  # P(failure)
        auc = roc_auc_score(y_train[va_idx] == 0, proba)
        ap  = average_precision_score(y_train[va_idx] == 0, proba)
        cv_aucs.append(auc)
        cv_aps.append(ap)
        print(f"  Fold {fold}: ROC-AUC={auc:.4f}  AP={ap:.4f}")

    print(f"  CV 평균: ROC-AUC={np.mean(cv_aucs):.4f}±{np.std(cv_aucs):.4f}"
          f"  AP={np.mean(cv_aps):.4f}±{np.std(cv_aps):.4f}")

    # ── 최종 모델 학습 (전체 Train) ──────────────────────────────────────
    print("\n최종 모델 학습...")
    model = LogisticRegression(
        C=1.0, class_weight="balanced", max_iter=1000,
        solver="lbfgs", random_state=42
    )
    model.fit(X_train, y_train)

    # ── Test 셋 평가 ─────────────────────────────────────────────────────
    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 0]  # P(failure) = risk_score

    test_auc = roc_auc_score(y_test == 0, y_proba)
    test_ap  = average_precision_score(y_test == 0, y_proba)

    report_str = classification_report(
        y_test, y_pred,
        target_names=["failure", "success"],
        digits=4
    )
    print(f"\n[Test Set 성능]")
    print(report_str)
    print(f"ROC-AUC (failure vs success): {test_auc:.4f}")
    print(f"Average Precision (failure):  {test_ap:.4f}")

    # ── 저장 ─────────────────────────────────────────────────────────────
    model_path  = OUT_DIR / "risk_model.pkl"
    report_path = OUT_DIR / "risk_model_report.txt"

    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    report_lines = [
        "=== 동아줄 리스크 스코어링 모델 성능 리포트 ===\n",
        f"학습 데이터: {len(X_train)}건 (success={( y_train==1).sum()} / failure={(y_train==0).sum()})",
        f"테스트 데이터: {len(X_test)}건\n",
        f"5-fold CV ROC-AUC: {np.mean(cv_aucs):.4f} ± {np.std(cv_aucs):.4f}",
        f"5-fold CV AP:      {np.mean(cv_aps):.4f} ± {np.std(cv_aps):.4f}\n",
        "[Test Set Classification Report]",
        report_str,
        f"Test ROC-AUC: {test_auc:.4f}",
        f"Test AP:      {test_ap:.4f}",
    ]
    report_path.write_text("\n".join(report_lines), encoding="utf-8")

    print(f"\n저장 완료:")
    print(f"  {model_path}")
    print(f"  {report_path}")

    # ── 샘플 추론 데모 ───────────────────────────────────────────────────
    print("\n─── 리스크 스코어 샘플 ───")
    df_meta = pd.read_parquet(OUT_DIR / "articles_meta.parquet")

    # 실패 기사 3개 + 성공 기사 3개 (실제 라벨 기준)
    sample_fail = df_meta[df_meta["label"] == 0].head(3)
    sample_succ = df_meta[df_meta["label"] == 1].head(3)
    sample = pd.concat([sample_fail, sample_succ])
    sample_idx = sample.index.tolist()

    sample_emb = embeddings[sample_idx]
    scores = model.predict_proba(sample_emb)[:, 0]  # P(failure)

    print(f"{'실제라벨':8s} {'리스크점수':>10s}  제목")
    for (_, row), score in zip(sample.iterrows(), scores):
        actual = row["label_name"]
        print(f"{actual:8s} {score:10.4f}  {str(row['title'])[:55]}")

    print("\n④ 리스크 스코어링 모델 완료")
    print("   risk_score = P(failure) — 높을수록 실패 유사 사례와 유사한 전략")


if __name__ == "__main__":
    main()
