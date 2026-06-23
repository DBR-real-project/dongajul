const db = require("../config/db");

/**
 * UMAP 좌표 샘플 조회 (article_vectors 직접 조회)
 * - 800개 랜덤 샘플 + 라벨 + 클러스터 정보
 */
exports.getSemanticMap = async () => {
  // 포인트 데이터: label별 샘플링 (success 400, failure 200, neutral 200)
  const sql = `
    (
      SELECT av.article_id, av.umap_x, av.umap_y, av.cluster_id,
             al.label, a.title, a.category, a.source
      FROM article_vectors av
      INNER JOIN article_labels al ON av.article_id = al.article_id
      INNER JOIN articles a ON av.article_id = a.article_id
      WHERE al.label = 'success'
        AND av.umap_x IS NOT NULL
      ORDER BY RAND()
      LIMIT 400
    )
    UNION ALL
    (
      SELECT av.article_id, av.umap_x, av.umap_y, av.cluster_id,
             al.label, a.title, a.category, a.source
      FROM article_vectors av
      INNER JOIN article_labels al ON av.article_id = al.article_id
      INNER JOIN articles a ON av.article_id = a.article_id
      WHERE al.label = 'failure'
        AND av.umap_x IS NOT NULL
      ORDER BY RAND()
      LIMIT 200
    )
    UNION ALL
    (
      SELECT av.article_id, av.umap_x, av.umap_y, av.cluster_id,
             al.label, a.title, a.category, a.source
      FROM article_vectors av
      INNER JOIN article_labels al ON av.article_id = al.article_id
      INNER JOIN articles a ON av.article_id = a.article_id
      WHERE al.label = 'neutral'
        AND av.umap_x IS NOT NULL
      ORDER BY RAND()
      LIMIT 200
    )
  `;

  // 클러스터 중심 정보
  const clusterSql = `
    SELECT cluster_id, cluster_name, center_x, center_y, article_count
    FROM clusters
    ORDER BY cluster_id
  `;

  const [points] = await db.query(sql);
  const [clusters] = await db.query(clusterSql);

  return { points, clusters };
};
