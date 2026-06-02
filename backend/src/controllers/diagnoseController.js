const axios = require('axios');
const db = require('../config/db');

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

exports.diagnose = async (req, res) => {
  const { text, top_k = 5 } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: '전략 텍스트를 입력해주세요.' });
  }

  try {
    // 1. AI 서버 호출
    const aiResponse = await axios.post(`${AI_SERVER_URL}/diagnose`, {
      text: text.trim(),
      top_k,
    }, { timeout: 30000 });

    const data = aiResponse.data;

    // 2. cluster_name 조회 (DB clusters 테이블)
    let cluster_name = null;
    if (data.query_cluster_id !== null && data.query_cluster_id !== undefined) {
      try {
        const [rows] = await db.execute(
          'SELECT cluster_name FROM clusters WHERE cluster_id = ?',
          [data.query_cluster_id]
        );
        if (rows.length > 0) cluster_name = rows[0].cluster_name;
      } catch (_) {}
    }

    return res.json({ ...data, cluster_name });

  } catch (err) {
    console.error('[diagnoseController] 오류:', err.message);

    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'AI 서버에 연결할 수 없습니다. ai_server가 실행 중인지 확인하세요.' });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'AI 서버 응답 시간이 초과되었습니다.' });
    }

    return res.status(500).json({ error: '진단 처리 중 오류가 발생했습니다.', detail: err.message });
  }
};

// GET /api/diagnose/:id — 저장된 진단 결과 조회
exports.getDiagnoseById = async (req, res) => {
  const { id } = req.params;
  try {
    const [diagRows] = await db.execute(
      `SELECT dr.*, ar.risk_score, ar.keywords, ar.improvement
       FROM diagnosis_requests dr
       LEFT JOIN analysis_results ar ON dr.diagnosis_id = ar.diagnosis_id
       WHERE dr.diagnosis_id = ?`,
      [id]
    );
    if (!diagRows.length) return res.status(404).json({ error: '진단 결과를 찾을 수 없습니다.' });

    const diag = diagRows[0];

    // 유사 사례 조회
    const [matches] = await db.execute(
      `SELECT sam.rank, sam.similarity_score AS similarity,
              a.title, a.url, a.summary, a.category, a.source, a.published_at AS published_date,
              al.label
       FROM similar_article_matches sam
       JOIN articles a ON sam.article_id = a.article_id
       LEFT JOIN article_labels al ON a.article_id = al.article_id
       WHERE sam.result_id = (
         SELECT result_id FROM analysis_results WHERE diagnosis_id = ? LIMIT 1
       )
       ORDER BY sam.rank`,
      [id]
    );

    return res.json({
      diagnosis_id: diag.diagnosis_id,
      input_text: diag.input_text,
      risk_score: diag.risk_score,
      risk_level: diag.risk_score >= 0.6 ? 'high' : diag.risk_score >= 0.3 ? 'medium' : 'low',
      keywords: diag.keywords ? JSON.parse(diag.keywords) : [],
      improvement: diag.improvement,
      similar_articles: matches.map(m => ({
        rank: m.rank,
        title: m.title,
        url: m.url,
        label: m.label,
        similarity: m.similarity,
        summary: m.summary,
        category: m.category,
        source: m.source,
        published_date: m.published_date,
      })),
      created_at: diag.created_at,
    });
  } catch (err) {
    console.error('[getDiagnoseById]', err.message);
    return res.status(500).json({ error: '진단 결과 조회 실패' });
  }
};
