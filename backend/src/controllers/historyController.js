const historyRepository = require("../repositories/historyRepository");

/**
 * 진단 기록 전체 조회 API
 */
exports.getHistory = async (req, res) => {
    try {
        const userId = req.query.user_id;

        if (!userId) {
            return res.status(400).json({ message: "user_id is required" });
        }

        const history = await historyRepository.getHistory(userId);
        res.status(200).json(history);

    } catch (err) {
        console.error("History API Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};