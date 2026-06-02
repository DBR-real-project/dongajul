import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, AlertTriangle, Shield, ExternalLink, Search, Clock, RefreshCw } from 'lucide-react';

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

interface InsightDashboardProps {
  darkMode?: boolean;
  onArticleClick?: (id: number) => void;
}

export function InsightDashboard({ darkMode = false, onArticleClick }: InsightDashboardProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const artRes = await fetch('http://localhost:3001/api/articles?limit=20');
        if (artRes.ok) {
          const artData = await artRes.json();
          setArticles(Array.isArray(artData) ? artData : artData.articles || []);
        }
      } catch (e) {
        console.error('아티클 로드 실패:', e);
      }
      try {
        const clusterRes = await fetch('http://localhost:3001/api/clusters');
        if (clusterRes.ok) {
          const clData = await clusterRes.json();
          setClusters(Array.isArray(clData) ? clData.slice(0, 6) : []);
        }
      } catch (e) {
        console.error('클러스터 로드 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = articles.filter(a => {
    const matchLabel = filter === 'all' || a.label === filter;
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLabel && matchSearch;
  });

  const stats = [
    { label: 'DBR·HBR 아티클', value: '13,335', icon: BarChart2, color: 'blue' },
    { label: '성공 사례', value: '11,858', icon: TrendingUp, color: 'green' },
    { label: '실패 사례', value: '1,279', icon: AlertTriangle, color: 'red' },
    { label: '전략 클러스터', value: '12', icon: Shield, color: 'indigo' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
  };

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#F8FAFC]'} pb-20`}>
      {/* 헤더 */}
      <div className={`sticky top-0 z-40 border-b px-6 py-4 ${darkMode ? 'bg-[#0A0E1A]/90 backdrop-blur-xl border-gray-800/50' : 'bg-white/90 backdrop-blur-xl border-gray-200/50'}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>경영 인사이트</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>DBR·HBR 성공·실패 사례 데이터베이스</p>
          </div>
          <button onClick={() => window.location.reload()} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-all`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`${darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-100'} border rounded-2xl p-4 shadow-sm`}>
              <div className={`w-9 h-9 ${colorMap[color]} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>{value}</div>
              <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
            </div>
          ))}
        </div>

        {/* 클러스터 */}
        {clusters.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-100'} border rounded-2xl p-5 shadow-sm`}>
            <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>전략 클러스터 분포</h3>
            <div className="grid grid-cols-3 gap-3">
              {clusters.map((c) => (
                <div key={c.cluster_id} className={`${darkMode ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3`}>
                  <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>{c.cluster_name}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{Number(c.article_count).toLocaleString()}건</div>
                  {c.top_keywords && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.top_keywords.split(',').slice(0, 3).map((kw: string) => (
                        <span key={kw} className={`px-1.5 py-0.5 text-[10px] rounded ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
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

        {/* 검색 + 필터 */}
        <div className="flex items-center gap-3">
          <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Search className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아티클 검색..."
              className={`flex-1 text-sm bg-transparent focus:outline-none ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          {(['all', 'success', 'failure'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${filter === f
                ? f === 'success' ? 'bg-green-500 text-white' : f === 'failure' ? 'bg-red-500 text-white' : 'bg-[#142755] text-white'
                : darkMode ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f === 'all' ? '전체' : f === 'success' ? '성공' : '실패'}
            </button>
          ))}
        </div>

        {/* 아티클 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#142755] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-16 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
            아티클이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((article) => (
              <a
                key={article.article_id}
                href={article.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`group ${darkMode ? 'bg-gray-800/50 border-gray-700/40 hover:bg-gray-800/80' : 'bg-white border-gray-100 hover:shadow-md'} border rounded-2xl p-5 transition-all block`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg ${
                        article.label === 'success'
                          ? darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'
                          : article.label === 'failure'
                          ? darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                          : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {article.label === 'success' ? '✅ 성공' : article.label === 'failure' ? '⚠️ 실패' : '중립'}
                      </span>
                      {article.source && (
                        <span className={`px-2 py-0.5 text-xs rounded-lg ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                          {article.source}
                        </span>
                      )}
                      {article.category && (
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{article.category}</span>
                      )}
                    </div>
                    <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 leading-relaxed group-hover:text-[#142755] transition-colors line-clamp-2`}>
                      {article.title}
                    </h4>
                    {article.summary && (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-2 leading-relaxed`}>
                        {article.summary}
                      </p>
                    )}
                    {article.published_at && (
                      <div className={`flex items-center gap-1 mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Clock className="w-3 h-3" />
                        {new Date(article.published_at).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>
                  <ExternalLink className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-600' : 'text-gray-300'} group-hover:text-[#142755] transition-colors`} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
