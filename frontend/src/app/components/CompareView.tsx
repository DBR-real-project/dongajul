/**
 * CompareView.tsx - 전략 비교 분석 화면
 * 차트 데이터: 실제 article 속성(label, source, published_at, summary 길이) 기반 도출
 */

import { ArrowLeft, BarChart3, Target, Lightbulb, ExternalLink } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

interface CompareItem {
  id: number;
  status: string;      // '성공' | '실패' | '중립'
  label?: string;      // 'success' | 'failure' | 'neutral'
  strategy: string;
  riskLevel: string;
  industry: string;
  title: string;
  strategySum: string;
  riskSum: string;
  source?: string;
  url?: string;
  published_at?: string;
}

interface CompareViewProps {
  items: Array<CompareItem>;
  onBack: () => void;
  darkMode?: boolean;
}

const BRAND_NAVY = '#0B2F61';
const BRAND_GOLD = '#C8994B';

function sourceScore(source?: string): number {
  const s = (source || '').toUpperCase();
  if (s === 'DBR') return 92;
  if (s === 'HBR') return 88;
  if (s === 'HBS') return 85;
  return 70;
}

function recencyScore(published_at?: string): number {
  if (!published_at) return 55;
  const year = new Date(published_at).getFullYear();
  if (isNaN(year)) return 55;
  return Math.max(10, Math.min(100, 100 - (2026 - year) * 8));
}

function riskScore(label?: string, status?: string): number {
  const l = label || status || '';
  if (l === 'failure' || l === '실패') return 82;
  if (l === 'success' || l === '성공') return 18;
  return 50;
}

function fitScore(label?: string, status?: string): number {
  const l = label || status || '';
  if (l === 'success' || l === '성공') return 85;
  if (l === 'failure' || l === '실패') return 22;
  return 52;
}

function contentScore(summary?: string): number {
  const len = (summary || '').length;
  return Math.min(100, Math.max(20, Math.round(len / 6)));
}

function statusLabel(status: string, label?: string): string {
  const l = label || status;
  if (l === 'success' || l === '성공') return '성공';
  if (l === 'failure' || l === '실패') return '실패';
  return '중립';
}

