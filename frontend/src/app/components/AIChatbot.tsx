import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface AIChatbotProps {
  darkMode?: boolean;
}

export function AIChatbot({ darkMode = false }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '안녕하세요! 동아줄 AI 어시스턴트입니다.\nDBR·HBR 사례 기반으로 전략 리스크나 경영 질문에 답변드립니다.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data.reply || '답변을 생성할 수 없습니다.';
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 플로팅 토글 버튼 */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-500 hover:bg-gray-600'
            : 'bg-gradient-to-br from-[#142755] to-[#3B547E] hover:from-[#1a316c] hover:to-[#4a6b9e] hover:scale-110'
        }`}
        title="AI 전략 어시스턴트"
      >
        {isOpen
          ? <X className="w-6 h-6 text-white" />
          : <MessageCircle className="w-6 h-6 text-white" />
        }
      </button>

      {/* 채팅 패널 */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          darkMode ? 'bg-[#0F1623] border-gray-700/60' : 'bg-white border-gray-200'
        } ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        style={{ height: '480px' }}
      >
        {/* 헤더 */}
        <div className="bg-[#142755] px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">동아줄 AI 어시스턴트</p>
            <p className="text-[10px] text-white/60">DBR·HBR 사례 기반 전략 Q&A</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className="w-6 h-6 rounded-full bg-[#142755] flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? `bg-[#142755] text-white rounded-tr-sm`
                    : darkMode
                      ? 'bg-gray-800 text-gray-100 rounded-tl-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <User className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-[#142755] flex-shrink-0 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className={`px-3 py-2 rounded-2xl rounded-tl-sm ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <Loader2 className={`w-4 h-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력 영역 */}
        <div className={`px-3 py-3 border-t flex-shrink-0 ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
          <div className={`flex items-end gap-2 rounded-xl border px-3 py-2 ${
            darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="전략 리스크나 경영 질문을 입력하세요..."
              rows={1}
              disabled={isLoading}
              className={`flex-1 resize-none text-xs leading-relaxed focus:outline-none bg-transparent ${
                darkMode ? 'text-white placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'
              } disabled:opacity-50`}
              style={{ maxHeight: '80px', overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-1.5 rounded-lg bg-[#142755] text-white hover:bg-[#1a316c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className={`text-[10px] mt-1.5 text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Enter 전송 · Shift+Enter 줄바꿈 · ⚠️ AI 참고용 자료
          </p>
        </div>
      </div>
    </>
  );
}
