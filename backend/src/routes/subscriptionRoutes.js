const express = require("express");
const router = express.Router();

const subscriptionController = require("../controllers/subscriptionController");
const { verifyToken } = require("../middlewares/auth");

// 구독 생성
router.post("/", verifyToken, subscriptionController.createSubscription);

// 내 구독 조회
router.get("/me", verifyToken, subscriptionController.getMySubscription);

// 구독 취소
router.patch("/cancel", verifyToken, subscriptionController.cancelSubscription);

module.exports = router;