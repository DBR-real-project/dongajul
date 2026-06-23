"""
DB 마이그레이션 스크립트

1. strategies 테이블 생성
2. users 테이블에 알림 설정 컬럼 추가 (notif_email / notif_push / notif_marketing)

실행: python 데이터처리/migrate_db.py
"""
from __future__ import annotations
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
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


DDL_STRATEGIES = """
CREATE TABLE IF NOT EXISTS strategies (
    strategy_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT          NOT NULL,
    name          VARCHAR(200) NOT NULL,
    content       TEXT,
    keywords      JSON,
    metrics_conversion  FLOAT NOT NULL DEFAULT 5.0,
    metrics_roi         FLOAT NOT NULL DEFAULT 100,
    metrics_growth      FLOAT NOT NULL DEFAULT 10,
    metrics_cost        FLOAT NOT NULL DEFAULT 1000,
    metrics_engagement  FLOAT NOT NULL DEFAULT 5.0,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
"""

NOTIF_COLUMNS = [
    ("notif_email",     "TINYINT(1) NOT NULL DEFAULT 1"),
    ("notif_push",      "TINYINT(1) NOT NULL DEFAULT 1"),
    ("notif_marketing", "TINYINT(1) NOT NULL DEFAULT 0"),
]


def column_exists(cursor, table: str, column: str) -> bool:
    cursor.execute(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
        (table, column),
    )
    return cursor.fetchone()[0] > 0


def main():
    print("DB 연결 중...")
    conn = connect()
    cursor = conn.cursor()
    print("✅ 연결 성공\n")

    # 1. strategies 테이블
    print("[1] strategies 테이블 생성...")
    cursor.execute(DDL_STRATEGIES)
    conn.commit()
    print("  ✅ strategies 테이블 준비 완료\n")

    # 2. users 알림 컬럼 추가
    print("[2] users 테이블 알림 컬럼 추가...")
    for col, definition in NOTIF_COLUMNS:
        if column_exists(cursor, "users", col):
            print(f"  ⏩ {col} 이미 존재 — 스킵")
        else:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {definition}")
            conn.commit()
            print(f"  ✅ {col} 추가 완료")

    cursor.close()
    conn.close()
    print("\n✅ 마이그레이션 완료!")


if __name__ == "__main__":
    main()
