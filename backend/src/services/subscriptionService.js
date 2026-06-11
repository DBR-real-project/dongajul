const db = require("../config/db");

exports.subscribe = async (userId, planType = "premium") => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const insertSql = `
      INSERT INTO subscriptions
        (user_id, plan_type, status, start_date, end_date, auto_renewal, created_at, updated_at)
      VALUES
        (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 1, NOW(), NOW())
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
      auto_renewal: 1,
    };
  } catch (err) {
    await conn.rollback();
    console.error("subscribe transaction error:", err);
    throw err;
  } finally {
    conn.release();
  }
};

exports.syncUserSubscriptionType = async (userId, subscriptionType = "premium") => {
  const sql = `
    UPDATE users
    SET subscription_type = ?
    WHERE user_id = ?
  `;

  const [result] = await db.query(sql, [subscriptionType, userId]);
  return result.affectedRows;
};

exports.cancelSubscription = async (userId) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const cancelSql = `
      UPDATE subscriptions
      SET status = 'cancelled',
          auto_renewal = 0,
          updated_at = NOW()
      WHERE user_id = ?
        AND status = 'active'
    `;

    const [result] = await conn.query(cancelSql, [userId]);

    if (result.affectedRows > 0) {
      await conn.query(
        `
        UPDATE users
        SET subscription_type = 'free'
        WHERE user_id = ?
        `,
        [userId]
      );
    }

    await conn.commit();

    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    console.error("cancelSubscription transaction error:", err);
    throw err;
  } finally {
    conn.release();
  }
};