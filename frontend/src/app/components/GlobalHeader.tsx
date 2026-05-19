import { Share2, Download, Sparkles, Send, Paperclip, X, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface GlobalHeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNotificationClick: () => void;
  onSearch?: (query: string) => void;
}

export function GlobalHeader({ darkMode, onToggleDarkMode, onNotificationClick, onSearch }: GlobalHeaderProps) {
  const [aiInput, setAiInput] = useState('');
  const [aiFiles, setAiFiles] = useState<File[]>([]);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; content: string; files?: string[] }[]>([
    { role: 'ai', content: '안녕하세요! 🎯 전략 분석을 도와드리겠습니다. 무엇을 도와드릴까요?' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleAiSendMessage = () => {
    if (!aiInput.trim() && aiFiles.length === 0) return;

    const userMessage: { role: 'user' | 'ai'; content: string; files?: string[] } = {
      role: 'user',
      content: aiInput,
      files: aiFiles.length > 0 ? aiFiles.map(f => f.name) : undefined,
    };

    setAiMessages(prev => [...prev, userMessage]);

    // 오른쪽 대시보드에 검색 쿼리 전달
    if (onSearch) {
      onSearch(aiInput);
    }

    setAiInput('');
    setAiFiles([]);
    setIsAiTyping(true);

    setTimeout(() => {
      const aiResponse = {
        role: 'ai' as const,
        content: `"${userMessage.content}"에 대한 분석을 진행했습니다. 오른쪽 대시보드에서 관련 전략 사례와 데이터를 확인하세요.`,
      };
      setAiMessages(prev => [...prev, aiResponse]);
      setIsAiTyping(false);
    }, 1500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAiFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAiFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleExport = () => {
    const chatHistory = aiMessages.map(msg => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`).join('\n\n');
    const blob = new Blob([chatHistory], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StratIQ-AI-대화내역-${new Date().toLocaleDateString('ko-KR')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const chatUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'StratIQ AI 대화',
          text: '전략 분석 AI와의 대화를 공유합니다',
          url: chatUrl,
        });
      } catch (err) {
        // 공유 취소됨 (사용자가 공유 대화상자를 닫음)
      }
    } else {
      // Fallback: 클립보드에 복사
      navigator.clipboard.writeText(chatUrl);
      alert('링크가 클립보드에 복사되었습니다!');
    }
  };

  const handleClearChat = () => {
    if (confirm('대화 내역을 모두 삭제하시겠습니까?')) {
      setAiMessages([
        { role: 'ai', content: '안녕하세요! 🎯 전략 분석을 도와드리겠습니다. 무엇을 도와드릴까요?' }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* AI Chat Area - Always Visible */}
      <div className={`flex-1 ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} overflow-hidden flex flex-col`}>
        {/* Header with Actions */}
        <div className={`${darkMode ? 'bg-[#0A0E1A] border-gray-800/50' : 'bg-white border-gray-200'} border-b px-4 py-3 flex flex-col gap-3 shadow-sm`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#142755] to-[#444655] rounded-lg flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>StratIQ AI</h2>
              <p className="text-xs text-gray-500">전략 분석 어시스턴트</p>
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between">
            <div className={`px-2.5 py-1 ${darkMode ? 'bg-[#444655]/30 border-gray-600' : 'bg-gray-100 border-gray-300'} border rounded-lg flex items-center gap-1.5`}>
              <Sparkles className="w-3 h-3 text-[#142755]" />
              <span className="text-xs font-medium text-[#142755]">활성</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className={`p-1.5 ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'} rounded-lg transition-colors`}
                title="대화 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleExport}
                className={`p-1.5 ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} rounded-lg transition-colors`}
                title="대화 내보내기"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleShare}
                className={`p-1.5 ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} rounded-lg transition-colors`}
                title="공유하기"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {aiMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'flex gap-2'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 bg-gradient-to-br from-[#142755] to-[#444655] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-[#142755] text-white'
                        : darkMode ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-xs leading-relaxed">{msg.content}</p>
                    {msg.files && msg.files.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-blue-400/30 space-y-1">
                        {msg.files.map((file, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs opacity-90">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>{file}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-[#142755] to-[#444655] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border px-3 py-2 rounded-xl`}>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-[#142755] rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-[#142755] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[#142755] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={aiChatEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className={`${darkMode ? 'bg-[#0A0E1A] border-gray-800/50' : 'bg-white border-gray-200'} border-t px-4 py-3`}>
          {/* File Attachments */}
          {aiFiles.length > 0 && (
            <div className="mb-2 flex gap-1 flex-wrap">
              {aiFiles.map((file, idx) => (
                <div key={idx} className={`flex items-center gap-1.5 px-2 py-1 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg text-xs`}>
                  <Paperclip className="w-2.5 h-2.5" />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{file.name}</span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="relative">
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAiSendMessage();
                }
              }}
              placeholder="메시지 입력..."
              rows={1}
              className={`w-full pl-3 pr-20 py-2.5 ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none`}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <input
                ref={aiFileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                multiple
              />
              <button
                onClick={() => aiFileInputRef.current?.click()}
                className={`p-1.5 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'} rounded-lg transition-colors`}
                title="파일 첨부"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleAiSendMessage}
                disabled={!aiInput.trim() && aiFiles.length === 0}
                className="p-1.5 bg-[#142755] text-white rounded-lg hover:bg-[#444655] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="전송"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
