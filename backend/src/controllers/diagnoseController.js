const axios = require('axios');
const db = require('../config/db');

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://127.0.0.1:8000';
const AI_TIMEOUT = 180000;

// POST /api/diagnose
exports.diagnose = async (req, res) => {
  const { text, top_k = 3 } = req.body;
  const user_id = req.user?.user_id ?? null;

  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: '전략 텍스트를 입력해주세요.' });
  }

  try {
    console.time('[AI /report 처리 시간]');

    const aiResponse = await axios.post(
      `${AI_SERVER_URL}/report`,
      {
        text: String(text).trim(),
        top_k,
      },
      {
        timeout: AI_TIMEOUT,
      }
    );

    console.timeEnd('[AI /report 처리 시간]');

    const data = aiResponse.data;

    let cluster_name = null;

    if (data.query_cluster_id !== null && data.query_cluster_id !== undefined) {
      try {
        const [rows] = await db.execute(
          'SELECT cluster_name FROM clusters WHERE cluster_id = ?',
          [data.query_cluster_id]
        );

        if (rows.length > 0) {
          cluster_name = rows[0].cluster_name;
        }
      } catch (clusterErr) {
        console.error('[diagnoseController] cluster_name 조회 실패:', clusterErr.message);
      }
    }

    // 중요: DB 저장을 기다려야 diagnosis_id를 프론트에 내려줄 수 있음
    const diagnosisId = await saveToDb(String(text).trim(), data, user_id || null);

    return res.json({
      diagnosis_id: diagnosisId,
      input_text: String(text).trim(),
      ...data,
      cluster_name,
    });
  } catch (err) {
    console.error('[diagnoseController] 오류:', err.message);
    console.error('[diagnoseController] 코드:', err.code);
    console.error('[AI 서버 응답 상태]', err.response?.status);
    console.error('[AI 서버 응답 데이터]', err.response?.data);

    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'AI 서버에 연결할 수 없습니다.',
        detail: err.message,
      });
    }

    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'AI 서버 응답 시간이 초과되었습니다.',
        detail: err.message,
      });
    }

    if (err.response) {
      return res.status(err.response.status).json({
        error: 'AI 서버 /report 호출 실패',
        detail: err.message,
        ai_status: err.response.status,
        ai_error: err.response.data,
      });
    }

    return res.status(500).json({
      error: '진단 처리 중 오류가 발생했습니다.',
      detail: err.message,
    });
  }
};

// DB 저장 함수
async function saveToDb(inputText, aiData, userId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [diagResult] = await connection.execute(
      `
      INSERT INTO diagnosis_requests
        (user_id, input_text, status, created_at)
      VALUES
        (?, ?, 'completed', NOW())
      `,
      [userId, inputText]
    );

    const diagnosisId = diagResult.insertId;

    const successArticles = (aiData.similar_articles || []).filter(
      (article) => article.label === 'success'
    );

    const failureArticles = (aiData.similar_articles || []).filter(
      (article) => article.label === 'failure'
    );

    const successKeywords = successArticles
      .map((article) => article.category || '')
      .filter(Boolean)
      .slice(0, 5)
      .join(',');

    const failureKeywords = failureArticles
      .map((article) => article.category || '')
      .filter(Boolean)
      .slice(0, 5)
      .join(',');

    await connection.execute(
      `
      INSERT INTO analysis_results
        (diagnosis_id, risk_score, analysis_mode, success_keywords, failure_keywords, created_at)
      VALUES
        (?, ?, 'auto', ?, ?, NOW())
      `,
      [
        diagnosisId,
        aiData.risk_score || 0,
        successKeywords,
        failureKeywords,
      ]
    );

    const urls = (aiData.similar_articles || [])
      .map((article) => article.url)
      .filter(Boolean);

    if (urls.length > 0) {
      const placeholders = urls.map(() => '?').join(',');

      const [artRows] = await connection.execute(
        `
        SELECT article_id, url
        FROM articles
        WHERE url IN (${placeholders})
        `,
        urls
      );

      const urlToId = {};

      artRows.forEach((row) => {
        urlToId[row.url] = row.article_id;
      });

      for (const article of aiData.similar_articles || []) {
        const articleId = urlToId[article.url];

        if (!articleId) continue;

        await connection.execute(
          `
          INSERT INTO similar_article_matches
            (diagnosis_id, article_id, similarity_score, recommend_rank, case_type)
          VALUES
            (?, ?, ?, ?, ?)
          `,
          [
            diagnosisId,
            articleId,
            article.similarity || 0,
            article.rank || 0,
            article.label || 'neutral',
          ]
        );
      }
    }

    await connection.commit();

    console.log(`[DB 저장] diagnosis_id=${diagnosisId}, risk=${aiData.risk_score}`);

    return diagnosisId;
  } catch (err) {
    await connection.rollback();
    console.error('[saveToDb] rollback:', err.message);
    throw err;
  } finally {
    connection.release();
  }
}

