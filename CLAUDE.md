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
| NAVER JSON (final_news_*.json) | 55,465건 | 크롤링/naver/ (gitignore됨, 모델학습 전용) |

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

## ④ 리스크 스코어링 결과 (완료 — 개선됨)

- 임베딩: jhgan/ko-sroberta-multitask (768차원, 한국어 특화)
- 라벨링: SBERT 센트로이드 기반 Stage2 재분류 (TF-IDF → SBERT)
- 모델 비교 결과: MLP > LightGBM > XGBoost > LR
- **채택 모델: MLP (hidden=512x128, threshold=0.33)**
- 학습: 68,800건 (DBR+HBR+NAVER), neutral 제외 → 5-fold stratified CV
- **성능**: Test ROC-AUC=0.9771 / Failure Precision=0.71 / Failure Recall=0.87 / F1=0.78
- 이전 대비: Precision 0.36→0.71 (2배), AUC 0.9382→0.9771
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
│       ├── final_news_2023.json  ← NAVER 크롤링 데이터 (gitignore, 모델학습 전용)
│       ├── final_news_2024.json
│       ├── final_news_2025.json
│       ├── final_news_2026.json
│       ├── crawling1.py          ← 크롤링 스크립트
│       └── check_count.py
└── 데이터처리/
    ├── preprocess.py            ← ① DBR/HBR 전처리
    ├── preprocess_naver.py      ← ① 네이버 전처리 (완료)
    ├── embed_naver.py           ← NAVER 전용 SBERT 임베딩 (완료, 모델학습 전용)
    ├── label.py                 ← ② 라벨링 DBR/HBR/NAVER (완료)
    ├── stopwords_ko.txt
    └── output/
        ├── DBR_preprocessed.parquet
        ├── HBR_preprocessed.parquet
        ├── NAVER_preprocessed.parquet  ← 55,465건
        ├── DBR_labeled.parquet
        ├── HBR_labeled.parquet
        ├── NAVER_labeled.parquet       ← success 65.7% / failure 6.0% / neutral 28.2%
        ├── embeddings.npy              ← ③ 13,335건 384차원 임베딩 (DBR+HBR, FAISS용)
        ├── NAVER_embeddings.npy        ← 55,465건 임베딩 (모델학습 전용, FAISS 미포함)
        ├── faiss.index                 ← ③ FAISS IndexFlatIP
        ├── articles_meta.parquet       ← ③ 검색 결과용 메타데이터
        ├── risk_model.pkl              ← ④ LogisticRegression (risk_score)
        ├── risk_model_report.txt       ← ④ 성능 리포트
        ├── umap_coords.parquet         ← ⑤ umap_x, umap_y, cluster_id
        └── cluster_info.parquet        ← ⑤ clusters 테이블용
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

## 현재 상태 (2026-06-05 세션2 — 최종)

**NLP 파이프라인 전체 완료**: ① 전처리 → ② 라벨링 → ③ 임베딩+FAISS → ④ 리스크 모델 → ⑤ UMAP+K-means
**FastAPI ML 서비스 완료**: POST /diagnose, GET /report (GPT RAG), GET /health, GET /clusters
**RAG 완료**: FAISS 유사 사례 검색 → GPT few-shot 리포트 생성 (reporter.py)

---

### 오늘 완료한 작업 (2026-06-05)

**1. 공통 API 유틸 (`frontend/src/app/utils/api.ts`)**
- `apiFetch` 래퍼: Authorization 헤더 자동 첨부
- 401 응답 시 localStorage 클리어 + 자동 로그아웃(reload)
- 전체 컴포넌트에서 `localhost:3001` 하드코딩 → `apiFetch` 교체
  (DiagnosisInterview, DiagnosisResult, SearchHistory, NotificationView, ProfileView, InsightDashboard)

**2. 버그 수정**
- SearchHistory: API 응답 `{success, data:[]}` 파싱 오류 → `json.data` 로 수정
- 회원가입 `alert()` 제거 → 바로 자동 로그인

**3. 시맨틱 맵 UI 완료**
- `SemanticMap.tsx`: Recharts ScatterChart, 성공/실패/중립 색상, 필터, 클러스터 목록
- 백엔드 `semanticMapRepository.js`: `article_vectors` 직접 조회 (success 400 + failure 200 + neutral 200 랜덤 샘플)
- TopNavigation에 '시맨틱 맵' 메뉴 추가
- 진단 결과 화면에 '시맨틱 맵에서 보기' 버튼 추가
- App.tsx에 `semantic-map` 뷰 연결

**4. AI 서버 UMAP 쿼리 포인트**
- `schemas.py`: `DiagnoseResponse`, `ReportResponse`에 `query_umap_x/y` 필드 추가
- `main.py`: top-K 유사 아티클의 umap_x/y 평균 → 쿼리 포인트 근사 좌표 반환
- 진단 결과에서 시맨틱 맵으로 이동 시 ⭐ 포인트 하이라이트

**5. 기타 개선**
- `handleLogout`: userName, 상태 전체 초기화
- `TopNavigation`: `onLogout` prop 연결

---

### ⚠️ 주의사항
- `npm run build`는 VM에서 dist 폴더 권한 오류(EPERM) — Windows에서 `dist` 폴더 삭제 후 빌드
- 코드 자체는 정상 (2234 modules transformed 확인)
- DB에 `article_vectors.umap_x/y` 데이터 있어야 시맨틱 맵 점들 표시됨

### 남은 작업
1. 비밀번호 찾기 이메일 전송 (nodemailer)
2. JWT Refresh Token
3. 기업 구독 결제 플로우