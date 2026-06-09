import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  ArrowLeft,
  Map,
  RefreshCw,
  Info,
  Search,
  Maximize2,
  Target,
  Flame,
  Layers3,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Radar,
  Sparkles,
  BarChart3,
  X,
} from 'lucide-react';
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
  summary?: string;
  url?: string;
}

interface ClusterInfo {
  cluster_id: number;
  cluster_name: string;
  center_x: number;
  center_y: number;
  article_count: number;
  top_keywords?: string;
  success_count?: number;
  failure_count?: number;
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

type FilterType = 'all' | 'success' | 'failure' | 'risk';

const LABEL_KO: Record<string, string> = {
  success: '성공',
  failure: '실패',
  neutral: '중립',
};

const escapeHtml = (value: unknown) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const getClusterLabel = (cluster: ClusterInfo) => {
  if (cluster.top_keywords) {
    const keywords = cluster.top_keywords
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(' · ');

    if (keywords) return keywords;
  }

  return cluster.cluster_name || `cluster_${cluster.cluster_id}`;
};

const getFailureRate = (cluster: ClusterInfo) => {
  if (!cluster.article_count) return 0;
  return Math.round(((cluster.failure_count ?? 0) / cluster.article_count) * 100);
};

const getRiskLevel = (failureRate: number) => {
  if (failureRate >= 25) return '위험';
  if (failureRate >= 12) return '주의';
  return '안정';
};

const getRiskClassName = (failureRate: number) => {
  if (failureRate >= 25) return 'text-red-500 bg-red-500/10 border-red-500/20';
  if (failureRate >= 12) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
};

export function SemanticMap({ darkMode = false, onBack, queryPoint }: SemanticMapProps) {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await apiFetch('/api/semantic-map');

      if (!res.ok) {
        throw new Error(`시맨틱 맵 API 오류: ${res.status}`);
      }

      const json = await res.json();
      const rawPoints = json.points ?? json.data ?? [];

      const normalizedPoints: MapPoint[] = rawPoints
        .map((p: any, index: number) => ({
          article_id: Number(p.article_id ?? p.id ?? index),
          umap_x: Number(p.umap_x ?? p.x),
          umap_y: Number(p.umap_y ?? p.y),
          cluster_id: Number(p.cluster_id ?? p.cluster ?? 0),
          label: (
            p.label === 'success' || p.label === 'failure' || p.label === 'neutral'
              ? p.label
              : 'neutral'
          ) as MapPoint['label'],
          title: String(p.title ?? ''),
          category: String(p.category ?? ''),
          source: String(p.source ?? ''),
          summary: String(p.summary ?? ''),
          url: String(p.url ?? ''),
        }))
        .filter((p: MapPoint) => Number.isFinite(p.umap_x) && Number.isFinite(p.umap_y));

      const normalizedClusters: ClusterInfo[] = (json.clusters ?? [])
        .map((c: any) => ({
          cluster_id: Number(c.cluster_id ?? 0),
          cluster_name: String(c.cluster_name ?? `cluster_${c.cluster_id ?? 0}`),
          center_x: Number(c.center_x ?? 0),
          center_y: Number(c.center_y ?? 0),
          article_count: Number(c.article_count ?? 0),
          top_keywords: String(c.top_keywords ?? ''),
          success_count: Number(c.success_count ?? 0),
          failure_count: Number(c.failure_count ?? 0),
        }))
        .filter((c: ClusterInfo) => Number.isFinite(c.center_x) && Number.isFinite(c.center_y));

      setPoints(normalizedPoints);
      setClusters(normalizedClusters);
    } catch (e) {
      console.error('시맨틱 맵 로드 실패:', e);
      setPoints([]);
      setClusters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalSuccessCount = useMemo(() => {
    return points.filter(p => p.label === 'success').length;
  }, [points]);

  const totalFailureCount = useMemo(() => {
    return points.filter(p => p.label === 'failure').length;
  }, [points]);

  const totalNeutralCount = useMemo(() => {
    return points.filter(p => p.label === 'neutral').length;
  }, [points]);

  const successRate = useMemo(() => {
    if (!points.length) return 0;
    return Math.round((totalSuccessCount / points.length) * 100);
  }, [points.length, totalSuccessCount]);

  const failureRate = useMemo(() => {
    if (!points.length) return 0;
    return Math.round((totalFailureCount / points.length) * 100);
  }, [points.length, totalFailureCount]);

  const topRiskClusters = useMemo(() => {
    return [...clusters]
      .sort((a, b) => {
        const aRate = getFailureRate(a);
        const bRate = getFailureRate(b);

        if (bRate !== aRate) return bRate - aRate;
        return (b.failure_count ?? 0) - (a.failure_count ?? 0);
      })
      .slice(0, 3);
  }, [clusters]);

  const topRiskCluster = topRiskClusters[0] ?? null;

  const selectedCluster = useMemo(() => {
    if (selectedClusterId === null) return null;
    return clusters.find(c => c.cluster_id === selectedClusterId) ?? null;
  }, [clusters, selectedClusterId]);

  const searchedPoints = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return points;

    return points.filter(p => {
      return (
        p.title.toLowerCase().includes(keyword) ||
        p.category.toLowerCase().includes(keyword) ||
        p.source.toLowerCase().includes(keyword) ||
        String(p.cluster_id).includes(keyword)
      );
    });
  }, [points, searchText]);

  const clusterFilteredPoints = useMemo(() => {
    if (selectedClusterId === null) return searchedPoints;
    return searchedPoints.filter(p => p.cluster_id === selectedClusterId);
  }, [searchedPoints, selectedClusterId]);

  const filtered = useMemo(() => {
    if (filter === 'success') {
      return clusterFilteredPoints.filter(p => p.label === 'success');
    }

    if (filter === 'failure' || filter === 'risk') {
      return clusterFilteredPoints.filter(p => p.label === 'failure');
    }

    return clusterFilteredPoints;
  }, [filter, clusterFilteredPoints]);

  const successPts = useMemo(() => {
    return filtered.filter(p => p.label === 'success');
  }, [filtered]);

  const failurePts = useMemo(() => {
    return filtered.filter(p => p.label === 'failure');
  }, [filtered]);

  const neutralPts = useMemo(() => {
    return filtered.filter(p => p.label === 'neutral');
  }, [filtered]);

  const successData = useMemo(() => {
    return successPts.map(p => ({
      value: [p.umap_x, p.umap_y],
      ...p,
    }));
  }, [successPts]);

  const failureData = useMemo(() => {
    return failurePts.map(p => ({
      value: [p.umap_x, p.umap_y],
      ...p,
    }));
  }, [failurePts]);

  const neutralData = useMemo(() => {
    return neutralPts.map(p => ({
      value: [p.umap_x, p.umap_y],
      ...p,
    }));
  }, [neutralPts]);

  const clusterBubbleData = useMemo(() => {
    return clusters
      .filter(c => selectedClusterId === null || selectedClusterId === c.cluster_id)
      .map(c => {
        const clusterFailureRate = getFailureRate(c);

        return {
          value: [c.center_x, c.center_y, c.article_count, clusterFailureRate],
          cluster_id: c.cluster_id,
          cluster_name: c.cluster_name,
          top_keywords: c.top_keywords,
          article_count: c.article_count,
          success_count: c.success_count ?? 0,
          failure_count: c.failure_count ?? 0,
          failure_rate: clusterFailureRate,
          risk_level: getRiskLevel(clusterFailureRate),
          label_text: getClusterLabel(c),
        };
      });
  }, [clusters, selectedClusterId]);

  const queryData = useMemo(() => {
    if (!queryPoint) return [];

    return [{
      value: [queryPoint.umap_x, queryPoint.umap_y],
      cluster_name: queryPoint.cluster_name,
      _isQuery: true,
    }];
  }, [queryPoint]);

  const option = useMemo(() => {
    const tooltipBg = darkMode ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)';
    const tooltipText = darkMode ? '#e5e7eb' : '#111827';
    const borderColor = darkMode ? 'rgba(71, 85, 105, 0.9)' : 'rgba(226, 232, 240, 0.95)';

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 700,
      animationEasing: 'cubicOut',
      grid: {
        top: 30,
        right: 28,
        bottom: 42,
        left: 28,
        containLabel: false,
      },
      toolbox: {
        right: 14,
        top: 10,
        itemSize: 15,
        feature: {
          restore: { title: '초기화' },
          saveAsImage: { title: '이미지 저장', pixelRatio: 2 },
        },
        iconStyle: {
          borderColor: darkMode ? '#94a3b8' : '#64748b',
        },
        emphasis: {
          iconStyle: {
            borderColor: darkMode ? '#c7d2fe' : '#4f46e5',
          },
        },
      },
      legend: {
        bottom: 4,
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: {
          color: darkMode ? '#d1d5db' : '#475569',
          fontSize: 12,
          fontWeight: 700,
        },
      },
      tooltip: {
        trigger: 'item',
        confine: true,
        appendToBody: true,
        backgroundColor: tooltipBg,
        borderColor,
        borderWidth: 1,
        textStyle: {
          color: tooltipText,
          fontSize: 12,
        },
        extraCssText: 'box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28); border-radius: 18px; backdrop-filter: blur(12px);',
        formatter: (params: any) => {
          const d = params.data;

          if (!d) return '';

          if (d._isQuery) {
            return `
              <div style="min-width:180px;">
                <div style="font-weight:900;color:#f59e0b;margin-bottom:6px;font-size:13px;">⭐ 내 전략 위치</div>
                <div style="opacity:.8;">${escapeHtml(d.cluster_name ?? '클러스터 정보 없음')}</div>
              </div>
            `;
          }

          if (params.seriesName === '전략 영역') {
            const rate = Number(d.failure_rate ?? 0);
            const riskColor = rate >= 25 ? '#ef4444' : rate >= 12 ? '#f59e0b' : '#10b981';

            return `
              <div style="width:280px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <span style="font-weight:900;font-size:14px;">#${escapeHtml(d.cluster_id)} ${escapeHtml(d.label_text)}</span>
                </div>
                <div style="line-height:1.5;opacity:.82;">
                  ${escapeHtml(d.top_keywords || '대표 키워드 없음')}
                </div>
                <div style="height:1px;background:${borderColor};margin:10px 0;"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <div>기사 <b>${Number(d.article_count ?? 0).toLocaleString()}</b>건</div>
                  <div>실패 <b style="color:#ef4444;">${Number(d.failure_count ?? 0).toLocaleString()}</b>건</div>
                  <div>성공 <b style="color:#10b981;">${Number(d.success_count ?? 0).toLocaleString()}</b>건</div>
                  <div>실패율 <b style="color:${riskColor};">${rate}%</b></div>
                </div>
                <div style="margin-top:10px;opacity:.58;font-size:11px;">클릭하면 이 영역만 집중 분석합니다</div>
              </div>
            `;
          }

          const labelColor = d.label === 'success'
            ? '#10b981'
            : d.label === 'failure'
              ? '#ef4444'
              : '#94a3b8';

          return `
            <div style="width:320px;">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;">
                <span style="width:10px;height:10px;border-radius:999px;background:${labelColor};display:inline-block;"></span>
                <span style="font-weight:900;color:${labelColor};font-size:13px;">${escapeHtml(LABEL_KO[d.label] ?? d.label)}</span>
                <span style="opacity:.45;">·</span>
                <span style="opacity:.75;">클러스터 ${escapeHtml(d.cluster_id)}</span>
              </div>
              <div style="font-weight:800;line-height:1.45;margin-bottom:8px;">
                ${escapeHtml(d.title)}
              </div>
              <div style="opacity:.75;line-height:1.4;">
                #${escapeHtml(d.category || '미분류')} · ${escapeHtml(d.source || '-')}
              </div>
              ${d.summary ? `
                <div style="opacity:.62;line-height:1.45;margin-top:8px;max-height:62px;overflow:hidden;">
                  ${escapeHtml(d.summary)}
                </div>
              ` : ''}
              ${d.url ? `
                <div style="opacity:.5;margin-top:9px;font-size:11px;">
                  클릭하면 원문을 엽니다
                </div>
              ` : ''}
            </div>
          `;
        },
      },
      xAxis: {
        type: 'value',
        show: false,
        scale: true,
        min: 'dataMin',
        max: 'dataMax',
      },
      yAxis: {
        type: 'value',
        show: false,
        scale: true,
        min: 'dataMin',
        max: 'dataMax',
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'none',
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
        },
        {
          type: 'inside',
          yAxisIndex: 0,
          filterMode: 'none',
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
        },
      ],
      series: [
        {
          name: '전략 영역',
          type: 'scatter',
          data: clusterBubbleData,
          symbolSize: (value: number[]) => {
            const count = Number(value?.[2] ?? 0);
            const size = Math.sqrt(count) * 3.15;
            return Math.max(58, Math.min(size, 138));
          },
          itemStyle: {
            color: (params: any) => {
              const rate = Number(params.data?.failure_rate ?? 0);

              if (rate >= 25) return 'rgba(239, 68, 68, 0.17)';
              if (rate >= 12) return 'rgba(245, 158, 11, 0.16)';
              return darkMode ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.13)';
            },
            borderColor: (params: any) => {
              const rate = Number(params.data?.failure_rate ?? 0);

              if (rate >= 25) return 'rgba(239, 68, 68, 0.9)';
              if (rate >= 12) return 'rgba(245, 158, 11, 0.85)';
              return darkMode ? 'rgba(129, 140, 248, 0.82)' : 'rgba(79, 70, 229, 0.66)';
            },
            borderWidth: 2,
            shadowBlur: 24,
            shadowColor: darkMode ? 'rgba(15, 23, 42, 0.48)' : 'rgba(79, 70, 229, 0.13)',
          },
          label: {
            show: true,
            formatter: (params: any) => {
              const d = params.data;
              return `#${d.cluster_id}\n${d.label_text}`;
            },
            color: darkMode ? '#e0e7ff' : '#312e81',
            fontSize: 11,
            fontWeight: 900,
            lineHeight: 16,
          },
          labelLayout: {
            hideOverlap: true,
          },
          emphasis: {
            scale: 1.1,
            label: {
              show: true,
              fontSize: 12,
            },
          },
          z: 1,
        },
        {
          name: '성공',
          type: 'scatter',
          data: successData,
          symbolSize: filter === 'success' ? 6.8 : 4.2,
          itemStyle: {
            color: '#10b981',
            opacity: filter === 'success' ? 0.92 : 0.28,
          },
          emphasis: {
            scale: 2.4,
            itemStyle: {
              opacity: 1,
              borderColor: '#065f46',
              borderWidth: 1,
            },
          },
          large: true,
          largeThreshold: 2000,
          progressive: 4000,
          progressiveThreshold: 4000,
          z: 3,
        },
        {
          name: '실패',
          type: 'effectScatter',
          data: failureData,
          symbolSize: filter === 'risk' || filter === 'failure' ? 11 : 8,
          rippleEffect: {
            scale: filter === 'risk' ? 3.1 : 1.9,
            brushType: 'stroke',
          },
          itemStyle: {
            color: '#ef4444',
            opacity: 0.95,
            shadowBlur: filter === 'risk' ? 18 : 11,
            shadowColor: 'rgba(239, 68, 68, 0.45)',
          },
          emphasis: {
            scale: 2.25,
            itemStyle: {
              opacity: 1,
              borderColor: '#7f1d1d',
              borderWidth: 1,
            },
          },
          z: 8,
        },
        {
          name: '중립',
          type: 'scatter',
          data: neutralData,
          symbolSize: 5.6,
          itemStyle: {
            color: '#64748b',
            opacity: 0.43,
          },
          emphasis: {
            scale: 2.1,
            itemStyle: {
              opacity: 1,
              borderColor: '#334155',
              borderWidth: 1,
            },
          },
          z: 5,
        },
        {
          name: '내 전략',
          type: 'effectScatter',
          data: queryData,
          symbolSize: 18,
          rippleEffect: {
            scale: 3.6,
            brushType: 'stroke',
          },
          itemStyle: {
            color: '#f59e0b',
            shadowBlur: 26,
            shadowColor: 'rgba(245, 158, 11, 0.55)',
          },
          label: {
            show: queryData.length > 0,
            formatter: '⭐ 내 전략',
            position: 'top',
            color: '#f59e0b',
            fontWeight: 900,
            fontSize: 12,
          },
          z: 20,
        },
      ],
    };
  }, [
    darkMode,
    filter,
    successData,
    failureData,
    neutralData,
    clusterBubbleData,
    queryData,
  ]);

  const handleChartClick = useCallback((params: any) => {
    const data = params?.data;

    if (!data) return;

    if (params.seriesName === '전략 영역' && typeof data.cluster_id === 'number') {
      setSelectedClusterId(prev => prev === data.cluster_id ? null : data.cluster_id);
      return;
    }

    if (data.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const onEvents = useMemo(() => {
    return {
      click: handleChartClick,
    };
  }, [handleChartClick]);

  const cardBg = darkMode ? 'bg-gray-900/55 border-gray-800/70' : 'bg-white border-gray-200 shadow-sm';
  const panelBg = darkMode ? 'bg-[#0f172a]/72 border-gray-800/70' : 'bg-white border-gray-200 shadow-sm';
  const chartBg = darkMode
    ? 'bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.14),transparent_32%),radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_42%),#020617]'
    : 'bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.09),transparent_32%),radial-gradient(circle_at_center,rgba(16,185,129,0.07),transparent_42%),#f8fafc]';

  const visibleCount = filtered.length;

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#020617]' : 'bg-[#F8FAFC]'} pb-10`}>
      <div className={`sticky top-0 z-40 border-b px-6 py-4 ${
        darkMode ? 'bg-[#020617]/90 backdrop-blur-xl border-gray-800/70' : 'bg-white/90 backdrop-blur-xl border-gray-200/70'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 rounded-xl transition-all ${
                  darkMode
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${
                darkMode
                  ? 'bg-indigo-500/10 text-indigo-300'
                  : 'bg-indigo-50 text-indigo-600'
              }`}>
                <Map className="w-5 h-5" />
              </div>

              <div>
                <h1 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                  전략 시맨틱 맵
                </h1>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {points.length.toLocaleString()}건 사례 기반 · UMAP 전략 지형도 · 실패 핫스팟 강조
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs ${
              darkMode ? 'border-gray-800 text-gray-400 bg-gray-900/40' : 'border-gray-200 text-gray-500 bg-white'
            }`}>
              <Maximize2 className="w-3.5 h-3.5" />
              휠 확대 · 드래그 이동 · 점 클릭 원문
            </div>

            <button
              onClick={fetchData}
              className={`p-2 rounded-xl transition-all ${
                darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <div className={`relative overflow-hidden rounded-[28px] border p-6 ${
          darkMode
            ? 'border-indigo-500/15 bg-[linear-gradient(135deg,rgba(79,70,229,0.18),rgba(15,23,42,0.82),rgba(239,68,68,0.10))]'
            : 'border-indigo-100 bg-[linear-gradient(135deg,#eef2ff,#ffffff,#fff1f2)] shadow-sm'
        }`}>
          <div className="absolute right-6 top-6 opacity-10">
            <Radar className="w-36 h-36" />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${
                darkMode ? 'border-indigo-400/20 bg-indigo-400/10 text-indigo-200' : 'border-indigo-200 bg-indigo-50 text-indigo-700'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                Strategy Intelligence Map
              </div>

              <h2 className={`mt-4 text-3xl md:text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                성공과 실패 사례를 한 장의 전략 지형도로 분석합니다
              </h2>

              <p className={`mt-3 max-w-2xl text-sm leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                각 점은 실제 기사 사례이고, 큰 버블은 전략 클러스터입니다. 실패율이 높은 영역은 붉은 테두리와 핫스팟으로 강조되어 리스크가 한눈에 드러납니다.
              </p>
            </div>

            <div className={`rounded-3xl border p-5 ${
              darkMode ? 'border-gray-800 bg-black/20' : 'border-white/80 bg-white/70 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    현재 데이터 신뢰도
                  </div>
                  <div className={`mt-1 text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                    {points.length ? 'ACTIVE' : 'WAITING'}
                  </div>
                </div>

                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>성공 비중</span>
                    <span className="text-emerald-500">{successRate}%</span>
                  </div>
                  <div className={`mt-1.5 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${successRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>실패 비중</span>
                    <span className="text-red-500">{failureRate}%</span>
                  </div>
                  <div className={`mt-1.5 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${failureRate}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                전체 사례
              </div>
              <Layers3 className={`w-4 h-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-500'}`} />
            </div>
            <div className={`mt-2 text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>
              {points.length.toLocaleString()}
            </div>
            <div className={`mt-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              현재 표시 {visibleCount.toLocaleString()}건
            </div>
          </div>

          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                성공 사례
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-3xl font-black text-emerald-500">
              {totalSuccessCount.toLocaleString()}
            </div>
            <div className={`mt-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              전체의 {successRate}%
            </div>
          </div>

          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                실패 사례
              </div>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 text-3xl font-black text-red-500">
              {totalFailureCount.toLocaleString()}
            </div>
            <div className={`mt-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              전체의 {failureRate}%
            </div>
          </div>

          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                최고 위험 영역
              </div>
              <Flame className="w-4 h-4 text-red-500" />
            </div>
            <div className={`mt-2 text-lg font-black truncate ${darkMode ? 'text-white' : 'text-gray-950'}`}>
              {topRiskCluster ? `#${topRiskCluster.cluster_id} ${getClusterLabel(topRiskCluster)}` : '-'}
            </div>
            <div className="mt-1 text-xs text-red-500 font-bold">
              {topRiskCluster ? `실패율 ${getFailureRate(topRiskCluster)}%` : '데이터 없음'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <div className={`rounded-3xl border p-5 ${panelBg}`}>
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                {([
                  { key: 'all', label: '전체 지형' },
                  { key: 'success', label: '성공만' },
                  { key: 'failure', label: '실패만' },
                  { key: 'risk', label: '리스크 모드' },
                ] as { key: FilterType; label: string }[]).map(item => (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
                      filter === item.key
                        ? item.key === 'success'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : item.key === 'failure' || item.key === 'risk'
                            ? 'bg-red-500 text-white shadow-sm'
                            : darkMode
                              ? 'bg-indigo-500 text-white shadow-sm'
                              : 'bg-gray-950 text-white shadow-sm'
                        : darkMode
                          ? 'bg-gray-950/50 text-gray-400 hover:bg-gray-800 border border-gray-800'
                          : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <button
                  onClick={() => setSelectedClusterId(null)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
                    selectedClusterId === null
                      ? darkMode
                        ? 'bg-slate-700 text-white'
                        : 'bg-indigo-600 text-white'
                      : darkMode
                        ? 'bg-gray-950/50 text-gray-400 hover:bg-gray-800 border border-gray-800'
                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  전체 클러스터
                </button>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border ${
                darkMode ? 'bg-gray-950/50 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-600'
              }`}>
                <Search className="w-4 h-4 opacity-60" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="제목, 카테고리, 클러스터 검색"
                  className={`w-full xl:w-72 bg-transparent outline-none text-xs ${
                    darkMode ? 'placeholder:text-gray-600' : 'placeholder:text-gray-400'
                  }`}
                />
                {searchText && (
                  <button onClick={() => setSearchText('')}>
                    <X className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}
              </div>
            </div>

            {selectedCluster && (
              <div className={`mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-2xl border px-4 py-3 ${
                darkMode ? 'bg-indigo-500/10 border-indigo-400/20 text-indigo-100' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}>
                <div>
                  <div className="text-sm font-black">
                    #{selectedCluster.cluster_id} {getClusterLabel(selectedCluster)}
                  </div>
                  <div className={`text-xs mt-0.5 ${darkMode ? 'text-indigo-200/70' : 'text-indigo-700/70'}`}>
                    {selectedCluster.top_keywords || '대표 키워드 없음'}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedClusterId(null)}
                  className={`text-xs font-black ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}
                >
                  필터 해제
                </button>
              </div>
            )}

            {queryPoint && (
              <div className={`flex items-center gap-2 mb-4 px-4 py-3 rounded-2xl text-sm font-bold ${
                darkMode
                  ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                <Target className="w-4 h-4" />
                <span>
                  내 전략 위치 표시 중
                  {queryPoint.cluster_name ? ` — ${queryPoint.cluster_name}` : ''}
                </span>
              </div>
            )}

            {loading ? (
              <div className={`flex items-center justify-center h-[720px] rounded-3xl ${chartBg}`}>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-11 h-11 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className={`text-sm font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    전략 지형도 생성 중…
                  </p>
                </div>
              </div>
            ) : points.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-[720px] gap-4 rounded-3xl ${chartBg}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  <Map className={`w-8 h-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>

                <div className="text-center">
                  <p className={`text-sm font-black ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    시맨틱 맵 데이터가 없습니다
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    UMAP 좌표 데이터를 먼저 생성해주세요
                  </p>
                </div>
              </div>
            ) : (
              <div className={`rounded-3xl border overflow-hidden ${chartBg} ${
                darkMode ? 'border-gray-800/70' : 'border-gray-100'
              }`}>
                <ReactECharts
                  option={option}
                  notMerge={true}
                  lazyUpdate={true}
                  onEvents={onEvents}
                  style={{ width: '100%', height: 720 }}
                />
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className={`rounded-3xl border p-5 ${panelBg}`}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className={`w-4 h-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
                <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                  리스크 요약
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>성공 사례</span>
                    <span className="text-emerald-500">{totalSuccessCount.toLocaleString()}</span>
                  </div>
                  <div className={`mt-1.5 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${successRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>실패 사례</span>
                    <span className="text-red-500">{totalFailureCount.toLocaleString()}</span>
                  </div>
                  <div className={`mt-1.5 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${failureRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>중립 사례</span>
                    <span className="text-slate-400">{totalNeutralCount.toLocaleString()}</span>
                  </div>
                  <div className={`mt-1.5 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div
                      className="h-full rounded-full bg-slate-400"
                      style={{
                        width: `${points.length ? Math.round((totalNeutralCount / points.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl border p-5 ${panelBg}`}>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-red-500" />
                <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                  위험 영역 TOP 3
                </h3>
              </div>

              <div className="space-y-3">
                {topRiskClusters.map(c => {
                  const clusterFailureRate = getFailureRate(c);

                  return (
                    <button
                      key={c.cluster_id}
                      onClick={() => setSelectedClusterId(c.cluster_id)}
                      className={`w-full text-left rounded-2xl border p-3 transition-all ${
                        selectedClusterId === c.cluster_id
                          ? darkMode
                            ? 'border-red-400/40 bg-red-500/10'
                            : 'border-red-200 bg-red-50'
                          : darkMode
                            ? 'border-gray-800 bg-gray-950/35 hover:bg-gray-900'
                            : 'border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`text-xs font-black truncate ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                            #{c.cluster_id} {getClusterLabel(c)}
                          </div>
                          <div className={`mt-1 text-[11px] truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {c.top_keywords || c.cluster_name}
                          </div>
                        </div>

                        <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-black ${getRiskClassName(clusterFailureRate)}`}>
                          {clusterFailureRate}%
                        </span>
                      </div>

                      <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div
                          className={`h-full rounded-full ${
                            clusterFailureRate >= 25
                              ? 'bg-red-500'
                              : clusterFailureRate >= 12
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, clusterFailureRate))}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`rounded-3xl border p-5 ${panelBg}`}>
              <div className="flex items-center gap-2 mb-4">
                <Info className={`w-4 h-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
                <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                  사용 가이드
                </h3>
              </div>

              <div className={`space-y-3 text-xs leading-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>
                  <b className={darkMode ? 'text-gray-200' : 'text-gray-800'}>큰 버블</b>은 전략 클러스터입니다. 크기가 클수록 사례가 많습니다.
                </p>
                <p>
                  <b className="text-red-500">붉은 점</b>은 실패 사례입니다. 리스크 모드에서는 실패 사례만 강조됩니다.
                </p>
                <p>
                  휠로 확대하고 드래그로 이동하세요. 점을 클릭하면 원문 기사로 이동합니다.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  성공
                </span>
                <span className="flex items-center gap-1 text-red-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  실패
                </span>
                <span className="flex items-center gap-1 text-slate-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  중립
                </span>
                <span className="flex items-center gap-1 text-indigo-500 font-bold">
                  <span className="w-3 h-3 rounded-full border border-indigo-500 bg-indigo-500/10" />
                  클러스터
                </span>
                <ExternalLink className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </div>
        </div>

        {clusters.length > 0 && (
          <div className={`rounded-3xl border p-5 ${panelBg}`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Info className={`w-4 h-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                  클러스터 리스크 보드
                </h3>
              </div>

              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                클릭하면 해당 지형만 집중 분석
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {clusters.map(c => {
                const active = selectedClusterId === c.cluster_id;
                const clusterFailureRate = getFailureRate(c);
                const riskLevel = getRiskLevel(clusterFailureRate);

                return (
                  <button
                    key={c.cluster_id}
                    onClick={() => {
                      setSelectedClusterId(prev => prev === c.cluster_id ? null : c.cluster_id);
                    }}
                    className={`text-left px-4 py-4 rounded-2xl text-xs border transition-all ${
                      active
                        ? darkMode
                          ? 'bg-indigo-500/15 border-indigo-400/40 text-indigo-100 shadow-lg shadow-indigo-950/20'
                          : 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-sm'
                        : darkMode
                          ? 'bg-gray-950/40 border-gray-800 text-gray-300 hover:bg-gray-900'
                          : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                            #{c.cluster_id}
                          </span>
                          <span className="font-black truncate">
                            {getClusterLabel(c)}
                          </span>
                        </div>

                        <div className={`mt-1 truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {c.top_keywords || c.cluster_name}
                        </div>
                      </div>

                      <span className={`shrink-0 px-2 py-1 rounded-full border text-[11px] font-black ${getRiskClassName(clusterFailureRate)}`}>
                        {riskLevel}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div>
                        <div className={darkMode ? 'text-gray-600' : 'text-gray-400'}>기사</div>
                        <div className={`mt-0.5 font-black ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {c.article_count?.toLocaleString() ?? '-'}
                        </div>
                      </div>

                      <div>
                        <div className={darkMode ? 'text-gray-600' : 'text-gray-400'}>실패</div>
                        <div className="mt-0.5 font-black text-red-500">
                          {c.failure_count?.toLocaleString() ?? 0}
                        </div>
                      </div>

                      <div>
                        <div className={darkMode ? 'text-gray-600' : 'text-gray-400'}>실패율</div>
                        <div className={`mt-0.5 font-black ${
                          clusterFailureRate >= 25
                            ? 'text-red-500'
                            : clusterFailureRate >= 12
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                        }`}>
                          {clusterFailureRate}%
                        </div>
                      </div>
                    </div>

                    <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full rounded-full ${
                          clusterFailureRate >= 25
                            ? 'bg-red-500'
                            : clusterFailureRate >= 12
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(4, clusterFailureRate))}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}