#!/bin/bash
set -e

# ─────────────────────────────────────────────────────────
# 동아줄 — NCP 서버 원클릭 배포 스크립트
# 사용법: bash deploy.sh
# ─────────────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "=== [1/5] 최신 코드 pull ==="
git pull origin develop

echo "=== [2/5] .env 파일 확인 ==="
if [ ! -f backend/.env ]; then
  echo "[ERROR] backend/.env 파일이 없습니다."
  echo "        backend/.env.example 을 복사해서 실제 값을 채워주세요:"
  echo "        cp backend/.env.example backend/.env"
  exit 1
fi

echo "=== [3/5] 기존 컨테이너 중지 ==="
docker compose down --remove-orphans

echo "=== [4/5] 이미지 빌드 & 컨테이너 시작 ==="
docker compose build --no-cache
docker compose up -d

echo "=== [5/5] 헬스체크 ==="
echo "잠시 후 서비스가 시작됩니다 (AI 서버 로드 약 60초 소요)..."
sleep 10
docker compose ps

echo ""
echo "======================================"
echo "  배포 완료!"
echo "  프론트엔드: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo "  로그 확인:  docker compose logs -f"
echo "======================================"
