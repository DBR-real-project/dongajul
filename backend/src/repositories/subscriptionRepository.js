const db = require("../config/db");

exports.findActiveByUserId = async (userId) => {
  const sql = `
    SELECT *
    FROM subscriptions
    WHERE user_id = ?
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [userId]);
  return rows[0];
};

exports.createSubscription = async (userId, planType) => {
  const sql = `
    INSERT INTO subscriptions
      (user_id, plan_type, status, start_date, end_date, auto_renewal, created_at, updated_at)
    VALUES
      (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 1, NOW(), NOW())
  `;

  const [result] = await db.query(sql, [userId, planType]);

  return {
    subscription_id: result.insertId,
    user_id: userId,
    plan_type: planType,
    status: "active",
  };
};

exports.getSubscriptionByUserId = async (userId) => {
  const sql = `
    SELECT *
    FROM subscriptions
    WHERE user_id = ?
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [userId]);
  return rows[0];
};

exports.updateUserSubscriptionType = async (userId, subscriptionType) => {
  const sql = `
    UPDATE users
    SET subscription_type = ?
    WHERE user_id = ?
  `;

  const [result] = await db.query(sql, [subscriptionType, userId]);
  return result.affectedRows;
};

exports.cancelSubscription = async (userId) => {
  const sql = `
    UPDATE subscriptions
    SET status = 'cancelled',
        auto_renewal = 0,
        updated_at = NOW()
    WHERE user_id = ?
      AND status = 'active'
  `;

  const [result] = await db.query(sql, [userId]);
  return result.affectedRows;
};