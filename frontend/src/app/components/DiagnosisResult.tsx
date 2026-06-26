import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Shield, AlertTriangle, ExternalLink,
  TrendingDown, TrendingUp, Activity, Tag, Lightbulb,
  Clock, BarChart2, ChevronRight, Check, Globe, Loader2, Download
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useArticleCount } from '../utils/articleCount';

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

export interface DiagnosisReport {
  summary: string;
  risk_factors: string[];
  improvement: string[];
  verdict: string;
  strategy_analysis?: string;
  market_context?: string;
  risk_details?: string[];
  framework_insight?: string;
}

export interface DiagnosisData {
  diagnosis_id?: number;
  input_text?: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  keywords?: string[];
  improvement?: string | string[];
  similar_articles: SimilarArticle[];
  cluster_name?: string;
  created_at?: string;
  report?: DiagnosisReport;
  query_umap_x?: number;
  query_umap_y?: number;
  query_cluster_id?: number;
}

interface DiagnosisResultProps {
  diagnosisId?: number;
  resultData?: DiagnosisData;
  onBack: () => void;
  onSemanticMap?: (coords?: { umap_x: number; umap_y: number; cluster_name?: string; cluster_id?: number }, similarArticles?: SimilarArticle[]) => void;
  darkMode?: boolean;
}

