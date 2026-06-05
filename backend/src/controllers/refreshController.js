const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { makeToken } = require('../services/authService');
const { findUserById } = require('../models/userModel');

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ||
  (process.env.JWT_SECRET + '_refresh');

/**
 * POST /api/auth/refresh
 * body: { refreshToken }
 * → 새 accessToken 발급
 */
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'refreshToken이 없습니다.' });

  try {
    // 1. 서명 검증
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    // 2. DB에서 토큰 유효성 확인
    const [rows] = await db.execute(
      `SELECT * FROM refresh_tokens
       WHERE token = ? AND revoked = 0 AND expires_at > NOW()
       LIMIT 1`,
      [refreshToken]
    );

    if (!rows.length) {
      return res.status(401).json({ message: '만료되었거나 유효하지 않은 refreshToken입니다.' });
    }

    const user = await findUserById(payload.user_id);
    if (!user) return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });

    const newAccessToken = makeToken(user);
    res.json({ success: true, token: newAccessToken });

  } catch (err) {
    console.error('[refresh]', err.message);
    res.status(401).json({ message: '유효하지 않은 refreshToken입니다.' });
  }
};

/**
 * POST /api/auth/logout
 * body: { refreshToken }
 * → refreshToken revoke
 */
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      await db.execute(
        'UPDATE refresh_tokens SET revoked = 1 WHERE token = ?',
        [refreshToken]
      );
    } catch (e) { /* 실패해도 클라이언트는 로그아웃 */ }
  }
  res.json({ success: true });
};
