# STRAND 45 — DBR 전략 분석 플랫폼

> **팀 45** | DBR 프로젝트 (2026.05.27 기준)

---

## 프로젝트 개요

STRAND 45는 경영 전략 사례를 AI 기반으로 검색·분석·비교할 수 있는 웹 애플리케이션입니다.  
사용자는 AI 채팅으로 전략 인사이트를 얻고, 경영진 대시보드에서 KPI를 확인하며, 전략 워크스페이스에서 전략을 직접 관리할 수 있습니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 번들러 | Vite 6 |
| 스타일링 | Tailwind CSS 4 |
| UI 컴포넌트 | shadcn/ui (Radix UI 기반), MUI |
| 차트 | Recharts |
| 아이콘 | lucide-react |
| 패키지 매니저 | pnpm |

---

## 디렉토리 구조

```
프로젝트 루트
├── index.html                  # HTML 진입점 (<div id="root">)
├── package.json                # 의존성 및 스크립트 정의
├── vite.config.ts              # Vite 빌드 설정
├── postcss.config.mjs          # PostCSS (Tailwind 연동)
├── pnpm-workspace.yaml         # pnpm 워크스페이스 설정
├── default_shadcn_theme.css    # shadcn 기본 테마 CSS 변수
│
└── src/
    ├── main.tsx                # React 앱 마운트 진입점
    ├── tailwind.config.js      # Tailwind 설정
    ├── imports/
    │   └── lg.png              # 로고 이미지 (TopNavigation에서 사용)
    ├── styles/
    │   ├── index.css           # 전역 기본 스타일
    │   ├── tailwind.css        # Tailwind 지시어
    │   ├── fonts.css           # 폰트 설정
    │   └── theme.css           # 브랜드 커스텀 테마 변수
    └── app/
        ├── App.tsx             # 루트 컴포넌트 (상태 관리 + 라우팅)
        └── components/
            ├── LoginScreen.tsx         # 로그인 화면
            ├── SignupScreen.tsx        # 회원가입 화면
            ├── TopNavigation.tsx       # 상단 고정 네비게이션 바
            ├── GlobalHeader.tsx        # 좌측 AI 채팅 패널
            ├── CommandPalette.tsx      # ⌘K 전역 커맨드 팔레트
            ├── EnterpriseDashboard.tsx # 경영진 대시보드 (KPI + 전략 사례)
            ├── MainDashboard.tsx       # 데이터 분석 화면
            ├── StrategyWorkspace.tsx   # 전략 워크스페이스
            ├── CompareView.tsx         # 전략 비교 분석 화면
            ├── RiskAnalysis.tsx        # 리스크 분석 화면
            ├── SearchHistory.tsx       # 검색 히스토리 화면
            ├── ArticleDetail.tsx       # 아티클 상세 보기
            ├── NotificationView.tsx    # 알림 목록
            ├── ProfileView.tsx         # 프로필 / 설정
            ├── ContextSwitcher.tsx     # 하위 탭 전환 바
            ├── FlipCard.tsx            # CSS 3D 뒤집기 카드
            ├── figma/
            │   └── ImageWithFallback.tsx  # 이미지 로드 실패 대응
            └── ui/                     # shadcn/ui 기본 컴포넌트 모음
                ├── button.tsx
                ├── card.tsx
                ├── dialog.tsx
                ├── tabs.tsx
                └── ... (기타 Radix UI 래퍼 컴포넌트들)
```

---

## 화면(View) 구조 및 전환 흐름

```
앱 시작
  └─ 로그인 상태 확인 (localStorage 'user')
       ├─ 없음 → LoginScreen ↔ SignupScreen
       └─ 있음 → 메인 앱
                  │
                  ├─ TopNavigation (항상 표시)
                  │
                  └─ currentView 에 따라:
                       ├─ 'dashboard'      → GlobalHeader(좌) + EnterpriseDashboard(우)
                       ├─ 'analysis'       → MainDashboard
                       │    ├─ 리스크 클릭  → 'risk' (RiskAnalysis)
                       │    ├─ 아티클 클릭  → 'article' (ArticleDetail)
                       │    └─ 비교 클릭   → 'compare' (CompareView)
                       ├─ 'strategy'       → StrategyWorkspace
                       ├─ 'history'        → SearchHistory
                       ├─ 'compare'        → CompareView (items 2개 필요)
                       ├─ 'risk'           → RiskAnalysis
                       ├─ 'article'        → ArticleDetail (articleId 필요)
                       ├─ 'notifications'  → NotificationView
                       └─ 'profile'/'settings' → ProfileView
```

---

## 컴포넌트별 역할 요약

### App.tsx — 앱의 두뇌
모든 전역 상태를 관리합니다.

| 상태 | 역할 |
|------|------|
| `isLoggedIn` | 로그인 여부 (localStorage 'user' 기반) |
| `currentView` | 현재 렌더링할 화면 (ViewType) |
| `activeTab` | MainDashboard 등의 하위 탭 상태 |
| `darkMode` | 다크모드 (localStorage에 저장하여 유지) |
| `comparedItems` | CompareView에 전달할 비교 대상 2개 |
| `previousView` | 뒤로가기 시 복귀할 이전 화면 |
| `showCommandPalette` | ⌘K 팔레트 열림 상태 |
| `aiSearchQuery` | GlobalHeader → EnterpriseDashboard로 전달되는 검색어 |

---

### TopNavigation.tsx — 상단 네비게이션 바
- 로고(홈), 메뉴(5개), AI사용량 표시, 알림, 다크모드, 사용자 드롭다운
- `currentView`와 메뉴 `id`를 비교하여 활성 탭 스타일 적용
- 사용자 드롭다운: 프로필 설정, 로그아웃

