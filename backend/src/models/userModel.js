const db = require('../config/db');

// 이메일로 유저 찾기
const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  return rows[0];
};

// 회원가입 / 소셜 유저 생성
const createUser = async (email, password_hash, name) => {
  const [result] = await db.execute(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    [email, password_hash, name]
  );

  return {
    user_id: result.insertId,
    email,
    password_hash,
    name,
  };
};

module.exports = {
  findUserByEmail,
  createUser,
};