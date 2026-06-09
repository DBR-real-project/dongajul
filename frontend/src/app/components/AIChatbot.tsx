import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { apiFetch } from '../utils/api';

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: '안녕하세요! DBR·HBR 사례 기반 전략 분석 도우미입니다. 비즈니스 전략의 리스크나 성공 요인에 대해 물어보세요.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      const reply = data.reply || '죄송합니다. 답변을 가져올 수 없습니다.';
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#142755] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#444655] transition-colors z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white shadow-2xl flex flex-col z-50 border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-[#142755] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="text-sm font-medium">AI 분석 도우미</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#142755] text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">분석 중...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="전략 리스크에 대해 질문하세요..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#1e3a5f] disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-[#142755] text-white px-3 py-2 rounded hover:bg-[#444655] transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
