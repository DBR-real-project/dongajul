import { Search, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { TabType } from '../App';
import { useState, useEffect } from 'react';

// [백화현상 가드] ContextSwitcher 폴백 컴포넌트
function ContextSwitcherFallback({ currentContext }: { currentContext: string }) {
  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{currentContext}</span>
    </div>
  );
}

interface SearchHistoryProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  onSearchAgain?: (query: string) => void;
  onClearAllHistory?: () => void;
  darkMode?: boolean;
  language?: string;
}

export function SearchHistory({ 
  onSearchAgain,
  onClearAllHistory,
  darkMode = false, 
  language = 'ko' 
}: SearchHistoryProps) {
  
  const t = {
    ko: {
      currentContext: '디지털 전환 프로젝트',
      dashboard: '데이터분석',
      strategy: '전략 관리',
      history: '히스토리',
      searchHistory: '검색 히스토리',
      recentSearches: '최근 검색 기록',
      results: '건 결과',
      clearAll: '기록 전체 삭제',
      modalTitle: '검색 기록 삭제',
      modalMessage: '모든 검색 기록을 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.',
      modalConfirm: '삭제하기',
      modalCancel: '취소',
      toastMessage: '키워드로 다시 검색을 시작합니다.',
      // TODO: GET /api/diagnosis/history 응답으로 교체
      historyData: [] as { id: number; query: string; time: string; results: number; category: string }[]
    },
    en: {
      currentContext: 'Digital Transformation Project',
      dashboard: 'Data Analysis',
      strategy: 'Strategy Management',
      history: 'History',
      searchHistory: 'Search History',
      recentSearches: 'Recent Searches',
      results: ' results',
      clearAll: 'Clear All',
      modalTitle: 'Clear History',
      modalMessage: 'Are you sure you want to clear all history?\nThis action cannot be undone.',
      modalConfirm: 'Delete',
      modalCancel: 'Cancel',
      toastMessage: 'Starting re-search for the keyword.',
      historyData: [] as { id: number; query: string; time: string; results: number; category: string }[]
    }
  };
  
  const text = language === 'en' ? t.en : t.ko;
  
  const [historyList, setHistoryList] = useState(text.historyData);
  const [currentContext, setCurrentContext] = useState(text.currentContext);
  const [LoadedContextSwitcher, setLoadedContextSwitcher] = useState<any>(null);
  
  // 모달 및 토스트 상태 가드
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; query: string }>({ show: false, query: '' });

  useEffect(() => {
    setHistoryList(text.historyData);
  }, [language]);

  useEffect(() => {
    import('./ContextSwitcher')
      .then((mod) => {
        if (mod && mod.ContextSwitcher) {
          setLoadedContextSwitcher(() => mod.ContextSwitcher);
        }
      })
      .catch(() => {
        console.warn("ContextSwitcher 컴포넌트가 없습니다. 안전 폴백 모드로 상단을 유지합니다.");
      });
  }, []);

  // 전체 삭제 핸들러
  const handleConfirmDelete = () => {
    setHistoryList([]);
    if (onClearAllHistory) onClearAllHistory();
    setIsModalOpen(false);
  };

  // 다시 검색 액션 작동 함수
  const handleSearchAgain = (query: string) => {
    // 1. 화면 상단에 인터랙티브 토스트 피드백 표시 (3초 유지)
    setToast({ show: true, query });
    setTimeout(() => setToast({ show: false, query: '' }), 3000);

    // 2. 상위 라우터 및 뷰 전환 트리거 실행
    if (onSearchAgain) {
      onSearchAgain(query);
    }
  };

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24 relative`}>
      {/* 인터랙티브 토스트 알림 컴포넌트 */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md border border-white/10 dark:border-slate-200 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>"{toast.query.substring(0, 15)}..." {text.toastMessage}</span>
        </div>
      )}

      {/* 🛠️ 이중 렌더링 수정 서브 헤더: 우측 알림/유저 프로필 버튼 삭제 및 왼쪽 정렬 처리 */}
      <header className={`${darkMode ? 'bg-[#0A0E1A]/80 backdrop-blur-xl border-gray-800/50' : 'bg-white/80 backdrop-blur-xl border-gray-200/50'} border-b sticky top-0 z-40`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-start">
            {LoadedContextSwitcher ? (
              <LoadedContextSwitcher
                currentContext={currentContext}
                onSelect={setCurrentContext}
                darkMode={darkMode}
                language={language}
              />
            ) : (
              <ContextSwitcherFallback currentContext={currentContext} />
            )}
          </div>
        </div>
      </header>

      <div className="px-6 py-6 max-w-[1600px] mx-auto">
        {/* 상단 통합 배너 */}
        <div className={`bg-gradient-to-br ${darkMode ? 'from-gray-800 to-[#0B2F61]' : 'from-[#0B2F61] to-[#3B547E]'} p-6 text-white mb-6 rounded-2xl shadow-md border ${darkMode ? 'border-gray-700/30' : 'border-[#0B2F61]/10'}`}>
          <div className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-[#C8994B]'} mb-2 tracking-widest`}>
            {text.searchHistory.toUpperCase()}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 leading-tight">
            {language === 'ko' ? (
              <>최근 분석 기록을<br />한눈에 확인하고 재검색하세요 📋</>
            ) : (
              <>Quickly review and<br />re-search your history 📋</>
            )}
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-slate-200'} opacity-90`}>
            {language === 'ko' ? 'AI가 마이닝한 핵심 키워드 성과를 추적하고, 불필요한 기록은 간편하게 삭제할 수 있습니다.' : 'Track AI-mined keyword performance and easily clear or re-run your past searches.'}
          </p>
        </div>

        {/* 히스토리 섹션 타이틀 및 삭제 버튼 */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{text.recentSearches}</h3>
          {historyList.length > 0 && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`text-xs font-semibold ${darkMode ? 'text-gray-400 hover:text-white' : 'text-[#0B2F61] hover:text-[#C8994B]'} transition-colors`}
            >
              {text.clearAll}
            </button>
          )}
        </div>

        {/* 검색 히스토리 타임라인 카드 리스트 */}
        <div className="space-y-3">
          {historyList.length === 0 ? (
            <div className={`text-center py-12 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {language === 'ko' ? '최근 검색 기록이 없습니다.' : 'No recent search history.'}
            </div>
          ) : (
            historyList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSearchAgain(item.query)} // 카드 영역 자체 클릭 활성화
                className={`group ${
                  darkMode ? 'bg-gray-800/40 border-gray-700/40 hover:bg-gray-800/70' : 'bg-white border-gray-200 hover:border-gray-300/80'
                } p-5 border rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-sm`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-[#0B2F61]'}`}>
                      <Search className="w-4 h-4" />
                    </div>
                    <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-[#0B2F61] dark:group-hover:text-blue-400 transition-colors`}>
                      {item.query}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.time}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{item.results}{text.results}</span>
                    </div>
                    <div className={`px-2.5 py-1 ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-100 text-slate-700'} text-xs font-semibold rounded-lg`}>
                      {item.category}
                    </div>
                  </div>
                  
                  {/* 다시 검색 버튼 */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // 카드 자체 클릭 이벤트 버블링 방지
                      handleSearchAgain(item.query);
                    }}
                    className="px-3.5 py-1.5 bg-[#0B2F61] hover:bg-[#C8994B] active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    {language === 'ko' ? '다시 검색' : 'Search Again'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 하단 팁 가이드 */}
        <div className={`mt-6 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-slate-950 border-gray-800' : 'bg-gradient-to-br from-slate-50 to-blue-50/50 border-slate-200'} p-5 border rounded-xl shadow-inner`}>
          <h3 className={`text-sm mb-3 ${darkMode ? 'text-[#C8994B]' : 'text-[#0B2F61]'} font-bold flex items-center gap-1.5`}>
            <span>💡</span> {language === 'ko' ? '전략 분석 검색 팁' : 'AI Search Tips'}
          </h3>
          <ul className={`space-y-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
            {(language === 'ko' ? [
              '키워드를 세부 프레임워크와 결합하면(예: "제조업 SWOT") 한층 고도화된 타깃 보고서가 출력됩니다',
              '특정 DBR 기사 제목이나 핵심 저자명을 조합하여 실시간 트렌드 추적 조회가 가능합니다',
              '정확한 지표 및 구문을 색인화하려면 따옴표("") 연산자를 본문에 적극 활용하세요',
              '불필요한 파이프라인 정보 유출을 차단하려면 마이너스(-) 기호로 검색 대상에서 예외시킬 수 있습니다',
            ] : [
              'Use specific keywords for more accurate results',
              'Search by industry, company, or strategy type',
              'Use quotes ("") to search for exact phrases',
              'Use minus (-) to exclude specific words',
            ]).map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#C8994B] font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 커스텀 디자인 팝업 모달 마크업 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          <div className={`relative transform overflow-hidden rounded-2xl ${darkMode ? 'bg-gray-900 border border-gray-800 text-white' : 'bg-white text-gray-900'} px-6 py-6 text-left shadow-2xl transition-all sm:w-full sm:max-w-md animate-in fade-in zoom-in-95 duration-200`}>
            <div className="flex items-start gap-4">
              <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="mt-1 text-left sm:ml-1">
                <h3 className="text-base font-bold leading-6">
                  {text.modalTitle}
                </h3>
                <div className="mt-2">
                  <p className={`text-xs sm:text-sm font-medium whitespace-pre-line ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {text.modalMessage}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-row-reverse gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex justify-center rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
              >
                {text.modalConfirm}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`inline-flex justify-center rounded-xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} active:scale-95 px-4 py-2.5 text-xs font-bold transition-all`}
              >
                {text.modalCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}