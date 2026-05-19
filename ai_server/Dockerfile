FROM python:3.11-slim

WORKDIR /app

# gcc 필요 (faiss-cpu / numpy 빌드 의존성)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 의존성 먼저 설치 (레이어 캐시 활용)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ai_server 패키지 → /app/ai_server/ 에 배치
# (main.py의 ROOT = parent.parent → /app, OUT_DIR → /app/데이터처리/output)
COPY . ./ai_server/

EXPOSE 8000

CMD ["uvicorn", "ai_server.main:app", "--host", "0.0.0.0", "--port", "8000"]
