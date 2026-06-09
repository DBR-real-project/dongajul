const db = require("../config/db");

// 1️⃣ 현재 활성 구독 조회
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

// 2️⃣ 구독 생성
exports.createSubscription = async (conn, userId, planType) => {
  const sql = `
    INSERT INTO subscriptions
      (user_id, plan_type, status, start_date, end_date, auto_renewal, created_at, updated_at)
    VALUES
      (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), true, NOW(), NOW())
  `;

  const [result] = await conn.query(sql, [userId, planType]);

  return {
    subscription_id: result.insertId,
    user_id: userId,
    plan_type: planType,
    status: "active",
  };
};

// 3️⃣ 유저의 최신 구독 조회 (상태 상관없이)
exports.getLatestByUserId = async (userId) => {
  const sql = `
    SELECT *
    FROM subscriptions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [userId]);
  return rows[0];
};

// 4️⃣ 구독 취소
exports.cancelActiveSubscription = async (conn, userId) => {
  const sql = `
    UPDATE subscriptions
    SET status = 'cancelled',
        auto_renewal = false,
        updated_at = NOW()
    WHERE user_id = ?
      AND status = 'active'
  `;

  const [result] = await conn.query(sql, [userId]);
  return result.affectedRows;
};