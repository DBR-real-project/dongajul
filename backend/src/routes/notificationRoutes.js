const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const db = require('../config/db');

// 알림 목록 가져오기
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '알림 조회 실패' });
  }
});

// 모든 알림 읽음 처리
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    res.json({ success: true, message: '읽음 처리 완료' });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;