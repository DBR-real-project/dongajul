import { Bell, User, Search, Clock, TrendingUp, Building2 } from 'lucide-react';
import { TabType } from '../App';
import { ContextSwitcher } from './ContextSwitcher';
import { useState } from 'react';

interface SearchHistoryProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  darkMode?: boolean;
  language?: string;
}

export function SearchHistory({ activeTab, onTabChange, onNotificationClick, onProfileClick, darkMode = false, language = 'ko' }: SearchHistoryProps) {
  const t = {
    ko: {
      currentContext: '디지털 전환 프로젝트',
      dashboard: '데이터분석',
      strategy: '전략 관리',
      history: '히스토리',
      searchHistory: '검색 히스토리',
      allHistory: '전체 기록',
      recentSearches: '최근 검색',
      results: '건 결과',
      hoursAgo: '시간 전',
      daysAgo: '일 전',
      historyData: [
        { id: 1, query: '디지털 트렌스포메이션 성공 사례', time: '2시간 전', results: 24, category: '엔터테인먼트' },
        { id: 2, query: '플랫폼 경제 독점 사례', time: '5시간 전', results: 18, category: '기술' },
        { id: 3, query: '재무 리스크 분석', time: '1일 전', results: 42, category: '금융' },
        { id: 4, query: '시장 진입 전략', time: '2일 전', results: 31, category: '제조' },
        { id: 5, query: '공급망 관리 실패', time: '3일 전', results: 15, category: '유통' },
      ]
    },
    en: {
      currentContext: 'Digital Transformation Project',
      dashboard: 'Data Analysis',
      strategy: 'Strategy Management',
      history: 'History',
      searchHistory: 'Search History',
      allHistory: 'All History',
      recentSearches: 'Recent Searches',
      results: ' results',
      hoursAgo: ' hours ago',
      daysAgo: ' days ago',
      historyData: [
        { id: 1, query: 'Digital Transformation Success Cases', time: '2 hours ago', results: 24, category: 'Entertainment' },
        { id: 2, query: 'Platform Economy Monopoly Cases', time: '5 hours ago', results: 18, category: 'Technology' },
        { id: 3, query: 'Financial Risk Analysis', time: '1 day ago', results: 42, category: 'Finance' },
        { id: 4, query: 'Market Entry Strategy', time: '2 days ago', results: 31, category: 'Manufacturing' },
        { id: 5, query: 'Supply Chain Management Failures', time: '3 days ago', results: 15, category: 'Retail' },
      ]
    }
  };
  const text = language === 'en' ? t.en : t.ko;
  const searchHistoryData = text.historyData;

  const [currentContext, setCurrentContext] = useState(text.currentContext);

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      <header className={`${darkMode ? 'bg-[#0A0E1A]/80 backdrop-blur-xl border-gray-800/50' : 'bg-white/80 backdrop-blur-xl border-gray-200/50'} border-b sticky top-0 z-50`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <ContextSwitcher
              currentContext={currentContext}
              onSelect={setCurrentContext}
              darkMode={darkMode}
              language={language}
            />
            <div className="flex items-center gap-3">
              <button onClick={onNotificationClick} className={`p-2.5 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} relative rounded-lg transition-all`}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
              </button>
              <button onClick={onProfileClick} className={`p-2.5 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-all`}>
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 max-w-[1600px] mx-auto">
        <div className={`bg-gradient-to-br ${darkMode ? 'from-gray-800 to-blue-800' : 'from-[#142755] to-[#444655]'} p-6 text-white mb-6 rounded-2xl shadow-lg`}>
          <div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-blue-100'} mb-2 tracking-wide`}>
            {text.searchHistory.toUpperCase()}
          </div>
          <h2 className="text-xl sm:text-2xl mb-3 leading-tight">
            {language === 'ko' ? (
              <>최근 검색 및 분석 내역을<br />빠르게 확인하세요 📋</>
            ) : (
              <>Quickly review your recent<br />search and analysis history 📋</>
            )}
          </h2>
          <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-blue-100'}`}>
            {language === 'ko' ? 'AI가 분석한 기록과 결과를 한눈에 파악할 수 있습니다' : 'View AI-analyzed records and results at a glance'}
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{text.recentSearches}</h3>
          <button className="text-xs text-[#142755] hover:underline">{language === 'ko' ? '전체 삭제' : 'Clear All'}</button>
        </div>

        <div className="space-y-3">
          {searchHistoryData.map((item) => (
            <div
              key={item.id}
              className={`group ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
                  : 'bg-white'
              } p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                darkMode
                  ? 'hover:shadow-xl hover:shadow-gray-900/20'
                  : 'shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-100'}`}>
                    <Search className={`w-4 h-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  </div>
                  <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-[#142755] dark:group-hover:text-[#A9AABC] transition-colors`}>
                    {item.query}
                  </h4>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.time}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{item.results}{text.results}</span>
                  </div>
                  <div className={`px-2.5 py-1 ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700'} text-xs font-medium rounded-lg`}>
                    {item.category}
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-gradient-to-r from-[#142755] to-[#444655] text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all duration-300">
                  {language === 'ko' ? '다시 검색' : 'Search Again'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-6 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-indigo-950 border-gray-600' : 'bg-gradient-to-br from-gray-50 to-indigo-50 border-gray-300'} p-5 border-2 rounded-xl`}>
          <h3 className={`text-sm mb-3 ${darkMode ? 'text-[#A9AABC]' : 'text-blue-900'} font-semibold`}>
            💡 {language === 'ko' ? 'AI 검색 팁' : 'AI Search Tips'}
          </h3>
          <ul className={`space-y-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {language === 'ko' ? [
              '키워드를 구체적으로 입력하면 더 정확한 결과를 얻을 수 있습니다',
              '산업명, 기업명, 전략 유형으로 검색 가능합니다',
              '따옴표("")를 사용하여 정확한 구문을 검색할 수 있습니다',
              '마이너스(-)를 사용하여 특정 단어를 제외할 수 있습니다',
            ] : [
              'Use specific keywords for more accurate results',
              'Search by industry, company, or strategy type',
              'Use quotes ("") to search for exact phrases',
              'Use minus (-) to exclude specific words',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className={darkMode ? 'text-[#A9AABC]' : 'text-[#142755]'}>💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
