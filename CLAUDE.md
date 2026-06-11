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

## 현재 상태 (2026-06-11 세션8)

**NLP 파이프라인 전체 완료**: ① 전처리 → ② 라벨링 → ③ 임베딩+FAISS → ④ 리스크 모델 → ⑤ UMAP+K-means
**v3 클러스터 완료**: 768차원 K-means → 12개 주제 기반 클러스터, DB 반영 완료 (cluster_id 1-12)
**FastAPI ML 서비스 완료**: POST /diagnose, POST /report (GPT RAG), GET /health, GET /clusters
**RAG 완료**: FAISS 유사 사례 검색 → GPT few-shot 리포트 생성 (reporter.py)
**JWT Refresh Token 완료**: Access 15분 / Refresh 7일, 자동 재발급
**카카오 로그인 복구 완료**: charset 버그 + JWT fallback 처리
**프론트엔드 전체 API 연동 완료**: 모든 화면 apiFetch 기반 연동, alert→toast 교체, AI 면책 문구 추가
**전체 오류검사 완료 (세션7)**: 6개 버그 수정
**세션8 추가 버그 수정 + 임포트 스크립트**: BannerAd toast 교체, profileRoutes 보안 로그 제거, articles DB 임포트 스크립트 생성

**신규 기획 아이디어 (세션6 논의)**
- ① NAVER 뉴스 데이터(55,465건) 기반 산업 트렌드 컨텍스트 → GPT 프롬프트 주입
- ② 유명 경영전략 저자 프레임워크 knowledge base 구축 → FAISS RAG에 추가

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

## ⚠️ 주의사항
- `npm run build`는 VM에서 dist 폴더 권한 오류(EPERM) — Windows에서 `dist` 폴더 삭제 후 빌드
- DB에 `article_vectors.umap_x/y` 데이터 있어야 시맨틱 맵 점들 표시됨
  → `python 데이터처리/import_umap_to_db.py` 실행 필요 (팀원)
- REFRESH_SECRET 환경변수 없으면 자동으로 `JWT_SECRET + '_refresh'` 사용
- `db.js`에 `charset` 옵션 절대 추가 금지 — DB 서버(campus.smhrd.com)가 latin1 기반이라 charset 변환 시 한글 garbling 발생

## 📋 남은 작업

### 팀원 할당
- **`python 데이터처리/import_articles_to_db.py` 실행** — DBR+HBR 13,335건을 articles/article_labels 테이블에 임포트 (한 번만 실행하면 됨)
- ~~`python 데이터처리/import_umap_to_db.py` 실행~~ → **v3로 교체: `import_umap_to_db_v3.py` 실행 완료**
- ~~`CheckoutPage.tsx` alert → toast~~ → 팀원 완료 ✅
- ~~`BannerAd.tsx` alert~~ → 세션8 완료 ✅

### 보류 결정됨
- ~~비밀번호 변경/찾기~~ **완전 제거, 다시 꺼내지 말 것**
- ProfileView 알림 토글 DB 연동 — **보류** (users 테이블에 알림 설정 컬럼 없음)
- CompareView DB 연동 — **보류** (실제 메트릭 없음, 하드코딩 차트 데모)
- StrategyWorkspace 백엔드 연동 — **보류** (strategies 테이블 없음)

### 신규 기획 (세션6 논의, 구현 검토 중)
- **트렌드 컨텍스트**: NAVER 뉴스 55,465건 → 산업별 시계열 키워드 추출 → GPT 프롬프트 주입
- **전략 프레임워크 knowledge base**: Porter/Christensen/블루오션 등 → FAISS RAG에 추가