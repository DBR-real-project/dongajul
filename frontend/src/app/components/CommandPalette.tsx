/**
 * src/app/components/CommandPalette.tsx - 전역 커맨드 팔레트 모달
 * * 수정 포인트:
 * - 자소서 내보내기(export) 액션 및 commands 배열 항목 완벽 제거
 * - 미사용 아이콘(BarChart3) 정리
 * - 브랜드 테마 컬러 반영: #0B2F61(딥 네이비), #C8994B(웜 골드 보조색) 호버 스타일 적용
 */

import { Search, Command, ArrowRight, TrendingUp, Settings, Zap, GitCompare, History } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export function CommandPalette({ isOpen, onClose, darkMode }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCommand = (action: string) => {
    onClose();
    switch (action) {
      case 'new-analysis':
        alert('새 전략 분석을 시작합니다');
        break;
      case 'compare':
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'compare' }));
        break;
      case 'search':
        alert('사례 검색 시스템을 호출합니다');
        break;
      case 'settings':
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }));
        break;
      case 'ai-insights':
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }));
        break;
      case 'history':
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'history' }));
        break;
    }
  };

  // 🌟 '자소서 내보내기' 명령 객체를 배열에서 완전히 필터링하여 지웠습니다.
  const commands = [
    { icon: TrendingUp, label: '새 전략 분석', shortcut: 'N', category: '작업', action: 'new-analysis' },
    { icon: GitCompare, label: '전략 비교 분석', shortcut: 'C', category: '작업', action: 'compare' },
    { icon: Search, label: '사례 리서치 검색', shortcut: '/', category: '탐색', action: 'search' },
    { icon: History, label: '히스토리 내역', shortcut: 'H', category: '탐색', action: 'history' },
    { icon: Settings, label: '설정', shortcut: 'S', category: '탐색', action: 'settings' },
    { icon: Zap, label: 'AI 인사이트 대시보드', shortcut: 'I', category: '탐색', action: 'ai-insights' },
  ];

  const filteredCommands = query
    ? commands.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  return (
    <>
      {/* 백드롭 레이어 */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 모달 본체 */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300 px-4 sm:px-0">
        <div className={`${
          darkMode
            ? 'bg-[#0A0E1A] border-gray-800'
            : 'bg-white border-gray-200'
        } border rounded-2xl shadow-2xl overflow-hidden`}>
          
          {/* 상단 통합 검색 바 */}
          <div className={`flex items-center gap-3 px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <Search className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="명령어 또는 메뉴 탐색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`flex-1 bg-transparent text-base font-medium ${
                darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'
              } focus:outline-none`}
              autoFocus
            />
            <div className={`flex items-center gap-1 px-2 py-1 ${
              darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
            } rounded-lg text-xs font-bold`}>
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* 커맨드 매핑 리스트 영역 */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {filteredCommands.length === 0 ? (
              <div className={`px-5 py-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} font-medium`}>
                일치하는 명령어를 찾을 수 없습니다
              </div>
            ) : (
              <>
                {['작업', '탐색'].map(category => {
                  const categoryCommands = filteredCommands.filter(cmd => cmd.category === category);
                  if (categoryCommands.length === 0) return null;

                  return (
                    <div key={category} className="space-y-0.5">
                      <div className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase ${
                        darkMode ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {category}
                      </div>
                      {categoryCommands.map((cmd, idx) => {
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleCommand(cmd.action)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl ${
                              darkMode
                                ? 'hover:bg-gray-800/70 text-gray-300 hover:text-white'
                                : 'hover:bg-blue-50/50 text-gray-700 hover:text-[#0B2F61]'
                            } transition-all group`}
                          >
                            <div className={`p-2 ${
                              darkMode 
                                ? 'bg-gray-800 group-hover:bg-[#0B2F61]/30 text-gray-400 group-hover:text-blue-400' 
                                : 'bg-slate-100 group-hover:bg-blue-100/60 text-slate-500 group-hover:text-[#0B2F61]'
                            } rounded-lg transition-colors`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="flex-1 text-left text-sm font-semibold">{cmd.label}</span>
                            <div className="flex items-center gap-2">
                              <kbd className={`px-2 py-0.5 ${
                                darkMode ? 'bg-gray-800 text-gray-500 group-hover:text-gray-300' : 'bg-slate-100 text-slate-400 group-hover:bg-white'
                              } rounded text-[10px] font-bold transition-colors`}>
                                {cmd.shortcut}
                              </kbd>
                              <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${darkMode ? 'text-gray-400' : 'text-[#C8994B]'} -translate-x-1 group-hover:translate-x-0 duration-200`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* 하단 가이드 가이드바 안내 */}
          <div className={`flex items-center justify-between px-5 py-3 border-t ${
            darkMode ? 'border-gray-800 bg-gray-900/30' : 'border-gray-100 bg-slate-50/60'
          }`}>
            <div className="flex items-center gap-4 text-[11px] font-medium">
              <div className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-500 border border-slate-200'} rounded shadow-sm`}>
                  ↑↓
                </kbd>
                <span className={darkMode ? 'text-gray-600' : 'text-slate-500'}>이동</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-500 border border-slate-200'} rounded shadow-sm`}>
                  ↵
                </kbd>
                <span className={darkMode ? 'text-gray-600' : 'text-slate-500'}>실행</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-500 border border-slate-200'} rounded shadow-sm`}>
                  ESC
                </kbd>
                <span className={darkMode ? 'text-gray-600' : 'text-slate-500'}>닫기</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}