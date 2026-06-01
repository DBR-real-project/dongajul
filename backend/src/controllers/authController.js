// 카카오 / 구글 callback 처리

const axios = require("axios");

exports.kakaoCallback = async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResult = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code: code,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    const accessToken = tokenResult.data.access_token;

    const userResult = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("카카오 유저 정보:", userResult.data);

    res.redirect("http://localhost:3000");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("카카오 로그인 실패");
  }
};


// 구글 로그인 페이지로 이동
exports.googleLogin = (req, res) => {
  const googleAuthUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: "http://localhost:3001/auth/google/callback",
      response_type: "code",
      scope: "email profile",
    });

  res.redirect(googleAuthUrl);
};


// 구글 callback 처리
exports.googleCallback = async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResult = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "http://localhost:3001/auth/google/callback",
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResult.data.access_token;

    const userResult = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("구글 유저 정보:", userResult.data);

    res.redirect("http://localhost:3000");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("구글 로그인 실패");
  }
};


// 로그인
const { loginUser } = require('../services/authService');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(401).json({ message: '유저 없음' });
    }

    if (err.message === 'INVALID_PASSWORD') {
      return res.status(401).json({ message: '비밀번호 틀림' });
    }

    res.status(500).json({ message: '서버 에러' });
  }
};

module.exports = {
  login
};