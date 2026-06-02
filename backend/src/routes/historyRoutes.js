const express = require("express");
const router = express.Router();

const historyController = require("../controllers/historyController");

// 내 진단 기록 전체 조회
router.get("/", historyController.getHistory);

module.exports = router;