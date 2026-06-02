const db = require('../config/db');

// ─────────────────────────────────────────────
// 이메일로 유저 조회
// 로그인 / 회원가입 중복 체크 등에 사용
// ─────────────────────────────────────────────
const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  return rows[0];
};

// ─────────────────────────────────────────────
// user_id로 유저 조회
// 내 정보 조회 API (/api/profile) 에서 사용
// 비밀번호 해시는 절대 응답하지 않음
// ─────────────────────────────────────────────
const findUserById = async (user_id) => {
  const [rows] = await db.execute(
    `
    SELECT 
      user_id,
      email,
      nickname
    FROM users
    WHERE user_id = ?
    `,
    [user_id]
  );

  return rows[0];
};

// ─────────────────────────────────────────────
// 회원가입 / 소셜 로그인 유저 생성
// password_hash:
// - 일반 회원가입 → bcrypt 해시 저장
// - 소셜 로그인 → null 가능
// ─────────────────────────────────────────────
const createUser = async (email, password_hash, nickname) => {
  const [result] = await db.execute(
    `
    INSERT INTO users (
      email,
      password_hash,
      nickname
    )
    VALUES (?, ?, ?)
    `,
    [email, password_hash, nickname]
  );

  // 생성된 유저 정보 반환
  return {
    user_id: result.insertId,
    email,
    password_hash,
    nickname,
  };
};

// ─────────────────────────────────────────────
// 닉네임 수정
// PUT /api/profile 에서 사용
// 로그인한 사용자의 nickname만 수정
// ─────────────────────────────────────────────
const updateUserNickname = async (user_id, nickname) => {
  await db.execute(
    `
    UPDATE users
    SET nickname = ?
    WHERE user_id = ?
    `,
    [nickname, user_id]
  );

  // 수정 후 최신 유저 정보 다시 조회해서 반환
  return findUserById(user_id);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserNickname,
};