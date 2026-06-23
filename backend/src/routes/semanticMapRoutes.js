const express = require("express");

// Router 객체 생성
const router = express.Router();


// controller 가져오기
const semanticMapController = require("../controllers/semanticMapController");


// UMAP 좌표 전체 조회 API
// GET /api/semantic-map
router.get("/", semanticMapController.getSemanticMap);


// router 내보내기
module.exports = router;