const feedbackRepository = require("../repositories/feedbackRepository");

exports.createFeedback = async (req, res) => {
  try {
    const { user_id, diagnosis_id, rating, opinion_text } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id가 필요합니다.",
      });
    }

    if (!diagnosis_id) {
      return res.status(400).json({
        success: false,
        message: "diagnosis_id가 필요합니다.",
      });
    }

    if (rating === undefined || rating === null || rating === "") {
      return res.status(400).json({
        success: false,
        message: "rating이 필요합니다.",
      });
    }

    const ratingNumber = Number(rating);

    if (![1, 5].includes(ratingNumber)) {
      return res.status(400).json({
        success: false,
        message: "rating 값은 1 또는 5만 가능합니다.",
      });
    }

    const feedback = await feedbackRepository.createFeedback({
      user_id: Number(user_id),
      diagnosis_id: Number(diagnosis_id),
      rating: ratingNumber,
      opinion_text: opinion_text || null,
    });

    res.status(201).json({
      success: true,
      message: "피드백이 저장되었습니다.",
      data: feedback,
    });
  } catch (err) {
    console.error("Feedback create error:", err);

    res.status(500).json({
      success: false,
      message: "피드백 저장 중 서버 오류가 발생했습니다.",
    });
  }
};