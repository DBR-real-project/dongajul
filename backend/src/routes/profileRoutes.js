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

    // 2. 중요: 단순 비교(==)가 아닌 bcrypt.compare를 사용해야 합니다.
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


module.exports = router;