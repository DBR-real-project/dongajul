const subscriptionRepository = require("../repositories/subscriptionRepository");
const subscriptionService = require("../services/subscriptionService");

exports.createSubscription = async (req, res) => {
  try {
    console.log("🔥 req.user:", req.user);
    const userId = req.user.user_id;
    const { plan_type = "premium" } = req.body;

    const activeSubscription = await subscriptionRepository.findActiveByUserId(userId);

    if (activeSubscription) {
      return res.status(409).json({
        success: false,
        message: "이미 활성화된 구독이 있습니다.",
      });
    }

    const subscription = await subscriptionService.subscribe(userId, plan_type);

    res.status(201).json({
      success: true,
      message: "구독이 완료되었습니다.",
      data: subscription,
    });

  } catch (err) {
    console.error("createSubscription error:", err);
    res.status(500).json({
      success: false,
      message: "구독 처리 중 서버 오류가 발생했습니다.",
    });
  }
};

exports.getMySubscription = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const subscription = await subscriptionRepository.getSubscriptionByUserId(userId);

    res.json({
      success: true,
      data: subscription || null,
    });
  } catch (err) {
    console.error("getMySubscription error:", err);
    res.status(500).json({
      success: false,
      message: "구독 조회 중 서버 오류가 발생했습니다.",
    });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const affectedRows = await subscriptionService.cancelSubscription(userId);

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        message: "취소할 활성 구독이 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "구독이 취소되었습니다.",
    });
  } catch (err) {
    console.error("cancelSubscription error:", err);
    res.status(500).json({
      success: false,
      message: "구독 취소 중 서버 오류가 발생했습니다.",
    });
  }
};

exports.subscribe = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { planType } = req.body;

    const result = await subscriptionService.subscribe(userId, planType);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "구독 실패" });
  }
};