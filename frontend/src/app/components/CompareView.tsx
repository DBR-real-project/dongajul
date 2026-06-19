import { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, Target, Lightbulb, ExternalLink, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { apiFetch } from '../utils/api';

interface CompareItem {
  id: number;
  status: string;
  label?: string;
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

interface DimScores {
  시장타이밍: number;
  실행력: number;
  고객이해도: number;
  경쟁대응력: number;
  자원충분성: number;
  트렌드부합도: number;
}

interface GptResult {
  analysis: string;
  key_differences: string[];
  recommendation: string;
  trend_insight?: string;
  score_basis?: { A: string; B: string };
  scores?: {
    A: DimScores;
    B: DimScores;
  };
}

const BRAND_NAVY = '#0B2F61';
const BRAND_GOLD = '#C8994B';

// ── 폴백 점수 계산 (GPT 실패 시) ──────────────────────────────────────

function getYear(published_at?: string): number {
  if (!published_at) return 2020;
  const y = new Date(published_at).getFullYear();
  return isNaN(y) ? 2020 : y;
}

function sourceScore(item: CompareItem): number {
  const s = (item.source || '').toUpperCase();
  const base = s === 'DBR' ? 91 : s === 'HBR' ? 88 : s === 'HBS' ? 85 : 68;
  const ageMod = getYear(item.published_at) >= 2022 ? 3 : getYear(item.published_at) <= 2016 ? -5 : 0;
  return Math.min(98, Math.max(50, base + ageMod));
}

function recencyScore(item: CompareItem): number {
  return Math.max(10, Math.min(100, 100 - (2026 - getYear(item.published_at)) * 8));
}

function riskScore(item: CompareItem): number {
  const base = item.label === 'failure' || item.status === '실패' ? 71
             : item.label === 'success' || item.status === '성공' ? 20
             : 47;
  const riskKws = ['실패', '위기', '부도', '철수', '적자', '손실', '폐업', '하락', '감소', '위험', 'fail', 'crisis'];
  const hits = riskKws.filter(kw => (item.strategySum || '').toLowerCase().includes(kw)).length;
  return Math.min(95, Math.max(8, base + hits * 2));
}

function fitScore(item: CompareItem): number {
  const base = item.label === 'success' || item.status === '성공' ? 73
             : item.label === 'failure' || item.status === '실패' ? 20
             : 50;
  const successKws = ['성공', '성장', '달성', '확대', '수익', '혁신', '선도', '1위', '점유', '흑자'];
  const failKws = ['실패', '위기', '부도', '손실', '철수', '적자'];
  const content = item.strategySum || '';
  return Math.min(95, Math.max(8, base + successKws.filter(k => content.includes(k)).length * 2 - failKws.filter(k => content.includes(k)).length * 3));
}

function contentScore(item: CompareItem): number {
  const s = item.strategySum || '';
  const lengthScore = Math.min(55, Math.round(s.length / 5));
  const hasNumbers = /\d+[%억만천원]|\d{4}년|\d+배/.test(s) ? 15 : 0;
  const hasEntities = /[가-힣]{2,}(사|기업|그룹|플랫폼|서비스)/.test(s) ? 10 : 0;
  return Math.min(97, Math.max(15, lengthScore + hasNumbers + hasEntities + (s.length > 200 ? 10 : 0)));
}

// GPT 실패 시 6개 폴백 점수 생성
function fallbackDimScores(item: CompareItem): DimScores {
  const fit = fitScore(item);
  const risk = riskScore(item);
  return {
    시장타이밍: Math.min(95, Math.max(10, fit - 5 + (getYear(item.published_at) >= 2020 ? 8 : 0))),
    실행력: Math.min(95, Math.max(10, fit + 3)),
    고객이해도: Math.min(95, Math.max(10, fit - 8 + contentScore(item) / 5)),
    경쟁대응력: Math.min(95, Math.max(10, 100 - risk - 5)),
    자원충분성: Math.min(95, Math.max(10, sourceScore(item) - 10)),
    트렌드부합도: Math.min(95, Math.max(10, recencyScore(item) - 5)),
  };
}

function statusLabel(item: CompareItem): string {
  const l = item.label || item.status;
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

const DIM_KEYS: (keyof DimScores)[] = ['시장타이밍', '실행력', '고객이해도', '경쟁대응력', '자원충분성', '트렌드부합도'];

// ── 컴포넌트 ──────────────────────────────────────────────────────────

export function CompareView({ items, onBack, darkMode = false }: CompareViewProps) {
  const [gptResult, setGptResult] = useState<GptResult | null>(null);
  const [gptLoading, setGptLoading] = useState(false);
  const [gptError, setGptError] = useState('');

  useEffect(() => {
    if (items.length !== 2) return;
    const [i1, i2] = items;
    setGptLoading(true);
    setGptError('');

    apiFetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article1: {
          title: i1.title,
          label: i1.label || i1.status,
          source: i1.source,
          published_at: i1.published_at,
          category: i1.strategy,
          summary: i1.strategySum,
        },
        article2: {
          title: i2.title,
          label: i2.label || i2.status,
          source: i2.source,
          published_at: i2.published_at,
          category: i2.strategy,
          summary: i2.strategySum,
        },
      }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: GptResult) => { setGptResult(data); setGptLoading(false); })
      .catch(() => { setGptError('AI 분석을 불러올 수 없습니다.'); setGptLoading(false); });
  }, [items[0]?.url, items[1]?.url]);

  if (items.length !== 2) {
    return (
      <div className={`h-full overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-[#F8FAFC]'} p-8`}>
        <button onClick={onBack} className={`mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
          <ArrowLeft className="w-5 h-5" /> 돌아가기
        </button>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 text-center`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>두 개의 항목을 선택해주세요.</p>
        </div>
      </div>
    );
  }

  const [item1, item2] = items;

  // GPT 스코어 or 폴백
  const scoresA: DimScores = gptResult?.scores?.A ?? fallbackDimScores(item1);
  const scoresB: DimScores = gptResult?.scores?.B ?? fallbackDimScores(item2);

  // 차트 데이터
  const barData = DIM_KEYS.map(k => ({
    metric: k,
    '전략 A': scoresA[k],
    '전략 B': scoresB[k],
  }));

  const radarData = DIM_KEYS.map(k => ({
    metric: k,
    A: scoresA[k],
    B: scoresB[k],
  }));

  const cardBase = darkMode
    ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
    : 'bg-white';
  const cardShadow = darkMode
    ? 'hover:shadow-xl hover:shadow-gray-900/20'
    : 'shadow-sm hover:shadow-md';

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-8">

        {/* 헤더 */}
        <div>
          <button
            onClick={onBack}
            className={`flex items-center gap-2 mb-4 px-4 py-2.5 ${darkMode ? 'hover:bg-gray-800/60 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'} rounded-xl transition-all`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">돌아가기</span>
          </button>
          <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>전략 비교 분석</h1>
          <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>두 사례를 6개 전략 차원으로 비교하고 시장 트렌드 관점의 시사점을 도출합니다.</p>
        </div>

        {/* 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[item1, item2].map((item, idx) => {
            const st = statusLabel(item);
            const risk = riskScore(item);
            const dimS = idx === 0 ? scoresA : scoresB;
            return (
              <div key={item.id} className={`relative ${cardBase} p-6 rounded-2xl transition-all duration-300 overflow-hidden group ${cardShadow}`}>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${idx === 0 ? 'bg-gradient-to-br from-[#0B2F61] to-[#1E3E7A]' : 'bg-gradient-to-br from-[#C8994B] to-[#D6B265]'} rounded-xl flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg">{idx === 0 ? 'A' : 'B'}</span>
                      </div>
                      <div>
                        <p className={`text-xs font-medium tracking-wide uppercase mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>전략 {idx + 1}</p>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                          st === '성공' ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                          : st === '실패' ? darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                          : darkMode ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-100 text-gray-600'
                        }`}>{st}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1`}>리스크 지수</p>
                      <p className={`text-2xl font-bold ${risk >= 60 ? 'text-red-500' : risk >= 35 ? 'text-yellow-500' : 'text-emerald-500'}`}>{risk}%</p>
                    </div>
                  </div>

                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 leading-snug`}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                        {item.title} <ExternalLink className="w-4 h-4 opacity-50 flex-shrink-0" />
                      </a>
                    ) : item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {item.source && (
                      <span className={`px-2.5 py-1 ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'} text-xs font-medium rounded-lg`}>{item.source}</span>
                    )}
                    {item.strategy && item.strategy !== item.source && (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${darkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{item.strategy}</span>
                    )}
                  </div>

                  {/* 미니 지표 바 (GPT 스코어 우선) */}
                  <div className="space-y-2 mt-4">
                    {([
                      { label: '시장타이밍', key: '시장타이밍' as keyof DimScores, color: 'bg-blue-500' },
                      { label: '실행력', key: '실행력' as keyof DimScores, color: 'bg-indigo-500' },
                      { label: '트렌드부합도', key: '트렌드부합도' as keyof DimScores, color: 'bg-purple-500' },
                    ]).map(({ label, key, color }) => {
                      const val = dimS[key];
                      return (
                        <div key={label}>
                          <div className="flex justify-between mb-0.5">
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
                            <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{val}</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {item.published_at && (
                    <p className={`text-xs mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(item.published_at)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 6개 지표 바 차트 */}
          <div className={`${cardBase} p-6 rounded-2xl transition-all duration-300 ${cardShadow}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>6대 전략 지표 비교</h3>
              <div className="flex items-center gap-2">
                {gptLoading && <Loader2 className={`w-4 h-4 animate-spin ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />}
                <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            </div>
            <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              시장타이밍 · 실행력 · 고객이해도 · 경쟁대응력 · 자원충분성 · 트렌드부합도 (0-100)
              {gptResult?.scores && <span className={`ml-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} font-medium`}>· GPT 평가</span>}
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barGap={8}>
                <defs>
                  <linearGradient id="barGradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND_NAVY} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={BRAND_NAVY} stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="barGradB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND_GOLD} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={BRAND_GOLD} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E2E8F0'} vertical={false} />
                <XAxis dataKey="metric" tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#64748B', fontWeight: 500 }} axisLine={{ stroke: darkMode ? '#374151' : '#E2E8F0' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', border: `1px solid ${darkMode ? '#374151' : '#E2E8F0'}`, borderRadius: '12px', padding: '12px' }} itemStyle={{ color: darkMode ? '#FFF' : '#000' }} cursor={{ fill: darkMode ? '#374151' : '#F8FAFC', opacity: 0.5 }} />
                <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '16px' }} iconType="circle" />
                <Bar dataKey="전략 A" fill="url(#barGradA)" radius={[10, 10, 0, 0]} />
                <Bar dataKey="전략 B" fill="url(#barGradB)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 6차원 레이더 */}
          <div className={`${cardBase} p-6 rounded-2xl transition-all duration-300 ${cardShadow}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>6차원 종합 평가</h3>
              <Target className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>6개 전략 역량 다각 분석 (0-100)</p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={darkMode ? '#374151' : '#E2E8F0'} strokeWidth={1.5} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#64748B', fontWeight: 500 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: darkMode ? '#6B7280' : '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', border: `1px solid ${darkMode ? '#374151' : '#E2E8F0'}`, borderRadius: '12px', padding: '12px' }} itemStyle={{ color: darkMode ? '#FFF' : '#000' }} />
                <Radar name="전략 A" dataKey="A" stroke={BRAND_NAVY} strokeWidth={2.5} fill={BRAND_NAVY} fillOpacity={0.15} dot={{ fill: BRAND_NAVY, strokeWidth: 2, r: 4 }} />
                <Radar name="전략 B" dataKey="B" stroke={BRAND_GOLD} strokeWidth={2.5} fill={BRAND_GOLD} fillOpacity={0.25} dot={{ fill: BRAND_GOLD, strokeWidth: 2, r: 4 }} />
                <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '16px' }} iconType="circle" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 상세 비교 테이블 */}
        <div className={`${cardBase} rounded-2xl overflow-hidden ${darkMode ? 'shadow-xl shadow-gray-900/20' : 'shadow-sm'}`}>
          <div className={`px-6 py-4 ${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>상세 비교</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                <tr>
                  {['항목', '전략 A', '전략 B'].map(h => (
                    <th key={h} className={`px-6 py-3.5 text-left text-xs font-semibold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-200/50'}`}>
                {[
                  { label: '결과', render: (item: CompareItem) => {
                    const st = statusLabel(item);
                    return (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${st === '성공' ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700' : st === '실패' ? darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700' : darkMode ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{st}</span>
                    );
                  }},
                  { label: '리스크 지수', render: (item: CompareItem) => {
                    const r = riskScore(item);
                    return <span className={`font-semibold ${r >= 60 ? 'text-red-500' : r >= 35 ? 'text-yellow-500' : 'text-emerald-500'}`}>{r}%</span>;
                  }},
                  { label: '출처', render: (item: CompareItem) => <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.source || '-'}</span> },
                  { label: '카테고리', render: (item: CompareItem) => <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.strategy || '-'}</span> },
                  { label: '발행일', render: (item: CompareItem) => <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(item.published_at)}</span> },
                  { label: '핵심 내용', render: (item: CompareItem) => <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-3`}>{item.strategySum || '-'}</span> },
                ].map(row => (
                  <tr key={row.label} className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                    <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'} whitespace-nowrap`}>{row.label}</td>
                    <td className="px-6 py-4 max-w-xs">{row.render(item1)}</td>
                    <td className="px-6 py-4 max-w-xs">{row.render(item2)}</td>
                  </tr>
                ))}
                {(item1.url || item2.url) && (
                  <tr className={`${darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                    <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>원문</td>
                    {[item1, item2].map((item, i) => (
                      <td key={i} className="px-6 py-4">
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-xs font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}>
                            원문 보기 <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI 비교 분석 결론 */}
        <div className={`relative ${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/50' : 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50'} p-6 rounded-2xl overflow-hidden ${darkMode ? 'shadow-xl shadow-gray-900/20' : 'shadow-sm'}`}>
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-[#0B2F61] to-[#1E3E7A] rounded-xl shadow-lg shrink-0">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI 비교 분석 결론</h3>
          </div>

          {gptLoading ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className={`w-5 h-5 animate-spin ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>GPT가 두 사례를 트렌드 관점으로 분석 중입니다...</span>
            </div>
          ) : gptError ? (
            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {gptError}
            </div>
          ) : gptResult ? (
            <div className="space-y-5">
              <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed`}>{gptResult.analysis}</p>

              {gptResult.key_differences?.length > 0 && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>주요 차이점</p>
                  <ul className="space-y-2">
                    {gptResult.key_differences.map((diff, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>{i + 1}</span>
                        {diff}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 채점 근거 */}
              {gptResult.score_basis && (
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/40 border border-gray-600/30' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>채점 근거</p>
                  <div className="space-y-2">
                    <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                      <span className="font-semibold">사례 A:</span> {gptResult.score_basis.A}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                      <span className="font-semibold">사례 B:</span> {gptResult.score_basis.B}
                    </p>
                  </div>
                </div>
              )}

              {/* 트렌드 인사이트 */}
              {gptResult.trend_insight && (
                <div className={`flex items-start gap-3 p-4 rounded-xl ${darkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <TrendingUp className={`w-4 h-4 mt-0.5 shrink-0 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>트렌드 관점</p>
                    <p className={`text-sm ${darkMode ? 'text-emerald-200' : 'text-emerald-800'} leading-relaxed`}>{gptResult.trend_insight}</p>
                  </div>
                </div>
              )}

              <div className={`pt-4 border-t ${darkMode ? 'border-gray-700/50' : 'border-indigo-100'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>전략적 시사점</p>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'} leading-relaxed`}>{gptResult.recommendation}</p>
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
