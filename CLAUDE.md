# 동아줄 — AI 전략 리스크 진단 서비스

DBR 성공/실패 사례 대조분석 기반 전략 리스크 진단 서비스.
사용자가 전략을 입력하면 유사 사례를 찾아 리스크 점수를 산출.
**마감: 2026-06-30**

---

## 확정 기술 스택 (기획서 기준)

| 레이어 | 기술 |
|--------|------|
| Frontend | React + Tailwind CSS + Axios |
| Main Backend | Node.js / Express + JWT Auth |
| Service Backend | FastAPI (Python) |
| **ML Server** | **Sentence-BERT (multilingual) + UMAP + FAISS** |
| Database | MySQL + FAISS Index |
| Auth | Kakao / Naver / Google OAuth |
| Data Pipeline | Selenium/BS4, ~13,000건 |

---

## 데이터 현황

| 파일 | 건수 | 경로 |
|------|------|------|
| DBR_articles.csv | 11,273건 | 크롤링/DBR_articles.csv |
| HBR_articles.csv | 2,062건 | 크롤링/HBR_articles.csv |

컬럼: title, content, url, category, published_date, source, summary

---

## NLP 파이프라인

| 단계 | 내용 | 상태 | 산출물 |
|------|------|------|--------|
| ① 텍스트 전처리 | Kiwi 형태소 분석, 노이즈/불용어 제거 | ✅ 완료 | 데이터처리/output/{DBR,HBR}_preprocessed.parquet |
| ② 성공/실패 라벨링 | 키워드 규칙 + TF-IDF 기반 자동 라벨 부여 | ✅ 완료 | 데이터처리/output/{DBR,HBR}_labeled.parquet |
| ③ Sentence-BERT 임베딩 + FAISS | multilingual 임베딩 생성 → FAISS 인덱스 구축 | ✅ 완료 | 데이터처리/output/embeddings.npy, faiss.index, articles_meta.parquet |
| ④ 리스크 스코어링 | Logistic Regression (class_weight=balanced) | ✅ 완료 | 데이터처리/output/risk_model.pkl |
| ⑤ UMAP + K-means | 2D 좌표 + 클러스터 할당, DB 저장용 | ✅ 완료 | 데이터처리/output/umap_coords.parquet, cluster_info.parquet |

---

## ① 전처리 결과 (완료)

- DBR 11,273건 / HBR 2,062건, 평균 토큰 1,138개 (탈락 없음)
- Kiwi 형태소 분석, 품사 필터(NNG/NNP/VV/VA/SL/XR), 불용어 220개
- 추가 컬럼: clean_text, tokens, token_str, n_tokens
- 스크립트: 데이터처리/preprocess.py

---

## ② 라벨링 결과 (완료, 명칭 수정 예정)

| 소스 | 성공(success) | 실패(failure) | 모호→neutral | 총계 |
|------|-------------|-------------|-------------|------|
| DBR | 9,800 (86.9%) | 532 (4.7%) | 941 (8.3%) | 11,273 |
| HBR | 2,004 (97.2%) | 15 (0.7%) | 43 (2.1%) | 2,062 |

- Stage 1: 키워드 히트 기반 success_ratio (≥0.65 성공 / ≤0.35 실패, min 3히트)
- Stage 2: TF-IDF 센트로이드 코사인 유사도 재분류 (sim_threshold=0.15)
- 라벨값: `success/failure/neutral` (DB 스키마 일치) ✅
- `confidence` 컬럼 저장 완료 (keyword: success_ratio, tfidf: cosine 유사도) ✅
- **클래스 불균형**: 실패 4.7% — ④단계에서 `class_weight='balanced'` 필수
- 스크립트: 데이터처리/label.py

---

## ③ 임베딩 + FAISS 결과 (완료)

- 모델: `paraphrase-multilingual-MiniLM-L12-v2` (384차원, multilingual)
- DBR 11,273 + HBR 2,062 = 13,335건 임베딩, 약 375초
- embeddings.npy: 19MB / faiss.index: 19MB (IndexFlatIP, 코사인 유사도)
- **FAISS 한글 경로 버그**: `faiss.write_index()` C++ 백엔드 한글 경로 미지원
  → 해결: `faiss.serialize_index()` bytes → `Path.write_bytes()` Python으로 저장
- articles_meta.parquet: 검색 결과 반환용 메타데이터 (title/url/summary/category/label 등)
- 스크립트: 데이터처리/embed.py

---

## ④ 리스크 스코어링 결과 (완료)

- 모델: LogisticRegression (C=1.0, class_weight='balanced', max_iter=1000)
- 학습: 12,351건 (neutral 984건 제외), 5-fold stratified CV
- **성능**: CV ROC-AUC=0.8705±0.0093 / Test ROC-AUC=0.9998 / Failure Recall=0.82
- risk_score = P(failure|embedding), 높을수록 실패 유사 사례와 가까운 전략
- 스크립트: 데이터처리/risk_model.py

---

