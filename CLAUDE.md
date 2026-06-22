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
| HBS_articles.csv | 2,116건 | 크롤링/HBS_articles.csv (HBS Working Knowledge, 영어) |
| HBS_articles_ko.csv | 2,116건 | 크롤링/HBS_articles_ko.csv (title_ko/summary_ko/content_ko_summary 포함) |
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
        ├── umap_coords.parquet         ← ⑤ 구버전 (보존)
        ├── cluster_info.parquet        ← ⑤ 구버전 (보존)
        ├── umap_coords_v3.parquet      ← ⑤-v3 최신 (cluster_id 1-12, ai_server 로드)
        └── cluster_info_v3.parquet     ← ⑤-v3 최신 (12개 주제 클러스터, DB 반영 완료)
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

## 현재 상태 (2026-06-22 세션21 — AI 리포트 컨설팅 UI + PDF 저장 + 시맨틱맵 가시성 개선)

**HBS 크롤링 완료 (세션10)**: 2,116건 수집 → HBS_articles_ko.csv (title_ko/summary_ko/content_ko_summary 한국어 번역 전체 완료, 실패 0건)
**NLP 파이프라인 전체 완료**: ① 전처리 → ② 라벨링 → ③ 임베딩+FAISS → ④ 리스크 모델 → ⑤ UMAP+K-means
**v3 클러스터 완료**: 768차원 K-means → 12개 주제 기반 클러스터, DB 반영 완료 (cluster_id 1-12)
**FastAPI ML 서비스 완료**: POST /diagnose, POST /report (GPT RAG), POST /diagnose/global (HBS 해외 사례), GET /health, GET /clusters
**RAG 완료**: FAISS 유사 사례 검색 → GPT few-shot 리포트 생성 (reporter.py)
**JWT Refresh Token 완료**: Access 15분 / Refresh 7일, 자동 재발급
**카카오 로그인 복구 완료**: charset 버그 + JWT fallback 처리
**프론트엔드 전체 API 연동 완료**: 모든 화면 apiFetch 기반 연동, alert→toast 교체, AI 면책 문구 추가
**전체 오류검사 완료 (세션7~8)**: 7개 버그 수정
**3가지 기획 기능 구현 완료 (세션9)**:
- ① 리스크 스코어 3-factor 고도화: model(35%) + case(45%,신뢰도 가중) + cluster(20%) × reliability 보정
- ② GPT 리포트 전문화: strategy_analysis + risk_details + framework_insight 섹션 추가
- ③ 비즈니스 전략 프레임워크 KB: 12개 프레임워크(Porter/블루오션/린스타트업 등) SBERT 임베딩 → 관련 프레임워크 자동 주입
**HBS 해외모드 완료 (세션11)**: DiagnosisResult 하단 "해외에서는 어떤 사례가 있을까요?" 버튼 → `/api/diagnose/global` → ai_server HBS 전용 FAISS → 5개 영문 사례 인디고 카드 표시
**기사 비교 기능 실제 구현 완료 (세션11)**: CompareView 하드코딩(전환율/ROI/성장률) → 실제 데이터 기반 차트로 전면 교체
- 바 차트: 리스크지수 / 정보신뢰도(출처별) / 사례최신성(발행연도) (0-100)
- 레이더 차트: 전략성공도 / 정보신뢰도 / 최신성 / 리스크수준 / 내용충실도 (5개 차원)
- 테이블: 출처·발행일·원문링크 추가
- handleInsightCompare: label→한국어 status 변환 버그 수정 (success→성공, failure→실패)
- LoginScreen: 비밀번호 찾기 버튼 제거
**인사이트 대시보드 4개 차트 완료 (세션12)**: `/api/articles/stats` 확장 + InsightDashboard 차트 섹션 추가
- 파이차트: 성공·실패·기타 비율 (PieChart 도넛형)
- 가로 바차트: 카테고리별 성공·실패 분포 (상위 8개)
- 라인차트: 연도별 사례 트렌드 (2015~2026)
- 가로 바차트: Top5 성공·실패 카테고리 복합 (articles DB에 데이터 있을 때만 표시)
**DiagnosisResult 키워드 맵 완료 (세션12)**: 유사 사례의 카테고리+키워드 빈도 집계 → 크기별 CSS 태그 클라우드 ("전략 키워드 맵" 섹션)

**세션13 완료**: strategies 테이블 생성 + StrategyWorkspace 백엔드 정상화, 알림 설정 GET/PATCH API + ProfileView 토글 UI, NAVER 트렌드 컨텍스트 추출(23개 카테고리) + ai_server 주입, reporter.py few-shot 예시 내 `'우리 서비스'` 미이스케이프 SyntaxError 수정

**세션14 완료**: 기사 비교 6차원 GPT 스코어링 + 플로팅 비교 버튼 + AI 챗 ChatGPT 스타일 전면 개편

**세션15 완료**: 진단이력 불러오기 버그 수정 (INNER→LEFT JOIN + 에러 UI), 전체 코드 버그 검수 8개 수정, NCP Docker 배포 설정 구축 (frontend Dockerfile/nginx.conf + docker-compose 전면 개편 + deploy.sh)

**세션21 완료**: AI 리포트 컨설팅 문서 UI 재설계 + PDF 저장 + 시맨틱맵 가시성 전면 개선 (항목 65~67 참고)

---

### 세션21 완료 (2026-06-22) — AI 리포트 컨설팅 UI + PDF + 시맨틱맵 가시성

**65. AI 리포트 컨설팅 문서 UI 재설계 (`frontend/src/app/components/DiagnosisResult.tsx`)**
- 기존: 카드가 나열된 앱 느낌 UI
- 신규: 넘버링 섹션(01/02/03) 기반 컨설팅 리포트 문서 스타일
  - 리포트 헤더: 동아줄 브랜딩 + 날짜 + [PDF 저장] 버튼 (인디고)
  - Executive Summary: 종합 평가 + 최종 판정 통합 (네이비 배경 박스)
  - `01` 전략 구조 분석: 파란 좌측 보더 박스
  - `02` 주요 리스크 요인: HIGH/MED 배지 + 심층 분석 텍스트
  - `03` 전략 개선 제언: 번호 서클 버튼 리스트
  - 전략 프레임워크 관점: 앰버 하이라이트 박스
  - 리포트 푸터: 데이터 출처 + 면책 문구

