const express = require("express");
const router = express.Router();

const historyController = require("../controllers/historyController");

// 내 진단 기록 전체 조회
router.get("/", historyController.getHistory);

// 진단 기록 상세 조회
router.get("/:id", historyController.getHistoryDetail);

module.exports = router;