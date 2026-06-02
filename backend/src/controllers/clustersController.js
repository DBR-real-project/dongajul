// repository 가져오기
const clustersRepository = require("../repositories/clustersRepository");


// 클러스터 전체 조회 API
exports.getClusters = async (req, res) => {

  try {

    // DB에서 클러스터 데이터 조회
    const clusters = await clustersRepository.getClusters();

    // 프론트에 데이터 반환
    res.json(clusters);

  } catch (err) {

    // 서버 에러 출력
    console.error("클러스터 조회 에러:", err);

    // 에러 응답
    res.status(500).json({
      message: "클러스터 조회 실패",
    });
  }
};