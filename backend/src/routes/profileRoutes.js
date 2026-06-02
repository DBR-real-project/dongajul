const express = require('express');
const router = express.Router();

// controller
const profileController = require('../controllers/profileController');

// JWT 인증 middleware
const { verifyToken } = require('../middlewares/auth');

// ─────────────────────────────────────────────
// 내 정보 조회
// GET /api/profile
// Authorization: Bearer 토큰
// ─────────────────────────────────────────────
router.get(
  '/',
  verifyToken,
  profileController.getProfile
);

// ─────────────────────────────────────────────
// 내 정보 수정
// PUT /api/profile
// Body: { "nickname": "새닉네임" }
// Authorization: Bearer 토큰
// ─────────────────────────────────────────────
router.put(
  '/',
  verifyToken,
  profileController.updateProfile
);

module.exports = router;