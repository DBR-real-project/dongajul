// repository 가져오기
const historyRepository = require("../repositories/historyRepository");


// 진단 기록 전체 조회 API
exports.getHistory = async (req, res) => {

  try {

    // DB에서 히스토리 데이터 조회
    const history = await historyRepository.getHistory();

    // 조회 결과를 프론트로 반환
    res.json(history);

  } catch (err) {

    // 서버 에러 출력
    console.error("진단 기록 조회 에러:", err);

    // 에러 응답 반환
    res.status(500).json({
      message: "진단 기록 조회 실패",
    });
  }
};