**66. PDF 저장 기능 (`frontend/src/app/components/DiagnosisResult.tsx`)**
- jsPDF + html2canvas 설치 (동적 import, 초기 번들 영향 없음)
- A4 다중 페이지 지원: 리포트 div → canvas 캡처 → JPEG → PDF
- 파일명: `동아줄_전략리스크진단리포트_YYYY-MM-DD.pdf`

**67. reporter.py temperature 0.3 → 0.5**
- 리스크 요인 다양성 개선 (기존 유사 패턴 반복 문제)

**68. 시맨틱맵 가시성 전면 개선 (`frontend/src/app/components/SemanticMap.tsx`)**
- 클러스터 레이블: 상위3 + 활성 + 줌1.6+ → **전체 12개 상시 표시**
- 레이블 이름 truncation 12→15자, 글자 크기 10→11px(활성), 필 높이 30→32-36px
- 레이블 배경 불투명도 증가 + 외곽 glow 레이어 추가
- 클러스터 hull fill: 0.04~0.15 → 0.07~0.22 (더 선명한 경계)
- hull stroke: 0.42~0.55 → 0.58~1.0 (경계선 진하게)
- 중립 점: 반지름 1.8→2.3, 투명도 0.13→0.22
- 성공 점: 반지름 2.6→3.2 (기본), 불투명도 0.42→0.55
- 실패율 서브텍스트 폰트 크기 9→10px, 위험 등급 font-weight 700

---

### 세션17 완료 (2026-06-19) — SemanticMap D3 전면 재설계

**54. SemanticMap ECharts → D3.js Canvas+SVG 하이브리드 전면 교체 (`frontend/src/app/components/SemanticMap.tsx`)**
- 기존: `ReactECharts` (echarts-for-react) 스캐터 차트 — 클러스터 레이블 겹침, 가독성 불량
- 신규: D3.js v7 Canvas+SVG 하이브리드 (`D3Map` 컴포넌트)
  - **Canvas** (points layer): 15,000+ 점을 canvas로 고성능 렌더링
    - neutral=슬레이트(반투명), success=에메랄드(필터 활성시 선명), failure=빨강+방사형 glow 효과
    - query point=황금색+glow 강조
  - **SVG** (hull/label layer): 클러스터 경계 + 레이블을 SVG로 렌더링
    - `d3.polygonHull()` → 각 클러스터의 convex hull 다각형 (inflate 22px 여백)
    - 클러스터 실패율에 따라 경계선 색상 자동 분기: 빨강(≥25%)/주황(≥12%)/인디고(안전)
    - Pill 형태 레이블: 클러스터명 + 실패율 서브텍스트 (배경 사각형+테두리)
    - 쿼리 포인트: 3중 ripple 링 + "⭐ 내 전략 위치" 황금 라벨
  - **Transparent overlay div** (mouse events): mousemove/click 전용
  - `d3.zoom()` pan/zoom — 줌 시 canvas 재드로 + SVG group transform만 갱신 (SVG 풀 재렌더 없음)
  - `d3.quadtree()` 호버 최근접점 탐색 (scale-space, 14/k px threshold)
  - ResizeObserver로 width 동적 대응, scale 재계산 시 zoom 리셋
  - 줌 컨트롤 버튼 (+/−/↺), 우하단 고정
  - 범례 (성공/실패/중립 + 조작법 힌트), 좌하단 고정
  - 툴팁: 절대위치 div, label색상+제목+카테고리·출처+클릭이동 안내
- renderCanvas ref 패턴으로 zoom handler에서 항상 최신 함수 참조 (zoom 재셋업 방지)
- ECharts 전용 useMemo 6개 제거, `handleChartClick`/`onEvents` 제거
- `import ReactECharts from 'echarts-for-react'` → `import * as d3 from 'd3'`
- Vite 빌드 확인: `✓ built in 5.54s` (TypeScript 에러 0)

---

### 세션18 완료 (2026-06-19) — 브라우저 뒤로/앞으로 가기 + 시맨틱맵 하이라이트

**55. 브라우저 뒤로/앞으로 가기 History API 연동 (`frontend/src/app/App.tsx`)**
- 기존: React state(`currentView`)만 관리 → URL 항상 `localhost:3000/` → Chrome 뒤로/앞으로 가기 무동작
- 신규: `window.history.pushState` + `popstate` 이벤트 기반 SPA 라우팅
  - `VIEW_PATHS` 매핑: ViewType → URL 경로 (`dashboard→/`, `analysis→/analysis`, `risk→/risk` 등 14개)
  - `PATH_TO_VIEW` 역방향 매핑: URL 경로 → ViewType (새로고침·직접 URL 접근 초기화용)
  - `currentView` 초기값을 `window.location.pathname`에서 결정 (새로고침 시 올바른 뷰 복원)
  - `popstate` 리스너: Chrome 뒤로/앞으로 버튼 클릭 시 `e.state.view`로 `setCurrentView` 업데이트
  - `navigateTo(view)`: `pushState({ view, depth: depth+1 })` → URL 변경 + React state 동시 업데이트
  - `navigateBack(fallback)`: `depth > 0`이면 `window.history.back()`, depth=0이면 fallback replaceState
  - `depth` 필드를 history state에 저장해 "뒤로 갈 항목 있음" 판단 (CSS state XSS 안전)
  - 탭 전환(`handleTabChange`): `pushState({ view, depth: 0 })` — 탭은 최상위라 depth 0 리셋
  - 로그인/회원가입/로그아웃/소셜콜백: `replaceState({ view:'dashboard', depth:0 }, '', '/')` 적용
  - JSX의 bare `setCurrentView('risk')` 등 → `navigateTo('risk')` 전면 교체
  - `navStack` state 완전 제거 (브라우저가 스택 관리하므로 불필요)
- Vite dev server가 404 경로에 자동으로 `index.html` 반환 (historyApiFallback 불필요)
- nginx.conf는 이미 `try_files $uri $uri/ /index.html` 설정돼 있어 그대로 사용

---

### 세션19 완료 (2026-06-19) — 시맨틱맵 하이라이트 근본 수정 + 진단이력 전체 데이터

