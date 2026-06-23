const express = require("express");
const router = express.Router();

const feedbackController = require("../controllers/feedbackController");
const { verifyToken } = require("../middlewares/auth");

router.post("/", verifyToken, feedbackController.createFeedback);

module.exports = router;