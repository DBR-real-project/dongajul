const authService = require('../services/authService');

const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
};

module.exports = { login };

// 회원가입
export const register = async (req, res) => {
  const { email, password, nickname } = req.body;

  try {
    await registerUser(email, password, nickname);
    res.json({ message: '회원가입 성공' });
  } catch (err) {
    res.status(500).json({ message: '회원가입 실패' });
  }
};