**57. 진단이력 삭제 기능 (`SearchHistory.tsx`, `diagnoseController.js`, `diagnoseRoutes.js`)**
- 각 이력 카드에 휴지통 버튼 추가 (hover 시 표시)
- `DELETE /api/diagnose/:id` — 소유권 체크 + `similar_article_matches → analysis_results → diagnosis_requests` cascade 삭제
- 삭제 중 카드 반투명 + 클릭 차단, 성공 시 목록 즉시 갱신

**58. 시맨틱맵 하이라이트 근본 수정 (`App.tsx`, `SemanticMap.tsx`)**
- **버그 원인**: ai_server `/semantic-map`이 반환하는 `id`는 DataFrame 행 인덱스(0,1,2...)로 DB `article_id`와 완전 다름 → `points.find(p => p.article_id === highlightArticleId)` 항상 실패
- **InsightDashboard → 시맨틱맵**: `article_vectors` JOIN으로 가져온 `umap_x/y`를 `semanticQueryPoint`에 직접 설정 (article_id 룩업 제거)
- **히스토리 → 시맨틱맵**: `onSemanticMap` 콜백 타입 변경 → `DiagnosisResult`가 로컬 `data.query_umap_x/y`를 좌표로 전달
- SemanticMap의 `queryPoint` prop을 단순화: `semanticQueryPoint` 하나만 사용 (복잡한 삼항 제거)
- 직접 진단 시 `navigateToResult`에서도 `semanticQueryPoint` 즉시 저장

**59. 진단이력 전체 데이터 보존 (DB 마이그레이션 + 백엔드 + 프론트)**
- `analysis_results` 테이블 컬럼 추가: `query_umap_x FLOAT, query_umap_y FLOAT, query_cluster_id INT, report_json MEDIUMTEXT`
- `backend/scripts/migrate_analysis_columns.js` 실행 완료
- `saveToDb`: 위 4개 컬럼 저장 (`aiData.report → JSON.stringify`)
- `getDiagnoseById`: `report_json` 파싱해 `report` 객체 반환, `query_umap_x/y/cluster_id` 포함
- `DiagnosisReport` 인터페이스: `strategy_analysis, risk_details[], framework_insight` 필드 추가
- 히스토리에서 불러올 때 GPT 리포트 전체 (종합평가/리스크요인/개선제언/판정/전략분석/프레임워크) 표시

**56. 시맨틱맵 하이라이트 완전 재설계 (`App.tsx`, `SemanticMap.tsx`)**
- 기존 방식: DB의 `umap_x/umap_y` 컬럼에 의존 → HBS 기사(2,116건)는 article_vectors 없어 항상 null
- 신규 방식: SemanticMap이 ai_server에서 로드한 13,335건 UMAP 포인트 내에서 `article_id`로 직접 검색
  - 정확 좌표 우선순위: ① 진단결과 query_umap_x/y ② article_id 검색 ③ cluster_id 센터 폴백
  - `effectiveQueryPoint` useMemo: queryPoint > article_id lookup > cluster center 순서
  - App.tsx: `semanticHighlightArticleId` / `semanticHighlightClusterId` state 추가
  - `handleInsightSemanticMap`: article_id + cluster_id 전달, queryPoint 클리어
  - `handleDiagnosisSemanticMap`: highlight ID 클리어, diagnosisResult 좌표 사용
  - SemanticMap 헤더 표시: `highlightArticleId` 있으면 "기사 위치 표시 중" / 없으면 "내 전략 위치 표시 중"
- **뒤로가기 화살표 제거**: SemanticMap 헤더 ArrowLeft 버튼 삭제 (브라우저 뒤로가기 사용)
- Vite 빌드 확인: `✓ built in 5.51s` (TypeScript 에러 0)

---

### 세션16 완료 (2026-06-19) — 성능 전체 검수 + 8개 버그 수정

**46. historyRepository.js getHistoryDetail INNER→LEFT JOIN**
- `FROM analysis_results r INNER JOIN diagnosis_requests d` → `FROM diagnosis_requests d LEFT JOIN analysis_results r`
- 분석 결과 없는 진단이력 detail 조회 시 null 반환하던 버그 수정
- COALESCE로 result_id/created_at null 안전 처리

**47. DiagnosisResult.tsx RiskGauge 각도 공식 수정**
- `const angle = -90 + pct * 1.8` → `const angle = -(pct * 1.8)`
- 기존: pct=0이면 바늘이 위를 가리키고 pct=100이면 게이지 아래로 벗어남
- 수정: pct=0→오른쪽(안전), pct=50→위, pct=100→왼쪽(위험) 정확한 반원 동작

**48. DiagnosisInterview.tsx res.ok 체크 순서 + promptLoading 블로킹**
- `handleAnalyze()`: `res.json()` 호출 전 `res.ok` 체크 추가 (non-JSON 5xx 크래시 방지)
- 분석 시작 버튼: `disabled={loading || promptLoading || ...}` — AI 작성 중에 분석 버튼 비활성화

**49. reporter.py 사례 요약 절사 250→450자**
- `_format_similar_cases()`: `summary[:250]` → `summary[:450]` — 실패 사례 결론 잘림 방지

**50. reporter.py few-shot 예시 3에 framework_insight 실제 예시 추가**
- 기존 3개 예시 모두 `framework_insight: null` → GPT가 프레임워크 컨텍스트 주입 시 작성 방법 미학습
- 예시 3(AI SaaS 전략)에 린스타트업 기반 실제 framework_insight 추가

**51. failure_principles.py fallback 분산 선택**
- 키워드 미매칭 시 `FAILURE_PRINCIPLES[:top_k]` → `random.shuffle` 후 상위 선택
- 항상 Porter/Christensen 원칙만 반환하던 편향 제거

**52. main.py /report SBERT 임베딩 중복 제거**
- `/report` 엔드포인트: 동일 텍스트에 대해 `_sbert.encode()` 3회 → 2회로 감소
- 프레임워크 검색 + RAG 임베딩을 `q_emb_shared`로 통합 (약 100~200ms 절약)

**53. api.ts tryRefresh() refresh_token 갱신 저장**
- 서버가 새 refresh_token 반환 시 `localStorage.setItem('refresh_token', data.refresh_token)` 저장
- Refresh Token Rotation 완전 지원

---

### 세션20 완료 (2026-06-22) — 소셜로그인 버그 수정 + 시맨틱맵 클러스터 라벨 + NCP 배포

