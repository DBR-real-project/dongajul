# 📐 동아줄

> AI가 함께하는 전략 리스크 진단 서비스 — 경영 사례 한 줄로 즉시 AI 리스크 분석

<br>

## 👀 서비스 소개

- **서비스명**: 동아줄 (Dongajul)
- **서비스 설명**: 사용자가 비즈니스 전략을 입력하면 DBR·HBR·HBS 15,451건의 경영 성공·실패 사례를 AI가 실시간으로 탐색하여 전략 리스크를 0~100 점수로 정량화하고, GPT 기반 컨설팅 리포트와 시맨틱 인사이트 맵을 제공하는 AI 전략 리스크 진단 서비스입니다. 자체 구축한 Sentence-BERT + FAISS 파이프라인과 MLP 리스크 모델(ROC-AUC 0.9771)을 결합하여 국내외 경영 전략 전 범위를 커버합니다.

<br>

## 📅 프로젝트 기간

2026.04.30 ~ 2026.06.30

<br>

## ⭐ 주요 기능

- 🔍 **전략 진단**: 전략 텍스트 입력 또는 인터뷰 → SBERT 임베딩 + FAISS로 15,451건 중 유사 사례 실시간 탐색
- 📊 **리스크 스코어**: MLP 모델이 유사 사례의 성공·실패 분포 기반으로 0~100 리스크 점수 산출
- 📄 **AI 컨설팅 리포트**: GPT-4o RAG 기반 전략 구조 분석 + 리스크 요인 + 개선 제언 + 프레임워크 인사이트 생성 및 PDF 저장
- 🗺️ **시맨틱 인사이트 맵**: UMAP 기반 2D 벡터 공간에 전략 위치를 시각화, 유사 성공·실패 사례 군집과의 거리 표시 (D3.js Canvas+SVG)
- 🌐 **해외 사례 분석**: HBS Working Knowledge 2,116건 전용 FAISS로 해외 유사 사례 탐색
- ⚖️ **기사 비교 분석**: 인사이트 대시보드에서 기사 2개 선택 → GPT가 6개 차원(시장타이밍·실행력·고객이해도·경쟁대응력·자원충분성·트렌드부합도) 점수화
- 📈 **인사이트 대시보드**: 성공·실패 비율, 카테고리별 분포, 연도별 트렌드 차트, 12개 전략 클러스터 분포
- 💬 **AI 챗봇**: GPT 기반 전략 리스크·경영 프레임워크 대화형 질의응답
- 📂 **전략 워크스페이스**: 전략 저장·관리 및 진단 이력 열람
- 🔔 **알림 센터**: 진단 완료·업그레이드·보안 알림 실시간 확인
- 👤 **소셜 로그인**: 카카오 / 네이버 / 구글 OAuth

<br>

## 🛠 기술 스택

