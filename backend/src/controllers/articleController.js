const axios = require('axios');
const db = require('../config/db');

// GET /api/articles/stats — 기사 통계
exports.getArticleStats = async (req, res) => {
  try {
    const [[countRow]]   = await db.execute(`SELECT COUNT(*) AS total_articles FROM articles`);
    const [[labelRows]]  = await db.execute(`
      SELECT
        COUNT(DISTINCT CASE WHEN label = 'success' THEN article_id END) AS success_count,
        COUNT(DISTINCT CASE WHEN label = 'failure' THEN article_id END) AS failure_count
      FROM article_labels
    `);
    const [[clusterRow]] = await db.execute(`SELECT COUNT(*) AS cluster_count FROM clusters`);

    // 연도별 트렌드 (2015~2026)
    const [yearlyRows] = await db.execute(`
      SELECT
        YEAR(a.published_at) AS year,
        al.label,
        COUNT(*) AS cnt
      FROM articles a
      INNER JOIN article_labels al ON a.article_id = al.article_id
      WHERE al.label IN ('success','failure')
        AND a.published_at IS NOT NULL
        AND YEAR(a.published_at) BETWEEN 2015 AND 2026
      GROUP BY YEAR(a.published_at), al.label
      ORDER BY year ASC
    `);

    // 카테고리별 분포 (상위 8개)
    const [catRows] = await db.execute(`
      SELECT
        a.category,
        al.label,
        COUNT(*) AS cnt
      FROM articles a
      INNER JOIN article_labels al ON a.article_id = al.article_id
      WHERE al.label IN ('success','failure')
        AND a.category IS NOT NULL AND a.category != ''
      GROUP BY a.category, al.label
      ORDER BY cnt DESC
      LIMIT 80
    `);

    // 연도별 변환: { year, success, failure }[]
    const yrMap = {};
    for (const row of yearlyRows) {
      const y = String(row.year);
      if (!yrMap[y]) yrMap[y] = { year: y, success: 0, failure: 0 };
      yrMap[y][row.label] = Number(row.cnt);
    }
    const yearly_trend = Object.values(yrMap)
      .sort((a, b) => Number(a.year) - Number(b.year));

    // 카테고리 변환: { category, success, failure, total }[] 상위 8
    const catMap = {};
    for (const row of catRows) {
      if (!catMap[row.category]) catMap[row.category] = { category: row.category, success: 0, failure: 0 };
      catMap[row.category][row.label] = Number(row.cnt);
    }
    const category_dist = Object.values(catMap)
      .map(c => ({ ...c, total: (c.success || 0) + (c.failure || 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    res.json({
      success: true,
      total_articles: Number(countRow?.total_articles)  || 0,
      success_count:  Number(labelRows?.success_count)  || 0,
      failure_count:  Number(labelRows?.failure_count)  || 0,
      cluster_count:  Number(clusterRow?.cluster_count) || 0,
      yearly_trend,
      category_dist,
    });
  } catch (err) {
    console.error('[articleController] getArticleStats 오류:', err);
    res.status(500).json({
      success: false,
      message: '기사 통계 조회 중 서버 오류가 발생했습니다.',
    });
  }
};

// GET /api/articles — 기사 목록
exports.getArticles = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    label,
    source,
    category,
    search,
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offsetNum = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (label) {
    conditions.push('al.label = ?');
    params.push(label);
  }

  if (source) {
    if (source === 'HBR') {
      conditions.push("(a.source = ? OR a.source = ?)");
      params.push('HBR', 'HBR Korea');
    } else {
      conditions.push('a.source = ?');
      params.push(source);
    }
  }

  if (category) {
    conditions.push('a.category = ?');
    params.push(category);
  }

  if (search) {
    conditions.push('(a.title LIKE ? OR a.summary LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      a.article_id,
      a.title,
      a.summary,
      a.url,
      a.source,
      a.category,
      a.published_at,
      al.label,
      al.confidence,
      av.umap_x,
      av.umap_y,
      av.cluster_id,
      c.cluster_name
    FROM articles a
    LEFT JOIN article_labels al
      ON a.article_id = al.article_id
    LEFT JOIN article_vectors av
      ON a.article_id = av.article_id
    LEFT JOIN clusters c
      ON av.cluster_id = c.cluster_id
    ${where}
    ORDER BY a.published_at DESC
    LIMIT ${limitNum}
    OFFSET ${offsetNum}
  `;

  try {
    const [rows] = await db.execute(sql, params);

    res.json({
      success: true,
      page: pageNum,
      limit: limitNum,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error('[articleController] getArticles 오류:', err);

    res.status(500).json({
      success: false,
      message: '기사 목록 조회 중 서버 오류가 발생했습니다.',
    });
  }
};

// GET /api/articles/:id — 기사 상세
exports.getArticleById = async (req, res) => {
  const { id } = req.params;

  const articleId = Number(id);

  if (!Number.isInteger(articleId) || articleId <= 0) {
    return res.status(400).json({
      success: false,
      message: '올바르지 않은 기사 ID입니다.',
    });
  }

  const sql = `
    SELECT
      a.article_id,
      a.title,
      a.summary,
      a.url,
      a.source,
      a.category,
      a.company_name,
      a.industry,
      a.published_at,
      al.label,
      al.confidence,
      av.umap_x,
      av.umap_y,
      av.cluster_id,
      c.cluster_name
    FROM articles a
    LEFT JOIN article_labels al
      ON a.article_id = al.article_id
    LEFT JOIN article_vectors av
      ON a.article_id = av.article_id
    LEFT JOIN clusters c
      ON av.cluster_id = c.cluster_id
    WHERE a.article_id = ?
    LIMIT 1
  `;

  try {
    const [rows] = await db.execute(sql, [articleId]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: '기사를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.error('[articleController] getArticleById 오류:', err);

    res.status(500).json({
      success: false,
      message: '기사 상세 조회 중 서버 오류가 발생했습니다.',
    });
  }
};

// POST /api/articles/:id/score — GPT 6차원 채점
exports.scoreArticle = async (req, res) => {
  const articleId = Number(req.params.id);
  if (!Number.isInteger(articleId) || articleId <= 0) {
    return res.status(400).json({ success: false, message: '올바르지 않은 기사 ID입니다.' });
  }

  try {
    const [[article]] = await db.execute(
      `SELECT a.title, a.summary, a.content, a.source, a.category, a.published_at,
              al.label, al.confidence
       FROM articles a
       LEFT JOIN article_labels al ON a.article_id = al.article_id
       WHERE a.article_id = ? LIMIT 1`,
      [articleId]
    );

    if (!article) return res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다.' });

    const labelKo = (lbl) =>
      lbl === 'success' ? '성공 사례' : lbl === 'failure' ? '실패 사례' : '결과 미상';

    const body = (article.content || article.summary || '').slice(0, 2000);

    const systemPrompt = `당신은 DBR·HBR·HBS 전략 사례 전문 분석가입니다.
실제 기사 본문 내용을 근거로 6개 차원을 0~100 정수로 채점합니다.
채점 기준:
- 시장타이밍: 진입 시점의 시장 상황, 선점 여부, 타이밍 실수 여부
- 실행력: 전략 실행 속도·완성도, 피벗 능력, 실제 성과
- 고객이해도: 타깃 고객 정의 정확도, 니즈 파악, 고객 반응
- 경쟁대응력: 경쟁사 대비 차별화, 포지셔닝 강도
- 자원충분성: 자금·인력·기술 자원 보유 수준, 조달 능력
- 트렌드부합도: 2024~2025 시장 트렌드와의 정합성
성공 사례라도 실행이 부족하면 실행력은 낮게 채점하세요. 증거가 없는 항목은 50 기준으로 조정하세요.`;

    const userPrompt = `아래 전략 사례를 분석하세요.

제목: ${article.title}
최종결과: ${labelKo(article.label)}
출처: ${article.source || '미상'} | 발행: ${article.published_at || '미상'} | 카테고리: ${article.category || '-'}
본문:
${body || '(내용 없음)'}

위 내용을 근거로 6개 차원을 채점하고, 아래 JSON만 출력하세요:
{"시장타이밍":0,"실행력":0,"고객이해도":0,"경쟁대응력":0,"자원충분성":0,"트렌드부합도":0}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.15,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      }
    );

    const scores = JSON.parse(response.data.choices[0].message.content);
    return res.json({ success: true, scores });
  } catch (err) {
    console.error('[scoreArticle]', err.response?.data || err.message);
    const status = err.response?.status;
    if (status === 429) return res.status(503).json({ success: false, error: 'API 한도 초과' });
    if (status === 401) return res.status(503).json({ success: false, error: 'API 인증 오류' });
    return res.status(500).json({ success: false, error: 'GPT 채점 실패' });
  }
};