import { Share2, Download, Sparkles, Send, Paperclip, X, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
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

  // 모달 제어 상태 변수
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  
  // 💡 링크 복사 알림 토스트를 제어하기 위한 상태 추가
  const [showCopyToast, setShowCopyToast] = useState(false);

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

  // 💡 투박한 alert 창을 걷어내고 부드러운 토스트 알림으로 교체한 공유 핸들러
  const handleShare = async () => {
    const chatUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'STRAND 45 대화',
          text: '전략 분석 AI와의 대화를 공유합니다',
          url: chatUrl,
        });
      } catch (err) {
        // 공유 취소 대응
      }
    } else {
      navigator.clipboard.writeText(chatUrl);
      
      // 💡 3초간 세련된 토스트 팝업 가이드 노출
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    }
  };

  const handleClearChatClick = () => {
    setIsClearModalOpen(true);
  };

  const handleConfirmClearChat = () => {
    setAiMessages([
      { role: 'ai', content: '안녕하세요! 🎯 전략 분석을 도와드리겠습니다. 무엇을 도와드릴까요?' }
    ]);
    setIsClearModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* 🌟 최상단 레이어에 부드럽게 흐르는 링크 복사 성공 토스트 컴포넌트 장착 */}
      {showCopyToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md border border-white/10 dark:border-slate-200 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>링크가 클립보드에 안전하게 복사되었습니다!</span>
        </div>
      )}

      {/* AI Chat Area - Always Visible */}
      <div className={`flex-1 ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} overflow-hidden flex flex-col`}>
        {/* Header with Actions */}
        <div className={`${darkMode ? 'bg-[#0A0E1A] border-gray-800/50' : 'bg-white border-gray-200'} border-b px-4 py-4 flex flex-col gap-3 shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#142755] to-[#444655] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} leading-snug`}>STRAND AI</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">전략 분석 어시스턴트</p>
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between">
            <div 
              className={`px-2.5 py-1 border rounded-lg flex items-center gap-1.5 transition-colors ${
                darkMode 
                  ? 'bg-[#142755]/30 border-[#142755] text-blue-400' 
                  : 'bg-gray-100 border-gray-300 text-[#142755]'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${darkMode ? 'text-blue-400' : 'text-[#142755]'}`} />
              <span className="text-xs font-semibold">활성</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChatClick}
                className={`p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'} rounded-lg transition-colors`}
                title="대화 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleExport}
                className={`p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} rounded-lg transition-colors`}
                title="대화 내보내기"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleShare}
                className={`p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} rounded-lg transition-colors`}
                title="공유하기"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-4">
            {aiMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'flex gap-2.5'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-[#142755] to-[#444655] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-[#142755] text-white rounded-tr-none'
                        : darkMode ? 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.files && msg.files.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-blue-400/30 space-y-1.5">
                        {msg.files.map((file, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs opacity-90">
                            <Paperclip className="w-3 h-3" />
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
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#142755] to-[#444655] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border px-4 py-3 rounded-2xl rounded-tl-none`}>
                    <div className="flex gap-1.5 items-center h-5">
                      <span className="w-2 h-2 bg-[#142755] rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-[#142755] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-[#142755] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={aiChatEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className={`${darkMode ? 'bg-[#0A0E1A] border-gray-800/50' : 'bg-white border-gray-200'} border-t px-4 py-4`}>
          {/* File Attachments */}
          {aiFiles.length > 0 && (
            <div className="mb-2.5 flex gap-1.5 flex-wrap">
              {aiFiles.map((file, idx) => (
                <div key={idx} className={`flex items-center gap-1.5 px-2.5 py-1 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg text-xs`}>
                  <Paperclip className="w-3 h-3" />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{file.name}</span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-gray-400 hover:text-red-500 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="relative flex items-end">
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAiSendMessage();
                }
              }}
              placeholder="STRAND AI에게 무엇이든 물어보세요!"
              rows={1}
              className={`w-full pl-4 pr-24 py-3 ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none shadow-inner`}
              style={{ minHeight: '46px', maxHeight: '140px' }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              <input
                ref={aiFileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                multiple
              />
              <button
                onClick={() => aiFileInputRef.current?.click()}
                className={`p-2 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'} rounded-lg transition-colors`}
                title="파일 첨부"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={handleAiSendMessage}
                disabled={!aiInput.trim() && aiFiles.length === 0}
                className="p-2 bg-[#142755] text-white rounded-lg hover:bg-[#444655] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow"
                title="전송"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 디자인 무드를 하나로 통합한 대화 내역 전용 커스텀 삭제 모달 */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsClearModalOpen(false)}
          />
          
          <div className={`relative transform overflow-hidden rounded-2xl ${
            darkMode ? 'bg-gray-950 border border-gray-800/80 text-white shadow-gray-950/60' : 'bg-white text-gray-900 shadow-xl'
          } px-6 py-6 text-left shadow-2xl transition-all sm:w-full sm:max-w-md animate-in fade-in zoom-in-95 duration-200`}>
            
            <div className="flex items-start gap-4">
              <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              
              <div className="mt-1 text-left sm:ml-1">
                <h3 className="text-base font-bold leading-6">
                  대화 내역 비우기
                </h3>
                <div className="mt-2">
                  <p className={`text-xs sm:text-sm font-medium whitespace-pre-line ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    현재 진행 중인 대화 내역을 모두 삭제하시겠습니까?
                    삭제된 데이터와 타임라인은 복구할 수 없습니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-row-reverse gap-2">
              <button
                type="button"
                onClick={handleConfirmClearChat}
                className="inline-flex justify-center rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
              >
                전체 삭제
              </button>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className={`inline-flex justify-center rounded-xl ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } active:scale-95 px-4 py-2.5 text-xs font-bold transition-all`}
              >
                취소
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}