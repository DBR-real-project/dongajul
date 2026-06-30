const axios = require('axios');
<<<<<<< HEAD

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
=======
const db = require('../config/db');

const SYSTEM_PROMPT = `당신은 동아줄(Dongajul)의 AI 전략 어시스턴트입니다.
DBR·HBR·HBS 15,451건의 경영 사례를 기반으로 전략 리스크와 성공·실패 패턴을 대화형으로 안내합니다.

[대화 방식]
- 자연스러운 대화체로 답변하세요. 채팅이지 리포트가 아닙니다.
- 짧고 단순한 질문에는 2~4문장으로 간결하게 답하세요.
- 깊은 분석이 필요한 경우에만 항목을 나누어 정리하세요.
- 답변 후 상황에 따라 자연스럽게 1개의 추가 질문을 던지세요. (예: "어떤 산업 분야를 생각하고 계신가요?")
- 사용자가 이어서 말하면 맥락을 기억하고 대화를 이어가세요.

[역할]
- 전략 리스크, 성공/실패 요인, Porter·블루오션·린스타트업 등 경영 프레임워크 설명
- 사용자 전략의 잠재 리스크와 개선 방향 제시
- DBR·HBR·HBS 사례를 필요할 때만 예시로 활용

[원칙]
- 한국어로 자연스럽게 (구어체 허용)
- 불확실한 내용은 "데이터 기준으로는" 같이 가볍게 표현
- 홍보성 표현 금지, 객관적 분석에 집중`;

const MAX_HISTORY = 20;

// ── 세션 목록 조회 ─────────────────────────────────────────────────────
exports.getSessions = async (req, res) => {
  const user_id = req.user?.user_id;
  try {
    const [rows] = await db.execute(
      `SELECT session_id, title, updated_at
       FROM chat_sessions
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT 50`,
      [user_id]
    );
    return res.json({ sessions: rows });
  } catch (err) {
    console.error('[getSessions]', err.message);
    return res.status(500).json({ error: '세션 조회 실패' });
  }
};

// ── 세션 제목 수정 ────────────────────────────────────────────────────
exports.updateSession = async (req, res) => {
  const user_id = req.user?.user_id;
  const { id } = req.params;
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: '제목을 입력해주세요.' });
  try {
    await db.execute(
      'UPDATE chat_sessions SET title = ? WHERE session_id = ? AND user_id = ?',
      [title.trim().slice(0, 100), id, user_id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[updateSession]', err.message);
    return res.status(500).json({ error: '제목 수정 실패' });
  }
};

// ── 세션 삭제 ─────────────────────────────────────────────────────────
exports.deleteSession = async (req, res) => {
  const user_id = req.user?.user_id;
  const { id } = req.params;
  try {
    await db.execute(
      'DELETE FROM chat_messages WHERE session_id = ? AND user_id = ?',
      [id, user_id]
    );
    await db.execute(
      'DELETE FROM chat_sessions WHERE session_id = ? AND user_id = ?',
      [id, user_id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[deleteSession]', err.message);
    return res.status(500).json({ error: '세션 삭제 실패' });
  }
};

// ── 세션 메시지 로드 ──────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  const user_id = req.user?.user_id;
  const { session_id } = req.query;
  if (!session_id) return res.json({ messages: [] });
  try {
    const [rows] = await db.execute(
      `SELECT role, content, created_at
       FROM chat_messages
       WHERE user_id = ? AND session_id = ?
       ORDER BY created_at ASC
       LIMIT 100`,
      [user_id, session_id]
    );
    return res.json({ messages: rows });
  } catch (err) {
    console.error('[getHistory]', err.message);
    return res.status(500).json({ error: '기록 조회 실패' });
  }
};

// ── 메시지 전송 + GPT 호출 ────────────────────────────────────────────
exports.chat = async (req, res) => {
  const { message, session_id } = req.body;
  const user_id = req.user?.user_id;

  if (!message?.trim()) {
    return res.status(400).json({ error: '메시지를 입력해주세요.' });
  }

  const userMsg = message.trim();
  let currentSessionId = session_id ? Number(session_id) : null;

  console.log(`[chat] user_id=${user_id} session_id=${currentSessionId} msg="${userMsg.slice(0, 40)}"`);

  try {
    // 새 세션 생성 (첫 메시지)
    if (!currentSessionId) {
      const title = userMsg.length > 30 ? userMsg.slice(0, 30) + '…' : userMsg;
      const [result] = await db.execute(
        'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
        [user_id, title]
      );
      currentSessionId = result.insertId;
      console.log(`[chat] 새 세션 생성: session_id=${currentSessionId}`);
    }

    // 히스토리 로드
    const [rows] = await db.execute(
      `SELECT role, content FROM chat_messages
       WHERE session_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [currentSessionId]
    );
    const history = rows.reverse();
    console.log(`[chat] 히스토리 ${history.length}건 로드`);

    // GPT 메시지 구성
    const gptMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(r => ({ role: r.role, content: r.content })),
      { role: 'user', content: userMsg },
    ];

    // 사용자 메시지 저장
    await db.execute(
      'INSERT INTO chat_messages (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
      [user_id, currentSessionId, 'user', userMsg]
    );

    // GPT 호출
>>>>>>> 06d5573372fae868d35f2d4b6bfc609d225abbc7
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
<<<<<<< HEAD
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
=======
        messages: gptMessages,
        max_tokens: 600,
        temperature: 0.8,
>>>>>>> 06d5573372fae868d35f2d4b6bfc609d225abbc7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
<<<<<<< HEAD
=======
        timeout: 30000,
>>>>>>> 06d5573372fae868d35f2d4b6bfc609d225abbc7
      }
    );

    const reply = response.data.choices[0]?.message?.content || '답변을 생성할 수 없습니다.';
<<<<<<< HEAD
    return res.json({ success: true, reply });
  } catch (err) {
    console.error('[chatController] error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, message: '챗봇 서비스 오류가 발생했습니다.' });
=======
    console.log(`[chat] GPT 응답 ${reply.length}자`);

    // 응답 저장
    await db.execute(
      'INSERT INTO chat_messages (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
      [user_id, currentSessionId, 'assistant', reply]
    );

    // 세션 updated_at 갱신
    await db.execute(
      'UPDATE chat_sessions SET updated_at = NOW() WHERE session_id = ?',
      [currentSessionId]
    );

    return res.json({ success: true, reply, session_id: currentSessionId });
  } catch (err) {
    const status = err.response?.status;
    console.error('[chat] 오류:', status, err.response?.data || err.message);

    if (status === 429) {
      return res.status(503).json({ success: false, message: 'AI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' });
    }
    if (status === 401) {
      return res.status(503).json({ success: false, message: 'AI API 인증 오류입니다. 관리자에게 문의하세요.' });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ success: false, message: 'AI 응답 시간이 초과됐습니다. 다시 시도해주세요.' });
    }
    return res.status(500).json({ success: false, message: `서버 오류: ${err.message}` });
>>>>>>> 06d5573372fae868d35f2d4b6bfc609d225abbc7
  }
};
