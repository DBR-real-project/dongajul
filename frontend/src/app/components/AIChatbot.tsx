import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle, X, Send, Bot, User, Trash2, Plus, MessageSquare, Menu, Pencil, Check,
} from 'lucide-react';
import { apiFetch } from '../utils/api';

interface Message {
  role: 'user' | 'bot';
  text: string;
  time?: string;
}

interface Session {
  session_id: number;
  title: string;
  updated_at: string;
}

interface AIChatbotProps {
  darkMode?: boolean;
}

const WELCOME_TEXT = '안녕하세요! 동아줄 AI 어시스턴트입니다.\nDBR·HBR·HBS 13,000+ 사례 기반으로 전략 리스크, 경영 프레임워크, 성공/실패 요인을 분석해드립니다.\n\n무엇이 궁금하신가요?';

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// 간단한 마크다운 렌더러 (**bold**, 줄바꿈, 번호 목록)
function RenderText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i} className="block leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part
            )}
            {i < lines.length - 1 && line === '' && <br />}
          </span>
        );
      })}
    </>
  );
}

export function AIChatbot({ darkMode = false }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  // historyLoaded 제거됨 → sessionsFetchedRef 로 대체
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const sessionsFetchedRef = useRef(false);

  // 세션 목록 로드
  const loadSessions = useCallback(async () => {
    try {
      const res = await apiFetch('/api/chat/sessions');
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {}
  }, []);

  // 채팅창 열릴 때 세션 목록 로드
  useEffect(() => {
    if (isOpen && !sessionsFetchedRef.current) {
      sessionsFetchedRef.current = true;
      loadSessions();
    }
  }, [isOpen, loadSessions]);

  // 새 대화 시작
  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // 세션 전환
  const switchSession = async (session_id: number) => {
    if (session_id === currentSessionId) return;
    setSessionLoading(true);
    setCurrentSessionId(session_id);
    setMessages([]);
    try {
      const res = await apiFetch(`/api/chat/history?session_id=${session_id}`);
      const data = await res.json();
      const loaded: Message[] = (data.messages || []).map((m: { role: string; content: string; created_at: string }) => ({
        role: m.role === 'assistant' ? 'bot' : 'user',
        text: m.content,
        time: formatTime(m.created_at),
      }));
      setMessages(loaded);
    } catch {}
    setSessionLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // 세션 삭제
  const deleteSession = async (e: React.MouseEvent, session_id: number) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/chat/sessions/${session_id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.session_id !== session_id));
      if (currentSessionId === session_id) startNewChat();
    } catch {}
  };

  // 세션 제목 편집 시작
  const startEdit = (e: React.MouseEvent, s: Session) => {
    e.stopPropagation();
    setEditingSessionId(s.session_id);
    setEditingTitle(s.title);
    setTimeout(() => editInputRef.current?.select(), 50);
  };

  // 세션 제목 저장
  const saveTitle = async (session_id: number) => {
    const title = editingTitle.trim();
    if (!title) { setEditingSessionId(null); return; }
    setEditingSessionId(null);
    setSessions(prev => prev.map(s => s.session_id === session_id ? { ...s, title } : s));
    try {
      await apiFetch(`/api/chat/sessions/${session_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      });
    } catch {}
  };

  // 메시지 전송
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    const now = new Date().toISOString();
    setMessages(prev => [...prev, { role: 'user', text, time: formatTime(now) }]);
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, session_id: currentSessionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: data.message || `서버 오류(${res.status})가 발생했습니다. 잠시 후 다시 시도해주세요.`,
          time: formatTime(new Date().toISOString()),
        }]);
        setIsLoading(false);
        return;
      }

      const reply = data.reply || '답변을 생성할 수 없습니다.';
      const newSessionId = data.session_id;

      setMessages(prev => [...prev, {
        role: 'bot',
        text: reply,
        time: formatTime(new Date().toISOString()),
      }]);

      if (newSessionId && newSessionId !== currentSessionId) {
        setCurrentSessionId(newSessionId);
        await loadSessions();
      } else {
        await loadSessions();
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: '네트워크 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 스크롤 to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 세션 날짜 그룹핑
  const groupedSessions = sessions.reduce<{ label: string; items: Session[] }[]>((acc, s) => {
    const label = relativeDate(s.updated_at);
    const group = acc.find(g => g.label === label);
    if (group) group.items.push(s);
    else acc.push({ label, items: [s] });
    return acc;
  }, []);

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <>
      {/* 플로팅 토글 버튼 */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-gradient-to-br from-[#142755] to-[#3B547E] hover:from-[#1a316c] hover:to-[#4a6b9e] hover:scale-110'
        }`}
        title="AI 전략 어시스턴트"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* 풀스크린 모달 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex" style={{ backdropFilter: 'blur(2px)' }}>
          {/* 배경 클릭으로 닫기 방지용 overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />

          {/* 채팅 컨테이너 */}
          <div
            className={`relative ml-auto flex w-full max-w-4xl h-full shadow-2xl ${
              darkMode ? 'bg-[#0F1623]' : 'bg-[#F9FAFB]'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* ── 사이드바 ──────────────────────────────────────────── */}
            <div
              className={`flex-shrink-0 flex flex-col transition-all duration-200 ${
                sidebarOpen ? 'w-[240px]' : 'w-0 overflow-hidden'
              } bg-[#171717]`}
            >
              {/* 새 대화 버튼 */}
              <div className="p-3 pt-4 flex-shrink-0">
                <button
                  onClick={startNewChat}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-colors border border-white/10"
                >
                  <Plus className="w-4 h-4" />
                  새 대화
                </button>
              </div>

              {/* 세션 목록 */}
              <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
                {groupedSessions.length === 0 ? (
                  <p className="text-xs text-gray-600 px-3 py-4 text-center">대화 기록이 없습니다</p>
                ) : (
                  groupedSessions.map(group => (
                    <div key={group.label}>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider px-3 py-2 mt-2">{group.label}</p>
                      {group.items.map(s => (
                        <div
                          key={s.session_id}
                          onClick={() => editingSessionId !== s.session_id && switchSession(s.session_id)}
                          className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-left group transition-colors cursor-pointer ${
                            currentSessionId === s.session_id
                              ? 'bg-white/15 text-white'
                              : 'text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                          {editingSessionId === s.session_id ? (
                            /* 편집 모드 */
                            <input
                              ref={editInputRef}
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveTitle(s.session_id);
                                if (e.key === 'Escape') setEditingSessionId(null);
                              }}
                              onBlur={() => saveTitle(s.session_id)}
                              onClick={e => e.stopPropagation()}
                              className="flex-1 min-w-0 bg-white/10 text-white text-xs px-1.5 py-0.5 rounded outline-none border border-white/20 focus:border-white/40"
                              maxLength={60}
                              autoFocus
                            />
                          ) : (
                            /* 일반 모드 */
                            <span className="flex-1 truncate">{s.title}</span>
                          )}
                          {editingSessionId === s.session_id ? (
                            <button
                              onClick={e => { e.stopPropagation(); saveTitle(s.session_id); }}
                              className="p-0.5 rounded text-emerald-400 flex-shrink-0"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={e => startEdit(e, s)}
                                className="p-0.5 rounded hover:text-blue-400 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={e => deleteSession(e, s.session_id)}
                                className="p-0.5 rounded hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* 사이드바 하단 */}
              <div className="p-3 border-t border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#C8994B] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[11px] text-gray-500 truncate">동아줄 AI · DBR·HBR 기반</span>
                </div>
              </div>
            </div>

            {/* ── 메인 채팅 영역 ──────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* 헤더 */}
              <div className={`flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 ${
                darkMode ? 'border-gray-700/60 bg-[#0F1623]' : 'border-gray-200 bg-white'
              }`}>
                <button
                  onClick={() => setSidebarOpen(o => !o)}
                  className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#142755] to-[#3B547E] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      동아줄 AI 어시스턴트
                    </p>
                    <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      전략 리스크 사전진단 · 사례 기반 Q&A · 프레임워크 해설
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 메시지 영역 */}
              <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-[#0F1623]' : 'bg-[#F9FAFB]'}`}>
                {isEmpty ? (
                  /* 빈 상태 — 환영 화면 */
                  <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#142755] to-[#3B547E] flex items-center justify-center mb-4 shadow-lg">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>동아줄 AI 어시스턴트</h2>
                    <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      DBR·HBR·HBS 13,000+ 사례를 학습한 전략 리스크 전문 AI입니다
                    </p>
                    <div className="grid grid-cols-1 gap-2 w-full max-w-sm text-left">
                      {([
                        { icon: '🔍', title: '전략 사전진단', desc: '아이디어 단계에서 리스크 포인트 파악' },
                        { icon: '📊', title: '진단 결과 해석', desc: '점수·유사 사례의 의미를 심층 분석' },
                        { icon: '📚', title: '프레임워크 Q&A', desc: 'Porter·블루오션·린스타트업 실전 적용' },
                      ] as const).map(item => (
                        <div key={item.title} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${
                          darkMode ? 'bg-gray-800/60' : 'bg-gray-50 border border-gray-100'
                        }`}>
                          <span className="text-lg flex-shrink-0">{item.icon}</span>
                          <div>
                            <p className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.title}</p>
                            <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* 메시지 목록 */
                  <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    {sessionLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-[#142755] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'bot' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#142755] to-[#3B547E] flex-shrink-0 flex items-center justify-center mt-0.5 shadow">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="flex flex-col gap-1" style={{ maxWidth: '80%', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div
                              className={`px-4 py-3 rounded-2xl text-sm ${
                                msg.role === 'user'
                                  ? 'bg-[#142755] text-white rounded-tr-sm'
                                  : darkMode
                                    ? 'bg-gray-800/70 text-gray-100 rounded-tl-sm border border-gray-700/50'
                                    : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
                              }`}
                            >
                              <RenderText text={msg.text} />
                            </div>
                            {msg.time && (
                              <span className={`text-[10px] px-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{msg.time}</span>
                            )}
                          </div>
                          {msg.role === 'user' && (
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <User className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {/* 타이핑 인디케이터 */}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#142755] to-[#3B547E] flex-shrink-0 flex items-center justify-center shadow">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${darkMode ? 'bg-gray-800/70 border border-gray-700/50' : 'bg-white shadow-sm border border-gray-100'}`}>
                          <div className="flex gap-1.5 items-center h-4">
                            {[0, 1, 2].map(idx => (
                              <span
                                key={idx}
                                className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'} animate-bounce`}
                                style={{ animationDelay: `${idx * 0.15}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* 입력 영역 */}
              <div className={`px-4 py-4 border-t flex-shrink-0 ${
                darkMode ? 'border-gray-700/60 bg-[#0F1623]' : 'border-gray-200 bg-white'
              }`}>
                <div className="max-w-2xl mx-auto">
                  <div className={`flex items-end gap-2 rounded-2xl border px-4 py-3 transition-colors ${
                    darkMode
                      ? 'bg-gray-800/60 border-gray-700 focus-within:border-gray-500'
                      : 'bg-gray-50 border-gray-200 focus-within:border-[#142755]'
                  }`}>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="전략 리스크나 경영 질문을 입력하세요..."
                      rows={1}
                      disabled={isLoading}
                      className={`flex-1 resize-none text-sm leading-relaxed focus:outline-none bg-transparent ${
                        darkMode ? 'text-white placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'
                      } disabled:opacity-50`}
                      style={{ maxHeight: '120px', overflowY: 'auto' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="p-2 rounded-xl bg-[#142755] text-white hover:bg-[#1a316c] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className={`text-[10px] mt-2 text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    Enter 전송 · Shift+Enter 줄바꿈 · ⚠️ AI 참고용 자료이며 전문가 자문을 병행하시기 바랍니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
