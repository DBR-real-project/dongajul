const express = require('express');
const router = express.Router();
const diagnoseController = require('../controllers/diagnoseController');
const { verifyToken } = require('../middlewares/auth');

// POST /api/diagnose — 분석 실행 (프론트 RiskAnalysis.tsx)
router.post('/', diagnoseController.diagnose);

// GET /api/diagnose/:id — 저장된 진단 결과 조회 (DiagnosisResult.tsx)
router.get('/:id', verifyToken, diagnoseController.getDiagnoseById);

module.exports = router;
