const db = require('../config/db');

// GET /api/articles — 기사 목록
exports.getArticles = async (req, res) => {
  const { page = 1, limit = 20, label, source, category } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const params = [];

  if (label) { conditions.push('al.label = ?'); params.push(label); }
  if (source) { conditions.push('a.source = ?'); params.push(source); }
  if (category) { conditions.push('a.category = ?'); params.push(category); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const limitNum = parseInt(limit);
  const offsetNum = parseInt(offset);
  const sql = `
    SELECT
      a.article_id, a.title, a.summary, a.url, a.source, a.category, a.published_at,
      al.label, al.confidence
    FROM articles a
    LEFT JOIN article_labels al ON a.article_id = al.article_id
    ${where}
    ORDER BY a.published_at DESC
    LIMIT ${limitNum} OFFSET ${offsetNum}
  `;

  try {
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[articleController] getArticles 오류:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/articles/:id — 기사 상세
exports.getArticleById = async (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT a.*, al.label, al.confidence, av.umap_x, av.umap_y, av.cluster_id, c.cluster_name
    FROM articles a
    LEFT JOIN article_labels al ON a.article_id = al.article_id
    LEFT JOIN article_vectors av ON a.article_id = av.article_id
    LEFT JOIN clusters c ON av.cluster_id = c.cluster_id
    WHERE a.article_id = ?
  `;
  try {
    const [rows] = await db.execute(sql, [id]);
    if (!rows.length) return res.status(404).json({ error: '기사를 찾을 수 없습니다.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[articleController] getArticleById 오류:', err.message);
    res.status(500).json({ error: err.message });
  }
};
