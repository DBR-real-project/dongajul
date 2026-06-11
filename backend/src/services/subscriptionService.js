const db = require("../config/db");

exports.subscribe = async (userId, planType = "premium") => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const insertSql = `
      INSERT INTO subscriptions
        (user_id, plan_type, status, start_date, end_date, auto_renewal, created_at, updated_at)
      VALUES
        (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), true, NOW(), NOW())
    `;

    const [result] = await conn.query(insertSql, [userId, planType]);

    await conn.query(
      `
      UPDATE users
      SET subscription_type = ?
      WHERE user_id = ?
      `,
      [planType, userId]
    );

    await conn.commit();

    return {
      subscription_id: result.insertId,
      user_id: userId,
      plan_type: planType,
      subscription_type: planType,
      status: "active",
    };
  } catch (err) {
    await conn.rollback();
    console.error("subscribe error:", err);
    throw err;
  } finally {
    conn.release();
  }
};