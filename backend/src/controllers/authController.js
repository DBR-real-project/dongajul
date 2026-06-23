const axios = require('axios');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const { findUserByEmail, createUser, updateUserNickname, saveRefreshToken, findByRefreshToken, clearRefreshToken } = require('../models/userModel');

// 이메일 로그인
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    const { user, token, refresh_token } = await authService.loginUser(email, password);

    // refresh token DB 저장
    await saveRefreshToken(user.user_id, refresh_token);

    res.json({
      success: true,
      token,
      refresh_token,
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

    console.error(err);
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
    const { user, token, refresh_token } = await authService.registerUser(email, password, name);

    // refresh token DB 저장
    await saveRefreshToken(user.user_id, refresh_token);

    res.json({
      success: true,
      message: '회원가입 성공',
      token,
      refresh_token,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.nickname || user.email.split('@')[0],
      },
    });
  } catch (err) {
    if (err.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    console.error(err);
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
      scope: 'profile_nickname',  // 닉네임만 요청 (account_email은 권한 없음)
    });
  res.redirect(kakaoAuthUrl);
};

// 카카오 callback 처리 (수정본: 무조건 돌아가게)
exports.kakaoCallback = async (req, res) => {
  const code = req.query.code;
  try {
    // 1. 카카오 토큰 요청 파라미터 구성
    // client_secret은 Kakao 앱에서 활성화한 경우에만 포함 (비활성화 상태면 빼야 함)
    const tokenParams = {
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_REST_API_KEY,
      redirect_uri: process.env.KAKAO_REDIRECT_URI,
      code,
    };
    if (process.env.KAKAO_CLIENT_SECRET) {
      tokenParams.client_secret = process.env.KAKAO_CLIENT_SECRET;
    }

    // 2. 토큰 받아오기
    const tokenResult = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams(tokenParams),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' } }
    );

    const accessToken = tokenResult.data.access_token;
    const userResult = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const kakaoUser = userResult.data;
    const kakaoId = kakaoUser.id;
    const email = kakaoUser.kakao_account?.email || `kakao_${kakaoId}@kakao.local`;
    // kakao_account.profile.nickname (동의 필요) → properties.nickname (기본 제공) 순으로 fallback
    const name = kakaoUser.kakao_account?.profile?.nickname
      || kakaoUser.properties?.nickname
      || '카카오사용자';

    if (!email) {
      return res.status(400).send('카카오 계정에서 이메일을 가져올 수 없습니다.');
    }
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser(email, null, name);
    } else if (name && name !== '카카오사용자' && (!user.nickname || user.nickname === '카카오사용자')) {
      // 기존 유저인데 닉네임이 기본값이면 실제 카카오 닉네임으로 업데이트
      await updateUserNickname(user.user_id, name);
      user.nickname = name;
    }
    const token = authService.makeToken(user);
    const kakaoRefreshToken = authService.makeRefreshToken(user);
    try { await saveRefreshToken(user.user_id, kakaoRefreshToken); } catch (e) {
      console.error('[kakao] refresh token 저장 실패:', e.message);
    }

    res.redirect(`${process.env.FRONTEND_URL}?token=${token}&refresh_token=${kakaoRefreshToken}`);

  } catch (err) {
    console.error('[kakao callback error]', err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=kakao_login_failed`);
  }
};

// 구글 로그인 페이지로 이동
exports.googleLogin = (req, res) => {
  const googleAuthUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback',
      response_type: 'code',
      scope: 'email profile',
    });

  res.redirect(googleAuthUrl);
};

// 구글 callback 처리
exports.googleCallback = async (req, res) => {
  const code = req.query.code;

  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

    const tokenResult = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenResult.data.access_token;

    const userResult = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
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
    const googleRefreshToken = authService.makeRefreshToken(user);
    try { await saveRefreshToken(user.user_id, googleRefreshToken); } catch (e) {
      console.error('[google] refresh token 저장 실패:', e.message);
    }

    res.redirect(`${process.env.FRONTEND_URL}?token=${token}&refresh_token=${googleRefreshToken}`);
  } catch (err) {
    console.error('[google callback error]', err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=google_login_failed`);
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
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenResult.data.access_token;

    const userResult = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
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
    const naverRefreshToken = authService.makeRefreshToken(user);
    try { await saveRefreshToken(user.user_id, naverRefreshToken); } catch (e) {
      console.error('[naver] refresh token 저장 실패:', e.message);
    }

    res.redirect(`${process.env.FRONTEND_URL}?token=${token}&refresh_token=${naverRefreshToken}`);
  } catch (err) {
    console.error('[naver callback error]', err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=naver_login_failed`);
  }
};

// POST /api/auth/refresh — 액세스 토큰 재발급
exports.refresh = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ message: 'refresh_token이 필요합니다.' });
  }

  try {
    const secret = process.env.REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
    jwt.verify(refresh_token, secret); // 서명·만료 검증

    const user = await findByRefreshToken(refresh_token);
    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 refresh token입니다.' });
    }

    const token = authService.makeToken(user);
    return res.json({ success: true, token });
  } catch (err) {
    return res.status(401).json({ message: '만료되거나 유효하지 않은 refresh token입니다.' });
  }
};

// POST /api/auth/logout — refresh token 서버 측 무효화
exports.logout = async (req, res) => {
  const user_id = req.user?.user_id;
  if (user_id) {
    try {
      await clearRefreshToken(user_id);
    } catch (e) {
      // 실패해도 클라이언트 로그아웃은 진행
    }
  }
  return res.json({ success: true });
};