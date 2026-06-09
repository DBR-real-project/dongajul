require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// ── 환경 변수 기본값 ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── 미들웨어 ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 라우터 등록 ───────────────────────────────────────────────────────
// 인증: 이메일 로그인/회원가입 + 카카오/구글/네이버 OAuth
const authRoutes = require('./src/routes/authRoutes');

// AI 전략 진단 → ai_server(8000) 브릿지
const diagnoseRoutes = require('./src/routes/diagnoseRoutes');

// DBR 기사 목록/상세
const articleRoutes = require('./src/routes/articleRoutes');

// 분석 히스토리
const historyRoutes = require('./src/routes/historyRoutes');

// 클러스터 목록
const clustersRoutes = require('./src/routes/clustersRoutes');

// 시맨틱 맵
const semanticMapRoutes = require('./src/routes/semanticMapRoutes');

// 내 정보 조회
const profileRoutes = require('./src/routes/profileRoutes');

// 알람 센터
const notificationRoutes = require('./src/routes/notificationRoutes');

// 구독 서비스
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');

// 피드백 서비스
const feedbackRoutes = require('./src/routes/feedbackRoutes');

// ── API 라우트 연결 ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/diagnose', diagnoseRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/clusters', clustersRoutes);
app.use('/api/semantic-map', semanticMapRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/feedbacks', feedbackRoutes);

// ── 기본 라우트 ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Dongajul backend server is running',
    port: PORT,
  });
});

// ── 헬스체크 ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    port: PORT,
    aiServerTarget: process.env.AI_SERVER_URL || 'http://localhost:8000',
  });
});

// ── 404 처리 ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: '요청한 API 경로를 찾을 수 없습니다.',
    path: req.originalUrl,
  });
});

// ── 에러 처리 ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);

  res.status(err.status || 500).json({
    message: err.message || '서버 오류가 발생했습니다.',
  });
});

// ── 서버 시작 ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`✅ Frontend origin: ${FRONTEND_URL}`);
  console.log(`✅ Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`✅ Diagnose routes: http://localhost:${PORT}/api/diagnose`);
  console.log(`✅ Article routes: http://localhost:${PORT}/api/articles`);
  console.log(`✅ History routes: http://localhost:${PORT}/api/history`);
  console.log(`✅ Clusters routes: http://localhost:${PORT}/api/clusters`);
  console.log(`✅ Semantic map routes: http://localhost:${PORT}/api/semantic-map`);
  console.log(`✅ Profile routes: http://localhost:${PORT}/api/profile`);
  console.log(`✅ AI server target: ${process.env.AI_SERVER_URL || 'http://localhost:8000'}`);
});