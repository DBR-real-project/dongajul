import { Search, Command, ArrowRight, TrendingUp, BarChart3, FileText, Settings, Zap, GitCompare, History } from 'lucide-react';
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
      case 'export':
        alert('보고서를 내보냅니다');
        break;
      case 'search':
        alert('사례 검색');
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

  const commands = [
    { icon: TrendingUp, label: '새 전략 분석', shortcut: 'N', category: '작업', action: 'new-analysis' },
    { icon: GitCompare, label: '전략 비교', shortcut: 'C', category: '작업', action: 'compare' },
    { icon: FileText, label: '보고서 내보내기', shortcut: 'E', category: '작업', action: 'export' },
    { icon: Search, label: '사례 검색', shortcut: '/', category: '탐색', action: 'search' },
    { icon: History, label: '히스토리', shortcut: 'H', category: '탐색', action: 'history' },
    { icon: Settings, label: '설정', shortcut: 'S', category: '탐색', action: 'settings' },
    { icon: Zap, label: 'AI 인사이트', shortcut: 'I', category: '탐색', action: 'ai-insights' },
  ];

  const filteredCommands = query
    ? commands.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className={`${
          darkMode
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-gray-200'
        } border rounded-2xl shadow-2xl overflow-hidden`}>
          {/* Search Input */}
          <div className={`flex items-center gap-3 px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="명령어 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`flex-1 bg-transparent text-base ${
                darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              } focus:outline-none`}
              autoFocus
            />
            <div className={`flex items-center gap-1 px-2 py-1 ${
              darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            } rounded text-xs font-semibold`}>
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className={`px-5 py-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                명령어를 찾을 수 없습니다
              </div>
            ) : (
              <>
                {['작업', '탐색'].map(category => {
                  const categoryCommands = filteredCommands.filter(cmd => cmd.category === category);
                  if (categoryCommands.length === 0) return null;

                  return (
                    <div key={category}>
                      <div className={`px-5 py-2 text-xs font-bold tracking-wide uppercase ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {category}
                      </div>
                      {categoryCommands.map((cmd, idx) => {
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleCommand(cmd.action)}
                            className={`w-full flex items-center gap-3 px-5 py-3 ${
                              darkMode
                                ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
                                : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                            } transition-all group`}
                          >
                            <div className={`p-2 ${
                              darkMode ? 'bg-gray-800 group-hover:bg-[#444655]/30' : 'bg-gray-100 group-hover:bg-gray-100'
                            } rounded-lg transition-colors`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="flex-1 text-left text-sm font-medium">{cmd.label}</span>
                            <div className="flex items-center gap-2">
                              <kbd className={`px-2 py-1 ${
                                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                              } rounded text-xs font-semibold`}>
                                {cmd.shortcut}
                              </kbd>
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
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

          {/* Footer */}
          <div className={`flex items-center justify-between px-5 py-3 border-t ${
            darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'} rounded`}>
                  ↑↓
                </kbd>
                <span className={darkMode ? 'text-gray-500' : 'text-gray-600'}>이동</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'} rounded`}>
                  ↵
                </kbd>
                <span className={darkMode ? 'text-gray-500' : 'text-gray-600'}>선택</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'} rounded`}>
                  ESC
                </kbd>
                <span className={darkMode ? 'text-gray-500' : 'text-gray-600'}>닫기</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
