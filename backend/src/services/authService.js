import { loginUser } from '../services/authService.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(401).json({ message: '유저 없음' });
    }

    if (err.message === 'INVALID_PASSWORD') {
      return res.status(401).json({ message: '비번 틀림' });
    }

    res.status(500).json({ message: '서버 에러' });
  }
};

// 회원가입
export const registerUser = async (email, password, nickname) => {
  const hashed = await bcrypt.hash(password, 10);
  await createUser(email, hashed, nickname);
};