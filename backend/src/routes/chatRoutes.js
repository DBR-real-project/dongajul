const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// POST /api/chat — AI 챗봇 메시지 처리
router.post('/', chatController.chat);

module.exports = router;
