const axios = require('axios');
const db = require('../config/db');

const SYSTEM_PROMPT = `당신은 동아줄(Dongajul)의 AI 전략 어시스턴트입니다.
DBR(동아비즈니스리뷰)·HBR·HBS 사례 13,000건 이상을 기반으로 비즈니스 전략 리스크를 분석합니다.

역할:
- 전략 리스크, 성공/실패 요인, 경영 프레임워크(Porter, 블루오션, 린스타트업 등) 설명
- 사용자 전략의 잠재 리스크와 개선 방향 제시
- DBR·HBR 사례를 예시로 활용
- 대화 맥락을 기억하며 연속 대화 지원

답변 원칙:
- 한국어로 명확하고 실용적으로 답변 (200~500자 권장)
- 핵심 포인트는 번호 목록이나 **굵은 텍스트**로 정리
- 불확실한 내용은 "사례 데이터 기준"임을 명시
- 마케팅 홍보성 표현 금지, 객관적 분석에 집중`;

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
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: gptMessages,
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const reply = response.data.choices[0]?.message?.content || '답변을 생성할 수 없습니다.';
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
  }
};
