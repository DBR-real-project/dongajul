require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/db');

async function migrate() {
  console.log('[migrate] chat_sessions 테이블 생성...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      session_id  INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT          NOT NULL,
      title       VARCHAR(200) DEFAULT '새 대화',
      created_at  DATETIME     DEFAULT NOW(),
      updated_at  DATETIME     DEFAULT NOW() ON UPDATE NOW(),
      INDEX idx_user_updated (user_id, updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('[migrate] chat_messages 에 session_id 컬럼 추가...');
  // 컬럼이 이미 있으면 에러 무시
  try {
    await db.execute(`ALTER TABLE chat_messages ADD COLUMN session_id INT DEFAULT NULL`);
    await db.execute(`ALTER TABLE chat_messages ADD INDEX idx_session (session_id)`);
  } catch (e) {
    if (!e.message.includes('Duplicate')) throw e;
    console.log('  (이미 존재, 스킵)');
  }

  console.log('[migrate] 완료');
  process.exit(0);
}

migrate().catch(err => {
  console.error('[migrate] 오류:', err.message);
  process.exit(1);
});