**60. 소셜로그인 URL 파라미터 소실 버그 근본 수정 (`App.tsx`, `authController.js`, `LoginScreen.tsx`)**
- **버그 원인**: 세션18 History API 도입 시 `popstate` useEffect(L102)가 소셜콜백 useEffect(L125)보다 먼저 실행되어 `replaceState('/')` 호출 → `?token=XXXX` URL 파라미터 제거 → 로그인 무조건 실패
- **수정**: popstate useEffect에 URL 파라미터 체크 추가 — `?token=` 또는 `?error=` 있으면 replaceState 스킵
- `authController.js`: 소셜로그인 catch 블록 `res.status(500)` → `res.redirect(FRONTEND_URL?error=xxx_login_failed)` 통일
- `LoginScreen.tsx`: `socialLoginError` prop 수신 + 에러 표시 UI (lazy initializer로 URL 읽기)
- 카카오/네이버/구글 3개 모두 적용 (구글은 IP 기반 redirect URI 제한으로 배포 환경 미지원)

**61. 시맨틱맵 클러스터 라벨 수정 (`SemanticMap.tsx`)**
- `getClusterLabel()`: `top_keywords` 우선 사용 → 기업·사람 같은 범용 단어가 여러 클러스터에 중복 표시
- `cluster_name` 직접 사용으로 변경 → 재무/투자/위기관리, 경영전략/조직관리 등 의미 있는 이름 표시

**62. umap_coords_v3 / cluster_info_v3 팀원 공유 (.gitignore + git push)**
- `.gitignore`에 `!데이터처리/output/umap_coords_v3.parquet` / `!cluster_info_v3.parquet` 예외 추가
- git add → commit → push (develop 브랜치, 커밋 `909eb8ce`)
- 조원이 `git pull` 후 ai_server 재시작하면 v3 클러스터 동일하게 적용됨

**63. NCP 배포 완료 (211.188.50.81)**
- 서버 .env 확인: `FRONTEND_URL`, `KAKAO/NAVER_REDIRECT_URI` 모두 NCP IP로 설정 완료
- `git stash → git pull → docker compose build --no-cache → docker compose up -d` 완료
- 3개 컨테이너 정상: frontend(HTTP 200), backend, ai_server(healthy)
- 카카오 소셜로그인 redirect: 302 정상 응답 확인

**64. NCP 서버 인스턴스 정지 (크레딧 절약)**
- NCP 콘솔 → dongajul 서버 → 정지
- G3 타입 정지 시 디스크 요금만 청구 (월 약 9,000원 수준) → 10만 크레딧 충분

---

### NCP 서버 재시작 방법 (중요)

1. **NCP 콘솔** (console.ncloud.com/vpc-compute/server) → dongajul 서버 체크 → **시작** 버튼
2. 서버 상태가 "운영"으로 바뀌면 SSH 접속:
   ```
   ssh root@211.188.50.81  (비밀번호: H6-U3EdMrAg)
   ```
3. Docker 컨테이너 시작:
   ```bash
   cd /root/dongajul && docker compose start
   ```
4. AI 서버 로드 약 60초 후 `http://211.188.50.81` 접속 확인

---

## ✅ 전체 완료 작업 이력

### 세션1~2 (2026-06-09)

**1. JWT Refresh Token (`authService.js`, `userModel.js`, `authController.js`, `api.ts`)**
- Access Token 15분 / Refresh Token 7일 (JWT)
- 로그인·회원가입·소셜로그인 응답에 `refresh_token` 포함
- `users.refresh_token` 컬럼에 DB 저장 (서버 측 무효화 가능)
- `POST /api/auth/refresh` — 재발급 엔드포인트
- `POST /api/auth/logout` — 서버 측 refresh token 무효화
- `api.ts`: 401 시 tryRefresh → 성공 시 원래 요청 재시도 / 실패 시 로그아웃
- 소셜 로그인 콜백: URL params에 `refresh_token` 포함 → App.tsx에서 저장

**2. DB 마이그레이션 (`backend/scripts/migrate_auth.js`)**
- `users.password_hash` → `VARCHAR(255) NULL` (소셜 로그인 신규 가입자 지원)
- `users.refresh_token VARCHAR(512) NULL` 컬럼 추가
- 실행 완료: `node backend/scripts/migrate_auth.js`

**3. .gitignore 수정 (운영 파일 해제)**
- 팀원 공유 필요 파일 예외 처리:
  - `umap_coords.parquet`, `cluster_info.parquet`, `articles_meta.parquet`
  - `risk_model.pkl`, `faiss.index`, `risk_model_report.txt`
  - `embeddings.npy`, `DBR/HBR_embeddings.npy`, `HBR_labeled/preprocessed.parquet` (jyp 추가)
- 대용량 학습 전용 파일 계속 제외

**4. UMAP DB 임포트 스크립트 (`데이터처리/import_umap_to_db.py`)**
- `cluster_info.parquet` → `clusters` 테이블
- `umap_coords.parquet` → `article_vectors` 테이블 (umap_x/y/cluster_id)
- 팀원이 `python 데이터처리/import_umap_to_db.py` 한 번만 실행하면 시맨틱 맵 데이터 채워짐

**5. 소셜 로그인 pre-existing 버그 수정**
- `authController.js`: kakaoCallback `finalEmail` → `email` (undefined 변수 버그)
- `authRoutes.js`: 중복 카카오 라우트 (`/kakao` 두 번 선언) 제거

**6. 비밀번호 변경/찾기** — ~~완전 제거 (팀 결정, 프론트에서도 삭제 완료)~~ **절대 언급 금지**

---

### 세션4 (2026-06-09) — 카카오 로그인 복구

**7. 카카오 로그인 깨진 버그 수정 (`db.js`, `App.tsx`, `authController.js`)**
- 원인①: `db.js`에 `charset: 'utf8mb4'` 추가 → MySQL이 latin1 컬럼 데이터를 charset 변환하면서 한글 이름 garbling
- 원인②: `App.tsx` JWT 디코딩을 `decodeURIComponent`로 변경 → URIError throw 시 catch에서 토큰 전체 삭제 → 로그인 차단
- 원인③: `authController.js` kakaoCallback에서 `payload` 객체에 `client_secret` 추가했으나 실제 axios.post는 별도 `URLSearchParams`를 사용해 `client_secret`이 누락 → Kakao가 400 반환 (`.env`에 `KAKAO_CLIENT_SECRET` 세팅된 경우 필수값)
- 수정: `charset: 'utf8mb4'` 제거 / `decodeURIComponent` atob fallback / `tokenParams` 객체로 통합해 client_secret 실제 요청에 포함
- 커밋: `635daf0`, `2ca7b93` (develop 브랜치)

