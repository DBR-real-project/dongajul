const axios = require('axios');
const authService = require('../services/authService');
const { findUserByEmail, createUser } = require('../models/userModel');

// 이메일 로그인
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }
  try {
    const { user, token } = await authService.loginUser(email, password);
    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.nickname || user.email.split('@')[0],
      },
    });
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND' || err.message === 'INVALID_PASSWORD') {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 회원가입
exports.register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
  }
  try {
    await authService.registerUser(email, password, name);
    res.json({ message: '회원가입 성공' });
  } catch (err) {
    if (err.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 카카오 로그인 페이지로 이동
exports.kakaoLogin = (req, res) => {
  const kakaoAuthUrl =
    'https://kauth.kakao.com/oauth/authorize?' +
    new URLSearchParams({
      client_id: process.env.KAKAO_REST_API_KEY,
      redirect_uri: process.env.KAKAO_REDIRECT_URI,
      response_type: 'code',
    });
  res.redirect(kakaoAuthUrl);
};

// 카카오 callback 처리
exports.kakaoCallback = async (req, res) => {
  const code = req.query.code;
  try {
    const tokenResult = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' } }
    );
    const accessToken = tokenResult.data.access_token;
    const userResult = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const kakaoUser = userResult.data;
    const email = kakaoUser.kakao_account?.email;
    const name = kakaoUser.kakao_account?.profile?.nickname || '카카오사용자';
    if (!email) {
      return res.status(400).send('카카오 계정에서 이메일을 가져올 수 없습니다.');
    }
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser(email, null, name);
    }
    const token = authService.makeToken(user);
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('카카오 로그인 실패');
  }
};

// 구글 로그인 페이지로 이동
exports.googleLogin = (req, res) => {
  const googleAuthUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback',
      response_type: 'code',
      scope: 'email profile',
    });
  res.redirect(googleAuthUrl);
};

// 구글 callback 처리
exports.googleCallback = async (req, res) => {
  const code = req.query.code;
  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback';
    const tokenResult = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const accessToken = tokenResult.data.access_token;
    const userResult = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const googleUser = userResult.data;
    const email = googleUser.email;
    const name = googleUser.name || '구글사용자';
    if (!email) {
      return res.status(400).send('구글 계정에서 이메일을 가져올 수 없습니다.');
    }
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser(email, null, name);
    }
    const token = authService.makeToken(user);
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('구글 로그인 실패');
  }
};

// 네이버 로그인 페이지로 이동
exports.naverLogin = (req, res) => {
  const state = Math.random().toString(36).substring(2);
  const naverAuthUrl =
    'https://nid.naver.com/oauth2.0/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id: process.env.NAVER_CLIENT_ID,
      redirect_uri: process.env.NAVER_REDIRECT_URI,
      state,
    });
  res.redirect(naverAuthUrl);
};

// 네이버 callback 처리
exports.naverCallback = async (req, res) => {
  const { code, state } = req.query;
  try {
    const tokenResult = await axios.post(
      'https://nid.naver.com/oauth2.0/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code,
        state,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const accessToken = tokenResult.data.access_token;
    const userResult = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const naverUser = userResult.data.response;
    const email = naverUser.email;
    const name = naverUser.name || naverUser.nickname || '네이버사용자';
    if (!email) {
      return res.status(400).send('네이버 계정에서 이메일을 가져올 수 없습니다.');
    }
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser(email, null, name);
    }
    const token = authService.makeToken(user);
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('네이버 로그인 실패');
  }
};
