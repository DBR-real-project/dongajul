// ============================================================
// MainDashboard.tsx
// ============================================================
import { Bell, User, TrendingUp, Search, Filter, BarChart3, AlertTriangle, X } from 'lucide-react';
import { TabType } from '../App';
import { ContextSwitcher } from './ContextSwitcher';
import { useState } from 'react';

interface CompareItem {
  id: number;
  status: string;
  strategy: string;
  riskLevel: string;
  industry: string;
  title: string;
  strategySum: string;
  riskSum: string;
}

interface MainDashboardProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNavigateToRisk: () => void;
  onArticleClick: (id: number) => void;
  onCompareClick: (items: CompareItem[]) => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  darkMode?: boolean;
  language?: string;
}

export function MainDashboard({ activeTab, onTabChange, onNavigateToRisk, onArticleClick, onCompareClick, onNotificationClick, onProfileClick, darkMode = false, language = 'ko' }: MainDashboardProps) {
  const t = {
    ko: {
      dashboard: '데이터분석',
      strategy: '전략 관리',
      history: '히스토리',
      aiSearch: 'AI 기반 전략 검색 & 분석',
      welcomeMessage: '안녕하세요! 🎯 기업, 전략, 키워드를 검색하거나 파일을 업로드하여 분석 사례를 찾아보세요.',
      fileAnalysis: '파일 분석 요청',
      fileAnalyzed: '을 분석했습니다. 📎',
      searchComplete: '검색 완료! 🔍',
      totalCases: '총',
      casesFound: '개의 관련 사례를 찾았습니다.',
      successCases: '성공 사례:',
      failureCases: '실패 사례:',
      successRate: '성공률:',
      majorCompanies: '주요 기업:',
      viewDetails: '아래에서 상세 내용을 확인하세요! 👇',
      noCasesFound: '해당 키워드로 검색된 사례가 없습니다. 다른 키워드로 시도해보세요.',
      extractingKeywords: '파일에서 추출한 키워드로 관련 사례를 검색 중입니다...',
      attachFiles: '파일 첨부',
      searchPlaceholder: '기업명, 전략, 키워드를 입력하거나 파일을 업로드하세요...',
      quickFilter: '빠른 필터:',
      avgRisk: '평균 리스크',
      totalCasesLabel: '총 사례',
      searchResults: '검색 결과',
      allCases: '전체 사례',
      selected: '개 선택',
      resetSearch: '검색 초기화',
      compareAnalysis: '비교 분석 보기',
      deselectAll: '선택 해제',
      noResults: '검색 결과가 없습니다.',
      tryDifferent: '다른 키워드로 검색해보세요.',
      detailView: '상세보기',
      compare: '비교하기',
      comparing: '비교 분석',
      selectedItem: '선택됨',
      coreStrategy: '핵심전략:',
      mainRisk: '주요리스크:',
      searchReset: '검색이 초기화되었습니다. 전체 사례를 다시 확인하세요. ✨',
      success: '성공',
      failure: '실패',
    },
    en: {
      dashboard: 'Data Analysis',
      strategy: 'Strategy Management',
      history: 'History',
      aiSearch: 'AI-Powered Strategy Search & Analysis',
      welcomeMessage: 'Hello! 🎯 Search for companies, strategies, keywords or upload files to find analysis cases.',
      fileAnalysis: 'File analysis request',
      fileAnalyzed: 'analyzed. 📎',
      searchComplete: 'Search complete! 🔍',
      totalCases: 'Found',
      casesFound: 'related cases.',
      successCases: 'Success cases:',
      failureCases: 'Failure cases:',
      successRate: 'Success rate:',
      majorCompanies: 'Major companies:',
      viewDetails: 'Check details below! 👇',
      noCasesFound: 'No cases found for this keyword. Try different keywords.',
      extractingKeywords: 'Searching for related cases using keywords extracted from files...',
      attachFiles: 'Attach Files',
      searchPlaceholder: 'Enter company, strategy, keyword or upload files...',
      quickFilter: 'Quick Filter:',
      avgRisk: 'Avg Risk',
      totalCasesLabel: 'Total Cases',
      searchResults: 'search results',
      allCases: 'All Cases',
      selected: 'selected',
      resetSearch: 'Reset Search',
      compareAnalysis: 'View Comparison',
      deselectAll: 'Deselect',
      noResults: 'No search results.',
      tryDifferent: 'Try different keywords.',
      detailView: 'Details',
      compare: 'Compare',
      comparing: 'Compare',
      selectedItem: 'Selected',
      coreStrategy: 'Core Strategy:',
      mainRisk: 'Main Risk:',
      searchReset: 'Search reset. View all cases again. ✨',
      success: 'Success',
      failure: 'Failure',
    }
  };
  const text = language === 'en' ? t.en : t.ko;

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [comparedItems, setComparedItems] = useState<number[]>([]);
  const [currentContext, setCurrentContext] = useState(language === 'en' ? 'Digital Transformation Project' : '디지털 전환 프로젝트');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filterOptions = language === 'en' ? {
    strategy: ['Digital Transformation', 'M&A', 'Market Entry', 'Innovation'],
    industry: ['Technology', 'Manufacturing', 'Finance', 'Retail'],
    riskType: ['Financial', 'Operational', 'Market', 'Regulatory'],
    riskLevel: ['Low', 'Medium', 'High'],
    status: ['Success', 'Failure'],
  } : {
    strategy: ['디지털전환', 'M&A', '시장진입', '혁신'],
    industry: ['기술', '제조', '금융', '유통'],
    riskType: ['재무', '운영', '시장', '규제'],
    riskLevel: ['Low', 'Medium', 'High'],
    status: ['성공', '실패'],
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const toggleCompare = (id: number) => {
    setComparedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  };

  // TODO: GET /api/articles 연동 후 실제 DBR 기사 목록으로 교체
  const allItems = [
    {
      id: 0,
      status: '성공',
      strategy: '디지털전환',
      riskLevel: 'Low' as const,
      industry: 'DBR',
      company: 'DBR 아티클',
      title: '(디자인 예시) 백엔드 연동 시 DBR 기사 제목이 표시됩니다',
      strategySum: 'GET /api/articles 연동 후 실제 DBR 기사 요약이 표시됩니다',
      riskSum: 'AI 서버 분석 결과로 리스크 요약이 채워집니다',
      keywords: ['DBR', '연동필요'],
    },
  ];

  const filteredItems = allItems.filter(item => {
    const query = activeSearchQuery.toLowerCase();
    const matchesSearch = !query ||
      item.title.toLowerCase().includes(query) ||
      item.company.toLowerCase().includes(query) ||
      item.industry.toLowerCase().includes(query) ||
      item.strategy.toLowerCase().includes(query) ||
      item.keywords.some(k => k.toLowerCase().includes(query));

    const matchesFilters = selectedFilters.length === 0 ||
      selectedFilters.some(filter =>
        item.strategy.includes(filter) ||
        item.industry.includes(filter) ||
        item.riskLevel === filter ||
        item.status === filter
      );

    return matchesSearch && matchesFilters;
  });

  const handleViewDetails = () => {
    if (comparedItems.length === 2) {
      const selectedItems = allItems.filter(item => comparedItems.includes(item.id));
      onCompareClick(selectedItems);
    }
  };

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      <div className="px-6 py-6 max-w-[1600px] mx-auto">
        {/* 필터 버튼 */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setShowFilterModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 ${darkMode ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800 border border-gray-700/50' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80'} rounded-xl transition-all shadow-sm hover:shadow`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">{text.quickFilter}</span>
            {selectedFilters.length > 0 && (
              <span className="ml-1 px-2.5 py-0.5 bg-[#142755] text-white text-xs font-semibold rounded-full">
                {selectedFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* 인사이트 요약 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/40 to-gray-800/20' : 'bg-gradient-to-br from-green-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/10' : 'bg-green-100'}`}>
                <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wide`}>{text.successRate}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'} mb-1`}>-</div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>DB 연동 후 표시</div>
          </div>

          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/40 to-gray-800/20' : 'bg-gradient-to-br from-amber-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <div className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wide`}>{text.avgRisk}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'} mb-1`}>-</div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>DB 연동 후 표시</div>
          </div>

          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/40 to-gray-800/20' : 'bg-gradient-to-br from-indigo-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-100'}`}>
                <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wide`}>{text.totalCasesLabel}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} mb-1`}>-</div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>DB 연동 후 표시</div>
          </div>
        </div>

        {/* 사례 리스트 */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {activeSearchQuery ? `"${activeSearchQuery}" ${text.searchResults}` : text.allCases}
            <span className={`ml-2 text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {filteredItems.length}{language === 'en' ? '' : '개'}
              {comparedItems.length > 0 && ` · ${comparedItems.length}${language === 'en' ? ' ' : '개 '}${text.selected}`}
            </span>
          </h3>
          <div className="flex items-center gap-2">
            {activeSearchQuery && (
              <button
                onClick={() => {
                  setActiveSearchQuery('');
                }}
                className={`px-3 py-2 ${darkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'} text-xs font-medium rounded-lg transition-all`}
              >
                {text.resetSearch}
              </button>
            )}
            {comparedItems.length === 2 && (
              <button
                onClick={handleViewDetails}
                className="px-4 py-2 bg-gradient-to-r from-[#142755] to-[#444655] text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                {text.compareAnalysis}
              </button>
            )}
            {comparedItems.length > 0 && (
              <button
                onClick={() => setComparedItems([])}
                className={`px-3 py-2 text-xs font-medium ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                {text.deselectAll}
              </button>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className={`text-center py-16 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-50/50'} rounded-2xl`}>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2 font-medium`}>{text.noResults}</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{text.tryDifferent}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isCompared = comparedItems.includes(item.id);
              const riskColors = {
                Low: darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700',
                Medium: darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700',
                High: darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700',
              };
              const statusColors = item.status === text.success
                ? (darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700')
                : (darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700');

              return (
                <div
                  key={item.id}
                  className={`group relative ${
                    darkMode
                      ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
                      : 'bg-white'
                  } p-5 rounded-2xl transition-all duration-300 ${
                    isCompared
                      ? 'ring-2 ring-[#142755] shadow-lg'
                      : darkMode
                      ? 'hover:shadow-xl hover:shadow-gray-900/20'
                      : 'shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${statusColors}`}>
                        {item.status}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                        darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {item.strategy}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${riskColors[item.riskLevel as keyof typeof riskColors]}`}>
                        {item.riskLevel}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0 ml-2`}>
                      {item.industry}
                    </span>
                  </div>

                  <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 leading-relaxed`}>
                    {item.title}
                  </h4>

                  <div className={`space-y-2 mb-4 ${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} p-3 rounded-xl`}>
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} min-w-[${language === 'en' ? '90px' : '70px'}] flex-shrink-0`}>
                        {text.coreStrategy}
                      </span>
                      <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                        {item.strategySum}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} min-w-[${language === 'en' ? '90px' : '70px'}] flex-shrink-0`}>
                        {text.mainRisk}
                      </span>
                      <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                        {item.riskSum}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (comparedItems.length === 2) {
                          handleViewDetails();
                        } else {
                          onArticleClick(item.id);
                        }
                      }}
                      className="flex-1 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-[#142755] to-[#444655] text-white rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      {comparedItems.length === 2 ? text.comparing : text.detailView}
                    </button>
                    <button
                      onClick={() => toggleCompare(item.id)}
                      className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 ${
                        isCompared
                          ? 'bg-gradient-to-r from-[#142755] to-[#444655] text-white shadow-lg'
                          : darkMode
                          ? 'bg-gray-700/50 text-[#A9AABC] hover:bg-gray-700 border border-gray-600'
                          : 'bg-gray-100 text-[#142755] hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {isCompared ? text.selectedItem : text.compare}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 필터 모달 - 검정 빈 공간을 일체 남기지 않고 전체를 꽉 채우는 형태(Full Screen) */}
      {showFilterModal && (
        <div className={`fixed inset-0 h-screen w-screen ${darkMode ? 'bg-gray-800' : 'bg-white'} z-50 flex flex-col overflow-hidden`}>
          
          {/* 상단 타이틀 영역 고정 */}
          <div className={`sticky top-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-5 flex items-center justify-between`}>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>필터</h3>
            <button
              onClick={() => setShowFilterModal(false)}
              className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} p-1 transition-colors`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 스크롤 가능한 내부 필터 옵션 영역 */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {Object.entries(filterOptions).map(([category, options]) => (
              <div key={category}>
                <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3 capitalize`}>
                  {category === 'strategy' ? language === 'en' ? 'Strategy' : '전략 유형' :
                   category === 'industry' ? language === 'en' ? 'Industry' : '산업' :
                   category === 'riskType' ? language === 'en' ? 'Risk Type' : '리스크 유형' :
                   category === 'riskLevel' ? language === 'en' ? 'Risk Level' : '리스크 수준' :
                   category === 'status' ? language === 'en' ? 'Status' : '상태' : category}
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleFilter(option)}
                      className={`px-4 py-2 text-xs font-medium rounded-full transition-all ${
                        selectedFilters.includes(option)
                          ? 'bg-[#142755] text-white shadow-md scale-[1.02]'
                          : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 하단 기능 버튼 영역 고정 */}
          <div className={`sticky bottom-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t px-6 py-5 flex gap-3`}>
            <button
              onClick={() => {
                setSelectedFilters([]);
                setShowFilterModal(false);
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-xl transition-colors`}
            >
              {language === 'en' ? 'Reset' : '초기화'}
            </button>
            <button
              onClick={() => setShowFilterModal(false)}
              className="flex-1 px-4 py-3 text-sm font-semibold bg-[#142755] text-white rounded-xl hover:bg-[#253b73] transition-colors shadow-md"
            >
              {language === 'en' ? 'Apply' : '적용하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}