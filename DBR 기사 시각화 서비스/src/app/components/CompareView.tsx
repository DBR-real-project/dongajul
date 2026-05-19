import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, Target, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface CompareViewProps {
  items: Array<{
    id: number;
    status: string;
    strategy: string;
    riskLevel: string;
    industry: string;
    title: string;
    strategySum: string;
    riskSum: string;
  }>;
  onBack: () => void;
  darkMode?: boolean;
  language?: string;
}

export function CompareView({ items, onBack, darkMode = false, language = 'ko' }: CompareViewProps) {
  if (items.length !== 2) {
    return (
      <div className={`h-full overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-[#F8FAFC]'} p-8`}>
        <button
          onClick={onBack}
          className={`mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
        >
          <ArrowLeft className="w-5 h-5" />
          {language === 'ko' ? '돌아가기' : 'Back'}
        </button>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 text-center`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'ko' ? '두 개의 항목을 선택해주세요.' : 'Please select two items.'}
          </p>
        </div>
      </div>
    );
  }

  const [item1, item2] = items;

  // 비교 데이터
  const comparisonData = [
    {
      metric: language === 'ko' ? '전환율' : 'Conversion',
      [language === 'ko' ? '전략 A' : 'Strategy A']: item1.status === '성공' ? 8.5 : 4.2,
      [language === 'ko' ? '전략 B' : 'Strategy B']: item2.status === '성공' ? 7.8 : 3.5,
    },
    {
      metric: 'ROI',
      [language === 'ko' ? '전략 A' : 'Strategy A']: item1.status === '성공' ? 320 : 150,
      [language === 'ko' ? '전략 B' : 'Strategy B']: item2.status === '성공' ? 250 : 120,
    },
    {
      metric: language === 'ko' ? '성장률' : 'Growth',
      [language === 'ko' ? '전략 A' : 'Strategy A']: item1.status === '성공' ? 45 : 20,
      [language === 'ko' ? '전략 B' : 'Strategy B']: item2.status === '성공' ? 38 : 15,
    },
  ];

  const radarData = [
    { metric: language === 'ko' ? '전환율' : 'Conversion', A: item1.status === '성공' ? 85 : 42, B: item2.status === '성공' ? 78 : 35 },
    { metric: 'ROI', A: item1.status === '성공' ? 90 : 50, B: item2.status === '성공' ? 75 : 40 },
    { metric: language === 'ko' ? '성장률' : 'Growth', A: item1.status === '성공' ? 70 : 30, B: item2.status === '성공' ? 60 : 25 },
    { metric: language === 'ko' ? '리스크' : 'Risk', A: item1.riskLevel === 'Low' ? 80 : 40, B: item2.riskLevel === 'Low' ? 70 : 30 },
    { metric: language === 'ko' ? '참여도' : 'Engagement', A: item1.status === '성공' ? 75 : 35, B: item2.status === '성공' ? 80 : 40 },
  ];

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={onBack}
              className={`flex items-center gap-2 mb-4 px-4 py-2.5 ${
                darkMode ? 'hover:bg-gray-800/60 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              } rounded-xl transition-all`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{language === 'ko' ? '돌아가기' : 'Back'}</span>
            </button>
            <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              {language === 'ko' ? '전략 비교 분석' : 'Strategy Comparison Analysis'}
            </h1>
            <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'ko' ? '두 전략의 성과 지표를 비교하여 최적의 의사결정을 지원합니다.' : 'Compare performance metrics of two strategies to support optimal decision-making.'}
            </p>
          </div>
          <button className="px-5 py-2.5 bg-gradient-to-r from-[#142755] to-[#444655] text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl duration-300">
            Export Comparison
          </button>
        </div>

        {/* Strategy Overview Cards */}
        <div className="grid grid-cols-2 gap-5">
          {[item1, item2].map((item, idx) => (
            <div
              key={item.id}
              className={`relative ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
                  : 'bg-white'
              } p-6 rounded-2xl transition-all duration-300 overflow-hidden group ${
                darkMode
                  ? 'hover:shadow-xl hover:shadow-gray-900/20'
                  : 'shadow-sm hover:shadow-md'
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${
                      idx === 0
                        ? 'bg-gradient-to-br from-[#142755] to-[#444655]'
                        : 'bg-gradient-to-br from-emerald-600 to-emerald-700'
                    } rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-lg">{idx === 0 ? 'A' : 'B'}</span>
                    </div>
                    <div>
                      <p className={`text-xs font-medium tracking-wide uppercase mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {language === 'ko' ? '전략' : 'Strategy'} {idx + 1}
                      </p>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        item.status === '성공'
                          ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                          : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 leading-snug`}>
                  {item.title}
                </h3>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`px-2.5 py-1 ${
                    darkMode
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'bg-indigo-50 text-indigo-700'
                  } text-xs font-medium rounded-lg`}>
                    {item.strategy}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                    item.riskLevel === 'Low'
                      ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : item.riskLevel === 'Medium'
                      ? darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                      : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                  }`}>
                    {item.riskLevel} Risk
                  </span>
                </div>

                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.industry}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Comparison */}
        <div className="grid grid-cols-2 gap-5">
          {/* Bar Chart */}
          <div className={`${
            darkMode
              ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
              : 'bg-white'
          } p-6 rounded-2xl transition-all duration-300 ${
            darkMode
              ? 'hover:shadow-xl hover:shadow-gray-900/20'
              : 'shadow-sm hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {language === 'ko' ? '지표 비교' : 'Metrics Comparison'}
              </h3>
              <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} barGap={8}>
                <defs>
                  <linearGradient id="barGradientA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#142755" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#444655" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barGradientB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E2E8F0'} vertical={false} />
                <XAxis
                  dataKey="metric"
                  tick={{ fontSize: 13, fill: darkMode ? '#9CA3AF' : '#64748B', fontWeight: 500 }}
                  axisLine={{ stroke: darkMode ? '#374151' : '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 13, fill: darkMode ? '#9CA3AF' : '#64748B', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${darkMode ? '#374151' : '#E2E8F0'}`,
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px',
                  }}
                  cursor={{ fill: darkMode ? '#374151' : '#F8FAFC', opacity: 0.5 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '14px', fontWeight: 600, paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar key="bar-strategy-a" dataKey={language === 'ko' ? '전략 A' : 'Strategy A'} fill="url(#barGradientA)" radius={[10, 10, 0, 0]} />
                <Bar key="bar-strategy-b" dataKey={language === 'ko' ? '전략 B' : 'Strategy B'} fill="url(#barGradientB)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className={`${
            darkMode
              ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
              : 'bg-white'
          } p-6 rounded-2xl transition-all duration-300 ${
            darkMode
              ? 'hover:shadow-xl hover:shadow-gray-900/20'
              : 'shadow-sm hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {language === 'ko' ? '종합 평가' : 'Overall Assessment'}
              </h3>
              <Target className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={darkMode ? '#374151' : '#E2E8F0'} strokeWidth={1.5} />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 13, fill: darkMode ? '#9CA3AF' : '#64748B', fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: darkMode ? '#6B7280' : '#94A3B8', fontWeight: 500 }}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${darkMode ? '#374151' : '#E2E8F0'}`,
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px',
                  }}
                />
                <Radar
                  key="radar-strategy-a"
                  name={language === 'ko' ? '전략 A' : 'Strategy A'}
                  dataKey="A"
                  stroke="#142755"
                  strokeWidth={2.5}
                  fill="#142755"
                  fillOpacity={0.25}
                  dot={{ fill: '#142755', strokeWidth: 2, r: 4 }}
                />
                <Radar
                  key="radar-strategy-b"
                  name={language === 'ko' ? '전략 B' : 'Strategy B'}
                  dataKey="B"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="#10B981"
                  fillOpacity={0.25}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '14px', fontWeight: 600, paddingTop: '20px' }}
                  iconType="circle"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className={`${
          darkMode
            ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
            : 'bg-white'
        } rounded-2xl overflow-hidden ${
          darkMode
            ? 'shadow-xl shadow-gray-900/20'
            : 'shadow-sm'
        }`}>
          <div className={`px-6 py-4 ${
            darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'
          } border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {language === 'ko' ? '상세 비교' : 'Detailed Comparison'}
            </h3>
          </div>
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <tr>
                <th className={`px-6 py-3.5 text-left text-xs font-semibold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'ko' ? '항목' : 'Item'}
                </th>
                <th className={`px-6 py-3.5 text-left text-xs font-semibold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'ko' ? '전략 A' : 'Strategy A'}
                </th>
                <th className={`px-6 py-3.5 text-left text-xs font-semibold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'ko' ? '전략 B' : 'Strategy B'}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-200/50'}`}>
              <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  {language === 'ko' ? '전략 유형' : 'Strategy Type'}
                </td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item1.strategy}</td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item2.strategy}</td>
              </tr>
              <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  {language === 'ko' ? '산업' : 'Industry'}
                </td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item1.industry}</td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item2.industry}</td>
              </tr>
              <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  {language === 'ko' ? '리스크 수준' : 'Risk Level'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                    item1.riskLevel === 'Low'
                      ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : item1.riskLevel === 'Medium'
                      ? darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                      : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                  }`}>
                    {item1.riskLevel}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                    item2.riskLevel === 'Low'
                      ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : item2.riskLevel === 'Medium'
                      ? darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                      : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                  }`}>
                    {item2.riskLevel}
                  </span>
                </td>
              </tr>
              <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  {language === 'ko' ? '결과' : 'Result'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                    item1.status === '성공'
                      ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                  }`}>
                    {item1.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                    item2.status === '성공'
                      ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                  }`}>
                    {item2.status}
                  </span>
                </td>
              </tr>
              <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  {language === 'ko' ? '핵심 전략' : 'Core Strategy'}
                </td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item1.strategySum}</td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item2.strategySum}</td>
              </tr>
              <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  {language === 'ko' ? '주요 리스크' : 'Main Risk'}
                </td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item1.riskSum}</td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item2.riskSum}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Conclusion */}
        <div className={`relative ${
          darkMode
            ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
            : 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50'
        } p-6 rounded-2xl overflow-hidden ${
          darkMode
            ? 'shadow-xl shadow-gray-900/20'
            : 'shadow-sm'
        }`}>
          <div className="relative z-10">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-[#142755] to-[#444655] rounded-xl shadow-lg">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {language === 'ko' ? 'AI 비교 분석 결론' : 'AI Analysis Conclusion'}
              </h3>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {item1.status === '성공' && item2.status === '성공'
                ? language === 'ko'
                  ? '두 사례 모두 성공적인 결과를 보였습니다. 각 전략의 장점을 결합하여 더 효과적인 접근을 설계할 수 있습니다.'
                  : 'Both cases showed successful results. You can design a more effective approach by combining the strengths of each strategy.'
                : item1.status === '실패' && item2.status === '실패'
                ? language === 'ko'
                  ? '두 사례 모두 실패로 이어졌습니다. 공통된 리스크 요인을 파악하여 유사한 실수를 방지해야 합니다.'
                  : 'Both cases led to failure. Common risk factors should be identified to prevent similar mistakes.'
                : language === 'ko'
                ? '성공 사례와 실패 사례를 비교함으로써, 성공 요인과 위험 신호를 명확히 구분할 수 있습니다.'
                : 'By comparing success and failure cases, you can clearly distinguish success factors from warning signals.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
