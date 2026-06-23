// GET  /api/articles/stats   → 아티클 통계
// GET  /api/articles         → 기사 목록
// GET  /api/articles/:id     → 기사 상세
// POST /api/articles/:id/score → GPT 6차원 채점

const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// 중요: /stats는 /:id보다 위에 있어야 함
router.get('/stats', articleController.getArticleStats);

router.get('/', articleController.getArticles);

router.get('/:id', articleController.getArticleById);

router.post('/:id/score', articleController.scoreArticle);

module.exports = router;