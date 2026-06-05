import { useState, useEffect, useCallback } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { ArrowLeft, Map, RefreshCw, Info } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface MapPoint {
  article_id: number;
  umap_x: number;
  umap_y: number;
  cluster_id: number;
  label: 'success' | 'failure' | 'neutral';
  title: string;
  category: string;
  source: string;
}

interface ClusterInfo {
  cluster_id: number;
  cluster_name: string;
  center_x: number;
  center_y: number;
  article_count: number;
}

interface QueryPoint {
  umap_x: number;
  umap_y: number;
  cluster_name?: string;
}

interface SemanticMapProps {
  darkMode?: boolean;
  onBack?: () => void;
  queryPoint?: QueryPoint | null;
}

type FilterType = 'all' | 'success' | 'failure';

const LABEL_KO: Record<string, string> = {
  success: '성공', failure: '실패', neutral: '중립',
};

function CustomTooltip({ active, payload, darkMode }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d || d._isQuery) return null;
  return (
    <div className={`px-3 py-2.5 rounded-xl shadow-xl text-xs max-w-[220px] border ${
      darkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'
    }`}>
      <div className="flex items-center gap-1.5 mb-1.5 font-semibold">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{
          background: d.label === 'success' ? '#10b981' : d.label === 'failure' ? '#ef4444' : '#94a3b8'
        }} />
        <span className={
          d.label === 'success' ? 'text-green-500' : d.label === 'failure' ? 'text-red-500' : 'text-slate-400'
        }>{LABEL_KO[d.label] ?? d.label}</span>
      </div>
      <p className="leading-relaxed line-clamp-3">{d.title}</p>
      {d.category && (
        <p className={`mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          #{d.category} · {d.source}
        </p>
      )}
    </div>
  );
}

function QueryTooltip({ active, payload, darkMode }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d?._isQuery) return null;
  return (
    <div className={`px-3 py-2 rounded-xl shadow-xl text-xs border ${
      darkMode ? 'bg-gray-900 border-yellow-500/40 text-yellow-300' : 'bg-yellow-50 border-yellow-300 text-yellow-800'
    }`}>
      <p className="font-bold">⭐ 내 전략 위치</p>
      {d.cluster_name && <p className="mt-0.5 opacity-80">클러스터: {d.cluster_name}</p>}
    </div>
  );
}

function CombinedTooltip(props: any) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return d._isQuery ? <QueryTooltip {...props} /> : <CustomTooltip {...props} />;
}

export function SemanticMap({ darkMode = false, onBack, queryPoint }: SemanticMapProps) {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/semantic-map');
      const json = await res.json();
      setPoints(json.points ?? []);
      setClusters(json.clusters ?? []);
    } catch (e) {
      console.error('시맨틱 맵 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = filter === 'all' ? points : points.filter(p => p.label === filter);
  const successPts = filtered.filter(p => p.label === 'success');
  const failurePts = filtered.filter(p => p.label === 'failure');
  const neutralPts = filtered.filter(p => p.label === 'neutral');
  const queryData = queryPoint
    ? [{ umap_x: queryPoint.umap_x, umap_y: queryPoint.umap_y, cluster_name: queryPoint.cluster_name, _isQuery: true }]
    : [];

  const cardBg = darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#F8FAFC]'} pb-10`}>
      {/* 헤더 */}
      <div className={`sticky top-0 z-40 border-b px-6 py-4 ${
        darkMode ? 'bg-[#0A0E1A]/90 backdrop-blur-xl border-gray-800/50' : 'bg-white/90 backdrop-blur-xl border-gray-200/50'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className={`p-2 rounded-xl transition-all ${
                darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}>
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                <Map className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>전략 시맨틱 맵</h1>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  13,335건 사례의 UMAP 2D 투영 · 성공/실패 분포
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {(['all', 'success', 'failure'] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === f
                    ? f === 'success' ? 'bg-green-500 text-white'
                      : f === 'failure' ? 'bg-red-500 text-white'
                      : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'
                    : darkMode ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-500 hover:bg-gray-50'
                }`}>
                  {f === 'all' ? '전체' : f === 'success' ? '성공' : '실패'}
                </button>
              ))}
            </div>
            <button onClick={fetchData} className={`p-2 rounded-xl transition-all ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '성공 사례', count: points.filter(p => p.label === 'success').length, color: 'text-green-500' },
            { label: '실패 사례', count: points.filter(p => p.label === 'failure').length, color: 'text-red-500' },
            { label: '중립 사례', count: points.filter(p => p.label === 'neutral').length, color: 'text-slate-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`p-4 rounded-2xl border ${cardBg}`}>
              <div className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1`}>{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{count.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* 차트 */}
        <div className={`rounded-2xl border p-5 ${cardBg}`}>
          {queryPoint && (
            <div className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-sm font-semibold ${
              darkMode ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              <span>⭐</span>
              <span>내 전략이 지도에 표시됩니다{queryPoint.cluster_name ? ` — 클러스터: ${queryPoint.cluster_name}` : ''}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-[480px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#142755] border-t-transparent rounded-full animate-spin" />
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>데이터 로드 중…</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <XAxis type="number" dataKey="umap_x" name="X"
                  tick={{ fontSize: 10, fill: darkMode ? '#6b7280' : '#9ca3af' }}
                  tickLine={false} axisLine={false} />
                <YAxis type="number" dataKey="umap_y" name="Y"
                  tick={{ fontSize: 10, fill: darkMode ? '#6b7280' : '#9ca3af' }}
                  tickLine={false} axisLine={false} />
                <ZAxis range={[18, 18]} />

                {(filter === 'all' || filter === 'success') && (
                  <Scatter name="성공" data={successPts}>
                    {successPts.map((_, i) => <Cell key={i} fill="#10b981" fillOpacity={0.65} />)}
                  </Scatter>
                )}
                {(filter === 'all' || filter === 'failure') && (
                  <Scatter name="실패" data={failurePts}>
                    {failurePts.map((_, i) => <Cell key={i} fill="#ef4444" fillOpacity={0.7} />)}
                  </Scatter>
                )}
                {filter === 'all' && (
                  <Scatter name="중립" data={neutralPts}>
                    {neutralPts.map((_, i) => <Cell key={i} fill="#94a3b8" fillOpacity={0.35} />)}
                  </Scatter>
                )}
                {queryData.length > 0 && (
                  <Scatter name="내 전략" data={queryData}
                    shape={(props: any) => {
                      const { cx, cy } = props;
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r={14} fill="#f59e0b" fillOpacity={0.25} />
                          <circle cx={cx} cy={cy} r={8} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
                          <text x={cx} y={cy - 16} textAnchor="middle" fontSize={11} fill="#f59e0b" fontWeight="bold">⭐</text>
                        </g>
                      );
                    }}>
                    <Cell fill="#f59e0b" />
                  </Scatter>
                )}
                <Tooltip content={<CombinedTooltip darkMode={darkMode} />}
                  cursor={{ strokeDasharray: '3 3', stroke: darkMode ? '#374151' : '#e5e7eb' }} />
                <Legend formatter={(value) => (
                  <span style={{ fontSize: 12, color: darkMode ? '#d1d5db' : '#4b5563' }}>{value}</span>
                )} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 클러스터 목록 */}
        {clusters.length > 0 && (
          <div className={`rounded-2xl border p-5 ${cardBg}`}>
            <div className="flex items-center gap-2 mb-4">
              <Info className={`w-4 h-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                클러스터 분류 ({clusters.length}개)
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {clusters.map(c => (
                <div key={c.cluster_id} className={`px-3 py-2 rounded-xl text-xs ${
                  darkMode ? 'bg-gray-900/40 border border-gray-700/40 text-gray-300' : 'bg-gray-50 border border-gray-100 text-gray-700'
                }`}>
                  <span className={`font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>#{c.cluster_id}</span>
                  <span className="ml-1.5">{c.cluster_name}</span>
                  <span className={`ml-1.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    ({c.article_count?.toLocaleString() ?? '-'})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