<table>
  <tr>
    <th>구분</th>
    <th>내용</th>
  </tr>
  <tr>
    <td>Frontend</td>
    <td>
      <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=React&logoColor=black"/>
      <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=TypeScript&logoColor=white"/>
      <img src="https://img.shields.io/badge/Tailwind CSS-06B6D4?style=flat&logo=TailwindCSS&logoColor=white"/>
      <img src="https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=Axios&logoColor=white"/>
      <img src="https://img.shields.io/badge/D3.js-F9A03C?style=flat&logo=d3.js&logoColor=white"/>
      <img src="https://img.shields.io/badge/Recharts-22B5BF?style=flat"/>
    </td>
  </tr>
  <tr>
    <td>Backend</td>
    <td>
      <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=Node.js&logoColor=white"/>
      <img src="https://img.shields.io/badge/Express-000000?style=flat&logo=Express&logoColor=white"/>
      <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=MySQL&logoColor=white"/>
      <img src="https://img.shields.io/badge/JWT-000000?style=flat&logo=JSONWebTokens&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td>AI 서버</td>
    <td>
      <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=FastAPI&logoColor=white"/>
      <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=Python&logoColor=white"/>
      <img src="https://img.shields.io/badge/OpenAI-412991?style=flat&logo=OpenAI&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td>자체 ML 파이프라인</td>
    <td>
      <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=flat&logo=PyTorch&logoColor=white"/>
      Sentence-BERT (paraphrase-multilingual-MiniLM-L12-v2) · FAISS IndexFlatIP · UMAP · K-means(12 클러스터) · MLP 리스크 모델
    </td>
  </tr>
  <tr>
    <td>데이터</td>
    <td>DBR 11,273건 · HBR 2,062건 · HBS 2,116건 = 총 15,451건 / NAVER 뉴스 55,465건 (모델 학습 전용)</td>
  </tr>
  <tr>
    <td>인프라</td>
    <td>
      <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=Docker&logoColor=white"/>
      <img src="https://img.shields.io/badge/Nginx-009639?style=flat&logo=Nginx&logoColor=white"/>
      NCP (Naver Cloud Platform)
    </td>
  </tr>
  <tr>
    <td>인증</td>
    <td>카카오 / 네이버 / 구글 OAuth · JWT Access(15분) + Refresh(7일)</td>
  </tr>
  <tr>
    <td>개발 도구</td>
    <td>
      <img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=GitHub&logoColor=white"/>
      <img src="https://img.shields.io/badge/VSCode-007ACC?style=flat&logo=VisualStudioCode&logoColor=white"/>
    </td>
  </tr>
</table>

<br>

## 🏗 시스템 아키텍처

```
사용자 (브라우저)
      ↓
[Frontend] React + Tailwind CSS (포트 3000)
      ↓ axios (JWT 자동 첨부)
[Backend] Node.js + Express (포트 3001)
      ↓                         ↓
   MySQL DB              [AI Server] FastAPI (포트 8000)
   - users                SBERT 임베딩 + FAISS 유사 사례 검색
   - articles             GPT-4o RAG 컨설팅 리포트 생성
   - diagnosis_requests   MLP 리스크 스코어 산출
   - analysis_results     UMAP 2D 시각화 데이터
   - article_vectors            ↓
   - clusters             FAISS Index (15,451건)
                          embeddings.npy (384차원)
                          risk_model.pkl (MLP)
                          umap_coords_v3.parquet
```

<br>

## 📊 NLP 파이프라인

```
① 전처리 (Kiwi 형태소 분석, 불용어 220개)
      ↓
② 성공/실패 라벨링 (키워드 규칙 + SBERT 센트로이드 기반)
      ↓
③ Sentence-BERT 임베딩 + FAISS 인덱스 구축 (13,335건 → 15,451건)
      ↓
④ MLP 리스크 모델 학습 (68,800건, ROC-AUC 0.9771)
      ↓
⑤ UMAP 차원 축소 + K-means 12개 클러스터 분류 → DB 저장
```

| 단계 | 모델/방법 | 성능 |
|------|----------|------|
| 임베딩 | paraphrase-multilingual-MiniLM-L12-v2 (384차원) | - |
| 리스크 모델 | MLP (hidden=512×128, threshold=0.33) | ROC-AUC **0.9771** / Failure F1 **0.78** |
| 클러스터링 | UMAP + K-means (k=12) | 12개 주제 클러스터 |

<br>

## 📋 유스케이스

<img width="643" height="705" alt="image" src="https://github.com/user-attachments/assets/9ba78c96-49b7-40d0-89f8-aa6c2ec2500f" />

<br>

## 🔄 서비스 흐름도

```
전략 텍스트 입력 / 인터뷰 단계별 응답
        ↓
  SBERT 임베딩 생성
        ↓
  FAISS 유사 사례 탐색 (TOP 5)
        ↓
  MLP 리스크 스코어 산출 (0~100)
        ↓
  GPT-4o RAG 컨설팅 리포트 생성
  (전략 분석 + 리스크 요인 + 개선 제언 + 프레임워크 인사이트)
        ↓
  진단 결과 저장 → 시맨틱 맵 위치 표시 → PDF 저장
```