function RiskGauge({ score, darkMode }: { score: number; darkMode: boolean }) {
  const pct = Math.round(score * 100);
  const angle = -(pct * 1.8);
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
      className={`group flex flex-col gap-3 p-5 rounded-2xl cursor-pointer transition-all duration-300 ${darkMode
        ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 hover:shadow-xl hover:shadow-gray-900/20'
        : 'bg-white shadow-sm hover:shadow-md'
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mb-2.5 ${isSuccess
            ? darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'
            : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
            }`}>
            {isSuccess ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            <span>유사도 {simPct}%</span>
            {article.rank && <span className="opacity-60">· #{article.rank}</span>}
          </div>
          <h4 className={`text-sm font-semibold leading-relaxed line-clamp-2 mb-2 ${darkMode ? 'text-white' : 'text-gray-900'
            } group-hover:${isSuccess ? 'text-green-600' : 'text-red-600'} transition-colors`}>
            {article.title}
          </h4>
          {article.summary && (
            <p className={`text-xs leading-relaxed line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
              {article.summary}
            </p>
          )}
        </div>
        <ExternalLink className={`w-4 h-4 flex-shrink-0 mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'
          } group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {article.source && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
            }`}>
            #{article.source}
          </span>
        )}
        {article.category && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${darkMode ? 'bg-gray-700/60 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
            {article.category}
          </span>
        )}
        {article.published_date && (
          <span className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
            <Clock className="w-3 h-3" />
            {article.published_date.slice(0, 10)}
          </span>
        )}
      </div>
    </a>
  );
}

export function DiagnosisResult({ diagnosisId, resultData, onBack, onSemanticMap, darkMode = false }: DiagnosisResultProps) {
  const articleCount = useArticleCount();
  const [data, setData] = useState<DiagnosisData | null>(resultData || null);
  const [loading, setLoading] = useState(!resultData && !!diagnosisId);
  const [error, setError] = useState('');

  const [rating, setRating] = useState<'good' | 'bad' | null>(null);
  const [opinion, setOpinion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [globalCases, setGlobalCases] = useState<SimilarArticle[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalFetched, setGlobalFetched] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFetchGlobal = async () => {
    if (!data?.input_text || globalLoading || globalFetched) return;
    setGlobalLoading(true);
    try {
      const res = await apiFetch('/api/diagnose/global', {
        method: 'POST',
        body: JSON.stringify({ text: data.input_text, top_k: 5 }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setGlobalCases(json.similar_articles || []);
      setGlobalFetched(true);
    } catch {
      showToast('해외 사례를 불러올 수 없습니다.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      const { toJpeg } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      const el = reportRef.current;
      // html-to-image는 CSS 변수·그라디언트·한글 폰트 모두 정상 렌더링
      const dataUrl = await toJpeg(el, {
        quality: 0.92,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipAutoScale: false,
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (img.height * pageW) / img.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(dataUrl, 'JPEG', 0, position, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, position, pageW, imgH);
        heightLeft -= pageH;
      }
      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`동아줄_전략리스크진단리포트_${dateStr}.pdf`);
      showToast('PDF 저장 완료!');
    } catch (err) {
      console.error('[PDF] 생성 오류:', err);
      showToast('PDF 생성에 실패했습니다.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!rating) {
      showToast('평가를 선택해주세요');
      return;
    }

    if (!data?.diagnosis_id) {
      showToast('진단 정보가 없습니다');
      return;
    }

    try {
      setSubmitting(true);

      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = savedUser?.id || savedUser?.user_id;

      if (!userId) {
        showToast('로그인 사용자 정보가 없습니다. 다시 로그인해주세요.');
        return;
      }

      const res = await apiFetch('/api/feedbacks', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          diagnosis_id: data.diagnosis_id,
          rating: rating === 'good' ? 5 : 1,
          opinion_text: opinion,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        showToast(result.message || '피드백 제출 실패');
        return;
      }

      showToast('피드백 감사합니다!');
      setRating(null);
      setOpinion('');
    } catch (err) {
      showToast('피드백 제출 실패');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!resultData && diagnosisId) {
      setLoading(true);
      apiFetch(`/api/diagnose/${diagnosisId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status}`);
          return res.json();
        })
        .then((json) => { setData(json); setLoading(false); })
        .catch(() => { setError('결과를 불러올 수 없습니다.'); setLoading(false); });
    }
  }, [diagnosisId, resultData]);

  const successCases = data?.similar_articles?.filter((a) => a.label === 'success') ?? [];
  const failureCases = data?.similar_articles?.filter((a) => a.label === 'failure') ?? [];
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
      <header className={`sticky top-0 z-50 border-b ${darkMode
        ? 'bg-[#0A0E1A]/90 backdrop-blur-xl border-gray-800/50'
        : 'bg-white/90 backdrop-blur-xl border-gray-200/50'
        }`}>
        <div className="px-6 py-4 max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-2.5 rounded-xl transition-all ${darkMode
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
                DBR · HBR · HBS {articleCount}건 사례 기반 분석
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
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800/40 border-gray-700/40' : 'bg-white border-gray-200 shadow-sm'
              }`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>분석한 전략</p>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {data.input_text}
              </p>
            </div>
          )}

          {/* 리스크 게이지 + KPI */}
          <div className={`p-8 rounded-2xl ${darkMode
            ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 shadow-xl shadow-gray-900/20'
            : 'bg-white shadow-sm'
            }`}>
            <div className="text-center mb-6">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                통합 전략 리스크 지수
              </h2>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {articleCount}개 사례 기반 · SBERT + MLP 모델
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
                  className={`p-4 rounded-xl text-center ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50'
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
            <div className={`p-5 rounded-2xl ${darkMode
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
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl ${darkMode
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

          {/* 전략 키워드 맵 */}
          {data.similar_articles && data.similar_articles.length > 0 && (() => {
            // 카테고리 + 키워드 빈도 집계
            const freq: Record<string, number> = {};
            data.similar_articles.forEach((a) => {
              if (a.category) {
                const cats = a.category.split(/[,/·]/).map((s) => s.trim()).filter(Boolean);
                cats.forEach((c) => { freq[c] = (freq[c] || 0) + 1; });
              }
              if (a.source) freq[a.source] = (freq[a.source] || 0) + 0.5;
            });
            (data.keywords || []).forEach((kw) => { freq[kw] = (freq[kw] || 0) + 2; });
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
            if (sorted.length === 0) return null;
            const max = sorted[0][1];
            const sizeClass = (cnt: number) => {
              const r = cnt / max;
              if (r > 0.75) return 'text-xl font-black';
              if (r > 0.5) return 'text-base font-bold';
              if (r > 0.25) return 'text-sm font-semibold';
              return 'text-xs font-medium';
            };
            const colorClass = (cnt: number) => {
              const r = cnt / max;
              if (r > 0.75) return darkMode ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-800 border-indigo-200';
              if (r > 0.5) return darkMode ? 'bg-blue-500/15 text-blue-300 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200';
              if (r > 0.25) return darkMode ? 'bg-gray-700/60 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200';
              return darkMode ? 'bg-gray-800/60 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-100';
            };
            return (
              <div className={`p-5 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                    <Tag className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>전략 키워드 맵</h3>
                  <span className={`ml-auto text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>유사 사례 기반</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {sorted.map(([word, cnt]) => (
                    <span
                      key={word}
                      className={`px-3 py-1.5 rounded-xl border transition-all ${sizeClass(cnt)} ${colorClass(cnt)}`}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

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

          {/* ── 해외 사례 CTA ── */}
          <div className={`rounded-2xl border-2 border-dashed overflow-hidden ${
            darkMode ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-indigo-200 bg-indigo-50/60'
          }`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
                  <Globe className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    해외에서는 어떤 사례가 있을까요?
                  </h3>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    Harvard Business School · HBR 글로벌 케이스 기반
                  </p>
                </div>
              </div>
              <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                동일한 전략을 해외 기업은 어떻게 실행했을까요? HBS 케이스와 HBR 아티클에서 유사 사례를 찾아드립니다.
              </p>

              {!globalFetched ? (
                <button
                  onClick={handleFetchGlobal}
                  disabled={globalLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    darkMode
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                  }`}
                >
                  {globalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      해외 사례 분석 중...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      해외 사례 분석하기
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : globalCases.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  유사한 해외 사례를 찾지 못했습니다.
                </p>
              ) : null}
            </div>

            {globalFetched && globalCases.length > 0 && (
              <div className={`border-t px-6 py-5 space-y-3 ${darkMode ? 'border-indigo-500/20' : 'border-indigo-100'}`}>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  HBS · HBR 유사 사례 Top {globalCases.length}
                </p>
                {globalCases.map((a) => (
                  <a
                    key={a.rank}
                    href={a.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-start gap-3 p-4 rounded-xl transition-all ${
                      darkMode
                        ? 'bg-gray-800/50 hover:bg-gray-800'
                        : 'bg-white hover:shadow-sm border border-indigo-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                          darkMode ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          HBS · #{a.rank}
                        </span>
                        <span className={`text-xs font-medium ${
                          a.label === 'success'
                            ? darkMode ? 'text-green-400' : 'text-green-600'
                            : a.label === 'failure'
                              ? darkMode ? 'text-red-400' : 'text-red-600'
                              : darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          유사도 {Math.round(a.similarity * 100)}%
                        </span>
                        {a.category && (
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {a.category}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-semibold leading-snug line-clamp-2 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {a.title}
                      </p>
                      {a.summary && (
                        <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {a.summary}
                        </p>
                      )}
                    </div>
                    <ExternalLink className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      darkMode ? 'text-gray-600 group-hover:text-indigo-400' : 'text-gray-300 group-hover:text-indigo-500'
                    } transition-colors`} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* AI 전략 컨설팅 리포트 */}
          {data.report && (
            <div
              ref={reportRef}
              id="diagnosis-report"
              className={`rounded-2xl overflow-hidden ${darkMode
                ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
                : 'bg-white shadow-sm'
              }`}
            >
              {/* 리포트 헤더 */}
              <div className={`px-6 py-5 border-b flex items-center justify-between gap-4 ${
                darkMode ? 'border-gray-700/50' : 'border-gray-100'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${darkMode ? 'bg-indigo-500/15' : 'bg-indigo-600'}`}>
                    <Lightbulb className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-white'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      동아줄 AI 전략 진단 리포트
                    </p>
                    <h3 className={`text-lg font-black leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      AI 전략 컨설팅 분석
                    </h3>
                    {data.created_at && (
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(data.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {' · '} DBR · HBR {articleCount}건 기반
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                    darkMode
                      ? 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {pdfLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Download className="w-4 h-4" />
                  }
                  {pdfLoading ? '생성 중...' : 'PDF 저장'}
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Executive Summary */}
                {data.report.summary ? (
                  <div className={`rounded-xl p-5 ${darkMode ? 'bg-[#0B2F61]/50 border border-blue-500/20' : 'bg-[#0B2F61]'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2.5 ${darkMode ? 'text-blue-300' : 'text-blue-200'}`}>
                      Executive Summary
                    </p>
                    <p className="text-sm leading-relaxed font-medium text-white">
                      {data.report.summary}
                    </p>
                    <div className={`mt-4 pt-3.5 border-t flex items-start gap-3 ${darkMode ? 'border-blue-500/25' : 'border-white/20'}`}>
                      <span className={`text-xs font-bold uppercase tracking-widest flex-shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-200'}`}>
                        최종 판정
                      </span>
                      <span className="text-sm font-bold leading-relaxed text-white">
                        {data.report.verdict}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'}`}>
                    <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      ⚠️ AI 리포트를 생성할 수 없습니다. GPT API 사용량 한도를 초과했습니다. 유사 사례와 리스크 점수를 참고해주세요.
                    </p>
                  </div>
                )}

                {/* 01 전략 구조 분석 */}
                {(data.report as any).strategy_analysis && (
                  <>
                    <div className={`h-px ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
                    <div>
                      <div className="flex items-center gap-3 mb-3.5">
                        <span className={`text-3xl font-black leading-none select-none ${darkMode ? 'text-gray-700' : 'text-gray-200'}`}>01</span>
                        <h4 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>전략 구조 분석</h4>
                      </div>
                      <div className={`border-l-4 pl-4 py-2 pr-4 rounded-r-xl ${
                        darkMode ? 'border-blue-500/50 bg-blue-500/5' : 'border-blue-500 bg-blue-50'
                      }`}>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {(data.report as any).strategy_analysis}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* 시장 동향 분석 (market_context) */}
                {(data.report as any).market_context && (
                  <>
                    <div className={`h-px ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
                    <div>
                      <div className="flex items-center gap-3 mb-3.5">
                        <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-teal-500/15' : 'bg-teal-50'}`}>
                          <TrendingUp className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                        </div>
                        <h4 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>시장 동향 분석</h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-teal-500/15 text-teal-400' : 'bg-teal-50 text-teal-600'
                        }`}>실시간 데이터</span>
                      </div>
                      <div className={`border-l-4 pl-4 py-2 pr-4 rounded-r-xl ${
                        darkMode ? 'border-teal-500/50 bg-teal-500/5' : 'border-teal-500 bg-teal-50'
                      }`}>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {(data.report as any).market_context}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* 02 주요 리스크 요인 */}
                {data.report.risk_factors.length > 0 && (
                  <>
                    <div className={`h-px ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`text-3xl font-black leading-none select-none ${darkMode ? 'text-gray-700' : 'text-gray-200'}`}>02</span>
                        <h4 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>주요 리스크 요인</h4>
                      </div>
                      <ul className="space-y-4">
                        {data.report.risk_factors.map((factor, i) => {
                          const isHigh = i === 0;
                          const badgeClass = isHigh
                            ? darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                            : darkMode ? 'bg-orange-500/15 text-orange-300' : 'bg-orange-100 text-orange-700';
                          return (
                            <li key={i} className="flex gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <span className={`px-2 py-0.5 text-xs font-black rounded-md ${badgeClass}`}>
                                  {isHigh ? 'HIGH' : 'MED'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-snug mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {factor}
                                </p>
                                {(data.report as any).risk_details?.[i] && (
                                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {(data.report as any).risk_details[i]}
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                )}

                {/* 03 전략 개선 제언 */}
                {data.report.improvement.length > 0 && (
                  <>
                    <div className={`h-px ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`text-3xl font-black leading-none select-none ${darkMode ? 'text-gray-700' : 'text-gray-200'}`}>03</span>
                        <h4 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>전략 개선 제언</h4>
                      </div>
                      <ul className="space-y-3">
                        {data.report.improvement.map((item, i) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 ${
                              darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-600 text-white'
                            }`}>
                              {i + 1}
                            </span>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {item}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* 전략 프레임워크 관점 */}
                {(data.report as any).framework_insight && (
                  <>
                    <div className={`h-px ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
                    <div className={`rounded-xl p-4 border ${darkMode ? 'bg-yellow-900/10 border-yellow-500/20' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Lightbulb className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-amber-600'}`} />
                        <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-yellow-400' : 'text-amber-700'}`}>
                          전략 프레임워크 관점
                        </p>
                      </div>
                      <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {(data.report as any).framework_insight}
                      </p>
                    </div>
                  </>
                )}

                {/* 리포트 푸터 */}
                <div className={`flex items-center justify-between pt-2 border-t text-xs ${darkMode ? 'border-gray-700/50 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                  <span>⚡ Powered by 동아줄 AI · DBR·HBR {articleCount}건 기반</span>
                  <span>참고용 자료 · 전문가 자문 병행 권고</span>
                </div>
              </div>
            </div>
          )}

          {/* 개선 제안 (기존 - report 없을 때 fallback) */}
          {data.improvement && !data.report && (
            <div className={`p-6 rounded-2xl ${darkMode
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

          {/* 사용자 피드백 */}
          <div className={`mt-10 p-6 rounded-2xl border ${darkMode ? 'bg-gray-800/40 border-gray-700/40' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className={`text-base font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              이 분석이 도움이 되었나요?
            </h3>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setRating('good')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  rating === 'good'
                    ? 'bg-green-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👍 도움됨
              </button>

              <button
                onClick={() => setRating('bad')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  rating === 'bad'
                    ? 'bg-red-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👎 별로
              </button>
            </div>

            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder="의견을 남겨주세요 (선택)"
              rows={3}
              className={`w-full border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                darkMode
                  ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-600'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />

            <button
              onClick={handleSubmitFeedback}
              disabled={submitting}
              className="mt-3 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {submitting ? '제출 중...' : '피드백 제출'}
            </button>
          </div>

          {/* AI 참고용 면책 문구 */}
          <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border ${
            darkMode ? 'bg-gray-800/30 border-gray-700/40' : 'bg-gray-50 border-gray-200'
          }`}>
            <span className={`text-xs mt-0.5 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>⚠️</span>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              본 진단 결과는 DBR·HBR {articleCount}건 사례를 기반으로 AI가 생성한 <strong className={darkMode ? 'text-gray-400' : 'text-gray-500'}>참고용 자료</strong>입니다.
              실제 경영 의사결정 시 반드시 전문가 자문을 병행하시기 바라며, 본 서비스는 투자·법률·경영 결과에 대한 책임을 지지 않습니다.
            </p>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-center gap-3 pt-2 flex-wrap">
            {onSemanticMap && (
              <button
                onClick={() => onSemanticMap(
                  data?.query_umap_x != null
                    ? { umap_x: data.query_umap_x!, umap_y: data.query_umap_y!, cluster_name: data.cluster_name, cluster_id: data.query_cluster_id }
                    : undefined,
                  data?.similar_articles ?? []
                )}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all border ${darkMode
                  ? 'border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10'
                  : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                  }`}
              >
                <ChevronRight className="w-4 h-4" />
                시맨틱 맵에서 보기
              </button>
            )}
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

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-xl shadow-2xl z-[60] flex items-center gap-2 text-xs font-bold">
          <Check className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
