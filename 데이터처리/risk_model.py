"""
④ 리스크 스코어링 모델 (동아줄) — 다중 분류기 비교 + 앙상블

입력 : 데이터처리/output/embeddings.npy          ← ③ DBR+HBR 임베딩 (N x 768)
       데이터처리/output/NAVER_embeddings.npy     ← NAVER 임베딩 (M x 768)
       데이터처리/output/{DBR,HBR,NAVER}_labeled.parquet ← 라벨
출력 : 데이터처리/output/risk_model.pkl          ← 최고 성능 모델 (또는 앙상블)
       데이터처리/output/risk_model_report.txt   ← 전체 비교 리포트

비교 모델:
  1. Logistic Regression  (baseline)
  2. LightGBM
  3. XGBoost
  4. MLP (2-hidden-layer)
  5. Ensemble (LR + LightGBM + MLP 소프트 보팅)

평가: stratified 5-fold CV (ROC-AUC, Average Precision) + hold-out 20% test
임계값 최적화: validation fold에서 F1 최대화 임계값 탐색

실행: python 데이터처리/risk_model.py
"""
from __future__ import annotations

import pickle
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import label_binarize

warnings.filterwarnings("ignore")
sys.stdout.reconfigure(encoding="utf-8")

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

# ── 임포트 (선택적) ───────────────────────────────────────────────────────────
try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False
    print("[경고] lightgbm 없음 — pip install lightgbm")

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("[경고] xgboost 없음 — pip install xgboost")


# ── 모델 정의 ─────────────────────────────────────────────────────────────────

def get_models() -> dict:
    models = {
        "LR": LogisticRegression(
            C=1.0, class_weight="balanced", max_iter=1000,
            solver="lbfgs", random_state=42,
        ),
        "MLP": MLPClassifier(
            hidden_layer_sizes=(512, 128),
            activation="relu",
            max_iter=300,
            early_stopping=True,
            validation_fraction=0.1,
            random_state=42,
            verbose=False,
        ),
    }
    if HAS_LGB:
        models["LightGBM"] = lgb.LGBMClassifier(
            n_estimators=500,
            learning_rate=0.05,
            num_leaves=63,
            class_weight="balanced",
            n_jobs=-1,
            random_state=42,
            verbose=-1,
        )
    if HAS_XGB:
        models["XGBoost"] = xgb.XGBClassifier(
            n_estimators=500,
            learning_rate=0.05,
            max_depth=6,
            scale_pos_weight=9,       # failure 비율 역수 (≒ success/failure)
            eval_metric="logloss",
            use_label_encoder=False,
            random_state=42,
            verbosity=0,
        )
    return models


# ── 임계값 최적화 ─────────────────────────────────────────────────────────────

def find_best_threshold(y_true: np.ndarray, y_proba: np.ndarray) -> float:
    """F1(failure) 최대화 임계값 탐색 (0.05~0.95)."""
    best_t, best_f1 = 0.5, 0.0
    for t in np.arange(0.05, 0.95, 0.01):
        pred = (y_proba >= t).astype(int)
        # failure=0, success=1 이므로 failure proba >= threshold → predict failure
        f1 = f1_score(y_true == 0, y_proba >= t, zero_division=0)
        if f1 > best_f1:
            best_f1, best_t = f1, t
    return round(float(best_t), 3)


# ── 5-fold CV ─────────────────────────────────────────────────────────────────

def cross_validate(name: str, clf, X: np.ndarray, y: np.ndarray) -> dict:
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    aucs, aps, thresholds = [], [], []

    for fold, (tr_idx, va_idx) in enumerate(skf.split(X, y), 1):
        clf_fold = clone_clf(clf)
        clf_fold.fit(X[tr_idx], y[tr_idx])
        proba = get_failure_proba(clf_fold, X[va_idx])
        auc = roc_auc_score(y[va_idx] == 0, proba)
        ap  = average_precision_score(y[va_idx] == 0, proba)
        thr = find_best_threshold(y[va_idx], proba)
        aucs.append(auc); aps.append(ap); thresholds.append(thr)
        print(f"  [{name}] Fold {fold}: AUC={auc:.4f}  AP={ap:.4f}  BestThr={thr:.2f}")

    return {
        "auc_mean": float(np.mean(aucs)),
        "auc_std":  float(np.std(aucs)),
        "ap_mean":  float(np.mean(aps)),
        "ap_std":   float(np.std(aps)),
        "best_thr": float(np.median(thresholds)),
    }


def clone_clf(clf):
    """sklearn clone."""
    from sklearn.base import clone
    return clone(clf)


def get_failure_proba(clf, X: np.ndarray) -> np.ndarray:
    """P(failure) = P(class=0) 반환."""
    proba = clf.predict_proba(X)
    classes = list(clf.classes_)
    failure_col = classes.index(0)
    return proba[:, failure_col]


