const db = require('../config/db');

/**
 * 알림 생성 헬퍼
 * @param {number|null} userId
 * @param {'진단'|'보안'|'전략'|'업그레이드'} type
 * @param {string} message
 */
async function createNotification(userId, type, message) {
  if (!userId) return;
  try {
    await db.execute(
      'INSERT INTO notifications (user_id, notification_type, message, is_read, created_at) VALUES (?, ?, ?, 0, NOW())',
      [userId, type, message]
    );
  } catch (err) {
    // 알림 실패는 진단 흐름을 막지 않음
    console.error('[createNotification] 실패:', err.message);
  }
}

module.exports = { createNotification };