<br>

## 📊 ER 다이어그램

<img width="5355" height="4240" alt="실전프로젝트_ERD_동아줄_선명2" src="https://github.com/user-attachments/assets/466efaf5-d218-434c-b4a8-41081bc91310" />

<br>

## 🖥 화면 구성

| 홈 대시보드 | 전략 진단 |
|:---:|:---:|
| <img width="460" alt="홈" src="https://github.com/user-attachments/assets/a296028c-98bf-47ea-9ecb-4a1670c5043a" /> | <img width="460" alt="전략진단" src="https://github.com/user-attachments/assets/03f72b7e-fdb0-48eb-9f04-959ea0375405" /> |

| AI 리포트 | 시맨틱 인사이트 맵 |
|:---:|:---:|
| <img width="460" alt="AI리포트" src="https://github.com/user-attachments/assets/0409c9e5-13cc-4d8c-9a1a-ce2ca03e6af6" /> | <img width="460" alt="시맨틱맵" src="https://github.com/user-attachments/assets/05550105-a114-474c-b06a-92461da4e398" /> |

| 인사이트 대시보드 | 기사 비교 분석 |
|:---:|:---:|
| <img width="460" alt="인사이트" src="https://github.com/user-attachments/assets/d68ed382-ffa9-4e43-847f-60a8b614efee" /> | <img width="460" alt="비교분석" src="https://github.com/user-attachments/assets/791a35ef-34f5-41f9-bd60-88f088061ecf" /> |

## 👥 팀원 역할

<table>
  <tr>
    <td align="center">[팀장][박진엽]</td>
    <td align="center">[팀원][강동연]</td>
    <td align="center">[팀원][김재한]</td>
    <td align="center">[팀원][김지호]</td>
    <td align="center">[팀원][문병근]</td>
    <td align="center">[팀원][서현철]</td>
  </tr>
  <tr>
    <td align="center">Modeling</td>
    <td align="center">Back-end</td>
    <td align="center">PM</td>
    <td align="center">Front-end</td>
    <td align="center">Back-end</td>
    <td align="center">Front-end</td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/jyp921212">github</a></td>
    <td align="center"><a href="https://github.com/DongYeon-cloud">github</a></td>
    <td align="center"><a href="https://github.com/jaehan9602211-eng" target="_blank">github</a></td>
    <td align="center"><a href="https://github.com/jh75ho">github</a></td>
    <td align="center"><a href="https://github.com/Geun8b">github</a></td>
    <td align="center"><a href="https://github.com/chriii3">github</a></td>
  </tr>
</table>

<br>

## 🔧 트러블 슈팅

### NLP / 데이터

**1. FAISS 한글 경로 버그**
- 문제: `faiss.write_index()`가 내부적으로 C++ 백엔드를 사용하기 때문에 한글이 포함된 파일 경로를 처리하지 못해 인덱스 저장이 실패하였다.
- 해결: `faiss.serialize_index()`로 bytes 객체를 먼저 생성한 뒤, Python의 `Path.write_bytes()`로 저장하는 방식으로 전환하여 C++ 레이어를 우회하였다.
- 결과: 한글 경로 환경에서도 FAISS 인덱스 저장·로드가 정상 동작하게 되었다.

