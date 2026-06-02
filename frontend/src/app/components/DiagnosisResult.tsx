import { useState, useEffect } from 'react';
import {
  ArrowLeft, Shield, AlertTriangle, ExternalLink,
  TrendingDown, TrendingUp, Activity, Tag, Lightbulb,
  Clock, BarChart2, ChevronRight
} from 'lucide-react';

export interface SimilarArticle {
  rank: number;
  title: string;
  url: string;
  label: 'success' | 'failure' | 'neutral';
  similarity: number;
  summary?: string;
  category?: string;
  source?: string;
  published_date?: string;
}

export interface DiagnosisData {
  diagnosis_id?: number;
  input_text?: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  keywords?: string[];
  improvement?: string;
  similar_articles: SimilarArticle[];
  cluster_name?: string;
  created_at?: string;
}

interface DiagnosisResultProps {
  diagnosisId?: number;
  resultData?: DiagnosisData;
  onBack: () => void;
  darkMode?: boolean;
}

function RiskGauge({ score, darkMode }: { score: number; darkMode: boolean }) {
  const pct = Math.round(score * 100);
  const angle = -90 + pct * 1.8;
  const rad = (angle * Math.PI) / 180;
  const nx = 100 + 62 * Math.cos(rad);
  const ny = 100 + 62 * Math.sin(rad);
  const color = pct >= 70 ? '#ef4444' : pct >= 40 ? '#fbbf24' : '#10b981';
  const label = pct >= 70 ? '위험' : pct >= 40 ? '주의' : '안전';

  return (
    <div className="relative w-full max-w-xs mx-auto h-48">
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <defs>
          <linearGradient id="gr" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#ef4444' }} />
            <stop offset="50%" style={{ stopColor: '#fbbf24' }} />
            <stop offset="100%" style={{ stopColor: '#10b981' }} />
          </linearGradient>
          <filter id="gs">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
          </filter>
        </defs>
        {/* 배경 트랙 */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none"
          stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="20" strokeLinecap="round" />
        {/* 컬러 게이지 */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none"
          stroke="url(#gr)" strokeWidth="20" strokeLinecap="round" filter="url(#gs)" />
        {/* 바늘 */}
        <line x1="100" y1="100" x2={nx} y2={ny}
          stroke={darkMode ? '#e5e7eb' : '#1e293b'} strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="100" r="7" fill={darkMode ? '#e5e7eb' : '#1e293b'} />
        {/* 점수 텍스트 */}
        <text x="100" y="76" textAnchor="middle"
          style={{ fontSize: 22, fontWeight: 800, fill: color }}>{pct}%</text>
        <text x="100" y="93" textAnchor="middle"
          style={{ fontSize: 10, fontWeight: 600, fill: darkMode ? '#9ca3af' : '#6b7280' }}>{label}</text>
        {/* 범위 라벨 */}
        <text x="22" y="116" textAnchor="middle"
          style={{ fontSize: 8, fill: '#ef4444', fontWeight: 700 }}>위험</text>
        <text x="178" y="116" textAnchor="middle"
          style={{ fontSize: 8, fill: '#10b981', fontWeight: 700 }}>안전</text>
      </svg>
    </div>
  );
}

function CaseCard({
  article, type, darkMode
}: {
  article: SimilarArticle;
  type: 'success' | 'failure';
  darkMode: boolean;
}) {
  const isSuccess = type === 'success';
  const simPct = Math.round(article.similarity * 100);

  return (
    <a
      href={article.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col gap-3 p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 hover:shadow-xl hover:shadow-gray-900/20'
          : 'bg-white shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mb-2.5 ${
            isSuccess
              ? darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'
              : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
          }`}>
            {isSuccess ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            <span>유사도 {simPct}%</span>
            {article.rank && <span className="opacity-60">· #{article.rank}</span>}
          </div>
          <h4 className={`text-sm font-semibold leading-relaxed line-clamp-2 mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          } group-hover:${isSuccess ? 'text-green-600' : 'text-red-600'} transition-colors`}>
            {article.title}
          </h4>
          {article.summary && (
            <p className={`text-xs leading-relaxed line-clamp-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {article.summary}
            </p>
          )}
        </div>
        <ExternalLink className={`w-4 h-4 flex-shrink-0 mt-1 ${
          darkMode ? 'text-gray-500' : 'text-gray-400'
        } group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {article.source && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${
            darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
          }`}>
            #{article.source}
          </span>
        )}
        {article.category && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${
            darkMode ? 'bg-gray-700/60 text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}>
            {article.category}
          </span>
        )}
        {article.published_date && (
          <span className={`flex items-center gap-1 text-xs ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <Clock className="w-3 h-3" />
            {article.published_date.slice(0, 10)}
          </span>
        )}
      </div>
    </a>
  );
}

export function DiagnosisResult({ diagnosisId, resultData, onBack, darkMode = false }: DiagnosisResultProps) {
  const [data, setData] = useState<DiagnosisData | null>(resultData || null);
  const [loading, setLoading] = useState(!resultData && !!diagnosisId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!resultData && diagnosisId) {
      setLoading(true);
      fetch(`http://localhost:3001/api/diagnose/${diagnosisId}`)
        .then((res) => res.json())
        .then((json) => { setData(json); setLoading(false); })
        .catch(() => { setError('결과를 불러올 수 없습니다.'); setLoading(false); });
    }
  }, [diagnosisId, resultData]);

  const successCases = data?.similar_articles.filter((a) => a.label === 'success') ?? [];
  const failureCases = data?.similar_articles.filter((a) => a.label === 'failure') ?? [];
  const pct = data ? Math.round(data.risk_score * 100) : 0;
  const riskColor = pct >= 70 ? 'text-red-500' : pct >= 40 ? 'text-yellow-500' : 'text-green-500';
  const riskBg = pct >= 70
    ? darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
    : pct >= 40
    ? darkMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'
    : darkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200';

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      {/* 헤더 */}
      <header className={`sticky top-0 z-50 border-b ${
        darkMode
          ? 'bg-[#0A0E1A]/90 backdrop-blur-xl border-gray-800/50'
          : 'bg-white/90 backdrop-blur-xl border-gray-200/50'
      }`}>
        <div className="px-6 py-4 max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-2.5 rounded-xl transition-all ${
                darkMode
                  ? 'hover:bg-gray-800/60 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                전략 리스크 진단 결과
              </h1>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                DBR · HBR 13,335건 사례 기반 분석
              </p>
            </div>
          </div>
          {data?.created_at && (
            <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(data.created_at).toLocaleString('ko-KR')}</span>
            </div>
          )}
        </div>
      </header>

      {/* 로딩 / 에러 */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#142755] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-64">
          <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="px-6 py-6 max-w-[1200px] mx-auto space-y-6">

          {/* 입력 전략 */}
          {data.input_text && (
            <div className={`p-5 rounded-2xl border ${
              darkMode ? 'bg-gray-800/40 border-gray-700/40' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>분석한 전략</p>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {data.input_text}
              </p>
            </div>
          )}

          {/* 리스크 게이지 + KPI */}
          <div className={`p-8 rounded-2xl ${
            darkMode
              ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 shadow-xl shadow-gray-900/20'
              : 'bg-white shadow-sm'
          }`}>
            <div className="text-center mb-6">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                통합 전략 리스크 지수
              </h2>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                13,335개 사례 기반 · SBERT + MLP 모델
              </p>
            </div>

            <RiskGauge score={data.risk_score} darkMode={darkMode} />

            {/* KPI 카드 */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                {
                  label: '위험 가능성',
                  value: `${pct}%`,
                  icon: TrendingDown,
                  color: riskColor,
                },
                {
                  label: '분석 클러스터',
                  value: data.cluster_name || '-',
                  icon: BarChart2,
                  color: 'text-blue-500',
                },
                {
                  label: '위험 등급',
                  value: pct >= 70 ? 'HIGH' : pct >= 40 ? 'MEDIUM' : 'LOW',
                  icon: Activity,
                  color: riskColor,
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className={`p-4 rounded-xl text-center ${
                    darkMode ? 'bg-gray-900/40' : 'bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{label}</p>
                  <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>{value}</p>
                </div>
              ))}
            </div>

            {/* 리스크 배너 */}
            <div className={`mt-5 px-4 py-3 rounded-xl border flex items-center gap-3 ${riskBg}`}>
              {pct >= 70 ? (
                <AlertTriangle className={`w-5 h-5 ${riskColor} flex-shrink-0`} />
              ) : pct >= 40 ? (
                <Activity className={`w-5 h-5 ${riskColor} flex-shrink-0`} />
              ) : (
                <Shield className={`w-5 h-5 ${riskColor} flex-shrink-0`} />
              )}
              <p className={`text-sm font-semibold ${riskColor}`}>
                {pct >= 70
                  ? '전략 리스크가 높습니다. 유사 실패 사례를 반드시 검토하세요.'
                  : pct >= 40
                  ? '일부 리스크 요인이 감지됩니다. 주의가 필요합니다.'
                  : '상대적으로 안전한 전략입니다. 유사 성공 사례를 참고하세요.'}
              </p>
            </div>
          </div>

          {/* 키워드 */}
          {data.keywords && data.keywords.length > 0 && (
            <div className={`p-5 rounded-2xl ${
              darkMode
                ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
                : 'bg-white shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                  <Tag className={`w-4 h-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                </div>
                <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  핵심 키워드
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.keywords.map((kw) => (
                  <span
                    key={kw}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl ${
                      darkMode
                        ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 유사 성공 사례 */}
          {successCases.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/10' : 'bg-green-100'}`}>
                  <Shield className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  유사 성공 전략 사례
                </h3>
                <span className={`ml-auto text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Top {successCases.length}
                </span>
              </div>
              <div className="space-y-3">
                {successCases.map((a) => (
                  <CaseCard key={a.rank} article={a} type="success" darkMode={darkMode} />
                ))}
              </div>
            </section>
          )}

          {/* 유사 실패 사례 */}
          {failureCases.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-500/10' : 'bg-red-100'}`}>
                  <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  주의해야 할 실패 사례
                </h3>
                <span className={`ml-auto text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Top {failureCases.length}
                </span>
              </div>
              <div className="space-y-3">
                {failureCases.map((a) => (
                  <CaseCard key={a.rank} article={a} type="failure" darkMode={darkMode} />
                ))}
              </div>
            </section>
          )}

          {/* 개선 제안 */}
          {data.improvement && (
            <div className={`p-6 rounded-2xl ${
              darkMode
                ? 'bg-gradient-to-br from-[#0B2F61]/60 to-[#142755]/30 border border-blue-500/10'
                : 'bg-gradient-to-br from-[#0B2F61] to-[#1d3573] text-white'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-[#E5BA73]'}`} />
                <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-white'}`}>
                  전략 개선 제안
                </h3>
              </div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-blue-100'}`}>
                {data.improvement}
              </p>
            </div>
          )}

          {/* 다시 분석 버튼 */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#142755] to-[#444655] text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              새로운 전략 분석하기
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
