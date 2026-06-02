// DB 연결 가져오기
const db = require("../config/db");


// 진단 기록 전체 조회
exports.getHistory = async () => {

  // 실행할 SQL
  const sql = `
    SELECT *
    FROM analysis_results
    ORDER BY created_at DESC
  `;

  // SQL 실행
  const [rows] = await db.query(sql);

  // 조회 결과 반환
  return rows;
};