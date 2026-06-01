// 카카오 로그인 URL 연결

const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");


// 카카오 로그인
router.get("/kakao/callback", authController.kakaoCallback);


// 구글 로그인 시작
router.get("/google", authController.googleLogin);


// 구글 로그인 callback
router.get("/google/callback", authController.googleCallback);


module.exports = router;