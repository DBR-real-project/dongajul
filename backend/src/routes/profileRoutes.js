const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

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

// ... 상단 생략 ...

// ─────────────────────────────────────────────
// 비밀번호 변경
// PUT /api/profile/password
// ─────────────────────────────────────────────
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.user_id || req.user.id;

    // DB에서 해시된 비밀번호 가져오기
    const [rows] = await db.query('SELECT password_hash FROM users WHERE user_id = ?', [userId]);
    const user = rows[0];

<<<<<<< HEAD
    // 2. 중요: 단순 비교(==)가 아닌 bcrypt.compare를 사용해야 합니다.
=======
    if (!user || !user.password_hash) {
      return res.status(400).json({ success: false, message: '비밀번호가 설정되지 않은 계정입니다.' });
    }

>>>>>>> 06d5573372fae868d35f2d4b6bfc609d225abbc7
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      // 400 에러가 난다면 여기서 걸리는 것입니다.
      return res.status(400).json({ 
        success: false, 
        message: '현재 비밀번호가 일치하지 않습니다.' 
      });
    }

    // 3. 새 비밀번호도 해싱해서 저장
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashedNewPassword, userId]);

    return res.json({ success: true, message: '비밀번호 변경 성공' });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '서버 에러' });
  }
});


<<<<<<< HEAD
=======
// ─────────────────────────────────────────────
// 알림 설정 조회
// GET /api/profile/notifications
// ─────────────────────────────────────────────
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const [rows] = await db.query(
      'SELECT notif_email, notif_push, notif_marketing FROM users WHERE user_id = ?',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[알림설정 조회]', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────
// 알림 설정 변경
// PATCH /api/profile/notifications
// Body: { notif_email?, notif_push?, notif_marketing? }
// ─────────────────────────────────────────────
router.patch('/notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { notif_email, notif_push, notif_marketing } = req.body;

    const updates = [];
    const values = [];
    if (notif_email !== undefined)     { updates.push('notif_email = ?');     values.push(notif_email     ? 1 : 0); }
    if (notif_push !== undefined)      { updates.push('notif_push = ?');      values.push(notif_push      ? 1 : 0); }
    if (notif_marketing !== undefined) { updates.push('notif_marketing = ?'); values.push(notif_marketing ? 1 : 0); }

    if (!updates.length) return res.status(400).json({ message: '변경할 항목이 없습니다.' });

    values.push(userId);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, values);
    res.json({ success: true, message: '알림 설정이 저장되었습니다.' });
  } catch (err) {
    console.error('[알림설정 변경]', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});


>>>>>>> 06d5573372fae868d35f2d4b6bfc609d225abbc7
module.exports = router;