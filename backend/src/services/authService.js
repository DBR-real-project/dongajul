const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/userModel');

const makeToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      name: user.nickname || user.name || user.email?.split('@')[0],
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const makeRefreshToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id },
    process.env.REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );
};

// 로그인
const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('USER_NOT_FOUND');

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('INVALID_PASSWORD');

  const token = makeToken(user);
  const refresh_token = makeRefreshToken(user);

  return { user, token, refresh_token };
};

// 회원가입
const registerUser = async (email, password, name) => {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error('EMAIL_EXISTS');

  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser(email, hashed, name);

  const token = makeToken(user);
  const refresh_token = makeRefreshToken(user);

  return { user, token, refresh_token };
};

module.exports = {
  loginUser,
  registerUser,
  makeToken,
  makeRefreshToken,
};