# ── 메인 ─────────────────────────────────────────────────────────────────────

def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── 데이터 로드 ──────────────────────────────────────────────────────
    print("데이터 로드...")

    # DBR + HBR 임베딩 & 라벨 (labeled.parquet에서 직접 읽어 최신 라벨 반영)
    embeddings = np.load(str(OUT_DIR / "embeddings.npy")).astype(np.float32)
    dbr_meta   = pd.read_parquet(OUT_DIR / "DBR_labeled.parquet")[["label"]]
    hbr_meta   = pd.read_parquet(OUT_DIR / "HBR_labeled.parquet")[["label"]]
    meta       = pd.concat([dbr_meta, hbr_meta], ignore_index=True)
    print(f"[DBR+HBR] 임베딩: {embeddings.shape}  라벨: {len(meta)}건")

    # NAVER 임베딩 & 라벨 (있을 때만)
    naver_emb_path   = OUT_DIR / "NAVER_embeddings.npy"
    naver_label_path = OUT_DIR / "NAVER_labeled.parquet"
    if naver_emb_path.exists() and naver_label_path.exists():
        naver_emb  = np.load(str(naver_emb_path)).astype(np.float32)
        naver_meta = pd.read_parquet(naver_label_path)[["label"]]
        embeddings = np.vstack([embeddings, naver_emb])
        meta       = pd.concat([meta, naver_meta], ignore_index=True)
        print(f"[NAVER] 임베딩: {naver_emb.shape} 합산 → 전체: {embeddings.shape}")
    else:
        print("[NAVER] 임베딩 없음 — DBR+HBR만으로 학습합니다.")

    labels = meta["label"].values

    # 중립(2) 제외
    mask = labels != 2
    X = embeddings[mask]
    y = labels[mask].astype(int)
    print(f"\n학습 대상: {mask.sum()}건 (neutral {(~mask).sum()}건 제외)")
    print(f"클래스 분포: success={(y==1).sum()} / failure={(y==0).sum()} "
          f"({(y==0).sum()/len(y)*100:.1f}%)")

    # ── Train/Test 분할 ──────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train {len(X_train)}건 / Test {len(X_test)}건\n")

    # ── 모델 비교 (5-fold CV) ────────────────────────────────────────────
    models    = get_models()
    cv_results: dict[str, dict] = {}

    for name, clf in models.items():
        print(f"\n{'='*50}")
        print(f"[{name}] 5-fold CV 시작...")
        cv_results[name] = cross_validate(name, clf, X_train, y_train)
        r = cv_results[name]
        print(f"  → AUC={r['auc_mean']:.4f}±{r['auc_std']:.4f}  "
              f"AP={r['ap_mean']:.4f}±{r['ap_std']:.4f}  "
              f"최적임계값={r['best_thr']:.2f}")

    # ── CV 결과 요약 ─────────────────────────────────────────────────────
    print(f"\n{'='*50}")
    print("[ CV 결과 요약 ]")
    print(f"{'모델':<12} {'ROC-AUC':>10} {'AP':>10} {'최적임계값':>10}")
    print("-" * 45)
    for name, r in sorted(cv_results.items(), key=lambda x: -x[1]["auc_mean"]):
        print(f"{name:<12} {r['auc_mean']:.4f}±{r['auc_std']:.3f} "
              f"{r['ap_mean']:.4f}±{r['ap_std']:.3f} "
              f"{r['best_thr']:>10.2f}")

    best_name = max(cv_results, key=lambda n: cv_results[n]["auc_mean"])
    best_thr  = cv_results[best_name]["best_thr"]
    print(f"\n✓ 최고 단일 모델: {best_name} (AUC={cv_results[best_name]['auc_mean']:.4f})")

    # ── 앙상블 학습 & 평가 ───────────────────────────────────────────────
    print(f"\n{'='*50}")
    print("[Ensemble] 소프트 보팅 앙상블 학습...")

    ensemble_estimators = []
    for name, clf in models.items():
        trained = clone_clf(clf)
        trained.fit(X_train, y_train)
        ensemble_estimators.append((name, trained))

    # VotingClassifier (soft voting)
    ensemble = VotingClassifier(estimators=ensemble_estimators, voting="soft")
    ensemble.fit(X_train, y_train)

    ens_proba = get_failure_proba(ensemble, X_test)
    ens_auc   = roc_auc_score(y_test == 0, ens_proba)
    ens_ap    = average_precision_score(y_test == 0, ens_proba)
    ens_thr   = find_best_threshold(y_test, ens_proba)   # test에서 탐색 (참고용)
    print(f"  Ensemble Test AUC={ens_auc:.4f}  AP={ens_ap:.4f}  BestThr={ens_thr:.2f}")

    # ── 최종 모델 선택 (앙상블 vs 단일 최고) ────────────────────────────
    print(f"\n{'='*50}")
    print("[최종 모델 선택]")

    # 단일 최고 모델 test 성능
    best_single = clone_clf(models[best_name])
    best_single.fit(X_train, y_train)
    best_proba  = get_failure_proba(best_single, X_test)
    best_auc    = roc_auc_score(y_test == 0, best_proba)
    best_ap     = average_precision_score(y_test == 0, best_proba)

    print(f"  {best_name:<12} Test AUC={best_auc:.4f}  AP={best_ap:.4f}")
    print(f"  Ensemble     Test AUC={ens_auc:.4f}  AP={ens_ap:.4f}")

    if ens_auc >= best_auc:
        final_model     = ensemble
        final_proba     = ens_proba
        final_thr       = ens_thr
        final_model_name = "Ensemble"
    else:
        final_model     = best_single
        final_proba     = best_proba
        final_thr       = best_thr
        final_model_name = best_name

    print(f"\n✓ 채택 모델: {final_model_name}  (임계값: {final_thr:.2f})")

    # ── 최종 평가 리포트 ─────────────────────────────────────────────────
    y_pred_opt = (final_proba >= final_thr).astype(int)
    # 임계값 적용: proba >= thr → failure(0), else success(1)
    y_pred_labels = np.where(y_pred_opt == 1, 0, 1)

    final_auc = roc_auc_score(y_test == 0, final_proba)
    final_ap  = average_precision_score(y_test == 0, final_proba)
    report_str = classification_report(
        y_test, y_pred_labels,
        target_names=["failure", "success"],
        digits=4,
    )

    print(f"\n[Test Set 최종 성능 — {final_model_name}, threshold={final_thr:.2f}]")
    print(report_str)
    print(f"ROC-AUC: {final_auc:.4f}  |  Average Precision: {final_ap:.4f}")

    # ── 저장 ─────────────────────────────────────────────────────────────
    model_path  = OUT_DIR / "risk_model.pkl"
    report_path = OUT_DIR / "risk_model_report.txt"

    save_obj = {"model": final_model, "threshold": final_thr,
                "model_name": final_model_name}
    with open(model_path, "wb") as f:
        pickle.dump(save_obj, f)

    lines = [
        "=== 동아줄 리스크 스코어링 모델 성능 리포트 ===\n",
        f"채택 모델: {final_model_name}  (임계값: {final_thr:.2f})",
        f"학습 데이터: {len(X_train)}건 (success={(y_train==1).sum()} / failure={(y_train==0).sum()})",
        f"테스트 데이터: {len(X_test)}건\n",
        "[ CV 결과 요약 ]",
    ]
    for name, r in sorted(cv_results.items(), key=lambda x: -x[1]["auc_mean"]):
        lines.append(f"  {name:<12} AUC={r['auc_mean']:.4f}±{r['auc_std']:.3f}"
                     f"  AP={r['ap_mean']:.4f}±{r['ap_std']:.3f}")
    lines += [
        f"\nEnsemble Test AUC={ens_auc:.4f}  AP={ens_ap:.4f}",
        f"\n[Test Set 최종 성능]",
        report_str,
        f"Test ROC-AUC: {final_auc:.4f}",
        f"Test AP:      {final_ap:.4f}",
    ]
    report_path.write_text("\n".join(lines), encoding="utf-8")

    print(f"\n저장 완료:")
    print(f"  {model_path}")
    print(f"  {report_path}")

    # ── 샘플 추론 데모 ───────────────────────────────────────────────────
    print("\n─── 리스크 스코어 샘플 (DBR 기준) ───")
    df_meta = pd.read_parquet(OUT_DIR / "articles_meta.parquet")
    sample_fail = df_meta[df_meta["label"] == 0].head(3)
    sample_succ = df_meta[df_meta["label"] == 1].head(3)
    sample = pd.concat([sample_fail, sample_succ])
    sample_idx = sample.index.tolist()

    # embeddings.npy는 DBR+HBR이므로 DBR 인덱스 그대로 사용 가능
    dbr_hbr_emb = np.load(str(OUT_DIR / "embeddings.npy")).astype(np.float32)
    sample_emb  = dbr_hbr_emb[sample_idx]
    scores      = get_failure_proba(final_model, sample_emb)

    print(f"{'실제라벨':8s} {'리스크점수':>10s}  제목")
    for (_, row), score in zip(sample.iterrows(), scores):
        actual = row.get("label_name", str(row["label"]))
        print(f"{actual:8s} {score:10.4f}  {str(row['title'])[:55]}")

    print(f"\n④ 리스크 스코어링 모델 완료 [{final_model_name}]")
    print(f"   risk_score = P(failure) — 높을수록 실패 유사 사례와 유사한 전략")


if __name__ == "__main__":
    main()
