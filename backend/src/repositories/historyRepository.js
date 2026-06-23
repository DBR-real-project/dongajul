const db = require("../config/db");

/**
 * 특정 사용자의 진단 결과 기록 전체 조회
 * GET /api/history?user_id=1
 */
exports.getHistory = async (userId) => {
  const sql = `
    SELECT
      d.diagnosis_id,
      COALESCE(r.risk_score, 0) AS risk_score,
      CASE
        WHEN COALESCE(r.risk_score, 0) >= 0.7 THEN 'high'
        WHEN COALESCE(r.risk_score, 0) >= 0.4 THEN 'medium'
        ELSE 'low'
      END AS risk_level,
      d.created_at,
      d.input_text
    FROM diagnosis_requests d
    LEFT JOIN analysis_results r ON d.diagnosis_id = r.diagnosis_id
    WHERE d.user_id = ?
    ORDER BY d.created_at DESC
    LIMIT 50
  `;

  const [rows] = await db.query(sql, [userId]);
  return rows;
};

/**
 * 특정 진단 결과 상세 조회
 * GET /api/history/:id
 */
exports.getHistoryDetail = async (resultId) => {
  const sql = `
    SELECT
      r.result_id,
      r.diagnosis_id,
      COALESCE(r.risk_score, 0) AS risk_score,
      CASE
        WHEN COALESCE(r.risk_score, 0) >= 0.7 THEN 'high'
        WHEN COALESCE(r.risk_score, 0) >= 0.4 THEN 'medium'
        ELSE 'low'
      END AS risk_level,
      COALESCE(r.created_at, d.created_at) AS created_at,
      d.user_id,
      d.input_text
    FROM diagnosis_requests d
    LEFT JOIN analysis_results r
      ON d.diagnosis_id = r.diagnosis_id
    WHERE d.diagnosis_id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [resultId]);

  if (!rows.length) {
    return null;
  }

  return rows[0];
};