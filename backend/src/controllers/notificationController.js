const db = require('../config/db');

// 내 알림 목록 가져오기
exports.getNotifications = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '알림 조회 실패' });
  }
};

// 모든 알림 읽음 처리
exports.markAllAsRead = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );
    res.json({ success: true, message: '모든 알림 읽음 처리 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '읽음 처리 실패' });
  }
};