---

### 세션5~6 (2026-06-11) — 프론트엔드 전체 완성

**8. ProfileView 완전 재작성 (`ProfileView.tsx`)**
- 내부 darkMode state 제거 → prop 직접 사용
- 계정보안/알림설정/환경설정 버튼 3개 제거
- 프로필 사진: 텍스트 버튼 제거 → 아바타 우측상단 카메라 아이콘 배지로 교체
- 사진 저장 키: `profileImage` → `profileImage_${email}` (계정별 독립)
- 사진 변경/제거 시 `window.dispatchEvent(new Event('storage'))` → TopNavigation 즉시 동기화

**9. TopNavigation 프로필 이미지 동기화 (`TopNavigation.tsx`)**
- `getProfileImgFromStorage()` 헬퍼: localStorage `user.email` 기반 키로 이미지 조회
- `storage` 이벤트 리스너로 사진 변경 실시간 반영 (같은 탭 포함)
- 닉네임 표시: `parsedUser.nickname` 우선 → `.name` fallback

**10. RiskAnalysis apiFetch 전환 (`RiskAnalysis.tsx`)**
- raw `fetch` → `apiFetch` (JWT 자동 첨부, 401 자동 갱신)
- AI 면책 문구 추가 (⚠️ 참고용 자료, 전문가 자문 병행 권고)

**11. DiagnosisResult alert → toast (`DiagnosisResult.tsx`)**
- 모든 `alert()` 5개 → 자체 toast 시스템으로 교체
- 피드백 섹션 다크모드 스타일 수정
- AI 면책 문구 추가

**12. NotificationView 업그레이드 버튼 연결 (`NotificationView.tsx`)**
- 업그레이드 확인 버튼 → `onNavigate('checkout')` 호출

**13. SubscriptionPage 엔터프라이즈 연결 (`SubscriptionPage.tsx`)**
- 버튼 → `<a href="mailto:dongajul@dongajul.com?subject=엔터프라이즈 플랜 문의">` 링크

**14. App.tsx 연결 정리**
- `handleLogin` → `window.dispatchEvent(new Event('storage'))` 추가 (로그인 시 TopNavigation 갱신)
- CheckoutPage `onSuccess={() => setCurrentView('dashboard')}` 연결

**[팀원 작업 할당 — 완료됨]**
- `CheckoutPage.tsx`: 팀원이 inline 성공/에러 메시지로 이미 수정 완료 ✅
- `BannerAd.tsx`: 세션8에서 toast 교체 완료 ✅

---

### 세션7 (2026-06-11) — 전체 오류검사 + 버그 수정

**15. v3 클러스터 재구성 (`umap_cluster_v3.py`, `import_umap_to_db_v3.py`)**
- 기존: 2D UMAP 좌표 기반 K-means → HBR 영어기사 언어 클러스터 분리 문제
- 개선: 768차원 임베딩 기반 K-means → 12개 주제 기반 클러스터 (IT/AI, HR/조직, 마케팅, 금융 등)
- cluster_id=0 MySQL auto_increment 충돌 → 0→12로 리맵 (최종 1-12)
- DB clusters 테이블 + article_vectors 11,731건 업데이트 완료

**16. 전체 오류검사 + 3개 버그 수정 (세션7)**
- `InsightDashboard.tsx` L60: `artData.articles` → `artData.data || artData.articles || []`
  - articleController 응답이 `{data: rows}` 형태인데 `.articles`로 읽어서 항상 빈 배열이던 버그
- `InsightDashboard.tsx` L41: `.slice(0, 6)` 제거 → 12개 클러스터 전체 표시
  - 팀원이 재적용한 `.slice(0, 6)` 재수정
- `ai_server/main.py` L94/101: `umap_coords.parquet` / `cluster_info.parquet` → v3 우선 로드
  - 구버전 cluster_id 0-11이 DB cluster_id 1-12와 불일치하던 버그

---

### 세션8 (2026-06-11) — 추가 버그 수정 + 임포트 스크립트

**17. BannerAd.tsx alert → toast 교체 (`BannerAd.tsx`)**
- 구독 성공/이미구독/실패 시 `alert()` 3개 → 자체 toast 시스템으로 교체
- `CheckoutPage.tsx`는 팀원이 이미 inline 메시지로 수정 완료 확인

**18. profileRoutes.js 보안 디버그 로그 제거 (`profileRoutes.js`)**
- `/password` 라우트에 `console.log("req.user 전체 내용:", req.user)` 등 4개 제거
- req.body(비밀번호 평문) 서버 로그 노출 보안 이슈 해결

**19. articles DB 임포트 스크립트 생성 (`데이터처리/import_articles_to_db.py`)**
- DBR_labeled.parquet + HBR_labeled.parquet → articles + article_labels 테이블
- url 기준 중복 스킵 (재실행 안전), article_no = URL MD5 해시 20자
- 팀원이 `python 데이터처리/import_articles_to_db.py` 한 번 실행 필요

---

### 세션9 (2026-06-12) — 3가지 기획 기능 구현

**20. 전략 프레임워크 Knowledge Base (`ai_server/frameworks.py` 신규)**
- 12개 주요 경영전략 프레임워크 (Porter 5 Forces/본원적전략, 파괴적혁신, 블루오션, JTBD, BMC, 린스타트업, 고슴도치/플라이휠, Zero to One, 앤소프 매트릭스, 가치사슬, 플랫폼·네트워크)
- SBERT 임베딩(768차원) → 코사인 유사도 기반 관련 프레임워크 검색
- `init_frameworks(sbert_model)` 서버 시작 시 1회 호출
- `find_relevant_frameworks(query_emb)` → 유사도 0.35 이상 시 프레임워크 텍스트 반환

