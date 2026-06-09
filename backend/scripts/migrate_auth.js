/**
 * DB 마이그레이션: auth 관련 스키마 변경
 * 1. users.password_hash → NULL 허용 (소셜 로그인 지원)
 * 2. users.refresh_token 컬럼 추가 (JWT Refresh Token 저장)
 *
 * 실행: node backend/scripts/migrate_auth.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  console.log('✅ DB 연결 성공');

  try {
    // 1. password_hash NULL 허용
    console.log('\n[1] users.password_hash → NULL 허용...');
    await conn.execute(`
      ALTER TABLE users
      MODIFY COLUMN password_hash VARCHAR(255) NULL
    `);
    console.log('   ✅ 완료');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('   ⏭ 이미 NULL 허용됨');
    } else {
      console.error('   ❌ 실패:', e.message);
    }
  }

  try {
    // 2. refresh_token 컬럼 추가 (이미 있으면 skip)
    console.log('\n[2] users.refresh_token 컬럼 추가...');
    await conn.execute(`
      ALTER TABLE users
      ADD COLUMN refresh_token VARCHAR(512) NULL DEFAULT NULL
    `);
    console.log('   ✅ 완료');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
      console.log('   ⏭ 이미 존재함');
    } else {
      console.error('   ❌ 실패:', e.message);
    }
  }

  // 현재 스키마 확인
  const [cols] = await conn.execute(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    AND COLUMN_NAME IN ('password_hash', 'refresh_token')
  `, [process.env.MYSQL_DATABASE]);

  console.log('\n[users 컬럼 확인]');
  cols.forEach(c => {
    console.log(`  ${c.COLUMN_NAME}: ${c.COLUMN_TYPE} (NULL: ${c.IS_NULLABLE})`);
  });

  await conn.end();
  console.log('\n✅ 마이그레이션 완료');
}

main().catch(e => {
  console.error('마이그레이션 실패:', e);
  process.exit(1);
});
