const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("프론트에서 온 헤더:", authHeader); // 1번 확인

  if (!authHeader) {
    return res.status(401).json({ message: '토큰이 없습니다.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("토큰 해독 성공:", decoded); // 2번 확인
    req.user = decoded;
    next();
  } catch (err) {
    console.error("토큰 검증 에러 원인:", err.message);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = {
  verifyToken,
};