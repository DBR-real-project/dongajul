// repository 가져오기
const semanticMapRepository = require("../repositories/semanticMapRepository");


// UMAP 좌표 전체 조회 API
exports.getSemanticMap = async (req, res) => {
  try {
    // DB에서 UMAP 좌표 데이터 조회
    const semanticMap = await semanticMapRepository.getSemanticMap();

    // 프론트로 데이터 반환
    res.json(semanticMap);
  } catch (err) {
    // 서버 에러 출력
    console.error("시맨틱 맵 조회 에러:", err);

    // 에러 응답
    res.status(500).json({
      message: "시맨틱 맵 조회 실패",
    });
  }
};