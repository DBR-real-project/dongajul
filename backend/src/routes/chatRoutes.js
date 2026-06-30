const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/auth');

<<<<<<< HEAD
// POST /api/chat — AI 챗봇 메시지 처리
router.post('/', verifyToken, chatController.chat);
=======
router.post('/', verifyToken, chatController.chat);
router.get('/history', verifyToken, chatController.getHistory);
router.get('/sessions', verifyToken, chatController.getSessions);
router.patch('/sessions/:id', verifyToken, chatController.updateSession);
router.delete('/sessions/:id', verifyToken, chatController.deleteSession);
>>>>>>> 06d5573372fae868d35f2d4b6bfc609d225abbc7

module.exports = router;
