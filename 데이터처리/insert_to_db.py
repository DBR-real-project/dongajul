# -*- coding: utf-8 -*-
"""
NLP 산출물 → MySQL INSERT 스크립트

실행 순서:
  1. clusters       (12행)
  2. articles       (13,335행 — DBR 11,273 + HBR 2,062)
  3. article_labels (13,335행)
  4. article_vectors(13,335행 — umap_x/y, cluster_id)

실행 전 .env 파일에 아래 항목이 있어야 합니다:
  MYSQL_HOST / MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE / MYSQL_PORT
"""
from __future__ import annotations

import os, sys, re
sys.stdout.reconfigure(encoding="utf-8")

import pymysql
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── 경로 ──────────────────────────────────────────────────────────────────────
ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

# ── DB 연결 ───────────────────────────────────────────────────────────────────
def get_conn():
    return pymysql.connect(
        host     = os.getenv("MYSQL_HOST",     "localhost"),
        user     = os.getenv("MYSQL_USER",     "root"),
        password = os.getenv("MYSQL_PASSWORD", ""),
        database = os.getenv("MYSQL_DATABASE", "dongajul"),
        port     = int(os.getenv("MYSQL_PORT", "3306")),
        charset  = "utf8mb4",
        autocommit = False,
    )

# ── 유틸 ──────────────────────────────────────────────────────────────────────
def extract_article_no(url: str, fallback: int) -> int:
    """DBR URL에서 article_no 추출. 없으면 fallback(HBR용 순번) 사용."""
    m = re.search(r"article_no/(\d+)", str(url))
    return int(m.group(1)) if m else fallback


def batch_insert(cursor, sql: str, rows: list, batch_size: int = 500):
    total = len(rows)
    for i in range(0, total, batch_size):
        chunk = rows[i:i + batch_size]
        cursor.executemany(sql, chunk)
        print(f"  → {min(i + batch_size, total):,} / {total:,}")


# ── 1. clusters ───────────────────────────────────────────────────────────────
def insert_clusters(conn):
    print("\n[1/4] clusters 삽입 중...")
    df = pd.read_parquet(OUT_DIR / "cluster_info.parquet")

    sql = """
        INSERT IGNORE INTO clusters
            (cluster_id, cluster_name, representative_industry, top_keywords, article_count)
        VALUES (%s, %s, %s, %s, %s)
    """
    rows = []
    for _, row in df.iterrows():
        rows.append((
            int(row["cluster_id"]),
            str(row.get("cluster_name", f"cluster_{int(row['cluster_id']):02d}")),
            None,                                # representative_industry (미정)
            str(row.get("top_keywords", "")),
            int(row.get("article_count", 0)),
        ))

    with conn.cursor() as cur:
        batch_insert(cur, sql, rows)
    conn.commit()
    print(f"  ✅ clusters {len(rows)}행 완료")


