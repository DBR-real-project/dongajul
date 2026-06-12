const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/auth');

// POST /api/chat — AI 챗봇 메시지 처리
router.post('/', verifyToken, chatController.chat);

module.exports = router;
