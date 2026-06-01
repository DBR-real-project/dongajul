// POST /api/diagnose
// 프론트(RiskAnalysis.tsx "분석 실행")에서 전략 텍스트를 받아
// ai_server(포트 8000)로 전달하고 결과 반환

const axios = require('axios');

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

exports.diagnose = async (req, res) => {
  const { text, industry, area, top_k = 5 } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: '전략 텍스트를 입력해주세요.' });
  }

  try {
    const aiResponse = await axios.post(`${AI_SERVER_URL}/diagnose`, {
      text: text.trim(),
      top_k,
    });

    // ai_server 응답 구조:
    // { risk_score, risk_level, cluster_id, cluster_name, similar_articles: [...] }
    return res.json(aiResponse.data);
  } catch (err) {
    console.error('[diagnoseController] AI 서버 오류:', err.message);

    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'AI 서버에 연결할 수 없습니다. ai_server가 실행 중인지 확인하세요.' });
    }

    return res.status(500).json({ error: '진단 처리 중 오류가 발생했습니다.', detail: err.message });
  }
};
