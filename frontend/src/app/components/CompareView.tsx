/**
 * CompareView.tsx - 전략 비교 분석 화면 (상징색 연동 완결판)
 * * 수정 포인트:
 * - 우측 상단 Export Comparison 버튼 UI 및 관련 레이아웃 완벽 소거
 * - 다크모드 가독성 선제 조치: 헤더 및 세부 텍스트 가독성 대응 완결
 */

import { ArrowLeft, BarChart3, Target, Lightbulb } from 'lucide-react';
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
}

// 로고 에셋에서 정밀 추출한 헥사코드 고정 바인딩
const BRAND_NAVY = '#0B2F61'; // 전략 A (딥 네이비)
const BRAND_GOLD = '#C8994B'; // 전략 B (웜 골드)

export function CompareView({ items, onBack, darkMode = false }: CompareViewProps) {
  if (items.length !== 2) {
    return (
      <div className={`h-full overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-[#F8FAFC]'} p-8`}>
        <button
          onClick={onBack}
          className={`mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
        >
          <ArrowLeft className="w-5 h-5" />
          돌아가기
        </button>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 text-center`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            두 개의 항목을 선택해주세요.
          </p>
        </div>
      </div>
    );
  }

  const [item1, item2] = items;

  const comparisonData = [
    {
      metric: '전환율',
      '전략 A': item1.status === '성공' ? 8.5 : 4.2,
      '전략 B': item2.status === '성공' ? 7.8 : 3.5,
    },
    {
      metric: 'ROI',
      '전략 A': item1.status === '성공' ? 320 : 150,
      '전략 B': item2.status === '성공' ? 250 : 120,
    },
    {
      metric: '성장률',
      '전략 A': item1.status === '성공' ? 45 : 20,
      '전략 B': item2.status === '성공' ? 38 : 15,
    },
  ];

  const radarData = [
    { metric: '전환율', A: item1.status === '성공' ? 85 : 42, B: item2.status === '성공' ? 78 : 35 },
    { metric: 'ROI', A: item1.status === '성공' ? 90 : 50, B: item2.status === '성공' ? 75 : 40 },
    { metric: '성장률', A: item1.status === '성공' ? 70 : 30, B: item2.status === '성공' ? 60 : 25 },
    { metric: '리스크', A: item1.riskLevel === 'Low' ? 80 : 40, B: item2.riskLevel === 'Low' ? 70 : 30 },
    { metric: '참여도', A: item1.status === '성공' ? 75 : 35, B: item2.status === '성공' ? 80 : 40 },
  ];

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={onBack}
              className={`flex items-center gap-2 mb-4 px-4 py-2.5 ${
                darkMode ? 'hover:bg-gray-800/60 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              } rounded-xl transition-all`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">돌아가기</span>
            </button>
            <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              전략 비교 분석
            </h1>
            <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              두 전략의 성과 지표를 비교하여 최적의 의사결정을 지원합니다.
            </p>
          </div>
        </div>

        {/* Strategy Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[item1, item2].map((item, idx) => (
            <div
              key={item.id}
              className={`relative ${
                darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'
              } p-6 rounded-2xl transition-all duration-300 overflow-hidden group ${
                darkMode ? 'hover:shadow-xl hover:shadow-gray-900/20' : 'shadow-sm hover:shadow-md'
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${
                      idx === 0
                        ? 'bg-gradient-to-br from-[#0B2F61] to-[#1E3E7A]'
                        : 'bg-gradient-to-br from-[#C8994B] to-[#D6B265]'
                    } rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-lg">{idx === 0 ? 'A' : 'B'}</span>
                    </div>
                    <div>
                      <p className={`text-xs font-medium tracking-wide uppercase mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        전략 {idx + 1}
                      </p>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        item.status === '성공' || item.status === '실증 확인'
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
                    darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Bar Chart */}
          <div className={`${
            darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'
          } p-6 rounded-2xl transition-all duration-300 ${
            darkMode ? 'hover:shadow-xl hover:shadow-gray-900/20' : 'shadow-sm hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                지표 비교
              </h3>
              <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} barGap={8}>
                <defs>
                  <linearGradient id="barGradientA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND_NAVY} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={BRAND_NAVY} stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="barGradientB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND_GOLD} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={BRAND_GOLD} stopOpacity={0.6} />
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
                  itemStyle={{ color: darkMode ? '#FFF' : '#000' }}
                  cursor={{ fill: darkMode ? '#374151' : '#F8FAFC', opacity: 0.5 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '14px', fontWeight: 600, paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar key="bar-strategy-a" dataKey="전략 A" fill="url(#barGradientA)" radius={[10, 10, 0, 0]} />
                <Bar key="bar-strategy-b" dataKey="전략 B" fill="url(#barGradientB)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className={`${
            darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'
          } p-6 rounded-2xl transition-all duration-300 ${
            darkMode ? 'hover:shadow-xl hover:shadow-gray-900/20' : 'shadow-sm hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                종합 평가
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
                  itemStyle={{ color: darkMode ? '#FFF' : '#000' }}
                />
                <Radar
                  key="radar-strategy-a"
                  name="전략 A"
                  dataKey="A"
                  stroke={BRAND_NAVY}
                  strokeWidth={2.5}
                  fill={BRAND_NAVY}
                  fillOpacity={0.15}
                  dot={{ fill: BRAND_NAVY, strokeWidth: 2, r: 4 }}
                />
                <Radar
                  key="radar-strategy-b"
                  name="전략 B"
                  dataKey="B"
                  stroke={BRAND_GOLD}
                  strokeWidth={2.5}
                  fill={BRAND_GOLD}
                  fillOpacity={0.25}
                  dot={{ fill: BRAND_GOLD, strokeWidth: 2, r: 4 }}
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
          darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'
        } rounded-2xl overflow-hidden ${
          darkMode ? 'shadow-xl shadow-gray-900/20' : 'shadow-sm'
        }`}>
          <div className={`px-6 py-4 ${
            darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'
          } border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              상세 비교
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                <tr>
                  <th className={`px-6 py-3.5 text-left text-xs font-semibold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    항목
                  </th>
                  <th className={`px-6 py-3.5 text-left text-xs font-semibold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    전략 A
                  </th>
                  <th className={`px-6 py-3.5 text-left text-xs font-semibold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    전략 B
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-200/50'}`}>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    전략 유형
                  </td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item1.strategy}</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item2.strategy}</td>
                </tr>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    산업
                  </td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item1.industry}</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item2.industry}</td>
                </tr>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    리스크 수준
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
                    결과
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                      item1.status === '성공' || item1.status === '실증 확인'
                        ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                        : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                    }`}>
                      {item1.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                      item2.status === '성공' || item2.status === '실증 확인'
                        ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                        : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                    }`}>
                      {item2.status}
                    </span>
                  </td>
                </tr>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    핵심 전략
                  </td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item1.strategySum}</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item2.strategySum}</td>
                </tr>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    주요 리스크
                  </td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item1.riskSum}</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item2.riskSum}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Conclusion */}
        <div className={`relative ${
          darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/50' : 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50'
        } p-6 rounded-2xl overflow-hidden ${
          darkMode ? 'shadow-xl shadow-gray-900/20' : 'shadow-sm'
        }`}>
          <div className="relative z-10">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-[#0B2F61] to-[#1E3E7A] rounded-xl shadow-lg">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                AI 비교 분석 결론
              </h3>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed`}>
              {item1.status === '성공' && item2.status === '성공'
                ? '두 사례 모두 성공적인 결과를 보였습니다. 각 전략의 장점을 결합하여 더 효과적인 접근을 설계할 수 있습니다.'
                : item1.status === '실패' && item2.status === '실패'
                ? '두 사례 모두 실패로 이어졌습니다. 공통된 리스크 요인을 파악하여 유사한 실수를 방지해야 합니다.'
                : '성공 사례와 실패 사례를 비교함으로써, 성공 요인과 위험 신호를 명확히 구분할 수 있습니다.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}