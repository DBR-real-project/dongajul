# 동아줄 프로젝트 — 개발환경 설정 가이드

> 처음 합류한 팀원이 로컬에서 개발환경을 구성하는 방법을 단계별로 설명합니다.

---

## 목차

1. [사전 설치 프로그램](#1-사전-설치-프로그램)
2. [저장소 클론](#2-저장소-클론)
3. [환경변수 설정](#3-환경변수-설정)
4. [내 담당 폴더에 Dockerfile 추가](#4-내-담당-폴더에-dockerfile-추가)
5. [docker-compose.yml 주석 해제](#5-docker-composeyml-주석-해제)
6. [전체 실행 및 확인](#6-전체-실행-및-확인)
7. [자주 쓰는 명령어 모음](#7-자주-쓰는-명령어-모음)
8. [문제 해결 FAQ](#8-문제-해결-faq)

---

## 1. 사전 설치 프로그램

아래 프로그램이 없으면 먼저 설치하세요.

| 프로그램 | 버전 | 다운로드 |
|---------|------|---------|
| Git | 최신 | https://git-scm.com |
| Docker Desktop | 최신 | https://www.docker.com/products/docker-desktop |
| Node.js | 20 LTS | https://nodejs.org (백엔드/프론트엔드 팀) |

> **Docker Desktop 설치 확인 방법**
> 터미널(PowerShell)을 열고 아래 명령어를 실행해서 버전이 출력되면 OK
> ```
> docker --version
> docker compose version
> ```

---

## 2. 저장소 클론

```bash
# 작업하고 싶은 폴더로 이동 후 실행
git clone https://github.com/jaehan9602211-eng/DBR_project.git

# 프로젝트 폴더 진입
cd DBR_project

# develop 브랜치로 이동 (항상 develop 기준으로 작업)
git checkout develop
```

클론 후 폴더 구조는 이렇습니다:

```
DBR_project/
├── frontend/        ← 최규원 / 이경철 담당 (React + Vite)
├── backend/         ← 김동현 / 김문수 담당 (Node.js + Express)
├── ai_server/       ← 이정완 담당 (FastAPI + SBERT + FAISS)
├── 데이터처리/
├── docker-compose.yml
├── .env.example
└── SETUP.md         ← 지금 읽고 있는 파일
```

---

## 3. 환경변수 설정

`.env.example` 파일을 복사해서 `.env` 파일을 만들어야 합니다.

```bash
# Windows PowerShell
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

`.env` 파일을 열어서 아래 항목을 채워주세요:

```env
# OpenAI API 키 (이정완한테 받기)
OPENAI_API_KEY=sk-proj-여기에_API키_입력

# DB 비밀번호 (그냥 기본값 써도 로컬에서는 OK)
MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=dongajul
MYSQL_USER=dongajul
MYSQL_PASSWORD=dongajul1234
MYSQL_HOST=db
MYSQL_PORT=3306
```

> `.env` 파일은 절대 GitHub에 올리면 안 됩니다. `.gitignore`에 등록되어 있어서 자동으로 제외됩니다.

---

## 4. 내 담당 폴더에 Dockerfile 추가

### 백엔드 팀 (김동현 / 김문수)

`backend/` 폴더 안에 `Dockerfile`을 만드세요.

```
backend/
├── Dockerfile       ← 새로 만들기
├── package.json
├── src/
│   └── index.js
└── ...
```

**backend/Dockerfile 예시:**

```dockerfile
FROM node:20-slim

WORKDIR /app

# 의존성 먼저 설치 (레이어 캐시 활용)
COPY package*.json ./
RUN npm install

# 소스 복사
COPY . .

EXPOSE 3001

CMD ["node", "src/index.js"]
```

> `package.json`이 아직 없으면 먼저 `npm init`으로 생성하세요.

---

### 프론트엔드 팀 (최규원 / 이경철)

`frontend/` 폴더 안에 `Dockerfile`을 만드세요.

```
frontend/
├── Dockerfile       ← 새로 만들기
├── package.json
├── index.html
├── vite.config.ts
└── src/
```

**frontend/Dockerfile 예시:**

```dockerfile
# 1단계: 빌드
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2단계: nginx로 정적파일 서빙
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 5. docker-compose.yml 주석 해제

Dockerfile이 준비됐으면 프로젝트 루트의 `docker-compose.yml`을 열어서 내 담당 서비스 주석을 해제합니다.

### 백엔드 팀

아래 부분의 `#`을 전부 지워주세요:

```yaml
# 변경 전
  # backend:
  #   build: ./backend
  #   container_name: dongajul_backend
  #   restart: unless-stopped
  #   ports:
  #     - "3001:3001"
  #   env_file: .env
  #   depends_on:
  #     db:
  #       condition: service_healthy
  #     ai_server:
  #       condition: service_started

# 변경 후
  backend:
    build: ./backend
    container_name: dongajul_backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      ai_server:
        condition: service_started
```

### 프론트엔드 팀

아래 부분의 `#`을 전부 지워주세요:

```yaml
# 변경 전
  # frontend:
  #   build:
  #     context: ./frontend
  #   container_name: dongajul_frontend
  #   restart: unless-stopped
  #   ports:
  #     - "3000:3000"
  #   depends_on:
  #     - backend

# 변경 후
  frontend:
    build:
      context: ./frontend
    container_name: dongajul_frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

---

## 6. 전체 실행 및 확인

### 실행

```bash
# 프로젝트 루트에서 실행 (DBR_project/ 폴더)
docker compose up --build
```

처음 실행하면 이미지 빌드 때문에 5~10분 걸릴 수 있습니다. 기다리세요.

### 정상 실행 확인

아래 주소로 접속해서 응답이 오면 성공입니다:

| 서비스 | 주소 | 확인 방법 |
|--------|------|----------|
| MySQL DB | localhost:3306 | MySQL Workbench로 접속 |
| AI Server | http://localhost:8000/health | 브라우저에서 `{"status":"ok"}` 출력 |
| Backend | http://localhost:3001 | 브라우저 접속 |
| Frontend | http://localhost:3000 | 브라우저 접속 |

### 로그 확인

```bash
# 특정 서비스 로그만 보기
docker compose logs backend
docker compose logs frontend
docker compose logs ai_server
docker compose logs db
```

---

## 7. 자주 쓰는 명령어 모음

```bash
# 전체 빌드 & 실행
docker compose up --build

# 백그라운드에서 실행 (터미널 안 막힘)
docker compose up -d --build

# 전체 종료
docker compose down

# 특정 서비스만 재시작
docker compose restart backend

# 실행 중인 컨테이너 목록
docker compose ps

# 컨테이너 내부 접속 (디버깅용)
docker compose exec backend sh
docker compose exec db bash

# MySQL 접속
docker compose exec db mysql -u dongajul -pdongajul1234 dongajul
```

---

## 8. 문제 해결 FAQ

**Q. `docker compose up` 했더니 포트 충돌 에러가 납니다**

로컬에서 이미 같은 포트를 쓰는 프로그램이 있는 경우입니다.
`docker-compose.yml`에서 왼쪽 포트 번호를 바꿔주세요.

```yaml
ports:
  - "3002:3001"  # 로컬 3002 → 컨테이너 3001
```

---

**Q. `Cannot find module` 에러가 납니다**

node_modules가 컨테이너에 설치가 안 된 경우입니다.

```bash
docker compose down
docker compose up --build  # 반드시 --build 붙이기
```

---

**Q. DB에 접속이 안 됩니다**

컨테이너 내에서 DB 주소는 `localhost`가 아니라 `db`입니다.
`.env`에서 확인하세요:

```env
MYSQL_HOST=db   # localhost 아님!
```

---

**Q. 코드 수정했는데 반영이 안 됩니다**

개발 중에는 `--build` 옵션을 붙여서 재빌드해야 합니다:

```bash
docker compose up --build
```

또는 개발 편의를 위해 볼륨 마운트를 추가하면 코드 수정이 자동 반영됩니다 (이정완에게 문의).

---

**Q. Git pull 후에 실행이 안 됩니다**

의존성이 변경됐을 수 있습니다. 이미지를 새로 빌드하세요:

```bash
docker compose down
docker compose up --build
```

---

## 브랜치 전략 (필수 숙지)

```
main        ← 최종 배포용 (직접 커밋 X)
  └── develop   ← 팀 통합 브랜치 (PR로만 병합)
        ├── feat/backend-auth    ← 기능별 개발 브랜치
        ├── feat/frontend-login
        └── feat/ai-diagnosis
```

**작업 순서:**

```bash
# 1. develop 최신화
git checkout develop
git pull origin develop

# 2. 내 기능 브랜치 생성
git checkout -b feat/내기능이름

# 3. 작업 후 커밋
git add .
git commit -m "feat: 로그인 기능 구현"

# 4. push
git push origin feat/내기능이름

# 5. GitHub에서 develop으로 PR 생성
```

---

문의사항은 이정완(PM)에게 연락하세요.
