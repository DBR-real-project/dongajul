import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Calendar, TrendingUp, TrendingDown, Target, Users, Lightbulb, BarChart3, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { apiFetch } from '../utils/api';

interface ArticleDetailProps {
  articleId: number;
  onBack: () => void;
  darkMode?: boolean;
}

const BRAND_NAVY = '#0B2F61';
const BRAND_GOLD = '#C8994B';

const DIM_KEYS = ['시장타이밍', '실행력', '고객이해도', '경쟁대응력', '자원충분성', '트렌드부합도'] as const;

export function ArticleDetail({ articleId, onBack, darkMode = false }: ArticleDetailProps) {
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [metrics, setMetrics] = useState<{ name: string; score: number }[]>([]);
  const [scoreLoading, setScoreLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);

    apiFetch(`/api/articles/${articleId}`)
      .then(res => res.json())
      .then(data => {
        if (!mounted) return;
        if (data.success && data.data) {
          const d = data.data;
          const confidence = (typeof d.confidence === 'number' && d.confidence > 0) ? d.confidence : 0.7;

          setArticle({
            title: d.title || '제목 없음',
            company: d.company_name || d.source || 'DBR',
            industry: d.industry || d.cluster_name || '전략 경영',
            date: d.published_at ? String(d.published_at).split('T')[0] : '-',
            label: d.label || 'neutral',
            summary: d.summary || '요약 정보가 없습니다.',
            url: d.url,
            cluster: d.cluster_name,
            confidence,
          });

          // GPT 6차원 채점 요청
          setScoreLoading(true);
          apiFetch(`/api/articles/${articleId}/score`, { method: 'POST' })
            .then(r => r.json())
            .then(scoreData => {
              if (!mounted) return;
              if (scoreData.success && scoreData.scores) {
                setMetrics(DIM_KEYS.map(k => ({ name: k, score: scoreData.scores[k] ?? 50 })));
              } else {
                setFallbackMetrics(confidence);
              }
            })
            .catch(() => { if (mounted) setFallbackMetrics(confidence); })
            .finally(() => { if (mounted) setScoreLoading(false); });
        } else {
          setError(true);
        }
      })
      .catch(() => { if (mounted) setError(true); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [articleId]);

  const setFallbackMetrics = (confidence: number) => {
    const base = Math.round(confidence * 100);
    setMetrics([
      { name: '시장타이밍', score: Math.round(base * 0.92) },
      { name: '실행력',     score: Math.round(base * 0.84) },
      { name: '고객이해도', score: Math.round(base * 0.88) },
      { name: '경쟁대응력', score: base },
      { name: '자원충분성', score: Math.round(base * 0.78) },
      { name: '트렌드부합도', score: Math.round(base * 0.85) },
    ]);
  };

  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${darkMode ? 'bg-[#0A0E1A] text-gray-400' : 'bg-[#FAFBFC] text-gray-500'}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0B2F61] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium">기사 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className={`h-full flex items-center justify-center ${darkMode ? 'bg-[#0A0E1A] text-gray-400' : 'bg-[#FAFBFC] text-gray-500'}`}>
        <div className="text-center">
          <p className="text-sm font-medium mb-4">기사 데이터를 불러올 수 없습니다.</p>
          <button onClick={onBack} className="px-4 py-2 bg-[#0B2F61] text-white rounded-xl text-sm font-bold">목록으로</button>
        </div>
      </div>
    );
  }

  const isSuccess = article.label === 'success';
  const primaryColor = isSuccess ? BRAND_NAVY : BRAND_GOLD;

  return (
    <div className={`h-full min-h-screen overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <button
              onClick={onBack}
              className={`flex items-center gap-2 mb-4 px-3 py-2 ${
                darkMode ? 'hover:bg-gray-800/60 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              } rounded-xl transition-all`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">목록으로</span>
            </button>

            <div className="flex items-center gap-2 mb-3">
              {isSuccess ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                isSuccess
                  ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                  : article.label === 'failure'
                    ? darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                    : darkMode ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-50 text-gray-600'
              }`}>
                {isSuccess ? '성공 사례' : article.label === 'failure' ? '실패 사례' : '중립 사례'}
              </span>
              {article.cluster && (
                <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                  {article.cluster}
                </span>
              )}
            </div>

            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 leading-snug`}>
              {article.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{article.company}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{article.industry}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{article.date}</span>
              </div>
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>원문 보기</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 기사 요약 */}
        <div className={`relative p-6 rounded-2xl border-l-4 ${isSuccess ? 'border-emerald-500' : article.label === 'failure' ? 'border-red-500' : 'border-gray-400'} ${
          darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white shadow-sm'
        }`}>
          <div className={`inline-flex items-center gap-1.5 mb-2 text-sm font-semibold ${isSuccess ? 'text-emerald-600' : 'text-red-500'}`}>
            <Lightbulb className="w-4 h-4" />
            <span>기사 요약</span>
          </div>
          <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed font-medium`}>
            {article.summary}
          </p>
        </div>

        {/* 신뢰도 + 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 바 차트 */}
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'} p-6 rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>전략 역량 분석</h3>
                {scoreLoading && <p className="text-xs text-gray-400 mt-0.5">AI 채점 중...</p>}
              </div>
              <BarChart3 className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            {scoreLoading || metrics.length === 0 ? (
              <div className="flex items-center justify-center h-[240px]">
                <div className="w-6 h-6 border-2 border-[#0B2F61] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E2E8F0'} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#fff', border: `1px solid ${darkMode ? '#374151' : '#E2E8F0'}`, borderRadius: '12px' }}
                    itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                  />
                  <Bar dataKey="score" fill={primaryColor} radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 레이더 차트 */}
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'} p-6 rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>6차원 전략 평가</h3>
                {scoreLoading && <p className="text-xs text-gray-400 mt-0.5">GPT 분석 중...</p>}
              </div>
              <Target className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            {scoreLoading || metrics.length === 0 ? (
              <div className="flex items-center justify-center h-[240px]">
                <div className="w-6 h-6 border-2 border-[#0B2F61] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={metrics} margin={{ top: 15, right: 30, left: 30, bottom: 15 }}>
                  <PolarGrid stroke={darkMode ? '#374151' : '#E2E8F0'} />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#64748B' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="역량 스코어" dataKey="score" stroke={primaryColor} fill={primaryColor} fillOpacity={0.15} dot={{ fill: primaryColor, r: 3 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 신뢰도 정보 */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>라벨링 신뢰도</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.round(article.confidence * 100)}%` }}
              />
            </div>
            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {Math.round(article.confidence * 100)}%
            </span>
          </div>
          <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            AI가 해당 사례를 {isSuccess ? '성공' : article.label === 'failure' ? '실패' : '중립'} 사례로 분류한 신뢰도입니다.
          </p>
        </div>

      </div>
    </div>
  );
}
