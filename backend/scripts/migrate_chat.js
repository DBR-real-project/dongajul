require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/db');

async function migrate() {
  console.log('[migrate_chat] chat_messages 테이블 생성 중...');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      msg_id      INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT          NOT NULL,
      role        ENUM('user', 'assistant') NOT NULL,
      content     TEXT         NOT NULL,
      created_at  DATETIME     DEFAULT NOW(),
      INDEX idx_user_created (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('[migrate_chat] 완료 — chat_messages 테이블 준비됨');
  process.exit(0);
}

migrate().catch(err => {
  console.error('[migrate_chat] 오류:', err.message);
  process.exit(1);
});
