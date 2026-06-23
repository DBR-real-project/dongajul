"""
HBS articles + article_labels DB 임포트 스크립트

HBS_labeled.parquet (title_ko / summary_ko / content_ko_summary 컬럼)
  → MySQL articles 테이블
  → MySQL article_labels 테이블

중복 방지: url 기준 SKIP (재실행 안전)

실행: python 데이터처리/import_hbs_to_db.py
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

# ── .env 로드 ──────────────────────────────────────────────
env_path = ROOT / "backend" / ".env"
db_config: dict[str, str] = {}
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            db_config[k.strip()] = v.strip()
else:
    print(f"❌ .env 파일 없음: {env_path}")
    sys.exit(1)

try:
    import mysql.connector
except ImportError:
    print("❌ mysql-connector-python 없음\n   pip install mysql-connector-python")
    sys.exit(1)


def connect():
    return mysql.connector.connect(
        host=db_config.get("MYSQL_HOST"),
        port=int(db_config.get("MYSQL_PORT", 3306)),
        user=db_config.get("MYSQL_USER"),
        password=db_config.get("MYSQL_PASSWORD"),
        database=db_config.get("MYSQL_DATABASE"),
    )


def _safe_str(val, max_len: int | None = None) -> str | None:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    if not s:
        return None
    return s[:max_len] if max_len else s


_DATE_RE = __import__('re').compile(r'^\d{4}-\d{2}-\d{2}$')

def _safe_date(val) -> str | None:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()[:10]
    return s if _DATE_RE.match(s) else None


def import_hbs(conn, df: pd.DataFrame) -> None:
    cursor = conn.cursor(buffered=True)

    # 기존 url 목록 캐싱 (재실행 시 중복 방지)
    cursor.execute("SELECT url FROM articles WHERE url IS NOT NULL")
    existing_urls: set[str] = {row[0] for row in cursor.fetchall()}
    print(f"  기존 articles: {len(existing_urls)}건")

    art_inserted = art_skipped = lbl_inserted = 0

    for idx, row in df.iterrows():
        url = _safe_str(row.get("url"), 1000)
        if not url:
            art_skipped += 1
            continue

        # ── articles 삽입 ──────────────────────────────────
        if url in existing_urls:
            cursor.execute("SELECT article_id FROM articles WHERE url = %s", (url,))
            result = cursor.fetchone()
            article_id = result[0] if result else None
            art_skipped += 1
        else:
            # HBS: title_ko 우선, 없으면 title
            title = (
                _safe_str(row.get("title_ko"), 500)
                or _safe_str(row.get("title"), 500)
                or ""
            )
            # HBS: content_ko_summary 우선, 없으면 content
            content = (
                _safe_str(row.get("content_ko_summary"), 60000)
                or _safe_str(row.get("content"), 60000)
                or ""
            )
            # HBS: summary_ko 우선, 없으면 summary
            summary = (
                _safe_str(row.get("summary_ko"), 2000)
                or _safe_str(row.get("summary"), 2000)
            )
            source      = _safe_str(row.get("source"), 50) or "HBS"
            category    = _safe_str(row.get("category"), 255)
            published_at = _safe_date(row.get("published_date") or row.get("published_at"))

            article_no = hashlib.md5(url.encode()).hexdigest()[:20]

            try:
                cursor.execute(
                    """
                    INSERT INTO articles
                        (article_no, title, content, summary, url, source, category, published_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (article_no, title, content, summary, url, source, category, published_at),
                )
                article_id = cursor.lastrowid
                existing_urls.add(url)
                art_inserted += 1
            except Exception as e:
                art_skipped += 1
                article_id = None

        # ── article_labels 삽입 ───────────────────────────
        if article_id:
            cursor.execute(
                "SELECT label_id FROM article_labels WHERE article_id = %s", (article_id,)
            )
            if not cursor.fetchone():
                label_name = _safe_str(row.get("label_name")) or "neutral"
                confidence = float(row.get("confidence") or 0)

                try:
                    cursor.execute(
                        """
                        INSERT INTO article_labels
                            (article_id, label, label_method, confidence)
                        VALUES (%s, %s, 'auto', %s)
                        """,
                        (article_id, label_name, confidence),
                    )
                    lbl_inserted += 1
                except Exception:
                    pass

        total = art_inserted + art_skipped
        if total % 500 == 0 and total > 0:
            conn.commit()
            print(f"  ... {total}건 처리 (삽입:{art_inserted} / 스킵:{art_skipped})")

    conn.commit()
    cursor.close()
    print(f"  ✅ articles  : {art_inserted}건 삽입, {art_skipped}건 스킵")
    print(f"  ✅ article_labels: {lbl_inserted}건 삽입")


def main():
    hbs_path = OUT_DIR / "HBS_labeled.parquet"

    if not hbs_path.exists():
        print(f"❌ {hbs_path.name} 없음")
        print("   먼저 HBS 파이프라인을 실행하세요:")
        print("   1) python 데이터처리/preprocess_hbs.py")
        print("   2) python 데이터처리/label_hbs.py")
        sys.exit(1)

    df = pd.read_parquet(hbs_path)
    print(f"✅ {hbs_path.name}: {len(df)}건 로드")
    print(f"   컬럼: {list(df.columns)}")

    if "label_name" in df.columns:
        print("라벨 분포:")
        print(df["label_name"].value_counts().to_string())
    elif "label" in df.columns:
        print("라벨 분포 (label 컬럼):")
        print(df["label"].value_counts().to_string())

    print("\nDB 연결 중...")
    conn = connect()
    print("✅ 연결 성공\n")

    print("[1] HBS articles + article_labels 임포트 중...")
    import_hbs(conn, df)

    conn.close()
    print("\n✅ HBS 임포트 완료!")


if __name__ == "__main__":
    main()
