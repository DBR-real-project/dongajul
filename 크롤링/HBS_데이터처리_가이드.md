# HBS 데이터 처리 가이드

HBS_articles.csv 크롤링 완료 후 진행하는 전처리/라벨링 작업 가이드.
DBR/HBR 때와 동일한 파이프라인이지만 **영어 텍스트** 기준으로 일부 다름.

---

## 0. 사전 준비

```bash
# 필요 패키지 (없으면 설치)
pip install pandas pyarrow scikit-learn sentence-transformers kiwipiepy
```

CSV 위치: `크롤링/HBS_articles.csv`
컬럼: `title, content, url, category, published_date, source, summary`

---

## 1. 전처리 (`preprocess_hbs.py` 신규 작성)

HBS는 **영어** 기사이므로 Kiwi(한국어 형태소 분석기) 대신 **spaCy 또는 단순 정규식** 사용.

### 핵심 작업
| 항목 | 방법 |
|------|------|
| 노이즈 제거 | 특수문자, HTML 잔재, 줄바꿈 정리 |
| 소문자화 | `text.lower()` |
| 토크나이징 | `text.split()` 또는 `re.findall(r'\b[a-zA-Z]+\b', text)` |
| 불용어 제거 | NLTK stopwords 또는 직접 리스트 (a, the, is, are, ...) |
| 최소 길이 필터 | 토큰 50개 미만 제거 |

### 출력 컬럼 추가
```
clean_text   : 전처리된 텍스트
tokens       : 토큰 리스트
token_str    : 토큰을 공백으로 이어붙인 문자열
n_tokens     : 토큰 수
```

### 출력 파일
`데이터처리/output/HBS_preprocessed.parquet`

### 참고 코드 구조 (DBR 버전)
`데이터처리/preprocess.py` — Kiwi 부분만 영어 전처리로 교체하면 됨.

---

## 2. 라벨링 (`label.py` 에 HBS 추가)

기존 `데이터처리/label.py`에 HBS 처리 블록 추가.

### 라벨 기준 (DBR/HBR과 동일)
| 라벨 | 조건 |
|------|------|
| `success` | 성공 키워드 비율 ≥ 0.65 (키워드 히트 ≥ 3) |
| `failure` | 실패 키워드 비율 ≤ 0.35 (키워드 히트 ≥ 3) |
| `neutral` | 그 외 모호한 기사 |

### 영어 키워드 매핑
기존 키워드 파일에 영어 버전 추가 필요:

**성공 키워드 (영어)**
```
success, growth, profit, revenue, expansion, innovation, breakthrough,
leadership, achievement, winner, dominant, market share, scale, IPO,
acquisition, turnaround, transformation, outperform, record, milestone
```

**실패 키워드 (영어)**
```
failure, bankrupt, collapse, decline, loss, layoff, shutdown, crisis,
scandal, lawsuit, fraud, recall, restructure, downfall, mistake,
underperform, writeoff, abandon, debt, default
```

### confidence 컬럼
`label.py` 그대로 사용 — keyword 히트 기반 `success_ratio` 계산 후 저장.

### 출력 파일
`데이터처리/output/HBS_labeled.parquet`
컬럼: `title, content, url, category, published_date, source, summary, clean_text, tokens, token_str, n_tokens, label, confidence`

---

## 3. 임베딩 + FAISS 인덱스 업데이트

> ⚠️ 이 단계는 Claude(재한)와 상의 후 진행. FAISS 인덱스 재구축 필요.

현재 FAISS 인덱스는 DBR(11,273) + HBR(2,062) = 13,335건 기준.
HBS 추가 시 전체 재구축 or 별도 인덱스 생성.

**사용 모델**: `paraphrase-multilingual-MiniLM-L12-v2` (384차원, 영어 지원 ✅)

---

## 4. DB 임포트

HBS labeled 데이터를 articles / article_labels 테이블에 임포트.
기존 `데이터처리/import_articles_to_db.py` 에 HBS 파일 경로 추가하면 됨:

```python
# import_articles_to_db.py 맨 위에 추가
hbs_path = OUTPUT_DIR / "HBS_labeled.parquet"
```

---

## 참고: DBR/HBR 처리 결과 (비교용)

| 소스 | 건수 | success | failure | neutral |
|------|------|---------|---------|---------|
| DBR | 11,273 | 86.9% | 4.7% | 8.3% |
| HBR | 2,062 | 97.2% | 0.7% | 2.1% |
| HBS | ? | 예상 70~85% | 예상 5~10% | 나머지 |

HBS는 실패 케이스를 직접 분석하는 성격의 기사가 DBR보다 많을 수 있음.
라벨링 후 비율 확인 필수.

---

## 파일 요약

| 단계 | 스크립트 | 입력 | 출력 |
|------|----------|------|------|
| 크롤링 | `크롤링/HBS_crawler.py` | — | `크롤링/HBS_articles.csv` |
| 전처리 | `데이터처리/preprocess_hbs.py` (신규) | HBS_articles.csv | HBS_preprocessed.parquet |
| 라벨링 | `데이터처리/label.py` (HBS 블록 추가) | HBS_preprocessed.parquet | HBS_labeled.parquet |
| DB 임포트 | `데이터처리/import_articles_to_db.py` | HBS_labeled.parquet | articles / article_labels 테이블 |