**21. 리스크 스코어 3-factor 고도화 (`ai_server/main.py`)**
- 기존: `0.4 × model_score + 0.6 × case_score` (2인자 고정 비율)
- 개선: `base_score = 0.35 × model_score + 0.45 × case_score + 0.20 × cluster_risk`
  → `risk_score = base_score × reliability + 0.5 × (1 - reliability)` (신뢰도 보정)
- case_score: 유사도 × confidence 가중 실패 비율 (confidence 없으면 1.0 기본값)
- cluster_risk: 클러스터별 사전 계산된 평균 실패율 (`_cluster_risk_map`)
- reliability: `min(max_sim / 0.65, 1.0)` — 최고 유사도 낮으면 0.5 방향 수축

**22. GPT 리포트 전문화 (`ai_server/reporter.py`, `ai_server/schemas.py`)**
- DiagnosisReport에 3개 Optional 필드 추가: `strategy_analysis`, `risk_details`, `framework_insight`
- 전문 컨설팅 시스템 프롬프트 재작성 (7개 섹션 → 구조화된 분석)
- `risk_details[i]`: `risk_factors[i]`와 1:1 대응 심층 분석 (발생 경위·영향·유사 사례 연결)
- `strategy_analysis`: 타깃 고객·수익모델·차별화·실행 난이도 구조 평가
- `framework_insight`: 관련 프레임워크 컨텍스트 주입 시 GPT가 인사이트 생성
- few-shot 예시 3개 모두 새 포맷으로 업데이트

**23. DiagnosisResult.tsx 리포트 UI 확장 (`frontend/src/app/components/DiagnosisResult.tsx`)**
- "전략 구조 분석" 섹션 추가 (파란 좌측 보더 카드)
- 리스크 요인에 심층 분석 하위 텍스트 표시 (risk_details 연동)
- "프레임워크 관점" 섹션 추가 (노란 하이라이트 박스, 판정 직전)

---

### 세션11 (2026-06-16) — HBS 해외모드 + 비교 기능 실제 구현

**24. LoginScreen 비밀번호 찾기 버튼 제거 (`frontend/src/app/components/LoginScreen.tsx`)**
- `onForgotPassword` 렌더 블록 삭제, `justify-between` → `flex`

**25. HBS 해외모드 (`ai_server/main.py`, `ai_server/schemas.py`, `backend/...`, `DiagnosisResult.tsx`)**
- `GlobalCasesResponse` 스키마 추가
- ai_server startup 시 `HBS_embeddings.npy` → `_faiss_hbs` IndexFlatIP 동적 빌드
- `POST /diagnose/global` 엔드포인트 (DB 저장 없음, HBS 전용 FAISS 검색)
- backend: `diagnoseGlobal` 컨트롤러 + `/api/diagnose/global` 라우트 추가
- DiagnosisResult: 실패 사례 카드 아래 "해외에서는 어떤 사례가 있을까요?" 버튼 → 클릭 시 HBS 5개 사례 인디고 카드 표시

**26. 기사 비교 기능 실제 구현 (`CompareView.tsx`, `App.tsx`)**
- App.tsx `CompareItem` 인터페이스: `label?`, `source?`, `url?`, `published_at?` 추가
- `handleInsightCompare`: `label → '성공'/'실패'/'중립'` 한국어 변환, `riskLevel` label 기반 도출
- CompareView 바 차트: 전환율/ROI/성장률 가짜값 → **리스크지수/정보신뢰도/사례최신성** (실제 데이터)
- CompareView 레이더 차트: **전략성공도/정보신뢰도/최신성/리스크수준/내용충실도** 5개 실제 차원
- CompareView 테이블: 출처·카테고리·발행일·원문링크 행 추가
- 결론 텍스트: `statusLabel()` 헬퍼로 정확 분기 (영어 label 비교 버그 해결)

---

### 세션12 (2026-06-16) — InsightDashboard 차트 + DiagnosisResult 키워드 맵

**27. `/api/articles/stats` API 확장 (`backend/src/controllers/articleController.js`)**
- 기존 4개 항목(total/success/failure/cluster)에 `yearly_trend`, `category_dist` 추가
- `yearly_trend`: YEAR(published_at) GROUP BY + label → `{ year, success, failure }[]` (2015~2026)
- `category_dist`: 카테고리별 성공/실패 수 집계 → `{ category, success, failure, total }[]` 상위 8개

**28. InsightDashboard 4개 차트 추가 (`frontend/src/app/components/InsightDashboard.tsx`)**
- Recharts import 추가: PieChart/Pie/Cell, LineChart/Line, CartesianGrid + BarChart/Bar/XAxis/YAxis/Tooltip/Legend/ResponsiveContainer
- `StatsData` 인터페이스에 `yearly_trend`, `category_dist` 필드 추가
- KPI 카드 아래 2×2 그리드 차트 섹션 추가 (데이터 있을 때만 표시):
  - 파이차트 (도넛형): 성공·실패·기타 비율
  - 가로 바차트: 카테고리별 성공·실패 분포 (상위 8)
  - 라인차트: 연도별 성공·실패 트렌드 (2015~2026)
  - 가로 바차트: Top5 카테고리 성공·실패 복합 비교

**29. DiagnosisResult 전략 키워드 맵 추가 (`frontend/src/app/components/DiagnosisResult.tsx`)**
- 유사 사례(similar_articles)의 category + source + data.keywords 빈도 집계 (최대 20개)
- 빈도 비율별 4단계 font-size + 색상 (text-xl → text-xs) CSS 태그 클라우드
- "핵심 키워드" 섹션 바로 아래, 유사 사례 섹션 위에 "전략 키워드 맵" 삽입

**30. HBS DB 임포트 + ai_server 메인 FAISS 업그레이드 (세션12)**
- `import_hbs_to_db.py` buffered=True 버그 수정 후 실행 → HBS 2,116건 articles/article_labels DB 임포트
- `import_articles_to_db.py`도 동일 버그 수정 완료
- 날짜 파싱 버그 수정: `'2024. 7-8월'` 같은 비정형 날짜 → NULL 처리 (regex YYYY-MM-DD 검증 추가)
- 누락 HBR Korea 1,586건 직접 삽입 완료 → 최종 articles 15,451건 (DBR 11,273 + HBR 2,062 + HBS 2,116)
- `ai_server/main.py` 메인 FAISS: `faiss.index`(13,335건) → `faiss_with_hbs.index`(15,451건) 우선 로드
- `ai_server/main.py` 메타데이터: `articles_meta.parquet` → `articles_meta_with_hbs.parquet` 우선 로드
- 결과: 일반 `/diagnose`에서도 HBS 사례 포함 검색 (기존 HBS 전용 `/diagnose/global`은 유지)

