# 데이터 세팅 가이드 (git clone 후 필독)

git clone만 하면 **코드만 있고 데이터가 없음** — 아래 순서대로 세팅해야 함.

---

## 1. Python 환경 세팅

```bash
# Anaconda 환경 생성 (권장)
conda create -n dongajul python=3.11
conda activate dongajul

# 패키지 설치
pip install -r requirements.txt
```

---

## 2. 데이터 파일 받기

gitignore된 대용량 파일은 **팀 공유 드라이브**에서 받아야 함.

### 2-1. 크롤링 원본 데이터
아래 파일을 해당 경로에 복사:

```
크롤링/DBR_articles.csv          ← DBR 11,273건
크롤링/HBR_articles.csv          ← HBR 2,062건
크롤링/naver/final_news_2023.json ← NAVER 크롤링 데이터
크롤링/naver/final_news_2024.json
크롤링/naver/final_news_2025.json
크롤링/naver/final_news_2026.json
```

### 2-2. 전처리 산출물 (선택 — 파이프라인 직접 실행하지 않을 경우)
`데이터처리/output/` 폴더에 아래 파일 복사:

```
embeddings.npy          ← DBR+HBR 임베딩 (768차원, ~39MB)
DBR_embeddings.npy      ← DBR 전용
HBR_embeddings.npy      ← HBR 전용
NAVER_embeddings.npy    ← NAVER 전용 (~162MB)
faiss.index             ← FAISS 검색 인덱스
articles_meta.parquet   ← 검색 결과 메타데이터
DBR_labeled.parquet
HBR_labeled.parquet
NAVER_labeled.parquet
risk_model.pkl          ← 학습된 리스크 모델
umap_coords.parquet
cluster_info.parquet
```

---

## 3. 파이프라인 직접 실행 (산출물 파일 없을 때)

데이터 파일만 있으면 아래 순서로 전체 재생성 가능:

```bash
# ① 전처리 (DBR/HBR)
python 데이터처리/preprocess.py

# ① 전처리 (NAVER)
python 데이터처리/preprocess_naver.py

# ② 라벨링
python 데이터처리/label.py

# ③ 임베딩 + FAISS (약 20분)
python 데이터처리/embed.py

# ③ NAVER 임베딩 (약 90분)
python 데이터처리/embed_naver.py

# ④ 리스크 모델 학습
python 데이터처리/risk_model.py

# ⑤ UMAP + 클러스터링
python 데이터처리/umap_cluster.py
```

> ⚠️ embed.py, embed_naver.py는 최초 실행 시 HuggingFace에서  
> `jhgan/ko-sroberta-multitask` 모델(약 400MB)을 자동 다운로드합니다.

---

## 4. AI 서버 실행

```bash
cd ai_server
uvicorn main:app --reload --port 8000
```

- `GET  http://localhost:8000/health`
- `POST http://localhost:8000/diagnose`
- `GET  http://localhost:8000/clusters`

---

## 5. 인코딩 주의 (Windows)

```bash
# PowerShell / CMD에서 스크립트 실행 시
set PYTHONIOENCODING=utf-8
python 데이터처리/preprocess.py
```
