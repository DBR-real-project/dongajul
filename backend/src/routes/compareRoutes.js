const express = require('express');
const router = express.Router();
const compareController = require('../controllers/compareController');
const { verifyToken } = require('../middlewares/auth');

// POST /api/compare
router.post('/', verifyToken, compareController.compareArticles);

module.exports = router;
