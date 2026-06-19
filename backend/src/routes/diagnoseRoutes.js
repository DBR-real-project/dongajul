const express = require('express');
const router = express.Router();
const diagnoseController = require('../controllers/diagnoseController');
const { verifyToken } = require('../middlewares/auth');

// POST /api/diagnose/prompt-helper — AI 프롬프트 작성 도우미
router.post('/prompt-helper', verifyToken, diagnoseController.promptHelper);

// POST /api/diagnose — 분석 실행 (인증 필수)
router.post('/', verifyToken, diagnoseController.diagnose);

// POST /api/diagnose/global — HBS 해외 사례 조회 (/:id 보다 위에 선언해야 함)
router.post('/global', verifyToken, diagnoseController.diagnoseGlobal);

// GET /api/diagnose/:id — 저장된 진단 결과 조회 (DiagnosisResult.tsx)
router.get('/:id', verifyToken, diagnoseController.getDiagnoseById);

// DELETE /api/diagnose/:id — 진단이력 삭제
router.delete('/:id', verifyToken, diagnoseController.deleteDiagnose);

module.exports = router;
