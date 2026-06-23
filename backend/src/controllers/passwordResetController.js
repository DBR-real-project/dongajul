const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { findUserByEmail } = require('../models/userModel');
const { sendPasswordResetEmail } = require('../services/emailService');

/**
 * POST /api/auth/forgot-password
 * body: { email }
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: '이메일을 입력해주세요.' });

  try {
    const user = await findUserByEmail(email);

    // 유저가 없어도 동일 응답 (보안상)
    if (!user) {
      return res.json({ success: true, message: '이메일이 존재하면 재설정 링크를 발송했습니다.' });
    }

    // 기존 토큰 만료 처리
    await db.execute(
      'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
      [user.user_id]
    );

    // 새 토큰 생성 (64자 hex)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간

    await db.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.user_id, token, expiresAt]
    );

    await sendPasswordResetEmail(email, token);

    res.json({ success: true, message: '이메일이 존재하면 재설정 링크를 발송했습니다.' });
  } catch (err) {
    console.error('[forgotPassword]', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * POST /api/auth/reset-password
 * body: { token, newPassword }
 */
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: '토큰과 새 비밀번호를 입력해주세요.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: '비밀번호는 6자 이상이어야 합니다.' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT prt.*, u.user_id
       FROM password_reset_tokens prt
       INNER JOIN users u ON prt.user_id = u.user_id
       WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({ message: '유효하지 않거나 만료된 링크입니다.' });
    }

    const { user_id, id: tokenId } = rows[0];

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashed, user_id]);
    await db.execute('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [tokenId]);

    res.json({ success: true, message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.' });
  } catch (err) {
    console.error('[resetPassword]', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
