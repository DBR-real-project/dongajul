"""
HBS 전용 성공/실패/중립 라벨링 파이프라인

기존 label.py는 수정하지 않고,
HBS_preprocessed.parquet만 별도로 라벨링합니다.

입력 : 데이터처리/output/HBS_preprocessed.parquet
출력 : 데이터처리/output/HBS_labeled.parquet

실행: python 데이터처리/label_hbs.py
"""
from __future__ import annotations

import sys

# 기존 label.py의 process_file 함수를 그대로 재사용
from label import OUT_DIR, process_file

sys.stdout.reconfigure(encoding="utf-8")


def main() -> None:
    name = "HBS"

    src = OUT_DIR / "HBS_preprocessed.parquet"
    out = OUT_DIR / "HBS_labeled.parquet"

    if not src.exists():
        raise FileNotFoundError(f"[{name}] 전처리 파일 없음: {src}")

    df = process_file(name)

    df.to_parquet(out, index=False)
    print(f"[{name}] 저장 완료 → {out}  ({len(df)}건)")

    vc = df["label_name"].value_counts()
    total = len(df)
    stage_vc = df["label_stage"].value_counts().to_dict()

    print("\n=== HBS 라벨링 요약 ===")
    print(
        f"[{name}] 총 {total}건 | "
        f"성공 {vc.get('success', 0)} ({vc.get('success', 0) / total * 100:.1f}%) | "
        f"실패 {vc.get('failure', 0)} ({vc.get('failure', 0) / total * 100:.1f}%) | "
        f"모호 {vc.get('neutral', 0)} ({vc.get('neutral', 0) / total * 100:.1f}%) | "
        f"출처: {stage_vc}"
    )

    print("\nHBS 라벨링 완료")


if __name__ == "__main__":
    main()