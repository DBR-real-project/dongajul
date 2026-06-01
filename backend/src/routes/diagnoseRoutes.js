// POST /api/diagnose → diagnoseController.diagnose
// 프론트: RiskAnalysis.tsx "분석 실행" 버튼에서 호출

const express = require('express');
const router = express.Router();
const diagnoseController = require('../controllers/diagnoseController');

router.post('/', diagnoseController.diagnose);

module.exports = router;
