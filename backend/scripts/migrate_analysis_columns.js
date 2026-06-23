/**
 * analysis_results 테이블에 query_umap_x/y, query_cluster_id, report_json 컬럼 추가
 * 실행: node backend/scripts/migrate_analysis_columns.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/db');

async function migrate() {
  const conn = await db.getConnection();
  try {
    const columns = [
      `ALTER TABLE analysis_results ADD COLUMN query_umap_x FLOAT NULL AFTER risk_score`,
      `ALTER TABLE analysis_results ADD COLUMN query_umap_y FLOAT NULL AFTER query_umap_x`,
      `ALTER TABLE analysis_results ADD COLUMN query_cluster_id INT NULL AFTER query_umap_y`,
      `ALTER TABLE analysis_results ADD COLUMN report_json MEDIUMTEXT NULL AFTER failure_keywords`,
    ];

    for (const sql of columns) {
      try {
        await conn.execute(sql);
        console.log('OK:', sql.split(' ').slice(0, 7).join(' '));
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log('SKIP (already exists):', sql.split(' ')[6]);
        } else {
          throw e;
        }
      }
    }
    console.log('\n마이그레이션 완료');
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate().catch((e) => {
  console.error('마이그레이션 실패:', e.message);
  process.exit(1);
});
