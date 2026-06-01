import { ArrowLeft, Shield, AlertTriangle, ExternalLink, Bell, User, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface RiskAnalysisProps {
  onBack: () => void;
  onArticleClick: (id: number) => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  darkMode?: boolean;
  language?: string;
}

export function RiskAnalysis({ onBack, onArticleClick, onNotificationClick, onProfileClick, darkMode = false, language = 'ko' }: RiskAnalysisProps) {
  const t = {
    ko: {
      title: 'DBR 전략 리스크 분석기',
      runAnalysis: '분석 실행',
      riskIndex: '통합 전략 리스크 지수',
      riskDesc: '24,580개의 글로벌 기업 사례로 도출한 위험도입니다.',
      riskPossibility: '위험 가능성',
      industryAvg: '업계 평균 대비',
      industryGrade: '산업 등급',
      successCases: '유사 성공 전략 사례',
      riskCases: '주의해야 할 실패 사례',
      similarity: '유사도',
      viewDetail: '상세보기',
    },
    en: {
      title: 'DBR Strategy Risk Analyzer',
      runAnalysis: 'Run Analysis',
      riskIndex: 'Integrated Strategy Risk Index',
      riskDesc: 'Risk derived from 24,580 global enterprise cases.',
      riskPossibility: 'Risk Probability',
      industryAvg: 'vs Industry Avg',
      industryGrade: 'Industry Grade',
      successCases: 'Similar Success Cases',
      riskCases: 'Failure Cases to Watch',
      similarity: 'Similarity',
      viewDetail: 'View Details',
    }
  };
  const text = language === 'en' ? t.en : t.ko;

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      <header className={`${darkMode ? 'bg-[#0A0E1A]/80 backdrop-blur-xl border-gray-800/50' : 'bg-white/80 backdrop-blur-xl border-gray-200/50'} border-b sticky top-0 z-50`}>
        <div className="px-6 py-4 max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className={`p-2.5 ${darkMode ? 'hover:bg-gray-800/60 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} rounded-xl transition-all`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{text.title}</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>
                  Real-time risk assessment and strategy analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-5 py-2.5 bg-gradient-to-r from-[#142755] to-[#444655] text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl duration-300">
                {text.runAnalysis}
              </button>
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

      <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-6">
        {/* Risk Index Card */}
        <div className={`${
          darkMode
            ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
            : 'bg-white'
        } p-8 rounded-2xl ${
          darkMode
            ? 'shadow-xl shadow-gray-900/20'
            : 'shadow-sm'
        } transition-all duration-300`}>
          <div className="text-center mb-8">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              {text.riskIndex}
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {text.riskDesc}
            </p>
          </div>

          <div className="relative w-full max-w-md mx-auto h-56 mb-8">
            <svg viewBox="0 0 200 120" className="w-full h-full">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                </linearGradient>
                <filter id="gaugeShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
              </defs>
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="20"
                strokeLinecap="round"
                filter="url(#gaugeShadow)"
              />
              <line
                x1="100" y1="100" x2="140" y2="50"
                stroke={darkMode ? '#A9AABC' : '#142755'}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="8" fill={darkMode ? '#A9AABC' : '#142755'} />
              <text
                x="100" y="80"
                textAnchor="middle"
                className={`text-4xl font-bold ${darkMode ? 'fill-white' : 'fill-gray-900'}`}
              >
                -
              </text>
              <text
                x="100" y="98"
                textAnchor="middle"
                className={`text-sm font-semibold ${darkMode ? 'fill-gray-400' : 'fill-gray-500'}`}
              >
                분석 필요
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              { label: text.riskPossibility, value: '-', icon: TrendingDown, color: 'green' },
              { label: text.industryAvg, value: '-', icon: Activity, color: 'blue' },
              { label: text.industryGrade, value: '-', icon: TrendingUp, color: 'purple' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className={`${
                  darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'
                } p-4 rounded-xl text-center`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Icon className={`w-5 h-5 ${
                    color === 'green' ? 'text-green-500' :
                    color === 'blue' ? 'text-blue-500' :
                    'text-purple-500'
                  }`} />
                </div>
                <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                  {label}
                </div>
                <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Cases */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/10' : 'bg-green-100'}`}>
              <Shield className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {text.successCases}
            </h3>
          </div>

          {/* TODO: POST /api/diagnose 응답의 similar_articles (label=success) Top3로 교체 */}
          <div className="space-y-3">
            {[
              { id: 1, similarity: '-', title: '(예시) 분석 실행 후 유사 성공 사례가 표시됩니다', tags: ['#DBR', '#성공사례'] },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => onArticleClick(item.id)}
                className={`group relative ${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
                    : 'bg-white'
                } p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                  darkMode
                    ? 'hover:shadow-xl hover:shadow-gray-900/20'
                    : 'shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${
                      darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'
                    } rounded-lg text-xs font-semibold mb-3`}>
                      <Shield className="w-3.5 h-3.5" />
                      <span>{text.similarity}: {item.similarity}%</span>
                    </div>
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 leading-relaxed group-hover:text-[#142755] dark:group-hover:text-[#A9AABC] transition-colors`}>
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2.5 py-1 ${
                            darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
                          } text-xs font-medium rounded-lg`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ExternalLink className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0 ml-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Cases */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-500/10' : 'bg-red-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
            </div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {text.riskCases}
            </h3>
          </div>

          {/* TODO: POST /api/diagnose 응답의 similar_articles (label=failure) Top3로 교체 */}
          <div className="space-y-3">
            {[
              { id: 3, similarity: '-', title: '(예시) 분석 실행 후 유사 실패 사례가 표시됩니다', tags: ['#DBR', '#실패사례'] },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => onArticleClick(item.id)}
                className={`group relative ${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
                    : 'bg-white'
                } p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                  darkMode
                    ? 'hover:shadow-xl hover:shadow-gray-900/20'
                    : 'shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${
                      darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                    } rounded-lg text-xs font-semibold mb-3`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>RISK {text.similarity}: {item.similarity}%</span>
                    </div>
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 leading-relaxed group-hover:text-red-500 transition-colors`}>
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2.5 py-1 ${
                            darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                          } text-xs font-medium rounded-lg`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'} flex-shrink-0 ml-4 group-hover:scale-110 transition-transform`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
