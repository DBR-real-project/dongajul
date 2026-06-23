const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/auth');

router.post('/', verifyToken, chatController.chat);
router.get('/history', verifyToken, chatController.getHistory);
router.get('/sessions', verifyToken, chatController.getSessions);
router.patch('/sessions/:id', verifyToken, chatController.updateSession);
router.delete('/sessions/:id', verifyToken, chatController.deleteSession);

module.exports = router;
