import { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Shield,
  ExternalLink,
  Search,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { apiFetch } from '../utils/api';

interface Article {
  article_id: number;
  title: string;
  url?: string;
  summary?: string;
  category?: string;
  source?: string;
  published_at?: string;
  label?: string;
}

interface Cluster {
  cluster_id: number;
  cluster_name: string;
  article_count: number;
  top_keywords: string;
}

interface StatsData {
  total_articles: number;
  success_count: number;
  failure_count: number;
  cluster_count: number;
  yearly_trend: Array<{ year: string; success: number; failure: number }>;
  category_dist: Array<{ category: string; success: number; failure: number; total: number }>;
}

interface InsightDashboardProps {
  darkMode?: boolean;
  onArticleClick?: (id: number) => void;
  onShowSemanticMap?: (article: Article & { umap_x?: number; umap_y?: number }) => void;
  onCompareSelected?: (articles: Array<Article>) => void;
}

export function InsightDashboard({ darkMode = false, onArticleClick, onShowSemanticMap, onCompareSelected }: InsightDashboardProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCompareIds, setSelectedCompareIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [statsData, setStatsData] = useState<StatsData>({
    total_articles: 0,
    success_count: 0,
    failure_count: 0,
    cluster_count: 0,
    yearly_trend: [],
    category_dist: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch('/api/articles/stats');

        if (!res.ok) return;

        const data = await res.json();

        setStatsData({
          total_articles: Number(data.total_articles) || 0,
          success_count: Number(data.success_count) || 0,
          failure_count: Number(data.failure_count) || 0,
          cluster_count: Number(data.cluster_count) || 0,
          yearly_trend: data.yearly_trend || [],
          category_dist: data.category_dist || [],
        });
      } catch (e) {
        console.error('통계 로드 실패:', e);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const clusterRes = await apiFetch('/api/clusters');

        if (clusterRes.ok) {
          const clData = await clusterRes.json();
          setClusters(Array.isArray(clData) ? clData : []);
        }
      } catch (e) {
        console.error('클러스터 로드 실패:', e);
      }
    };

    fetchClusters();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          limit: '20',
        });

        if (filter !== 'all') {
          params.append('label', filter);
        }

        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }

        const artRes = await apiFetch(`/api/articles?${params}`);

        if (artRes.ok) {
          const artData = await artRes.json();
          setArticles(Array.isArray(artData) ? artData : artData.articles || artData.data || []);
        }
      } catch (e) {
        console.error('아티클 로드 실패:', e);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchArticles, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filter]);

  const filtered = articles;

  const toggleCompareSelection = (id: number) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleCompareSubmit = () => {
    if (!onCompareSelected || selectedCompareIds.length !== 2) return;
    const selectedArticles = articles.filter((article) => selectedCompareIds.includes(article.article_id));
    onCompareSelected(selectedArticles);
  };

  const handleShowSemanticMap = (article: Article) => {
    if (!onShowSemanticMap) return;
    onShowSemanticMap(article);
  };

  // 브랜드 컬러를 KPI 지표에 반영 (Navy & Gold 포인트 추가)
  const stats = [
    {
      label: 'DBR·HBR 아티클',
      value: statsData.total_articles.toLocaleString(),
      icon: BarChart2,
      color: 'blue',
    },
    {
      label: '성공 사례',
      value: statsData.success_count.toLocaleString(),
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: '실패 사례',
      value: statsData.failure_count.toLocaleString(),
      icon: AlertTriangle,
      color: 'red',
    },
    {
      label: '전략 클러스터',
      value: statsData.cluster_count.toLocaleString(),
      icon: Shield,
      color: 'indigo',
    },
  ];

  const colorMap: Record<string, string> = {
    gold:   darkMode ? 'bg-[#E1B764]/20 text-[#E1B764]'   : 'bg-[#FCF8F2] text-[#D4A853]',
    navy:   darkMode ? 'bg-[#162238] text-[#E1B764]'       : 'bg-[#162238]/10 text-[#162238]',
    blue:   darkMode ? 'bg-blue-500/10 text-blue-400'      : 'bg-blue-500/10 text-blue-600',
    green:  darkMode ? 'bg-green-500/10 text-green-400'    : 'bg-green-500/10 text-green-600',
    red:    darkMode ? 'bg-red-500/10 text-red-400'        : 'bg-red-500/10 text-red-600',
    indigo: darkMode ? 'bg-indigo-500/10 text-indigo-400'  : 'bg-indigo-500/10 text-indigo-600',
  };

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#F8FAFC]'} pb-20`}>
      <div
        className={`sticky top-0 z-40 border-b px-6 py-4 ${
          darkMode
            ? 'bg-[#0A0E1A]/90 backdrop-blur-xl border-gray-800/50'
            : 'bg-white/90 backdrop-blur-xl border-gray-200/50'
        }`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              경영 인사이트
            </h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
              DBR·HBR 성공·실패 사례 데이터베이스
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className={`p-2 rounded-xl ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            } transition-all`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className={`${
                darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-100'
              } border rounded-2xl p-4 shadow-sm`}
            >
              <div className={`w-9 h-9 ${colorMap[color]} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>
                {value}
              </div>

              <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ─── 데이터 차트 섹션 ─── */}
        {(statsData.yearly_trend.length > 0 || statsData.category_dist.length > 0) && (
          <div className="grid grid-cols-2 gap-4">

            {/* 성공·실패 비율 파이차트 */}
            <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-100'} border rounded-2xl p-5 shadow-sm`}>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>성공·실패 비율</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: '성공', value: statsData.success_count },
                      { name: '실패', value: statsData.failure_count },
                      { name: '기타', value: Math.max(0, statsData.total_articles - statsData.success_count - statsData.failure_count) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                    <Cell fill={darkMode ? '#374151' : '#e5e7eb'} />
                  </Pie>
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 카테고리별 바차트 */}
            <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-100'} border rounded-2xl p-5 shadow-sm`}>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>카테고리별 사례 분포</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statsData.category_dist} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <YAxis type="category" dataKey="category" width={80} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="success" name="성공" fill="#10b981" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="failure" name="실패" fill="#ef4444" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 연도별 트렌드 라인차트 */}
            <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-100'} border rounded-2xl p-5 shadow-sm`}>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>연도별 사례 트렌드</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={statsData.yearly_trend} margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f0f0f0'} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="success" name="성공" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="failure" name="실패" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top3 성공·실패 카테고리 */}
            <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-100'} border rounded-2xl p-5 shadow-sm`}>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>성공·실패 Top 5 카테고리</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={statsData.category_dist.slice(0, 5).map(c => ({ category: c.category, 성공: c.success, 실패: c.failure }))}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <YAxis type="category" dataKey="category" width={80} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="성공" fill="#10b981" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="실패" fill="#ef4444" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {clusters.length > 0 && (
          <div
            className={`${
              darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-100'
            } border rounded-2xl p-5 shadow-sm`}
          >
            <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              전략 클러스터 분포
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {clusters.map((c) => (
                <div
                  key={c.cluster_id}
                  className={`${
                    darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'
                  } border rounded-xl p-3`}
                >
                  <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                    {c.cluster_name}
                  </div>

                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {Number(c.article_count).toLocaleString()}건
                  </div>

                  {c.top_keywords && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.top_keywords
                        .split(',')
                        .slice(0, 3)
                        .map((kw: string) => (
                          <span
                            key={kw}
                            className={`px-1.5 py-0.5 text-[10px] rounded ${
                              darkMode
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            {kw.trim()}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div
            className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
              darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <Search className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아티클 검색..."
              className={`flex-1 text-sm bg-transparent focus:outline-none ${
                darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            {selectedCompareIds.length > 0 && (
              <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {selectedCompareIds.length}개 선택됨
              </span>
            )}
            {selectedCompareIds.length === 2 && (
              <button
                onClick={handleCompareSubmit}
                className="px-4 py-2.5 bg-gradient-to-r from-[#142755] to-[#444655] text-white text-xs font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                비교 분석 보기
              </button>
            )}
          </div>
          
          {(['all', 'success', 'failure'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === f
                  ? f === 'success'
                    ? 'bg-green-500 text-white'
                    : f === 'failure'
                      ? 'bg-red-500 text-white'
                      : 'bg-[#142755] text-white'
                  : darkMode
                    ? 'bg-gray-800 text-gray-400 border border-gray-700'
                    : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f === 'all' ? '전체' : f === 'success' ? '성공' : '실패'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#E1B764] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-16 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
            아티클이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((article) => (
              <button
                key={article.article_id}
                type="button"
                onClick={() => {
                  if (onArticleClick) {
                    onArticleClick(article.article_id);
                  } else if (article.url) {
                    window.open(article.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className={`group w-full text-left ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700/40 hover:bg-gray-800/80'
                    : 'bg-white border-gray-100 hover:shadow-md'
                } border rounded-2xl p-5 transition-all block`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg ${
                          article.label === 'success'
                            ? darkMode
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-green-50 text-green-700'
                            : article.label === 'failure'
                              ? darkMode
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-red-50 text-red-700'
                              : darkMode
                                ? 'bg-gray-700 text-gray-400'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {article.label === 'success' ? '✅ 성공' : article.label === 'failure' ? '⚠️ 실패' : '중립'}
                      </span>

                      {article.source && (
                        <span
                          className={`px-2 py-0.5 text-xs rounded-lg ${
                            darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                          }`}
                        >
                          {article.source}
                        </span>
                      )}

                      {article.category && (
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {article.category}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-bold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      } mb-2 leading-relaxed group-hover:text-[#142755] transition-colors line-clamp-2`}
                    >
                      {article.title}
                    </h4>

                    {article.summary && (
                      <p
                        className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        } line-clamp-2 leading-relaxed`}
                      >
                        {article.summary}
                      </p>
                    )}

                    {article.published_at && (
                      <div
                        className={`flex items-center gap-1 mt-2 text-xs ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {new Date(article.published_at).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>

                  <ExternalLink
                    className={`w-4 h-4 flex-shrink-0 ${
                      darkMode ? 'text-gray-600' : 'text-gray-300'
                    } group-hover:text-[#142755] transition-colors`}
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowSemanticMap(article);
                      }}
                      className="px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
                    >
                      시맨틱 맵 보기
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareSelection(article.article_id);
                      }}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                        selectedCompareIds.includes(article.article_id)
                          ? 'bg-[#142755] text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-[#142755] hover:bg-gray-200'
                      }`}
                    >
                      {selectedCompareIds.includes(article.article_id) ? '선택됨' : '비교 선택'}
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
