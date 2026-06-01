const { findUserByEmail } = require('../models/userModel');

// 로그인
const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // 테스트용 (나중에 bcrypt로 바꿔야 함)
  if (user.password_hash !== password) {
    throw new Error('INVALID_PASSWORD');
  }

  return {
    message: '로그인 성공',
    user: {
      id: user.user_id,
      email: user.email,
      nickname: user.nickname
    }
  };
};

module.exports = {
  loginUser
};