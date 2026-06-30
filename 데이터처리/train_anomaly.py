"""
Isolation Forest 이상감지 모델 학습
성공 사례 임베딩으로 "정상 전략 패턴" 학습 → 이탈할수록 리스크 높음

실행:
  python 데이터처리/train_anomaly.py
산출물:
  데이터처리/output/anomaly_model.pkl
"""
import sys
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import normalize

sys.stdout.reconfigure(encoding="utf-8")

OUT_DIR = Path(__file__).resolve().parent / "output"


def main():
    print("[anomaly] 데이터 로드 중...")
    emb = np.load(OUT_DIR / "embeddings.npy").astype(np.float32)
    meta = pd.read_parquet(OUT_DIR / "articles_meta.parquet")

    print(f"  전체: {len(emb):,}건")
    print(f"  레이블 분포: {meta['label'].value_counts().to_dict()}")

    # 성공 사례만 추출 (label == 1)
    success_mask = meta["label"] == 1
    success_idx = meta[success_mask].index.tolist()
    success_emb = normalize(emb[success_idx], norm="l2")
    print(f"  성공 사례: {len(success_emb):,}건 → 학습에 사용")

    # Isolation Forest 학습
    print("[anomaly] Isolation Forest 학습 중...")
    model = IsolationForest(
        n_estimators=300,
        contamination=0.05,   # 전체의 5%를 이상치로 가정
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(success_emb)
    print("  학습 완료")

    # 정규화 기준값 계산
    train_scores = model.score_samples(success_emb)
    mean_score = float(np.mean(train_scores))
    std_score  = float(np.std(train_scores))
    p1  = float(np.percentile(train_scores, 1))
    p5  = float(np.percentile(train_scores, 5))
    p50 = float(np.percentile(train_scores, 50))
    p95 = float(np.percentile(train_scores, 95))
    print(f"  score 통계: mean={mean_score:.4f} std={std_score:.4f}")
    print(f"  percentile: p1={p1:.4f} p5={p5:.4f} p50={p50:.4f} p95={p95:.4f}")

    # 실패 사례 테스트
    fail_mask = meta["label"] == 0
    fail_idx = meta[fail_mask].index.tolist()
    if fail_idx:
        fail_emb = normalize(emb[fail_idx], norm="l2")
        fail_scores = model.score_samples(fail_emb)
        print(f"  실패 사례 평균 score: {fail_scores.mean():.4f}  (낮을수록 이상치)")
        print(f"  성공 사례 평균 score: {train_scores.mean():.4f}")

    # 저장
    payload = {
        "model": model,
        "mean_score": mean_score,
        "std_score":  std_score,
        "p5":  p5,
        "p95": p95,
        # 하위 호환용
        "p1": p1,
        "p50": p50,
    }
    out_path = OUT_DIR / "anomaly_model.pkl"
    with open(out_path, "wb") as f:
        pickle.dump(payload, f)
    print(f"[anomaly] 저장 완료: {out_path}")


if __name__ == "__main__":
    main()
