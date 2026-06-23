const historyRepository = require("../repositories/historyRepository");

/**
 * 진단 기록 전체 조회 API
 * GET /api/history?user_id=1
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "인증이 필요합니다.",
      });
    }

    const history = await historyRepository.getHistory(userId);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (err) {
    console.error("History API Error:", err);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * 진단 기록 상세 조회 API
 * GET /api/history/:id
 */
exports.getHistoryDetail = async (req, res) => {
  try {
    const historyId = req.params.id;

    if (!historyId) {
      return res.status(400).json({
        success: false,
        message: "history id is required",
      });
    }

    const detail = await historyRepository.getHistoryDetail(historyId);

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "진단 기록을 찾을 수 없습니다.",
      });
    }

    res.status(200).json({
      success: true,
      data: detail,
    });
  } catch (err) {
    console.error("History Detail API Error:", err);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};