---

### GlobalHeader.tsx — AI 채팅 패널
- `dashboard` 화면의 좌측 400px 고정 영역
- STRAND AI와의 채팅 인터페이스 (현재는 1.5초 딜레이 후 모의 응답)
- Enter 전송, Shift+Enter 줄바꿈
- 파일 첨부, 대화 내보내기(.txt), 공유(Web Share API), 초기화
- 사용자 검색어를 `onSearch` 콜백으로 App.tsx에 전달 → EnterpriseDashboard 필터링

---

### CommandPalette.tsx — 전역 커맨드 팔레트
- ⌘K(Mac) / Ctrl+K(Windows)로 열기, ESC 또는 백드롭 클릭으로 닫기
- '작업'과 '탐색' 카테고리로 구분된 명령 6개
- 실시간 텍스트 필터링
- 명령 실행: `window.dispatchEvent(new CustomEvent('navigate', ...))` 방식

---

### EnterpriseDashboard.tsx — 경영진 대시보드
- `dashboard` 화면의 메인 우측 콘텐츠
- KPI 4종 (성공률, 평균 ROI, 리스크 지수, 실행 가능성) + 미니 스파크라인
- 전략 사례 카드: 필터, 정렬, 확장/접기, 비교 선택(최대 2개)
- AI 전략 인사이트 패널
- `searchQuery` prop으로 GlobalHeader AI 채팅과 연동

---

### MainDashboard.tsx — 데이터 분석 화면
- AI 기반 전략 검색 (텍스트 입력 또는 파일 업로드)
- 전략 사례 카드 목록 (성공/실패 필터, 리스크 레벨 뱃지)
- 비교 선택 → CompareView / 상세보기 → ArticleDetail / 리스크 분석 → RiskAnalysis

---

### StrategyWorkspace.tsx — 전략 워크스페이스
- 전략 CRUD: 추가 모달, 상세 펼치기, 편집(이름/키워드/파일/메트릭)
- Recharts 차트: RadarChart(종합 메트릭), BarChart(항목별), LineChart
- 정렬 기준: 점수순 / ROI순 / 성장률순
- Strategy 타입: `{ id, name, keywords, content, files, metrics, score }`

---

### CompareView.tsx — 전략 비교 분석
- 2개 전략을 좌우 나란히 비교
- 브랜드 컬러로 시각적 구분: A = `#0B2F61` (네이비), B = `#C8994B` (골드)
- Bar 차트(메트릭 비교) + Radar 차트(전략 형태 비교)

---

### RiskAnalysis.tsx — 리스크 분석
- 통합 리스크 지수(0~100) + 업계 평균 대비
- 유사 성공 사례 / 실패 사례 카드
- 사례 → ArticleDetail 연결

---

### ContextSwitcher.tsx — 하위 탭
- MainDashboard, StrategyWorkspace, SearchHistory에서 공통으로 사용
- `activeTab` 상태를 App.tsx와 공유하여 탭 간 이동

---

### FlipCard.tsx — 3D 뒤집기 카드
- `front`/`back` prop에 컴포넌트를 넣으면 `isFlipped`에 따라 CSS 3D 회전
- LoginScreen에서 로그인 폼 앞/뒤 전환에 사용

---

## 인증 방식

localStorage 기반의 클라이언트 사이드 인증입니다 (실제 서버 없음).

| localStorage 키 | 내용 |
|----------------|------|
| `users` | 전체 사용자 배열 JSON |
| `user` | 현재 로그인한 사용자 JSON |
| `darkMode` | 다크모드 상태 (`true`/`false`) |

**기본 테스트 계정**
- `test@test.com` / `123456`
- `admin@startq.ai` / `admin123`

---

## 브랜드 컬러

| 용도 | 색상 코드 | 설명 |
|------|----------|------|
| 주조색 (네이비) | `#142755` / `#0B2F61` | 버튼, 활성 탭, 그라디언트 시작 |
| 보조색 (골드) | `#C8994B` | 비교 B, 호버 포인트 |
| 다크 배경 | `#0A0E1A` | 다크모드 배경 |
| 회색 계열 | `#444655` | 그라디언트 끝, 서브 텍스트 |

---

## 실행 방법

```bash
# 패키지 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build
```

---

## 주요 패턴 정리

### 다국어 처리
각 컴포넌트 내부에 `t = { ko: {...}, en: {...} }` 객체를 정의하고  
`language` prop에 따라 `text = t.ko` 또는 `text = t.en`으로 사용합니다.

### 다크모드 적용
- Tailwind의 `dark:` prefix 클래스 사용
- `App.tsx`에서 `document.documentElement.classList.toggle('dark', darkMode)`로 전역 적용
- 각 컴포넌트는 `darkMode` prop을 받아 조건부 클래스 적용

### Props 전달 패턴
여러 컴포넌트에 반복되는 props는 `commonProps` 객체로 묶어 스프레드 연산자로 전달합니다.
```tsx
const commonProps = {
  darkMode,
  onNotificationClick: () => setCurrentView('notifications'),
  onProfileClick: () => setCurrentView('profile')
};
// 사용: <MainDashboard {...commonProps} />
```

### 화면 전환 패턴
`currentView` 상태를 변경하면 `App.tsx`의 조건부 렌더링으로 해당 컴포넌트가 표시됩니다.  
뒤로가기가 필요한 화면(`CompareView`, `ArticleDetail` 등)은 이동 전 `previousView`에 현재 화면을 기록합니다.

---

*이 README는 2026년 5월 27일 기준 코드베이스를 바탕으로 작성되었습니다.*