**2. 클래스 불균형 (실패 사례 4.7%)**
- 문제: DBR·HBR 데이터에서 성공 사례(86.9%)와 실패 사례(4.7%)의 극단적인 불균형으로 인해 초기 Logistic Regression 모델이 실패를 거의 예측하지 못하였다 (Failure Precision 0.36).
- 해결: `class_weight='balanced'`를 적용하고, 모델을 MLP로 교체하였다. 또한 DBR·HBR 외에 NAVER 뉴스 55,465건을 추가 학습 데이터로 확보하여 실패 사례 절대량을 보완하였다. 결정 임계값도 default 0.5에서 0.33으로 최적화하였다.
- 결과: Failure Precision 0.36 → 0.71 (2배), ROC-AUC 0.9382 → 0.9771 달성.

---

### Backend / DB

**3. DB charset garbling — 카카오 로그인 한글 이름 깨짐**
- 문제: `db.js`에 `charset: 'utf8mb4'` 옵션을 추가하자 MySQL 서버(latin1 기반)가 charset 변환을 시도하면서 한글 사용자 이름이 깨지는 현상이 발생하였다.
- 해결: `charset` 옵션을 완전히 제거하였다. DB 서버의 기본 charset을 그대로 따르도록 하여 변환 로직이 개입하지 않도록 처리하였다.
- 결과: 카카오·네이버 소셜 로그인 한글 이름이 정상적으로 저장·표시된다.

**4. 소셜 로그인 URL 파라미터 소실 버그**
- 문제: History API 도입 후 `popstate` 이벤트 리스너가 소셜 콜백 처리(`?token=XXXX`)보다 먼저 실행되어 `replaceState('/')` 호출로 URL 파라미터가 제거되었다. 결과적으로 소셜 로그인 콜백이 항상 실패하였다.
- 해결: `popstate` 핸들러 내부에서 `window.location.search`를 먼저 확인하여 `?token=` 또는 `?error=` 파라미터가 존재하면 `replaceState`를 스킵하도록 처리하였다.
- 결과: 카카오·네이버 소셜 로그인이 History API와 충돌 없이 정상 동작한다.

**5. 진단 이력 조회 시 분석 결과 누락**
- 문제: `historyRepository.js`에서 `diagnosis_requests INNER JOIN analysis_results` 쿼리를 사용하였기 때문에, 분석이 완료되지 않은 진단 요청(pending 상태)은 이력 목록에 아예 표시되지 않았다.
- 해결: `INNER JOIN`을 `LEFT JOIN`으로 변경하고 `COALESCE`로 null 필드를 안전하게 처리하였다.
- 결과: 분석 결과 유무와 관계없이 모든 진단 이력이 정상 표시된다.

---

### Frontend

**6. 시맨틱 맵 하이라이트 — article_id 불일치**
- 문제: AI 서버의 `/semantic-map` 엔드포인트가 반환하는 `id` 필드가 DataFrame 행 인덱스(0, 1, 2...)였으나, 이를 DB의 `article_id`로 오인하여 `points.find(p => p.article_id === highlightId)`가 항상 실패하였다.
- 해결: 진단 결과에 저장된 `query_umap_x/y` 좌표를 직접 `queryPoint`로 사용하도록 방식을 전환하였다. `article_id` 룩업을 제거하고 좌표 기반으로 맵 위치를 표시하도록 수정하였다.
- 결과: 진단 결과 → 시맨틱 맵 이동 시 내 전략 위치가 정확히 표시된다.

**7. D3.js Canvas+SVG 줌 시 렌더링 분리**
- 문제: 15,000개 이상의 점을 SVG로 렌더링하면 줌·패닝 시 성능이 심각하게 저하되었고, Canvas만 사용하면 클러스터 레이블과 hull 경계를 고품질로 표현하기 어려웠다.
- 해결: 점(points)은 Canvas로 고성능 렌더링하고, 클러스터 hull과 레이블은 SVG로 렌더링하는 하이브리드 아키텍처를 채택하였다. 줌 이벤트 발생 시 Canvas는 재드로, SVG는 `transform` 속성만 갱신하여 풀 리렌더를 방지하였다.
- 결과: 15,451개 점 기준 줌·패닝이 60fps로 부드럽게 동작한다.
