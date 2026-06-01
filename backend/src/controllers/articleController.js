// GET /api/articles        → 기사 목록 (MainDashboard.tsx)
// GET /api/articles/:id    → 기사 상세 (ArticleDetail.tsx)

const db = require('../config/db');

// 목록 조회
exports.getArticles = (req, res) => {
  const { page = 1, limit = 20, label, category, source } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let conditions = [];
  let params = [];

  // 필터: label (success / failure / neutral)
  if (label) {
    conditions.push('al.label = ?');
    params.push(label);
  }
  // 필터: category
  if (category) {
    conditions.push('a.category = ?');
    params.push(category);
  }
  // 필터: source (DBR / HBR)
  if (source) {
    conditions.push('a.source = ?');
    params.push(source);
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
      av.cluster_id
    FROM articles a
    LEFT JOIN article_labels al ON a.article_id = al.article_id
    LEFT JOIN article_vectors av ON a.article_id = av.article_id
    ${where}
    ORDER BY a.published_at DESC
    LIMIT ? OFFSET ?
  `;

  params.push(parseInt(limit), offset);

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('[articleController] getArticles 오류:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ articles: rows, page: parseInt(page), limit: parseInt(limit) });
  });
};

// 상세 조회
exports.getArticleById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      a.*,
      al.label,
      al.confidence,
      av.umap_x,
      av.umap_y,
      av.cluster_id,
      c.cluster_name
    FROM articles a
    LEFT JOIN article_labels al ON a.article_id = al.article_id
    LEFT JOIN article_vectors av ON a.article_id = av.article_id
    LEFT JOIN clusters c ON av.cluster_id = c.cluster_id
    WHERE a.article_id = ?
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('[articleController] getArticleById 오류:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: '기사를 찾을 수 없습니다.' });
    }
    res.json(rows[0]);
  });
};