function formatDate(published_at?: string): string {
  if (!published_at) return '-';
  const d = new Date(published_at);
  if (isNaN(d.getTime())) return published_at.slice(0, 10);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

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
      metric: '리스크 지수',
      '전략 A': riskScore(item1.label, item1.status),
      '전략 B': riskScore(item2.label, item2.status),
    },
    {
      metric: '정보 신뢰도',
      '전략 A': sourceScore(item1.source),
      '전략 B': sourceScore(item2.source),
    },
    {
      metric: '사례 최신성',
      '전략 A': recencyScore(item1.published_at),
      '전략 B': recencyScore(item2.published_at),
    },
  ];

  const radarData = [
    { metric: '전략 성공도', A: fitScore(item1.label, item1.status), B: fitScore(item2.label, item2.status) },
    { metric: '정보 신뢰도', A: sourceScore(item1.source), B: sourceScore(item2.source) },
    { metric: '사례 최신성', A: recencyScore(item1.published_at), B: recencyScore(item2.published_at) },
    { metric: '리스크 수준', A: riskScore(item1.label, item1.status), B: riskScore(item2.label, item2.status) },
    { metric: '내용 충실도', A: contentScore(item1.strategySum), B: contentScore(item2.strategySum) },
  ];

  const status1 = statusLabel(item1.status, item1.label);
  const status2 = statusLabel(item2.status, item2.label);

  const conclusionText =
    status1 === '성공' && status2 === '성공'
      ? '두 사례 모두 성공적인 결과를 보였습니다. 각 전략의 차별화 요인을 비교해 더 효과적인 접근법을 설계할 수 있습니다.'
      : status1 === '실패' && status2 === '실패'
      ? '두 사례 모두 실패로 이어졌습니다. 공통된 리스크 요인을 파악하여 유사한 실수를 방지해야 합니다.'
      : status1 === '성공' || status2 === '성공'
      ? `성공 사례(${status1 === '성공' ? '전략 A' : '전략 B'})에서 핵심 성공 요인을 도출하고, 실패 사례의 위험 신호와 비교해 전략 보완 방향을 수립하세요.`
      : '두 사례를 비교 분석하여 공통 패턴과 차이점을 파악하고, 최적의 전략 방향을 결정하세요.';

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
              두 사례의 성과 지표를 비교하여 최적의 의사결정을 지원합니다.
            </p>
          </div>
        </div>

        {/* Strategy Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[item1, item2].map((item, idx) => {
            const st = statusLabel(item.status, item.label);
            return (
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
                          st === '성공'
                            ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                            : st === '실패'
                            ? darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                            : darkMode ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {st}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 leading-snug`}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                        {item.title}
                        <ExternalLink className="w-4 h-4 opacity-50 flex-shrink-0" />
                      </a>
                    ) : item.title}
                  </h3>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`px-2.5 py-1 ${
                      darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
                    } text-xs font-medium rounded-lg`}>
                      {item.source || item.strategy}
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

                  {item.published_at && (
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatDate(item.published_at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Bar Chart */}
          <div className={`${
            darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'
          } p-6 rounded-2xl transition-all duration-300 ${
            darkMode ? 'hover:shadow-xl hover:shadow-gray-900/20' : 'shadow-sm hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                지표 비교
              </h3>
              <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              리스크 지수·정보 신뢰도·사례 최신성 (0-100)
            </p>
            <ResponsiveContainer width="100%" height={280}>
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
                  tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#64748B', fontWeight: 500 }}
                  axisLine={{ stroke: darkMode ? '#374151' : '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#64748B', fontWeight: 500 }}
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
                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 600, paddingTop: '20px' }} iconType="circle" />
                <Bar dataKey="전략 A" fill="url(#barGradientA)" radius={[10, 10, 0, 0]} />
                <Bar dataKey="전략 B" fill="url(#barGradientB)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className={`${
            darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'
          } p-6 rounded-2xl transition-all duration-300 ${
            darkMode ? 'hover:shadow-xl hover:shadow-gray-900/20' : 'shadow-sm hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                종합 평가
              </h3>
              <Target className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              5개 차원 다각 분석 (0-100)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={darkMode ? '#374151' : '#E2E8F0'} strokeWidth={1.5} />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#64748B', fontWeight: 500 }}
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
                  name="전략 A"
                  dataKey="A"
                  stroke={BRAND_NAVY}
                  strokeWidth={2.5}
                  fill={BRAND_NAVY}
                  fillOpacity={0.15}
                  dot={{ fill: BRAND_NAVY, strokeWidth: 2, r: 4 }}
                />
                <Radar
                  name="전략 B"
                  dataKey="B"
                  stroke={BRAND_GOLD}
                  strokeWidth={2.5}
                  fill={BRAND_GOLD}
                  fillOpacity={0.25}
                  dot={{ fill: BRAND_GOLD, strokeWidth: 2, r: 4 }}
                />
                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 600, paddingTop: '20px' }} iconType="circle" />
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
          <div className={`px-6 py-4 ${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>상세 비교</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                <tr>
                  <th className={`px-6 py-3.5 text-left text-xs font-semibold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>항목</th>
                  <th className={`px-6 py-3.5 text-left text-xs font-semibold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>전략 A</th>
                  <th className={`px-6 py-3.5 text-left text-xs font-semibold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>전략 B</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-200/50'}`}>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>결과</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                      status1 === '성공' ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : status1 === '실패' ? darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                      : darkMode ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>{status1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                      status2 === '성공' ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : status2 === '실패' ? darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                      : darkMode ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>{status2}</span>
                  </td>
                </tr>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>리스크 수준</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                      item1.riskLevel === 'Low' ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : item1.riskLevel === 'Medium' ? darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                      : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                    }`}>{item1.riskLevel}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                      item2.riskLevel === 'Low' ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : item2.riskLevel === 'Medium' ? darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                      : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                    }`}>{item2.riskLevel}</span>
                  </td>
                </tr>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>출처</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item1.source || item1.industry || '-'}</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item2.source || item2.industry || '-'}</td>
                </tr>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>카테고리</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item1.strategy || '-'}</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item2.strategy || '-'}</td>
                </tr>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>발행일</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(item1.published_at)}</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(item2.published_at)}</td>
                </tr>
                <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>핵심 내용</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xs`}>{item1.strategySum || '-'}</td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xs`}>{item2.strategySum || '-'}</td>
                </tr>
                {(item1.url || item2.url) && (
                  <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                    <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>원문</td>
                    <td className="px-6 py-4">
                      {item1.url ? (
                        <a href={item1.url} target="_blank" rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-xs font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}>
                          원문 보기 <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {item2.url ? (
                        <a href={item2.url} target="_blank" rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-xs font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}>
                          원문 보기 <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>}
                    </td>
                  </tr>
                )}
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
              {conclusionText}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
