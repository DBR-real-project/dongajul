const express = require("express");
const router = express.Router();

const historyController = require("../controllers/historyController");
const { verifyToken } = require("../middlewares/auth");

// 내 진단 기록 전체 조회
router.get("/", verifyToken, historyController.getHistory);

module.exports = router;