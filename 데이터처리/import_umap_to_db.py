"""
UMAP 좌표 및 클러스터 정보를 DB에 임포트하는 스크립트.

시맨틱 맵 기능을 위해 아래 테이블에 데이터를 채웁니다:
  - clusters        : cluster_info.parquet → 클러스터 이름/키워드/중심좌표
  - article_vectors : umap_coords.parquet  → article별 umap_x, umap_y, cluster_id

실행:
  python 데이터처리/import_umap_to_db.py

필수 파일:
  - 데이터처리/output/umap_coords.parquet
  - 데이터처리/output/cluster_info.parquet
  - backend/.env (DB 접속 정보)
"""
import sys
import os
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "데이터처리" / "output"

# .env 파일에서 DB 설정 로드
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
    print(f"❌ 필수 패키지 없음: {e}")
    print("   pip install mysql-connector-python pandas")
    sys.exit(1)


def connect():
    return mysql.connector.connect(
        host=db_config.get("MYSQL_HOST"),
        port=int(db_config.get("MYSQL_PORT", 3306)),
        user=db_config.get("MYSQL_USER"),
        password=db_config.get("MYSQL_PASSWORD"),
        database=db_config.get("MYSQL_DATABASE"),
        charset="utf8mb4",
    )


def import_clusters(conn, cluster_df):
    """cluster_info.parquet → clusters 테이블"""
    cursor = conn.cursor()
    inserted = 0
    updated = 0

    for _, row in cluster_df.iterrows():
        cluster_id = int(row["cluster_id"])
        cluster_name = str(row.get("cluster_name", f"클러스터{cluster_id}"))
        top_keywords = str(row.get("top_keywords", ""))
        article_count = int(row.get("article_count", 0))
        center_x = float(row.get("center_x", 0.0)) if "center_x" in row else None
        center_y = float(row.get("center_y", 0.0)) if "center_y" in row else None

        # 이미 있으면 UPDATE, 없으면 INSERT
        cursor.execute("SELECT cluster_id FROM clusters WHERE cluster_id = %s", (cluster_id,))
        exists = cursor.fetchone()

        if exists:
            cursor.execute("""
                UPDATE clusters
                SET cluster_name = %s, top_keywords = %s, article_count = %s,
                    center_x = %s, center_y = %s
                WHERE cluster_id = %s
            """, (cluster_name, top_keywords, article_count, center_x, center_y, cluster_id))
            updated += 1
        else:
            try:
                cursor.execute("""
                    INSERT INTO clusters (cluster_id, cluster_name, top_keywords, article_count, center_x, center_y)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (cluster_id, cluster_name, top_keywords, article_count, center_x, center_y))
                inserted += 1
            except Exception as e:
                print(f"  ⚠️  cluster_id={cluster_id} 삽입 실패: {e}")

    conn.commit()
    cursor.close()
    print(f"  clusters: {inserted}개 삽입, {updated}개 업데이트")


def import_article_vectors(conn, umap_df):
    """umap_coords.parquet → article_vectors 테이블 (umap_x, umap_y, cluster_id)"""
    cursor = conn.cursor()

    # URL → article_id 매핑 가져오기
    cursor.execute("SELECT article_id, url FROM articles WHERE url IS NOT NULL")
    url_to_id = {row[1]: row[0] for row in cursor.fetchall()}
    print(f"  articles 테이블: {len(url_to_id)}건 URL 로드")

    upserted = 0
    skipped = 0

    for _, row in umap_df.iterrows():
        url = str(row.get("url", ""))
        article_id = url_to_id.get(url)
        if not article_id:
            skipped += 1
            continue

        umap_x = float(row["umap_x"])
        umap_y = float(row["umap_y"])
        cluster_id = int(row["cluster_id"]) if "cluster_id" in row else None

        # article_vectors에 이미 있는지 확인
        cursor.execute(
            "SELECT vector_id FROM article_vectors WHERE article_id = %s",
            (article_id,)
        )
        exists = cursor.fetchone()

        if exists:
            cursor.execute("""
                UPDATE article_vectors
                SET umap_x = %s, umap_y = %s, cluster_id = %s
                WHERE article_id = %s
            """, (umap_x, umap_y, cluster_id, article_id))
        else:
            try:
                cursor.execute("""
                    INSERT INTO article_vectors (article_id, umap_x, umap_y, cluster_id)
                    VALUES (%s, %s, %s, %s)
                """, (article_id, umap_x, umap_y, cluster_id))
            except Exception as e:
                skipped += 1
                continue

        upserted += 1
        if upserted % 1000 == 0:
            conn.commit()
            print(f"  ... {upserted}건 처리 중")

    conn.commit()
    cursor.close()
    print(f"  article_vectors: {upserted}건 upsert, {skipped}건 스킵 (URL 매핑 없음)")


def main():
    cluster_path = OUT_DIR / "cluster_info.parquet"
    umap_path = OUT_DIR / "umap_coords.parquet"

    if not cluster_path.exists():
        print(f"❌ {cluster_path} 없음")
        sys.exit(1)
    if not umap_path.exists():
        print(f"❌ {umap_path} 없음")
        sys.exit(1)

    print("[1] Parquet 파일 로드 중...")
    cluster_df = pd.read_parquet(cluster_path)
    umap_df = pd.read_parquet(umap_path)
    print(f"  cluster_info: {len(cluster_df)}개 클러스터")
    print(f"  umap_coords:  {len(umap_df)}개 아티클 좌표")

    print("\n[2] DB 연결 중...")
    conn = connect()
    print("  ✅ 연결 성공")

    print("\n[3] clusters 테이블 임포트...")
    import_clusters(conn, cluster_df)

    print("\n[4] article_vectors 테이블 임포트 (umap_x/y/cluster_id)...")
    import_article_vectors(conn, umap_df)

    conn.close()
    print("\n✅ 임포트 완료! 시맨틱 맵을 새로고침하면 데이터가 표시됩니다.")


if __name__ == "__main__":
    main()
