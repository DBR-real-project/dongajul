const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 이메일 로그인
router.post('/login', authController.login);

// 회원가입
router.post('/register', authController.register);

// 카카오 로그인
router.get('/kakao', authController.kakaoLogin);
router.get('/kakao/callback', authController.kakaoCallback);

// 구글 로그인
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

// 네이버 로그인
router.get('/naver', authController.naverLogin);
router.get('/naver/callback', authController.naverCallback);

// 토큰 재발급
router.post('/refresh', authController.refresh);

// 로그아웃 (서버 측 refresh token 무효화)
router.post('/logout', authController.logout);

module.exports = router;
