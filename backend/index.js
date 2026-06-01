require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ── 미들웨어 ──────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ── 라우터 등록 ───────────────────────────────────────────────────────
// 인증 (카카오/구글 OAuth)
const authRoutes    = require('./src/routes/authRoutes');
// AI 전략 진단 → ai_server(8000) 브릿지 (RiskAnalysis.tsx "분석 실행")
const diagnoseRoutes = require('./src/routes/diagnoseRoutes');
// DBR 기사 목록/상세 (MainDashboard.tsx, ArticleDetail.tsx)
const articleRoutes  = require('./src/routes/articleRoutes');

app.use('/api/auth',     authRoutes);
app.use('/api/diagnose', diagnoseRoutes);
app.use('/api/articles', articleRoutes);

// ── 헬스체크 ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', port: process.env.PORT || 3001 }));

// ── 서버 시작 ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`   AI server target: ${process.env.AI_SERVER_URL || 'http://localhost:8000'}`);
});
