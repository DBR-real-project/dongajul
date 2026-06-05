import { useState } from 'react';
import { ArrowLeft, Shield, AlertTriangle, ExternalLink, Bell, User, TrendingUp, TrendingDown, Activity, ChevronRight } from 'lucide-react';
import { DiagnosisData } from './DiagnosisResult';

interface RiskAnalysisProps {
  onBack: () => void;
  onArticleClick: (id: number) => void;
  onResultClick?: (data: DiagnosisData) => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  darkMode?: boolean;
  language?: string;
}

export function RiskAnalysis({ onBack, onArticleClick, onResultClick, onNotificationClick, onProfileClick, darkMode = false, language = 'ko' }: RiskAnalysisProps) {
  const [strategyText, setStrategyText] = useState('');
  const [result, setResult] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    ko: {
      title: 'DBR 전략 리스크 분석기',
      runAnalysis: '분석 실행',
      riskIndex: '통합 전략 리스크 지수',
      riskDesc: '13,335개 DBR · HBR 사례로 도출한 위험도입니다.',
      riskPossibility: '위험 가능성',
      industryAvg: '클러스터',
      industryGrade: '위험 등급',
      successCases: '유사 성공 전략 사례',
      riskCases: '주의해야 할 실패 사례',
      similarity: '유사도',
      viewDetail: '상세 결과 보기',
    },
    en: {
      title: 'DBR Strategy Risk Analyzer',
      runAnalysis: 'Run Analysis',
      riskIndex: 'Integrated Strategy Risk Index',
      riskDesc: 'Risk derived from 13,335 DBR · HBR cases.',
      riskPossibility: 'Risk Probability',
      industryAvg: 'Cluster',
      industryGrade: 'Risk Level',
      successCases: 'Similar Success Cases',
      riskCases: 'Failure Cases to Watch',
      similarity: 'Similarity',
      viewDetail: 'View Details',
    }
  };

  const text = language === 'en' ? t.en : t.ko;

  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';

  const handleAnalyze = async () => {
    if (!strategyText.trim()) {
      setError('전략 텍스트를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: strategyText, top_k: 5 }),
      });

      const data: DiagnosisData = await response.json();

      if (!response.ok) throw new Error((data as any).error || '분석 요청 실패');

      data.input_text = strategyText;
      setResult(data);
    } catch (err: any) {
      setError(err.message || '진단 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const similarArticles = result?.similar_articles || [];

  const successArticles = similarArticles
    .filter((a) => a.label === 'success')
    .slice(0, 3)
    .map((a) => ({
      id: (a as any).article_id || 0,
      similarity: Math.round(a.similarity * 100),
      title: a.title || '제목 없음',
      tags: [a.source ? `#${a.source}` : '#DBR', '#성공사례'],
      url: a.url,
    }));

  const failureArticles = similarArticles
    .filter((a) => a.label === 'failure')
    .slice(0, 3)
    .map((a) => ({
      id: (a as any).article_id || 0,
      similarity: Math.round(a.similarity * 100),
      title: a.title || '제목 없음',
      tags: [a.source ? `#${a.source}` : '#DBR', '#실패사례'],
      url: a.url,
    }));

  const riskScore = result ? Math.round(result.risk_score * 100) : null;

  const report = ((result as any)?.report || result || {}) as any;

  const riskFactors = Array.isArray(report?.risk_factors)
    ? report.risk_factors
    : [];

  const improvement = Array.isArray(report?.improvement)
    ? report.improvement
    : [];

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
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {text.title}
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>
                  Real-time risk assessment and strategy analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-[#142755] to-[#444655] text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '분석 중...' : text.runAnalysis}
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
      

        {/* 전략 입력 */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 shadow-xl shadow-gray-900/20' : 'bg-white shadow-sm'} p-6 rounded-2xl`}>
          <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            분석할 전략을 입력하세요
          </label>

          <textarea
            value={strategyText}
            onChange={(e) => setStrategyText(e.target.value)}
            rows={4}
            placeholder="예: 우리 회사는 디지털 전환을 통해 제조업 경쟁력을 강화하고 해외 시장에 진출하려 합니다..."
            className={`w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#142755] transition-all ${
              darkMode
                ? 'bg-gray-900/50 text-white placeholder-gray-600 border border-gray-700'
                : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200'
            }`}
          />

          {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
        </div>

        {/* Risk Index Card */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 shadow-xl shadow-gray-900/20' : 'bg-white shadow-sm'} p-8 rounded-2xl transition-all duration-300`}>
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

              <text x="100" y="80" textAnchor="middle" className={`text-4xl font-bold ${darkMode ? 'fill-white' : 'fill-gray-900'}`}>
                {riskScore !== null ? `${riskScore}%` : '-'}
              </text>

              <text x="100" y="98" textAnchor="middle" className={`text-sm font-semibold ${darkMode ? 'fill-gray-400' : 'fill-gray-500'}`}>
                {result ? result.risk_level : '분석 필요'}
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              { label: text.riskPossibility, value: riskScore !== null ? `${riskScore}%` : '-', icon: TrendingDown, color: 'green' },
              { label: text.industryAvg, value: result?.cluster_name || '-', icon: Activity, color: 'blue' },
              { label: text.industryGrade, value: result?.risk_level || '-', icon: TrendingUp, color: 'purple' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} p-4 rounded-xl text-center`}>
                <div className="flex items-center justify-center mb-2">
                  <Icon className={`w-5 h-5 ${color === 'green' ? 'text-green-500' : color === 'blue' ? 'text-blue-500' : 'text-purple-500'}`} />
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

          {/* 상세 결과 보기 버튼 */}
          {result && onResultClick && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => onResultClick(result)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#142755] to-[#444655] text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
              >
                {text.viewDetail}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
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

          <div className="space-y-3">
            {(successArticles.length > 0
              ? successArticles
              : [{ id: 0, similarity: '-' as any, title: '(예시) 분석 실행 후 유사 성공 사례가 표시됩니다', tags: ['#DBR', '#성공사례'], url: '' }]
            ).map((item, idx) => (
              <div
                key={idx}
                onClick={() => item.id ? onArticleClick(item.id) : undefined}
                className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'} p-5 rounded-2xl cursor-pointer transition-all duration-300 ${darkMode ? 'hover:shadow-xl hover:shadow-gray-900/20' : 'shadow-sm hover:shadow-md'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'} rounded-lg text-xs font-semibold mb-3`}>
                      <Shield className="w-3.5 h-3.5" />
                      <span>{text.similarity}: {item.similarity}%</span>
                    </div>

                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 leading-relaxed group-hover:text-[#142755] dark:group-hover:text-[#A9AABC] transition-colors`}>
                      {item.title}
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className={`px-2.5 py-1 ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'} text-xs font-medium rounded-lg`}>
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

        {/* GPT 전략 분석 리포트 */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 shadow-xl shadow-gray-900/20' : 'bg-white shadow-sm'} p-6 rounded-2xl`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-100'}`}>
              <Activity className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>

            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              GPT 전략 분석 리포트
            </h3>
          </div>

          <div className="space-y-5">
            <div>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>
                전략 요약
              </h4>

              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {report?.summary || '분석 실행 후 전략 요약이 표시됩니다.'}
              </p>
            </div>

            <div>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>
                주요 리스크
              </h4>

              <ul className="space-y-2">
                {(riskFactors.length > 0
                  ? riskFactors
                  : ['분석 실행 후 주요 리스크가 표시됩니다.']
                ).map((item: string, index: number) => (
                  <li
                    key={index}
                    className={`text-sm leading-relaxed flex gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    <span className="text-red-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>
                개선 제안
              </h4>

              <ul className="space-y-2">
                {(improvement.length > 0
                  ? improvement
                  : ['분석 실행 후 개선 제안이 표시됩니다.']
                ).map((item: string, index: number) => (
                  <li
                    key={index}
                    className={`text-sm leading-relaxed flex gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    <span className="text-green-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`p-4 rounded-xl ${
              darkMode
                ? 'bg-gray-900/40 border border-gray-700'
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <h4 className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>
                최종 진단
              </h4>

              <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {report?.verdict || '분석 실행 후 최종 진단이 표시됩니다.'}
              </p>
            </div>
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

          <div className="space-y-3">
            {(failureArticles.length > 0
              ? failureArticles
              : [{ id: 0, similarity: '-' as any, title: '(예시) 분석 실행 후 유사 실패 사례가 표시됩니다', tags: ['#DBR', '#실패사례'], url: '' }]
            ).map((item, idx) => (
              <div
                key={idx}
                onClick={() => item.id ? onArticleClick(item.id) : undefined}
                className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'} p-5 rounded-2xl cursor-pointer transition-all duration-300 ${darkMode ? 'hover:shadow-xl hover:shadow-gray-900/20' : 'shadow-sm hover:shadow-md'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'} rounded-lg text-xs font-semibold mb-3`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>RISK {text.similarity}: {item.similarity}%</span>
                    </div>

                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 leading-relaxed group-hover:text-red-500 transition-colors`}>
                      {item.title}
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className={`px-2.5 py-1 ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'} text-xs font-medium rounded-lg`}>
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
