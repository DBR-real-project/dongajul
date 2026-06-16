"""
articles + article_labels DB 임포트 스크립트

DBR_labeled.parquet + HBR_labeled.parquet
  → MySQL articles 테이블 (title, content, summary, url, source, category, published_at)
  → MySQL article_labels 테이블 (label, confidence)

중복 방지: url 기준 SKIP (재실행 안전)

실행: python 데이터처리/import_articles_to_db.py
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


def import_articles(conn, df: pd.DataFrame) -> None:
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
            # 이미 있으면 article_id만 조회
            cursor.execute("SELECT article_id FROM articles WHERE url = %s", (url,))
            result = cursor.fetchone()
            article_id = result[0] if result else None
            art_skipped += 1
        else:
            title       = _safe_str(row.get("title"),   500)  or ""
            content     = _safe_str(row.get("content"), 60000) or ""
            summary     = _safe_str(row.get("summary"), 2000)
            source      = _safe_str(row.get("source"),  50)
            category    = _safe_str(row.get("category"), 255)
            published_at = _safe_date(row.get("published_date") or row.get("published_at"))

            # article_no: URL MD5 앞 20자 (UNIQUE 보장)
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
        if total % 1000 == 0 and total > 0:
            conn.commit()
            print(f"  ... {total}건 처리 (삽입:{art_inserted} / 스킵:{art_skipped})")

    conn.commit()
    cursor.close()
    print(f"  ✅ articles  : {art_inserted}건 삽입, {art_skipped}건 스킵")
    print(f"  ✅ article_labels: {lbl_inserted}건 삽입")


def main():
    files = [
        ("DBR", OUT_DIR / "DBR_labeled.parquet"),
        ("HBR", OUT_DIR / "HBR_labeled.parquet"),
    ]

    dfs: list[pd.DataFrame] = []
    for source_name, path in files:
        if not path.exists():
            print(f"⚠️  {path.name} 없음 — 스킵")
            continue
        df = pd.read_parquet(path)
        if "source" not in df.columns or df["source"].isna().all():
            df["source"] = source_name
        dfs.append(df)
        print(f"✅ {path.name}: {len(df)}건 로드")

    if not dfs:
        print("❌ 임포트할 parquet 파일이 없습니다.")
        sys.exit(1)

    combined = pd.concat(dfs, ignore_index=True)
    print(f"\n합계: {len(combined)}건")

    if "label_name" in combined.columns:
        print("라벨 분포:")
        print(combined["label_name"].value_counts().to_string())
    else:
        print("⚠️  label_name 컬럼 없음 — label 컬럼 확인 필요")

    print("\nDB 연결 중...")
    conn = connect()
    print("✅ 연결 성공\n")

    print("[1] articles + article_labels 임포트 중...")
    import_articles(conn, combined)

    conn.close()
    print("\n✅ 임포트 완료!")
    print("   InsightDashboard를 새로고침하면 기사 목록과 통계가 표시됩니다.")


if __name__ == "__main__":
    main()
