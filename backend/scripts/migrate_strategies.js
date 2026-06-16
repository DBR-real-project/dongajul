require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/db');

async function migrate() {
  console.log('strategies 테이블 마이그레이션 시작...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS strategies (
      strategy_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      content TEXT,
      keywords JSON DEFAULT NULL,
      metrics_conversion FLOAT DEFAULT 5.0,
      metrics_roi FLOAT DEFAULT 100,
      metrics_growth FLOAT DEFAULT 10,
      metrics_cost FLOAT DEFAULT 1000,
      metrics_engagement FLOAT DEFAULT 5.0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  console.log('✅ strategies 테이블 생성 완료');
  process.exit(0);
}

migrate().catch(e => {
  console.error('마이그레이션 실패:', e);
  process.exit(1);
});