---

## ⚠️ 주의사항
- `npm run build`는 VM에서 dist 폴더 권한 오류(EPERM) — Windows에서 `dist` 폴더 삭제 후 빌드
- DB에 `article_vectors.umap_x/y` 데이터 있어야 시맨틱 맵 점들 표시됨
  → `python 데이터처리/import_umap_to_db.py` 실행 필요 (팀원)
- REFRESH_SECRET 환경변수 없으면 자동으로 `JWT_SECRET + '_refresh'` 사용
- `db.js`에 `charset` 옵션 절대 추가 금지 — DB 서버(campus.smhrd.com)가 latin1 기반이라 charset 변환 시 한글 garbling 발생

---

### 세션13 (2026-06-18) — strategies DB 연동 + 알림 설정 + 트렌드 컨텍스트

**31. DB 마이그레이션 (`데이터처리/migrate_db.py` 신규)**
- strategies 테이블 생성 (user_id, name, content, keywords JSON, metrics_* 컬럼)
- users 테이블에 notif_email / notif_push / notif_marketing TINYINT(1) 컬럼 추가
- 실행 완료

**32. 전략 워크스페이스 백엔드 연동 (`backend/src/routes/strategyRoutes.js`)**
- 테이블이 없어서 500 에러나던 문제 해결 (테이블 생성으로 해결)
- GET/POST/PUT/DELETE CRUD 모두 완성된 상태로 정상 동작 확인

**33. 알림 설정 API (`backend/src/routes/profileRoutes.js`)**
- `GET /api/profile/notifications` — notif_email/notif_push/notif_marketing 조회
- `PATCH /api/profile/notifications` — 변경된 항목만 UPDATE

**34. ProfileView 알림 설정 토글 UI (`frontend/src/app/components/ProfileView.tsx`)**
- 이메일 알림 / 푸시 알림 / 마케팅 수신 동의 3개 토글 스위치
- 토글 클릭 즉시 PATCH API 호출, 실패 시 state 롤백
- 구독 정보 카드 아래에 알림 설정 카드 삽입

**35. NAVER 트렌드 컨텍스트 (`데이터처리/extract_trends.py`, `ai_server/trend_context.py`)**
- NAVER 55,465건 → 2024~2025년 데이터 31,848건 → 23개 카테고리 TF-IDF 키워드 추출
- trend_keywords.json 저장 (카테고리별 상위 15개 + 전체 상위 20개)
- ai_server startup 시 로드 (`init_trend_context`)
- `/report` 호출 시 query_cluster_id → 클러스터명 → 관련 카테고리 키워드 매핑 → GPT 프롬프트 주입
- reporter.py `generate_report()` 파라미터에 `trend_context` 추가
- HUMAN_PROMPT에 `[최근 시장 트렌드 키워드 (2024~2025)]` 섹션 삽입

---

### 세션14 (2026-06-18) — 기사 비교 6차원 GPT 스코어링 + AI 챗 ChatGPT 스타일 개편

**36. 기사 비교 6차원 GPT 스코어링 (`backend/src/controllers/compareController.js` 전면 재작성)**
- `trend_keywords.json` 로드 + CAT_MAP(17개 항목)으로 기사 카테고리 → NAVER 트렌드 매핑
- `buildTrendContext(cat1, cat2)`: 전체 트렌드 + 카테고리 특화 트렌드 최대 4줄 생성
- GPT 프롬프트: 6차원 점수(시장타이밍/실행력/고객이해도/경쟁대응력/자원충분성/트렌드부합도) 0~100
- JSON.parse try-catch 추가 (파싱 실패 시 500 반환)
- 응답 포함 필드: `scores.A/B`, `analysis`, `key_differences`, `trend_insight`, `recommendation`

**37. CompareView 6차원 차트 전면 교체 (`frontend/src/app/components/CompareView.tsx`)**
- `DimScores` 인터페이스 (6개 차원 키)
- `fallbackDimScores(item)`: GPT 없을 때 label/year/source/keywords 기반 휴리스틱 점수
- 바 차트: 6개 차원 × 2개 사례 실제 GPT 점수 (기존 하드코딩 제거)
- 레이더 차트: 동일 6차원
- 결론 섹션: `trend_insight` 트렌드 인사이트 초록 박스 표시

**38. InsightDashboard 플로팅 비교 버튼 (`frontend/src/app/components/InsightDashboard.tsx`)**
- `fixed bottom-[82px] right-6 z-40` — 챗봇 버튼 바로 위에 고정
- 1개 선택 시: "사례 1개 더 선택하세요" 안내 배지
- 2개 선택 시: "비교 분석 보기" 버튼 활성화 → `handleCompareSubmit()` 호출
- "선택 취소" 버튼 함께 표시

