import { Bell, User, Target, TrendingUp, Zap, Globe, Search } from 'lucide-react';
import { TabType } from '../App';
import { useState } from 'react';

interface StrategyAnalysisProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNavigateToRisk: () => void;
  onArticleClick: (id: number) => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
}

export function StrategyAnalysis({ activeTab, onTabChange, onNavigateToRisk, onArticleClick, onNotificationClick, onProfileClick }: StrategyAnalysisProps) {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-8">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs sm:text-sm text-gray-500 mb-0.5">DBR 전략 리스크 분석</div>
              <h1 className="text-base sm:text-lg md:text-xl text-[#1e3a5f]">전략 분석</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={onNotificationClick} className="p-2 text-gray-600 relative">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500"></span>
              </button>
              <button onClick={onProfileClick} className="p-2 text-gray-600">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {(['dashboard', 'strategy', 'history'] as TabType[]).map((tab) => {
              const labels: Record<TabType, string> = {
                dashboard: '데이터분석',
                strategy: '전략 분석',
                history: '히스토리',
              };
              return (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'bg-[#142755] text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="bg-white p-6 sm:p-8 md:p-10 mb-6 border border-gray-200 rounded-lg shadow-sm">
          <div className="text-xs sm:text-sm text-gray-500 mb-2 tracking-wide">
            STRATEGIC FRAMEWORK ANALYSIS
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl mb-4 leading-tight text-gray-900">
            검증된 전략 프레임워크로<br />
            비즈니스 방향성 수립
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            SWOT, 포터의 5 Forces, BCG 매트릭스 기반 전략 분석
          </p>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="전략 프레임워크, 산업, 키워드 검색..."
              className="w-full px-4 py-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142755]"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#142755] p-1.5 hover:bg-gray-100 rounded transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { icon: Target, color: 'blue', label: 'SWOT 분석', desc: '강점·약점·기회·위협 요인을 체계적으로 분석' },
            { icon: TrendingUp, color: 'green', label: '경쟁 우위 분석', desc: '포터의 5 Forces 모델 기반 경쟁력 평가' },
            { icon: Zap, color: 'purple', label: '혁신 전략', desc: '블루오션 전략 및 파괴적 혁신 모델' },
            { icon: Globe, color: 'amber', label: '글로벌 확장', desc: '시장 진입 전략 및 현지화 방안' },
          ].map(({ icon: Icon, color, label, desc }) => (
            <div key={label} className="bg-white p-4 sm:p-5 border border-gray-200 hover:shadow-sm transition-shadow">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${color}-100 flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-600`} />
              </div>
              <h3 className="text-sm sm:text-base mb-1 sm:mb-2">{label}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <h3 className="text-base sm:text-lg mb-3">전략 프레임워크별 사례</h3>
        </div>

        {/* TODO: GET /api/articles 응답으로 교체 */}
        <div className="space-y-3 sm:space-y-4 mb-6">
          {([] as { border: string; badge: string; badgeColor: string; industry: string; title: string; desc: string; tags: string[] }[]).map((item) => (
            <div key={item.title} className={`bg-white p-4 sm:p-5 border-l-4 border-${item.border}-500`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 bg-${item.badgeColor}-100 text-${item.badgeColor}-800 text-xs sm:text-sm`}>{item.badge}</span>
                <span className="text-xs sm:text-sm text-gray-500">{item.industry}</span>
              </div>
              <h4 className="text-sm sm:text-base mb-2">{item.title}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">{item.desc}</p>
              <div className="flex gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs sm:text-sm">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 sm:p-6 border-2 border-amber-200">
          <h3 className="text-sm sm:text-base mb-3 text-amber-900">전략 수립 체크리스트</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
            {['명확한 비전과 미션 정의', '경쟁 환경 및 시장 트렌드 분석', '핵심 역량 및 차별화 요소 파악', '실행 가능한 액션 플랜 수립', '성과 측정 지표(KPI) 설정'].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-amber-600">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
