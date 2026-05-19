import { Search } from 'lucide-react';

interface TopBarProps {
  darkMode: boolean;
  language?: string;
  currentView: string;
}

export function TopBar({ darkMode, language = 'ko', currentView }: TopBarProps) {
  const viewTitles: Record<string, { ko: string; en: string }> = {
    dashboard: { ko: 'AI 채팅', en: 'AI Chat' },
    analysis: { ko: '데이터 분석', en: 'Data Analysis' },
    strategy: { ko: '전략 워크스페이스', en: 'Strategy Workspace' },
    compare: { ko: '비교 분석', en: 'Compare Analysis' },
    history: { ko: '히스토리', en: 'History' },
    reports: { ko: '보고서', en: 'Reports' },
    risk: { ko: '리스크 분석', en: 'Risk Analysis' },
    article: { ko: '아티클', en: 'Article' },
    notifications: { ko: '알림', en: 'Notifications' },
    profile: { ko: '프로필', en: 'Profile' },
  };

  const title = viewTitles[currentView]?.[language] || viewTitles.dashboard[language];

  return (
    <div className={`h-16 ${darkMode ? 'bg-[#0A0E1A] border-gray-800' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-8 shadow-sm`}>
      {/* Page Title */}
      <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h1>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-4 py-2 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        } border rounded-lg w-80`}>
          <Search className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder={language === 'ko' ? '검색...' : 'Search...'}
            className={`flex-1 bg-transparent outline-none text-sm ${
              darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        {/* AI Usage Indicator */}
        <div className={`px-3 py-1.5 ${
          darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-gray-50 border-gray-200'
        } border rounded-lg flex items-center gap-2`}>
          <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'ko' ? 'AI 사용량' : 'AI Usage'}
          </span>
          <span className="text-xs font-bold bg-gradient-to-r from-[#142755] to-indigo-600 bg-clip-text text-transparent">
            73%
          </span>
        </div>
      </div>
    </div>
  );
}
