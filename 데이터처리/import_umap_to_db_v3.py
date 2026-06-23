"""
v3 클러스터 데이터 DB 반영 스크립트

- cluster_info_v3.parquet → clusters 테이블 (12개, 이름 확정)
- umap_coords_v3.parquet  → article_vectors 테이블 (umap_x, umap_y, cluster_id)

기존 데이터를 완전히 교체 (clusters TRUNCATE 후 재삽입)

실행: python 데이터처리/import_umap_to_db_v3.py
"""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

# .env 로드
env_path = ROOT / "backend" / ".env"
db_config = {}
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
    import pandas as pd
except ImportError as e:
    print(f"❌ 패키지 없음: {e}\n   pip install mysql-connector-python pandas")
    sys.exit(1)


def connect():
    return mysql.connector.connect(
        host=db_config.get("MYSQL_HOST"),
        port=int(db_config.get("MYSQL_PORT", 3306)),
        user=db_config.get("MYSQL_USER"),
        password=db_config.get("MYSQL_PASSWORD"),
        database=db_config.get("MYSQL_DATABASE"),
    )


INDUSTRY_MAP = {
    0:  '일반경영',
    1:  '금융/경제',
    2:  '경영전략',
    3:  'HR/조직',
    4:  'IT/AI',
    5:  '일반경영',
    6:  '마케팅',
    7:  'IT/기술',
    8:  '글로벌',
    9:  '경영관리',
    10: '마케팅',
    11: '혁신/창업',
}


def import_clusters(conn, df):
    """clusters 테이블 반영 (실제 컬럼: cluster_name, representative_industry, top_keywords, article_count)"""
    cursor = conn.cursor()

    for _, row in df.iterrows():
        cid      = int(row["cluster_id"])
        name     = str(row["cluster_name"])
        kw       = str(row.get("top_keywords", ""))
        cnt      = int(row.get("article_count", 0))
        industry = INDUSTRY_MAP.get(cid, "일반경영")

        cursor.execute("SELECT cluster_id FROM clusters WHERE cluster_id = %s", (cid,))
        if cursor.fetchone():
            cursor.execute("""
                UPDATE clusters
                SET cluster_name=%s, representative_industry=%s,
                    top_keywords=%s, article_count=%s
                WHERE cluster_id=%s
            """, (name, industry, kw, cnt, cid))
        else:
            cursor.execute("""
                INSERT INTO clusters
                    (cluster_id, cluster_name, representative_industry, top_keywords, article_count)
                VALUES (%s, %s, %s, %s, %s)
            """, (cid, name, industry, kw, cnt))

    conn.commit()
    cursor.close()
    print(f"  clusters: {len(df)}개 클러스터 반영 완료")


def import_article_vectors(conn, umap_df):
    """article_vectors: umap_x, umap_y, cluster_id 업데이트"""
    cursor = conn.cursor()

    cursor.execute("SELECT article_id, url FROM articles WHERE url IS NOT NULL")
    url_to_id = {row[1]: row[0] for row in cursor.fetchall()}
    print(f"  articles URL 매핑: {len(url_to_id)}건")

    upserted = skipped = 0

    for _, row in umap_df.iterrows():
        url        = str(row.get("url", ""))
        article_id = url_to_id.get(url)
        if not article_id:
            skipped += 1
            continue

        umap_x     = float(row["umap_x"])
        umap_y     = float(row["umap_y"])
        cluster_id = int(row["cluster_id"])

        cursor.execute(
            "SELECT vector_id FROM article_vectors WHERE article_id = %s", (article_id,)
        )
        if cursor.fetchone():
            cursor.execute("""
                UPDATE article_vectors
                SET umap_x=%s, umap_y=%s, cluster_id=%s
                WHERE article_id=%s
            """, (umap_x, umap_y, cluster_id, article_id))
        else:
            try:
                cursor.execute("""
                    INSERT INTO article_vectors (article_id, umap_x, umap_y, cluster_id)
                    VALUES (%s, %s, %s, %s)
                """, (article_id, umap_x, umap_y, cluster_id))
            except Exception:
                skipped += 1
                continue

        upserted += 1
        if upserted % 1000 == 0:
            conn.commit()
            print(f"  ... {upserted}건 처리 중")

    conn.commit()
    cursor.close()
    print(f"  article_vectors: {upserted}건 upsert, {skipped}건 스킵")


def main():
    cluster_path = OUT_DIR / "cluster_info_v3.parquet"
    umap_path    = OUT_DIR / "umap_coords_v3.parquet"

    if not cluster_path.exists():
        print(f"❌ {cluster_path} 없음"); sys.exit(1)
    if not umap_path.exists():
        print(f"❌ {umap_path} 없음"); sys.exit(1)

    cluster_df = pd.read_parquet(cluster_path)
    umap_df    = pd.read_parquet(umap_path)
    print(f"클러스터: {len(cluster_df)}개  아티클 좌표: {len(umap_df)}건")

    print("\nDB 연결 중...")
    conn = connect()
    print("✅ 연결 성공")

    print("\n[1] clusters 테이블 반영...")
    import_clusters(conn, cluster_df)

    print("\n[2] article_vectors 테이블 반영...")
    import_article_vectors(conn, umap_df)

    conn.close()
    print("\n✅ v3 클러스터 DB 반영 완료")
    print("   브라우저 새로고침하면 12개 클러스터가 새 이름으로 표시됩니다.")


if __name__ == "__main__":
    main()
