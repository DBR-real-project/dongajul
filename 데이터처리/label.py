"""
② 성공/실패/모호 라벨 자동 부여 (동아줄 - AI 전략 리스크 진단 서비스)

입력 : NLP/output/{DBR,HBR}_preprocessed.parquet
출력 : NLP/output/{DBR,HBR}_labeled.parquet

라벨 체계
  0 = 실패 (failure)
  1 = 성공 (success)
  2 = 중립 (neutral)   ← DB 스키마 기준 (neutral → neutral)

처리 단계
  Stage 1) 키워드 규칙 스코어링
           - 성공/실패 키워드 히트 카운트
           - success_ratio = success_hits / (success_hits + failure_hits + ε)
           - ratio ≥ 0.65 AND hits ≥ 3  → 성공
           - ratio ≤ 0.35 AND hits ≥ 3  → 실패
           - 그 외                        → neutral(일단)
  Stage 2) TF-IDF 센트로이드 재분류
           - Stage1에서 확정된 문서로 TF-IDF 행렬 구성
           - 클래스별 평균 벡터(센트로이드) 계산
           - neutral 문서 → 코사인 유사도 높은 쪽으로 재분류 (임계값 이상일 때만)
  출력) label, label_name, success_hits, failure_hits, success_ratio, confidence,
        label_stage ('keyword'/'tfidf'/'neutral')

실행: python NLP/label.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

# ── 성공 키워드 ────────────────────────────────────────────────────────────
# 명사형(NNG/NNP) + 동사 사전형(VV+'다')
SUCCESS_KEYWORDS: set[str] = {
    # 결과/성과 명사
    "성공", "성과", "성장", "혁신", "달성", "도약", "호황", "흑자", "수익", "이익",
    "이윤", "효과", "효율", "우위", "선도", "1위", "극복", "회복", "탁월", "우수",
    "강점", "경쟁력", "가치", "신뢰", "확장", "도전", "기회", "창조", "발전",
    "개선", "향상", "상승", "증가", "급성장", "돌파", "혁신가", "선구자",
    "시장점유율", "매출증가", "영업이익", "영업흑자", "순이익", "투자회수",
    "IPO", "상장", "글로벌확장", "리더십", "베스트프랙티스", "핵심역량",
    # 동사 사전형 (Kiwi가 어간+'다' 형태로 저장)
    "성장하다", "달성하다", "개선하다", "극복하다", "회복하다", "확대하다",
    "성공하다", "발전하다", "향상하다", "확장하다", "앞서다", "이끌다",
    "혁신하다", "창출하다", "선도하다", "도약하다", "돌파하다", "강화하다",
    "실현하다", "증가하다", "성취하다",
}

# ── 실패 키워드 ────────────────────────────────────────────────────────────
FAILURE_KEYWORDS: set[str] = {
    # 결과/위기 명사
    "실패", "위기", "파산", "부도", "적자", "손실", "침체", "하락", "쇠퇴",
    "철수", "폐업", "리콜", "스캔들", "비리", "위험", "취약", "약점",
    "구조조정", "감원", "해고", "폐쇄", "폐지", "위협", "손해", "부진",
    "실적부진", "영업손실", "영업적자", "순손실", "도산", "파탄", "몰락",
    "붕괴", "위축", "후퇴", "감소", "급락", "폭락", "리스크", "함정",
    "과오", "실책", "오판", "문제점", "한계", "장벽", "장애", "역효과",
    "부작용", "부패", "불신", "불투명", "사기", "횡령", "분식", "집단소송",
    # 동사 사전형
    "실패하다", "파산하다", "하락하다", "축소하다", "침체하다", "손실하다",
    "철수하다", "폐업하다", "해고하다", "몰락하다", "붕괴하다", "쇠퇴하다",
    "위축되다", "부도나다", "도산하다", "악화하다", "감소하다",
}


def keyword_score(token_str: str) -> tuple[int, int]:
    """token_str에서 성공/실패 키워드 히트 수 반환."""
    tokens = set(token_str.split())
    s = len(tokens & SUCCESS_KEYWORDS)
    f = len(tokens & FAILURE_KEYWORDS)
    return s, f


def keyword_label(success: int, failure: int) -> tuple[int, str, float]:
    """Stage 1 규칙 기반 라벨 반환. (label, label_stage, confidence)"""
    total = success + failure
    if total == 0:
        return 2, "neutral", 0.0
    ratio = success / total
    if ratio >= 0.65 and success >= 3:
        return 1, "keyword", round(ratio, 4)
    if ratio <= 0.35 and failure >= 3:
        return 0, "keyword", round(1 - ratio, 4)
    return 2, "neutral", round(abs(ratio - 0.5) * 2, 4)


def sbert_relabel(
    df: pd.DataFrame,
    name: str,
    sim_threshold: float = 0.20,
) -> pd.DataFrame:
    """Stage 2: SBERT 임베딩 센트로이드 기반 모호 문서 재분류.

    TF-IDF 대비 장점:
      - 의미 기반 유사도 (sparse bag-of-words 한계 극복)
      - '실패를 극복한 성공' 같은 애매한 문서를 의미 공간에서 더 정확히 분류
      - 정규화된 768차원 벡터 → 내적 = 코사인 유사도
    """
    emb_path = OUT_DIR / f"{name}_embeddings.npy"
    if not emb_path.exists():
        print(f"  [{name}] SBERT 임베딩 없음 → TF-IDF fallback 사용")
        return tfidf_relabel(df, sim_threshold=0.15)

    print(f"  [{name}] SBERT 임베딩 기반 재분류 (threshold={sim_threshold}) ...")
    t0 = time.time()
    embeddings = np.load(str(emb_path)).astype(np.float32)

    # 이미 normalize_embeddings=True로 저장됐으므로 단위벡터
    # 혹시 모르니 재정규화
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True) + 1e-9
    embeddings = embeddings / norms

    confirmed   = df[df["label_stage"] == "keyword"]
    neutral_idx = df[df["label_stage"] == "neutral"].index

    if len(neutral_idx) == 0:
        return df

    success_pos = confirmed[confirmed["label"] == 1].index.tolist()
    failure_pos = confirmed[confirmed["label"] == 0].index.tolist()

    if not success_pos or not failure_pos:
        print(f"  [{name}] 확정 라벨 부족 → TF-IDF fallback")
        return tfidf_relabel(df, sim_threshold=0.15)

    # 클래스 센트로이드 (정규화된 임베딩 평균 → 재정규화)
    centroid_s = embeddings[success_pos].mean(axis=0)
    centroid_f = embeddings[failure_pos].mean(axis=0)
    centroid_s /= (np.linalg.norm(centroid_s) + 1e-9)
    centroid_f /= (np.linalg.norm(centroid_f) + 1e-9)

    # 모호 문서와 센트로이드 코사인 유사도 (= 내적, 정규화 후)
    amb_embs = embeddings[neutral_idx]   # (M, 768)
    sim_s = amb_embs @ centroid_s        # (M,)
    sim_f = amb_embs @ centroid_f        # (M,)

    new_labels     = df["label"].copy()
    new_stages     = df["label_stage"].copy()
    new_confidence = df["confidence"].copy()

    reassigned = 0
    for i, idx in enumerate(neutral_idx):
        if sim_s[i] >= sim_threshold or sim_f[i] >= sim_threshold:
            if sim_s[i] >= sim_f[i]:
                new_labels[idx]     = 1
                new_confidence[idx] = round(float(sim_s[i]), 4)
            else:
                new_labels[idx]     = 0
                new_confidence[idx] = round(float(sim_f[i]), 4)
            new_stages[idx] = "sbert"
            reassigned += 1

    df = df.copy()
    df["label"]       = new_labels
    df["label_stage"] = new_stages
    df["confidence"]  = new_confidence
    print(f"  SBERT 재분류 완료: {reassigned}/{len(neutral_idx)}건 중립→재분류 "
          f"({time.time()-t0:.1f}s)")
    return df


def tfidf_relabel(
    df: pd.DataFrame,
    sim_threshold: float = 0.10,
) -> pd.DataFrame:
    """Stage 2 fallback: TF-IDF 센트로이드 기반 모호 문서 재분류."""
    confirmed = df[df["label_stage"] == "keyword"].copy()
    neutral_idx = df[df["label_stage"] == "neutral"].index

    if len(neutral_idx) == 0:
        return df

    print(f"  TF-IDF 벡터화 ({len(df)}건) ...")
    t0 = time.time()
    vec = TfidfVectorizer(
        max_features=30_000,
        min_df=3,
        max_df=0.85,
        ngram_range=(1, 2),
        sublinear_tf=True,
    )
    tfidf_matrix = vec.fit_transform(df["token_str"])
    print(f"  벡터화 완료 {time.time()-t0:.1f}s, shape={tfidf_matrix.shape}")

    for label_val in (0, 1):
        idx = confirmed[confirmed["label"] == label_val].index
        if len(idx) == 0:
            print(f"  [경고] label={label_val} 확정 문서 없음, 센트로이드 건너뜀")

    success_idx = confirmed[confirmed["label"] == 1].index
    failure_idx = confirmed[confirmed["label"] == 0].index

    centroid_s = np.asarray(tfidf_matrix[success_idx].mean(axis=0))
    centroid_f = np.asarray(tfidf_matrix[failure_idx].mean(axis=0))

    amb_matrix = tfidf_matrix[neutral_idx]
    sim_s = cosine_similarity(amb_matrix, centroid_s).flatten()
    sim_f = cosine_similarity(amb_matrix, centroid_f).flatten()

    new_labels     = df["label"].copy()
    new_stages     = df["label_stage"].copy()
    new_confidence = df["confidence"].copy()

    for i, idx in enumerate(neutral_idx):
        if sim_s[i] >= sim_threshold or sim_f[i] >= sim_threshold:
            if sim_s[i] >= sim_f[i]:
                new_labels[idx]     = 1
                new_confidence[idx] = round(float(sim_s[i]), 4)
            else:
                new_labels[idx]     = 0
                new_confidence[idx] = round(float(sim_f[i]), 4)
            new_stages[idx] = "tfidf"

    df = df.copy()
    df["label"]       = new_labels
    df["label_stage"] = new_stages
    df["confidence"]  = new_confidence
    return df


def process_file(name: str) -> pd.DataFrame:
    src = OUT_DIR / f"{name}_preprocessed.parquet"
    print(f"\n[{name}] 로드: {src}")
    df = pd.read_parquet(src)

    # Stage 1: 키워드 스코어링
    print(f"[{name}] Stage 1 키워드 스코어링 ...")
    scores = [keyword_score(ts) for ts in df["token_str"]]
    df["success_hits"] = [s for s, _ in scores]
    df["failure_hits"] = [f for _, f in scores]
    df["success_ratio"] = df["success_hits"] / (
        df["success_hits"] + df["failure_hits"] + 1e-9
    )

    label_results = [keyword_label(s, f) for s, f in scores]
    df["label"]       = [r[0] for r in label_results]
    df["label_stage"] = [r[1] for r in label_results]
    df["confidence"]  = [r[2] for r in label_results]

    kw_counts = df["label_stage"].value_counts()
    print(f"  키워드 라벨: 성공={kw_counts.get('keyword', 0)}건 중 "
          f"성공={(df['label']==1).sum()} / 실패={(df['label']==0).sum()} / "
          f"모호={(df['label']==2).sum()}")

    # Stage 2: SBERT 임베딩 재분류 (임베딩 없으면 TF-IDF fallback)
    print(f"[{name}] Stage 2 SBERT 재분류 ...")
    df = sbert_relabel(df, name, sim_threshold=0.20)

    final = {
        "성공": (df["label"] == 1).sum(),
        "실패": (df["label"] == 0).sum(),
        "모호": (df["label"] == 2).sum(),
    }
    stage_counts = df["label_stage"].value_counts().to_dict()
    print(f"  최종 라벨: {final}  (출처: {stage_counts})")

    # label_name 컬럼 추가
    df["label_name"] = df["label"].map({0: "failure", 1: "success", 2: "neutral"})

    return df


def main() -> None:
    results = {}
    for name in ("DBR", "HBR", "NAVER"):
        df = process_file(name)
        out = OUT_DIR / f"{name}_labeled.parquet"
        df.to_parquet(out, index=False)
        print(f"[{name}] 저장 완료 → {out}  ({len(df)}건)")
        results[name] = df

    # 전체 요약
    print("\n=== 라벨링 요약 ===")
    for name, df in results.items():
        vc = df["label_name"].value_counts()
        total = len(df)
        stage_vc = df["label_stage"].value_counts().to_dict()
        print(f"[{name}] 총 {total}건 | "
              f"성공 {vc.get('success',0)} ({vc.get('success',0)/total*100:.1f}%) | "
              f"실패 {vc.get('failure',0)} ({vc.get('failure',0)/total*100:.1f}%) | "
              f"모호 {vc.get('neutral',0)} ({vc.get('neutral',0)/total*100:.1f}%) | "
              f"출처: {stage_vc}")

    # ── articles_meta.parquet 라벨 업데이트 ──────────────────────────────
    meta_path = OUT_DIR / "articles_meta.parquet"
    if meta_path.exists():
        meta = pd.read_parquet(meta_path)
        # DBR+HBR 라벨을 meta에 반영 (순서 동일하게 유지됨)
        dbr_hbr = pd.concat(
            [results["DBR"][["label", "label_name"]],
             results["HBR"][["label", "label_name"]]],
            ignore_index=True,
        )
        if len(meta) == len(dbr_hbr):
            meta["label"]      = dbr_hbr["label"].values
            meta["label_name"] = dbr_hbr["label_name"].values
            meta.to_parquet(meta_path, index=False)
            print(f"\narticles_meta.parquet 라벨 업데이트 완료 ({len(meta)}건)")
        else:
            print(f"\n[경고] meta({len(meta)}) ≠ DBR+HBR({len(dbr_hbr)}) — meta 업데이트 스킵")

    print("\n② 라벨링 완료")


if __name__ == "__main__":
    main()