// POST /api/diagnose/global — HBS 해외 사례 조회 (DB 저장 없음)
exports.diagnoseGlobal = async (req, res) => {
  const { text, top_k = 5 } = req.body;

  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: '전략 텍스트를 입력해주세요.' });
  }

  try {
    const aiResponse = await axios.post(
      `${AI_SERVER_URL}/diagnose/global`,
      { text: String(text).trim(), top_k },
      { timeout: AI_TIMEOUT }
    );
    return res.json(aiResponse.data);
  } catch (err) {
    console.error('[diagnoseGlobal] 오류:', err.message);
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'AI 서버에 연결할 수 없습니다.' });
    }
    if (err.response) {
      return res.status(err.response.status).json({
        error: 'AI 서버 /diagnose/global 호출 실패',
        detail: err.response.data,
      });
    }
    return res.status(500).json({ error: '해외 사례 조회 실패', detail: err.message });
  }
};

// GET /api/diagnose/:id — 저장된 진단 결과 조회
exports.getDiagnoseById = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: '유효하지 않은 진단 ID입니다.' });
  }

  try {
    // analysis_results 컬럼이 DB 환경마다 다를 수 있어 risk_score만 명시 조회
    const [diagRows] = await db.execute(
      `SELECT dr.diagnosis_id, dr.user_id, dr.input_text, dr.status, dr.created_at,
              ar.risk_score
       FROM diagnosis_requests dr
       LEFT JOIN analysis_results ar ON dr.diagnosis_id = ar.diagnosis_id
       WHERE dr.diagnosis_id = ?`,
      [id]
    );

    if (!diagRows.length) {
      return res.status(404).json({ error: '진단 결과를 찾을 수 없습니다.' });
    }

    const diag = diagRows[0];

    // similar_article_matches 쿼리는 실패해도 빈 배열로 대체
    let matches = [];
    try {
      const [rows] = await db.execute(
        `SELECT sam.recommend_rank AS rank,
                sam.similarity_score AS similarity,
                sam.case_type AS label,
                a.title, a.url, a.summary, a.category, a.source,
                a.published_at AS published_date
         FROM similar_article_matches sam
         JOIN articles a ON sam.article_id = a.article_id
         WHERE sam.diagnosis_id = ?
         ORDER BY sam.recommend_rank`,
        [id]
      );
      matches = rows;
    } catch (matchErr) {
      console.error('[getDiagnoseById] similar_article_matches 조회 실패 (무시):', matchErr.message);
    }

    const riskScore = parseFloat(diag.risk_score) || 0;

    return res.json({
      diagnosis_id: diag.diagnosis_id,
      input_text: diag.input_text,
      risk_score: riskScore,
      risk_level: riskScore >= 0.6 ? 'high' : riskScore >= 0.3 ? 'medium' : 'low',
      improvement: null,
      similar_articles: matches,
      created_at: diag.created_at,
    });
  } catch (err) {
    console.error('[getDiagnoseById]', err.message);
    return res.status(500).json({ error: '진단 결과 조회 실패', detail: err.message });
  }
};