**39. AI 챗 ChatGPT 스타일 전면 개편 (`frontend/src/app/components/AIChatbot.tsx`)**
- 전체화면 모달 오버레이 (bg-black/40 backdrop)
- 좌측 다크 사이드바 (240px, #171717): 새 대화 버튼 + 세션 목록(날짜 그룹) + 하단 푸터
- 세션 아이템: hover 시 연필/휴지통 아이콘, 클릭 시 인라인 제목 편집 (editingSessionId)
- 빈 상태: Bot 아이콘 + 서비스 소개 + 3개 기능 카드 (🔍 사례 검색, 📊 리스크 분석, 📚 프레임워크)
- 메시지: max-w-2xl mx-auto 중앙 정렬, 봇=흰/회색 버블, 유저=네이비 버블
- 타이핑 인디케이터: 3개 점 bounce 애니메이션 (staggered delay)
- `RenderText` 컴포넌트: `**bold**` 마크다운 → `<strong>` 파싱
- `formatTime/relativeDate`: 오늘/어제/N일 전 날짜 표시
- 답변 불가 버그 수정: `!res.ok` 체크로 `data.message` 표시 (기존 fallback 텍스트 오류 해결)
- 예시 질문 버튼 3개 제거

**40. chat_sessions + chat_messages DB 마이그레이션 (`backend/scripts/migrate_chat_sessions.js`)**
- `chat_sessions` 테이블: session_id, user_id, title VARCHAR(200), created/updated_at
- `chat_messages`에 `session_id INT DEFAULT NULL` 컬럼 추가
- 두 마이그레이션 모두 실행 완료

**41. chatController 세션 관리 (`backend/src/controllers/chatController.js` 전면 재작성)**
- 전략 컨설턴트 시스템 프롬프트 (DBR·HBR·HBS 13,000건 기반)
- 첫 메시지 시 자동 세션 생성 (title = 첫 30자), 이후 session_id 재사용
- DB에서 최근 20개 메시지 로드 → GPT 컨텍스트에 주입 (대화 연속성)
- getSessions / updateSession / deleteSession / getHistory 엔드포인트 구현
- 오류 처리: 429→속도제한 메시지, 401→인증 오류, ECONNABORTED→타임아웃
- 응답: `{ success: true, reply, session_id }`

---

### 세션15 (2026-06-19) — 진단이력 버그픽스 + 전체 코드 검수 + NCP Docker 배포 구성

**42. 진단이력 불러오기 버그 수정**
- `historyRepository.js` INNER JOIN → LEFT JOIN + COALESCE (분석 결과 없는 진단도 이력에 표시)
- `diagnoseController.js` getDiagnoseById: unused SELECT 컬럼 제거, similar_article_matches 조회 try-catch 래핑 (SQL 오류 시 빈 배열 반환, 500 방지)
- `SearchHistory.tsx` fetchError state + 재시도 버튼 UI 추가

**43. 전체 코드 버그 검수 8개 수정**
- `NotificationView.tsx`: 동적 Tailwind 클래스 `border-l-${color}-500` → 정적 삼항 (purge 버그)
- `LoginScreen.tsx` / `SignupScreen.tsx`: hardcoded `http://localhost:3001` → `apiFetch` + `BASE_URL` (OAuth redirect 포함)
- `RiskAnalysis.tsx`: `.json()` 호출 전 `res.ok` 체크 (non-JSON 5xx 대응)
- `DiagnosisResult.tsx` handleFetchGlobal: `res.ok` 체크 추가
- `profileRoutes.js`: `password_hash` null 가드 (소셜 로그인 계정 400 반환)
- `strategyRoutes.js` PUT/DELETE: `isNaN(strategyId)` 검증 추가
- `ai_server/main.py` /diagnose/global: FAISS `top_k=0` 방지 가드

**44. api.ts BASE_URL 프로덕션 대응 (`frontend/src/app/utils/api.ts`)**
- `import.meta.env.PROD ? '' : 'http://localhost:3001'` — 빌드 시 자동 상대 URL
- export로 변경해 LoginScreen/SignupScreen에서 OAuth redirect 시 재사용

**45. NCP Docker 배포 구성 (신규 파일 5개 + docker-compose 전면 개편)**
- `frontend/Dockerfile`: node:20-slim 빌드 → nginx:alpine 서빙 (멀티스테이지)
- `frontend/nginx.conf`: `/api/*` → `backend:3001` 리버스 프록시, SPA 라우팅, gzip, 정적 캐시
- `frontend/.dockerignore` / `backend/.dockerignore`
- `docker-compose.yml` 전면 개편: frontend 서비스 활성화, `dongajul_net` 네트워크 추가, backend/ai_server `expose`(내부 전용), frontend만 `ports: 80:80`, `AI_SERVER_URL=http://ai_server:8000` 자동 주입, ai_server healthcheck
- `backend/.env.example`: 모든 환경변수 템플릿 (시크릿 제외, 배포 시 변경 항목 주석 포함)
- `deploy.sh`: git pull → .env 검사 → docker compose down/build/up 원클릭 스크립트

---

## 📋 남은 작업

### 팀원 할당
- **`python 데이터처리/import_articles_to_db.py` 실행** — DBR+HBR 13,335건을 articles/article_labels 테이블에 임포트 (한 번만 실행하면 됨)
- **HBS 파이프라인 실행** (순서대로): `preprocess_hbs.py` → `label_hbs.py` → `embed_hbs.py` → `import_hbs_to_db.py`
  → 완료 후 ai_server 재시작 시 HBS 전용 FAISS 자동 로드됨
- ~~`python 데이터처리/import_umap_to_db.py` 실행~~ → **v3로 교체: `import_umap_to_db_v3.py` 실행 완료**
- ~~`CheckoutPage.tsx` alert → toast~~ → 팀원 완료 ✅
- ~~`BannerAd.tsx` alert~~ → 세션8 완료 ✅

### 보류 결정됨
- ~~비밀번호 변경/찾기~~ **완전 제거, 다시 꺼내지 말 것**
- ~~ProfileView 알림 토글 DB 연동~~ → **세션13 완료** ✅
- ~~StrategyWorkspace 백엔드 연동~~ → **세션13 완료** (strategies 테이블 생성) ✅
- CompareView DB 연동 — **보류** (실제 메트릭 없음, 하드코딩 차트 데모)

### NCP 배포 — 완료 ✅ (세션20, 2026-06-22)
- 서버 IP: **211.188.50.81**, SSH: `root / H6-U3EdMrAg`
- backend/.env FRONTEND_URL + 소셜 redirect URI 모두 NCP IP로 설정 완료
- 카카오/네이버 개발자 콘솔 redirect URI 등록 완료
- 구글 로그인: IP 기반 redirect URI 미지원 → 배포 환경에서 비활성 (도메인 확보 시 가능)
- **현재 서버 인스턴스: 정지 상태** (크레딧 절약, 정지 중 디스크 요금만 월 ~9,000원)

### NCP 서버 재시작 방법
1. console.ncloud.com → Server → dongajul 체크 → **시작**
2. 상태 "운영" 확인 후 SSH: `ssh root@211.188.50.81`
3. `cd /root/dongajul && docker compose start`
4. 약 60초 후 `http://211.188.50.81` 접속

### 신규 기획 (세션6 논의, 구현 검토 중)
- ~~**트렌드 컨텍스트**~~ → **세션13 완료** ✅
- ~~**전략 프레임워크 knowledge base**~~ → **세션9 완료** ✅