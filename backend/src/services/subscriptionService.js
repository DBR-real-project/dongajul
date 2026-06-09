const db = require("../config/db");
const subscriptionModel = require("../models/subscriptionModel");
const userModel = require("../models/userModel");

exports.subscribe = async (userId, planType) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. 구독 생성
    const insertSql = `
      INSERT INTO subscriptions
        (user_id, plan_type, status, start_date, end_date, auto_renewal, created_at, updated_at)
      VALUES
        (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), true, NOW(), NOW())
    `;
    const [result] = await conn.query(insertSql, [userId, planType]);

    // 2. users 업데이트
    const updateSql = `
      UPDATE users
      SET subscription_type = ?
      WHERE user_id = ?
    `;
    await conn.query(updateSql, [planType, userId]);

    await conn.commit();

    return {
      subscription_id: result.insertId,
      user_id: userId,
      plan_type: planType,
      status: "active",
    };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.cancelSubscription = async (userId) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. 구독 취소
    const sql = `
      UPDATE subscriptions
      SET status = 'cancelled',
          auto_renewal = false,
          updated_at = NOW()
      WHERE user_id = ?
        AND status = 'active'
    `;
    const [result] = await conn.query(sql, [userId]);

    // 2. users free로 변경
    await conn.query(
      `UPDATE users SET subscription_type = 'free' WHERE user_id = ?`,
      [userId]
    );

    await conn.commit();

    return result.affectedRows;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};