const db = require("../config/db");

exports.createFeedback = async ({ user_id, diagnosis_id, rating, opinion_text }) => {
  const sql = `
    INSERT INTO feedbacks
      (user_id, diagnosis_id, rating, opinion_text, created_at)
    VALUES
      (?, ?, ?, ?, NOW())
  `;

  const [result] = await db.query(sql, [
    user_id,
    diagnosis_id,
    rating,
    opinion_text || null,
  ]);

  return {
    feedback_id: result.insertId,
    user_id,
    diagnosis_id,
    rating,
    opinion_text,
  };
};