## ⑤ UMAP + K-means 결과 (완료)

- UMAP: n_components=2, n_neighbors=15, min_dist=0.1, metric=cosine, 24초
- K-means: n_clusters=12 (AI/디지털, HR/리더십, 마케팅/브랜드, 해외시장 등 의미있는 분리)
- umap_coords.parquet: title/url/label/umap_x/umap_y/cluster_id (article_vectors 저장용)
- cluster_info.parquet: cluster_id/cluster_name/top_keywords/article_count/center_x/center_y
- 스크립트: 데이터처리/umap_cluster.py

---

## DB 스키마 핵심 테이블 (테이블명세서 기준)

| 테이블 | 주요 컬럼 |
|--------|----------|
| users | user_id, email, password_hash, user_type, subscription_type |
| articles | article_id, article_no(UNIQUE), title, content, summary, url, company_name, industry, strategy_type, published_at, source, category |
| article_labels | label_id, article_id(FK), label(success/failure/neutral), label_method(auto/manual), confidence, created_at |
| article_vectors | vector_id, article_id(FK,UNIQUE), tfidf_vector(JSON), embedding_vector(JSON), umap_x, umap_y, cluster_id(FK) |
| clusters | cluster_id, cluster_name, representative_industry, top_keywords, article_count |
| diagnosis_requests | diagnosis_id, user_id(FK), input_keywords, input_text, industry, status(pending/processing/completed/failed) |
| analysis_results | result_id, diagnosis_id(FK), risk_score, analysis_mode, keywords, improvement |
| similar_article_matches | match_id, result_id(FK), article_id(FK), similarity_score, rank |
| semantic_maps | map_id, 노드 좌표 및 표시 정보 |

---

## 파일 구조

```
실전프로젝트/
├── CLAUDE.md
├── 서류/                        ← 기획서, ERD, 테이블명세서, 시스템아키텍처 등
├── 크롤링/
│   ├── DBR_articles.csv
│   ├── HBR_articles.csv
│   └── naver/                  ← 네이버 API JSON 파일 위치 (친구 데이터 수령 후 여기에)
│       └── naver_전략경영_sample.json  ← 테스트용 샘플 (실제 데이터 오면 삭제)
└── 데이터처리/
    ├── preprocess.py            ← ① DBR/HBR 전처리
    ├── preprocess_naver.py      ← ① 네이버 전처리 (데이터 도착 시 실행)
    ├── label.py                 ← ② 라벨링 (완료)
    ├── stopwords_ko.txt
    └── output/
        ├── DBR_preprocessed.parquet
        ├── HBR_preprocessed.parquet
        ├── DBR_labeled.parquet
        ├── HBR_labeled.parquet
        ├── embeddings.npy              ← ③ 13,335건 384차원 임베딩
        ├── faiss.index                 ← ③ FAISS IndexFlatIP
        ├── articles_meta.parquet       ← ③ 검색 결과용 메타데이터
        ├── risk_model.pkl              ← ④ LogisticRegression (risk_score)
        ├── risk_model_report.txt       ← ④ 성능 리포트
        ├── umap_coords.parquet         ← ⑤ umap_x, umap_y, cluster_id
        ├── cluster_info.parquet        ← ⑤ clusters 테이블용
        └── NAVER_preprocessed.parquet  ← 데이터 도착 후 생성됨
ai_server/
    ├── __init__.py
    ├── main.py              ← FastAPI 앱 (POST /diagnose, GET /health, GET /clusters)
    ├── schemas.py           ← Pydantic 요청/응답 스키마
    └── requirements.txt
```

---

## 환경

- Windows 10, Python, Anaconda
- `PYTHONIOENCODING=utf-8` 필수 / `sys.stdout.reconfigure(encoding="utf-8")` 명시
- 필요 패키지: kiwipiepy, pandas, scikit-learn, sentence-transformers, faiss-cpu, umap-learn

---

## 작업 규칙

- 각 세션 완료 후 CLAUDE.md 최신화
- 다음 세션 시작 시 CLAUDE.md 먼저 읽고 현황 파악
- DB 스키마(테이블명세서)와 NLP 산출물 컬럼명을 일치시킬 것

---

## 현재 상태 (2026-05-19)

**NLP 파이프라인 전체 완료**: ① 전처리 → ② 라벨링 → ③ 임베딩+FAISS → ④ 리스크 모델 → ⑤ UMAP+K-means
**FastAPI ML 서비스 완료**: POST /diagnose, GET /health, GET /clusters (테스트 통과)

**네이버 데이터 수령 시**: 크롤링/naver/ 폴더에 JSON 파일 넣고 아래 두 단계 실행
1. `python 데이터처리/preprocess_naver.py` → NAVER_preprocessed.parquet
2. 필요시 label.py / embed.py 재실행 (NAVER 포함 통합)

**다음 할 일**: MySQL DB 연동
- MySQL에 articles / article_labels / article_vectors / clusters 테이블 INSERT
- ai_server/main.py에 DB 조회 결과 연동
