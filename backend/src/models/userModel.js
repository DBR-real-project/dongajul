import { db } from '../config/db.js';

// 이메일로 유저 찾기
export const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  return rows[0];
};

// 회원가입
export const createUser = async (email, password_hash, nickname) => {
  await db.execute(
    'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)',
    [email, password_hash, nickname]
  );
};