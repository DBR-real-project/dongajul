const db = require('../config/db');

// 1. 이메일로 유저 조회
const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

// 2. user_id로 유저 조회 (중복 선언 방지를 위해 이 하나만 남기세요)
const findUserById = async (user_id) => {
  const [rows] = await db.execute(
    `
    SELECT 
      user_id,
      email,
      nickname,
      user_type,
      subscription_type,
      created_at,
      last_login_at
    FROM users
    WHERE user_id = ?
    `,
    [user_id]
  );
  return rows[0];
};

// 3. 유저 생성 (DB 컬럼에 맞게 password_hash 포함)
const createUser = async (email, password_hash, nickname) => {
  const [result] = await db.execute(
    `
    INSERT INTO users (email, password_hash, nickname)
    VALUES (?, ?, ?)
    `,
    [email, password_hash, nickname]
  );

  return {
    user_id: result.insertId,
    email,
    nickname
  };
};

// 4. 닉네임 수정
const updateUserNickname = async (user_id, nickname) => {
  await db.execute(
    `
    UPDATE users
    SET nickname = ?
    WHERE user_id = ?
    `,
    [nickname, user_id]
  );

  // 수정 후 최신 정보를 가져와서 반환
  return findUserById(user_id);
};

// 5. refresh_token 저장
const saveRefreshToken = async (user_id, refresh_token) => {
  await db.execute(
    'UPDATE users SET refresh_token = ? WHERE user_id = ?',
    [refresh_token, user_id]
  );
};

// 6. refresh_token으로 유저 조회
const findByRefreshToken = async (refresh_token) => {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE refresh_token = ?',
    [refresh_token]
  );
  return rows[0];
};

// 7. refresh_token 초기화 (로그아웃)
const clearRefreshToken = async (user_id) => {
  await db.execute(
    'UPDATE users SET refresh_token = NULL WHERE user_id = ?',
    [user_id]
  );
};

// 모든 함수 내보내기
module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserNickname,
  saveRefreshToken,
  findByRefreshToken,
  clearRefreshToken,
};