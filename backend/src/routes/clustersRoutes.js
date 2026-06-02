const express = require("express");

// Router 객체 생성
const router = express.Router();


// controller 가져오기
const clustersController = require("../controllers/clustersController");


// 클러스터 전체 조회 API
// GET /api/clusters
router.get("/", clustersController.getClusters);


// router 내보내기
module.exports = router;