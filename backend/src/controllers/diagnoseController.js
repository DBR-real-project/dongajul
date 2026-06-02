const axios = require('axios');
const db = require('../config/db');

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

exports.diagnose = async (req, res) => {
  const { text, top_k = 5, user_id } = req.body;

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

    // 2. cluster_name 조회
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

    // 3. DB 저장 (비동기 - 응답에 영향 없음)
    saveToDb(text.trim(), data, user_id || null).catch(e =>
      console.error('[diagnoseController] DB 저장 실패:', e.message)
    );

    return res.json({ ...data, cluster_name });

  } catch (err) {
    console.error('[diagnoseController] 오류:', err.message);
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'AI 서버에 연결할 수 없습니다.' });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'AI 서버 응답 시간이 초과되었습니다.' });
    }
    return res.status(500).json({ error: '진단 처리 중 오류가 발생했습니다.', detail: err.message });
  }
};

// DB 저장 함수
async function saveToDb(inputText, aiData, userId) {
  // 1. diagnosis_requests 저장
  const [diagResult] = await db.execute(
    `INSERT INTO diagnosis_requests (user_id, input_text, status, created_at)
     VALUES (?, ?, 'completed', NOW())`,
    [userId, inputText]
  );
  const diagnosisId = diagResult.insertId;

  // 2. analysis_results 저장
  const successArticles = (aiData.similar_articles || []).filter(a => a.label === 'success');
  const failureArticles = (aiData.similar_articles || []).filter(a => a.label === 'failure');
  const successKeywords = successArticles.map(a => a.category || '').filter(Boolean).slice(0, 5).join(',');
  const failureKeywords = failureArticles.map(a => a.category || '').filter(Boolean).slice(0, 5).join(',');

  await db.execute(
    `INSERT INTO analysis_results (diagnosis_id, risk_score, analysis_mode, success_keywords, failure_keywords, created_at)
     VALUES (?, ?, 'auto', ?, ?, NOW())`,
    [diagnosisId, aiData.risk_score || 0, successKeywords, failureKeywords]
  );

  // 3. similar_article_matches 저장 (URL로 article_id 조회)
  const urls = (aiData.similar_articles || []).map(a => a.url).filter(Boolean);
  if (urls.length > 0) {
    const placeholders = urls.map(() => '?').join(',');
    const [artRows] = await db.execute(
      `SELECT article_id, url FROM articles WHERE url IN (${placeholders})`,
      urls
    );
    const urlToId = {};
    artRows.forEach(r => { urlToId[r.url] = r.article_id; });

    for (const article of aiData.similar_articles || []) {
      const articleId = urlToId[article.url];
      if (!articleId) continue;
      await db.execute(
        `INSERT INTO similar_article_matches (diagnosis_id, article_id, similarity_score, recommend_rank, case_type)
         VALUES (?, ?, ?, ?, ?)`,
        [diagnosisId, articleId, article.similarity || 0, article.rank || 0, article.label || 'neutral']
      );
    }
  }

  console.log(`[DB 저장] diagnosis_id=${diagnosisId}, risk=${aiData.risk_score}`);
  return diagnosisId;
}

// GET /api/diagnose/:id — 저장된 진단 결과 조회
exports.getDiagnoseById = async (req, res) => {
  const { id } = req.params;
  try {
    const [diagRows] = await db.execute(
      `SELECT dr.*, ar.risk_score, ar.success_keywords, ar.failure_keywords, ar.improvement_guides
       FROM diagnosis_requests dr
       LEFT JOIN analysis_results ar ON dr.diagnosis_id = ar.diagnosis_id
       WHERE dr.diagnosis_id = ?`,
      [id]
    );
    if (!diagRows.length) return res.status(404).json({ error: '진단 결과를 찾을 수 없습니다.' });

    const diag = diagRows[0];

    // 유사 사례 조회
    const [matches] = await db.execute(
      `SELECT sam.recommend_rank AS rank, sam.similarity_score AS similarity, sam.case_type AS label,
              a.title, a.url, a.summary, a.category, a.source, a.published_at AS published_date
       FROM similar_article_matches sam
       JOIN articles a ON sam.article_id = a.article_id
       WHERE sam.diagnosis_id = ?
       ORDER BY sam.recommend_rank`,
      [id]
    );

    const riskScore = parseFloat(diag.risk_score) || 0;
    return res.json({
      diagnosis_id: diag.diagnosis_id,
      input_text: diag.input_text,
      risk_score: riskScore,
      risk_level: riskScore >= 0.6 ? 'high' : riskScore >= 0.3 ? 'medium' : 'low',
      improvement: diag.improvement_guides || null,
      similar_articles: matches,
      created_at: diag.created_at,
    });
  } catch (err) {
    console.error('[getDiagnoseById]', err.message);
    return res.status(500).json({ error: '진단 결과 조회 실패' });
  }
};
