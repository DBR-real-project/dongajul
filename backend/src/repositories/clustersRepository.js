// DB 연결 가져오기
const db = require("../config/db");


// 클러스터 전체 조회
exports.getClusters = async () => {

  // 실행할 SQL
  const sql = `
    SELECT *
    FROM clusters
    ORDER BY cluster_id ASC
  `;

  // SQL 실행
  const [rows] = await db.query(sql);

  // 조회 결과 반환
  return rows;
};