// DB 연결 가져오기
const db = require("../config/db");


// UMAP 좌표 전체 조회
exports.getSemanticMap = async () => {

  // 실행할 SQL
  const sql = `
    SELECT *
    FROM semantic_map
    ORDER BY id ASC
  `;

  // SQL 실행
  const [rows] = await db.query(sql);

  // 조회 결과 반환
  return rows;
};