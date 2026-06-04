const db = require("../config/db");

/**
 * 특정 사용자의 진단 결과 기록 전체 조회 (JOIN)
 * @param {string|number} userId - 로그인한 사용자의 고유 ID
 */
exports.getHistory = async (userId) => {
    const sql = `
        SELECT 
            r.result_id,
            r.diagnosis_id,
            r.risk_score,
            CASE 
                WHEN r.risk_score >= 0.7 THEN 'high'
                WHEN r.risk_score >= 0.4 THEN 'medium'
                ELSE 'low'
            END AS risk_level,
            r.created_at,
            d.input_text
        FROM analysis_results r
        INNER JOIN diagnosis_requests d ON r.diagnosis_id = d.diagnosis_id
        WHERE d.user_id = ?
        ORDER BY r.created_at DESC
    `;

    try {
        const [rows] = await db.query(sql, [userId]);
        return rows;
    } catch (error) {
        throw error;
    }
};