# ── 2 & 3 & 4. articles + labels + vectors ───────────────────────────────────
def insert_articles(conn):
    print("\n[2-4/4] articles / article_labels / article_vectors 삽입 중...")

    # DBR + HBR labeled 파일 (content 포함)
    dbr = pd.read_parquet(OUT_DIR / "DBR_labeled.parquet")
    hbr = pd.read_parquet(OUT_DIR / "HBR_labeled.parquet")

    # umap 좌표 (umap_x, umap_y, cluster_id 포함)
    umap = pd.read_parquet(OUT_DIR / "umap_coords.parquet")

    # url 기준으로 umap 데이터 join
    umap_dict = {
        str(row["url"]): {
            "umap_x":    float(row["umap_x"]),
            "umap_y":    float(row["umap_y"]),
            "cluster_id": int(row["cluster_id"]),
        }
        for _, row in umap.iterrows()
    }

    all_df = pd.concat([dbr, hbr], ignore_index=True)

    # HBR article_no용 fallback 카운터 (DBR URL에 없으므로 음수 순번)
    hbr_counter = -1

    art_rows  = []
    lbl_rows  = []
    vec_rows  = []

    for _, row in all_df.iterrows():
        url        = str(row.get("url", "") or "")
        title      = str(row.get("title", "") or "")[:500]
        content    = str(row.get("content", "") or "")
        summary    = str(row.get("summary", "") or "")[:2000]
        category   = str(row.get("category", "") or "")[:100]
        source     = str(row.get("source", "") or "")[:50]
        pub_date   = str(row.get("published_date", "") or "")[:50] or None
        label_name = str(row.get("label_name", "neutral"))
        confidence = float(row.get("confidence", 0.0))

        # article_no 추출
        art_no = extract_article_no(url, hbr_counter)
        if art_no < 0:
            hbr_counter -= 1

        art_rows.append((
            art_no,    # article_no (UNIQUE)
            title,
            content,
            summary,
            url[:1000],
            None,      # company_name
            None,      # industry
            None,      # strategy_type
            pub_date,
            source,
            category,
        ))

        lbl_rows.append((
            art_no,        # article_no (임시 FK 매핑용, 후처리에서 article_id로 교체)
            label_name,
            "auto",
            confidence,
        ))

        coord = umap_dict.get(url)
        vec_rows.append((
            art_no,
            coord["umap_x"]    if coord else None,
            coord["umap_y"]    if coord else None,
            coord["cluster_id"] if coord else None,
        ))

    # ── articles INSERT ───────────────────────────────────────────────────────
    art_sql = """
        INSERT IGNORE INTO articles
            (article_no, title, content, summary, url,
             company_name, industry, strategy_type, published_at, source, category)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    print("  articles 삽입...")
    with conn.cursor() as cur:
        batch_insert(cur, art_sql, art_rows)
    conn.commit()
    print(f"  ✅ articles {len(art_rows):,}행 완료")

    # ── article_id 매핑 (article_no → article_id) ─────────────────────────────
    # article_no 컬럼이 VARCHAR이므로 str로 통일해서 매핑
    print("  article_id 매핑 조회 중...")
    with conn.cursor() as cur:
        cur.execute("SELECT article_id, article_no FROM articles")
        id_map = {str(row[1]): row[0] for row in cur.fetchall()}  # {str(article_no): article_id}

    # ── article_labels INSERT ─────────────────────────────────────────────────
    lbl_sql = """
        INSERT IGNORE INTO article_labels
            (article_id, label, label_method, confidence)
        VALUES (%s, %s, %s, %s)
    """
    mapped_lbl = [
        (id_map[str(r[0])], r[1], r[2], r[3])
        for r in lbl_rows if str(r[0]) in id_map
    ]
    print("  article_labels 삽입...")
    with conn.cursor() as cur:
        batch_insert(cur, lbl_sql, mapped_lbl)
    conn.commit()
    print(f"  ✅ article_labels {len(mapped_lbl):,}행 완료")

    # ── article_vectors INSERT ────────────────────────────────────────────────
    vec_sql = """
        INSERT IGNORE INTO article_vectors
            (article_id, umap_x, umap_y, cluster_id)
        VALUES (%s, %s, %s, %s)
    """
    mapped_vec = [
        (id_map[str(r[0])], r[1], r[2], r[3])
        for r in vec_rows if str(r[0]) in id_map
    ]
    print("  article_vectors 삽입...")
    with conn.cursor() as cur:
        batch_insert(cur, vec_sql, mapped_vec)
    conn.commit()
    print(f"  ✅ article_vectors {len(mapped_vec):,}행 완료")


# ── 검증 ──────────────────────────────────────────────────────────────────────
def verify(conn):
    print("\n[검증] 테이블별 행 수 확인")
    tables = ["clusters", "articles", "article_labels", "article_vectors"]
    with conn.cursor() as cur:
        for t in tables:
            cur.execute(f"SELECT COUNT(*) FROM {t}")
            cnt = cur.fetchone()[0]
            print(f"  {t:<20}: {cnt:,}행")


# ── 메인 ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("DB 연결 중...")
    try:
        conn = get_conn()
        print("✅ DB 연결 성공\n")
    except Exception as e:
        print(f"❌ DB 연결 실패: {e}")
        sys.exit(1)

    try:
        insert_clusters(conn)
        insert_articles(conn)
        verify(conn)
        print("\n🎉 전체 INSERT 완료!")
    except Exception as e:
        conn.rollback()
        print(f"\n❌ 오류 발생 (롤백됨): {e}")
        raise
    finally:
        conn.close()
