const db = require("../config/db");

exports.getSemanticMap = async () => {
  const sql = `
    SELECT sm.map_id, sm.diagnosis_id, sm.article_id, sm.recommend_rank,
           a.title, a.url, a.category, a.source,
           av.umap_x, av.umap_y, av.cluster_id,
           al.label
    FROM semantic_maps sm
    LEFT JOIN articles a ON sm.article_id = a.article_id
    LEFT JOIN article_vectors av ON sm.article_id = av.article_id
    LEFT JOIN article_labels al ON sm.article_id = al.article_id
    ORDER BY sm.map_id ASC
    LIMIT 500
  `;
  const [rows] = await db.query(sql);
  return rows;
};
