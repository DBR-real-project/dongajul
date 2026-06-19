#!/bin/bash
# NCP Ubuntu 22.04 서버 초기 세팅 스크립트
# 사용법: bash server_setup.sh

set -e

echo "=== [1/4] 패키지 업데이트 ==="
apt-get update -y && apt-get upgrade -y

echo "=== [2/4] Docker 설치 ==="
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "=== [3/4] Docker 서비스 시작 ==="
systemctl enable docker
systemctl start docker

echo "=== [4/4] Git 설치 ==="
apt-get install -y git

echo ""
echo "======================================"
echo "  초기 세팅 완료!"
echo "  Docker 버전: $(docker --version)"
echo "  다음 단계: 프로젝트 clone 후 deploy.sh 실행"
echo "======================================"
