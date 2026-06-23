const axios = require("axios");

const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://127.0.0.1:8000";

async function getSemanticMap(req, res) {
  try {
    const limit = req.query.limit || 15000;

    const [mapRes, clustersRes] = await Promise.all([
      axios.get(`${AI_SERVER_URL}/semantic-map`, { params: { limit }, timeout: 30000 }),
      axios.get(`${AI_SERVER_URL}/clusters`, { timeout: 10000 }).catch(() => ({ data: [] })),
    ]);

    return res.status(200).json({
      ...mapRes.data,
      clusters: clustersRes.data,
    });
  } catch (error) {
    console.error("[semantic-map] error:", error.message);

    return res.status(500).json({
      message: "시맨틱 맵 데이터를 불러오지 못했습니다.",
      detail: error.response?.data || error.message,
    });
  }
}

module.exports = {
  getSemanticMap,
};