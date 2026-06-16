const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middlewares/auth');

// GET /api/strategies — 내 전략 목록
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const [rows] = await db.query(
      'SELECT * FROM strategies WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const strategies = rows.map(r => ({
      id: r.strategy_id,
      name: r.name,
      content: r.content || '',
      keywords: (() => {
        try { return JSON.parse(r.keywords || '[]'); } catch { return []; }
      })(),
      files: [],
      metrics: {
        conversion: r.metrics_conversion,
        roi: r.metrics_roi,
        growth: r.metrics_growth,
        cost: r.metrics_cost,
        engagement: r.metrics_engagement,
      },
    }));

    res.json({ strategies });
  } catch (err) {
    console.error('전략 목록 조회 실패:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// POST /api/strategies — 전략 추가
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { name, content, keywords, metrics } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: '전략 이름은 필수입니다.' });
    }

    const [result] = await db.query(
      `INSERT INTO strategies
        (user_id, name, content, keywords, metrics_conversion, metrics_roi, metrics_growth, metrics_cost, metrics_engagement)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        content || '',
        JSON.stringify(keywords || []),
        metrics?.conversion ?? 5.0,
        metrics?.roi ?? 100,
        metrics?.growth ?? 10,
        metrics?.cost ?? 1000,
        metrics?.engagement ?? 5.0,
      ]
    );

    res.status(201).json({
      strategy: {
        id: result.insertId,
        name: name.trim(),
        content: content || '',
        keywords: keywords || [],
        files: [],
        metrics: {
          conversion: metrics?.conversion ?? 5.0,
          roi: metrics?.roi ?? 100,
          growth: metrics?.growth ?? 10,
          cost: metrics?.cost ?? 1000,
          engagement: metrics?.engagement ?? 5.0,
        },
      },
    });
  } catch (err) {
    console.error('전략 추가 실패:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// PUT /api/strategies/:id — 전략 수정 (키워드/내용)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const strategyId = parseInt(req.params.id, 10);
    const { name, content, keywords, metrics } = req.body;

    const [result] = await db.query(
      `UPDATE strategies
       SET name = ?, content = ?, keywords = ?,
           metrics_conversion = ?, metrics_roi = ?, metrics_growth = ?, metrics_cost = ?, metrics_engagement = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE strategy_id = ? AND user_id = ?`,
      [
        name,
        content,
        JSON.stringify(keywords || []),
        metrics?.conversion,
        metrics?.roi,
        metrics?.growth,
        metrics?.cost,
        metrics?.engagement,
        strategyId,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '전략을 찾을 수 없습니다.' });
    }

    res.json({ message: '전략이 수정되었습니다.' });
  } catch (err) {
    console.error('전략 수정 실패:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// DELETE /api/strategies/:id — 전략 삭제
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const strategyId = parseInt(req.params.id, 10);

    await db.query(
      'DELETE FROM strategies WHERE strategy_id = ? AND user_id = ?',
      [strategyId, userId]
    );

    res.json({ message: '전략이 삭제되었습니다.' });
  } catch (err) {
    console.error('전략 삭제 실패:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
