const bcrypt = require('bcrypt');
const { findUserByEmail, createUser } = require('../models/userModel');

// 이메일 로그인
const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('USER_NOT_FOUND');

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('INVALID_PASSWORD');

  return user;
};

// 회원가입
const registerUser = async (email, password, name) => {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error('EMAIL_EXISTS');

  const hashed = await bcrypt.hash(password, 10);
  await createUser(email, hashed, name);
};

module.exports = { loginUser, registerUser };
