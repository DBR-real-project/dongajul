const axios = require('axios');

/**
 * POST /api/chat
 * AIChatbot 프론트엔드에서 메시지를 받아 GPT로 답변 반환
 */
exports.chat = async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: '메시지를 입력해주세요.' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 DBR(동아비즈니스리뷰)·HBR 사례 기반 전략 리스크 분석 전문가입니다.
13,335건의 성공/실패 사례를 학습한 AI로, 비즈니스 전략의 리스크와 성공 요인을 분석해드립니다.
짧고 실용적인 답변을 한국어로 제공해주세요. (최대 3~4문장)`,
          },
          { role: 'user', content: message },
        ],
        max_tokens: 400,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = response.data.choices[0]?.message?.content || '답변을 생성할 수 없습니다.';
    return res.json({ success: true, reply });
  } catch (err) {
    console.error('[chatController] error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, message: '챗봇 서비스 오류가 발생했습니다.' });
  }
};
