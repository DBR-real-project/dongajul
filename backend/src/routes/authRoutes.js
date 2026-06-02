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

module.exports = router;
