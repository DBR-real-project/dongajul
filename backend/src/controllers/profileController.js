const {
  findUserById,
  updateUserNickname,
} = require('../models/userModel');

// ─────────────────────────────────────────────
// 내 정보 조회
// GET /api/profile
// JWT 토큰 기반 사용자 조회
// ─────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    // JWT middleware(auth.js)에서 저장한 사용자 정보
    const userId = req.user.user_id;

    // DB에서 유저 조회
    const user = await findUserById(userId);

    // 유저가 없는 경우
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.',
      });
    }

    // 정상 응답
    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: '내 정보 조회 실패',
    });
  }
};

// ─────────────────────────────────────────────
// 내 정보 수정
// PUT /api/profile
// 현재는 nickname만 수정
// Authorization: Bearer JWT토큰 필요
// ─────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    // JWT middleware(auth.js)에서 저장한 사용자 정보
    const userId = req.user.user_id;

    // 프론트에서 보낸 nickname
    const { nickname } = req.body;

    // 닉네임 필수 검증
    if (!nickname || !nickname.trim()) {
      return res.status(400).json({
        success: false,
        message: '닉네임을 입력해주세요.',
      });
    }

    // 닉네임 길이 제한
    if (nickname.trim().length > 20) {
      return res.status(400).json({
        success: false,
        message: '닉네임은 20자 이하로 입력해주세요.',
      });
    }

    // DB 업데이트
    const updatedUser = await updateUserNickname(userId, nickname.trim());

    // 정상 응답
    res.json({
      success: true,
      message: '닉네임이 수정되었습니다.',
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: '내 정보 수정 실패',
    });
  }
};