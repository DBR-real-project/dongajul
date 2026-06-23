import { Bell, Clock, User, AlertTriangle, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { TabType } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface RiskIndicatorsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onArticleClick: (id: number) => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
}

// TODO: DB 연동 후 실제 리스크 데이터로 교체
const riskTrendData: { id: number; month: string; risk: number }[] = [];
const categoryRiskData: { id: number; category: string; score: number }[] = [];

export function RiskIndicators({ activeTab, onTabChange, onArticleClick, onNotificationClick, onProfileClick }: RiskIndicatorsProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-8">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs sm:text-sm text-gray-500 mb-0.5">DBR 전략 리스크 분석</div>
              <h1 className="text-base sm:text-lg md:text-xl text-[#1e3a5f]">리스크 지표</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={onNotificationClick} className="p-2 text-gray-600 relative">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500"></span>
              </button>
              <button className="p-2 text-gray-600">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button onClick={onProfileClick} className="p-2 text-gray-600">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {(['dashboard', 'strategy', 'riskIndicators', 'guide'] as TabType[]).map((tab) => {
              const labels: Record<TabType, string> = {
                dashboard: '데이터분석',
                strategy: '전략 분석',
                riskIndicators: '리스크 지표',
                guide: '케인 가이드',
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: '종합 리스크', value: '-', sub: '분석 필요', subColor: 'text-gray-400', Icon: Activity, iconColor: 'text-amber-600' },
            { label: '재무 건전성', value: '-', sub: '-', subColor: 'text-gray-400', Icon: DollarSign, iconColor: 'text-[#142755]' },
            { label: '시장 변동성', value: '-', sub: '-', subColor: 'text-gray-400', Icon: TrendingDown, iconColor: 'text-red-600' },
            { label: '경고 알림', value: '-', sub: '-', subColor: 'text-gray-400', Icon: AlertTriangle, iconColor: 'text-amber-600' },
          ].map(({ label, value, sub, subColor, Icon, iconColor }) => (
            <div key={label} className="bg-white p-4 sm:p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600">{label}</span>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
              </div>
              <div className="text-2xl sm:text-3xl text-[#1e3a5f] mb-1">{value}</div>
              <div className={`text-xs sm:text-sm ${subColor}`}>{sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 sm:p-5 border border-gray-200">
            <h3 className="text-sm sm:text-base mb-3">월별 리스크 추이</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="risk" stroke="#1e3a5f" strokeWidth={2} key="risk-line" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 sm:p-5 border border-gray-200">
            <h3 className="text-sm sm:text-base mb-3">카테고리별 리스크 점수</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={categoryRiskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="score" fill="#1e3a5f" key="score-bar" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-base sm:text-lg mb-3">주요 리스크 요인</h3>
        </div>

        {/* TODO: DB 연동 후 실제 리스크 요인 데이터로 교체 */}
        <div className="space-y-3 sm:space-y-4">
          {([] as { border: string; level: string; levelColor: string; category: string; title: string; desc: string; tags: string[]; score: string; scoreColor: string }[]).map((item) => (
            <div key={item.title} className={`bg-white p-4 sm:p-5 border-l-4 border-${item.border}-500`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 text-${item.border}-600`} />
                  <span className={`px-2 py-0.5 bg-${item.levelColor}-100 text-${item.levelColor}-800 text-xs sm:text-sm`}>{item.level}</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-500">{item.category}</span>
              </div>
              <h4 className="text-sm sm:text-base mb-1">{item.title}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">{item.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs sm:text-sm">{tag}</span>
                  ))}
                </div>
                <span className={`text-xs sm:text-sm ${item.scoreColor}`}>리스크 점수: {item.score}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-gradient-to-br from-red-50 to-orange-50 p-5 sm:p-6 border-2 border-red-200">
          <h3 className="text-sm sm:text-base mb-3 text-red-900">리스크 관리 권장사항</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
            {['주요 시장 트렌드 및 경쟁사 동향 모니터링 강화', '대체 공급망 확보 및 재고 관리 최적화', '환헤지 전략 수립 및 재무 리스크 분산', '정기적인 리스크 평가 및 대응 계획 수립'].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-red-600">⚠</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
