import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import {
  ArrowLeft, Map, RefreshCw, Info, Search, Maximize2, Target, Flame,
  Layers3, ExternalLink, TrendingUp, AlertTriangle, ShieldCheck, Radar,
  Sparkles, BarChart3, X,
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
  highlightArticleId?: number | null;
  highlightClusterId?: number | null;
}

type FilterType = 'all' | 'success' | 'failure' | 'risk';

const LABEL_KO: Record<string, string> = { success: '성공', failure: '실패', neutral: '중립' };
const CHART_H = 720;

const getClusterLabel = (cluster: ClusterInfo) => {
  if (cluster.top_keywords) {
    const kw = cluster.top_keywords.split(',').map(v => v.trim()).filter(Boolean).slice(0, 2).join('·');
    if (kw) return kw;
  }
  return cluster.cluster_name || `Cluster ${cluster.cluster_id}`;
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

// ─── D3 Map Component ─────────────────────────────────────────────────────────
function D3Map({
  points,
  clusters,
  filter,
  selectedClusterId,
  darkMode,
  queryPoint,
  onClusterClick,
}: {
  points: MapPoint[];
  clusters: ClusterInfo[];
  filter: FilterType;
  selectedClusterId: number | null;
  darkMode: boolean;
  queryPoint?: QueryPoint | null;
  onClusterClick: (clusterId: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null!);
  const transformRef = useRef(d3.zoomIdentity);
  const quadtreeRef = useRef<d3.Quadtree<MapPoint>>(null!);
  const renderCanvasRef = useRef<() => void>(() => {});
  const renderSVGRef = useRef<() => void>(() => {});
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: MapPoint } | null>(null);
  const [mapW, setMapW] = useState(900);

  // Resize observer → update canvas/svg width
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.max(entry.contentRect.width, 1);
      setMapW(w);
    });
    ro.observe(wrap);
    // Initial
    setMapW(Math.max(wrap.clientWidth, 1));
    return () => ro.disconnect();
  }, []);

  // Scales: recompute on data or map width change
  const scales = useMemo(() => {
    if (!points.length || mapW < 10) return null;
    const xExt = d3.extent(points, p => p.umap_x) as [number, number];
    const yExt = d3.extent(points, p => p.umap_y) as [number, number];
    const pad = 55;
    const xs = d3.scaleLinear().domain(xExt).range([pad, mapW - pad]).nice();
    const ys = d3.scaleLinear().domain(yExt).range([CHART_H - pad, pad]).nice();
    return { x: xs, y: ys };
  }, [points, mapW]);

  // Visible points for filter
  const visiblePoints = useMemo(() => {
    let pts = selectedClusterId != null ? points.filter(p => p.cluster_id === selectedClusterId) : points;
    if (filter === 'success') return pts.filter(p => p.label === 'success');
    if (filter === 'failure' || filter === 'risk') return pts.filter(p => p.label === 'failure');
    return pts;
  }, [points, filter, selectedClusterId]);

  // Canvas render
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scales) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const t = transformRef.current;
    ctx.clearRect(0, 0, W, H);

    const px = (ux: number) => t.applyX(scales.x(ux));
    const py = (uy: number) => t.applyY(scales.y(uy));

    // neutral (draw first, smallest)
    ctx.fillStyle = darkMode ? 'rgba(100,116,139,0.16)' : 'rgba(100,116,139,0.13)';
    visiblePoints.filter(p => p.label === 'neutral').forEach(p => {
      const sx = px(p.umap_x), sy = py(p.umap_y);
      if (sx < -5 || sx > W + 5 || sy < -5 || sy > H + 5) return;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // success
    const successActive = filter === 'success';
    ctx.fillStyle = `rgba(16,185,129,${successActive ? 0.88 : 0.42})`;
    visiblePoints.filter(p => p.label === 'success').forEach(p => {
      const sx = px(p.umap_x), sy = py(p.umap_y);
      if (sx < -5 || sx > W + 5 || sy < -5 || sy > H + 5) return;
      ctx.beginPath();
      ctx.arc(sx, sy, successActive ? 3.8 : 2.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // failure (with glow)
    const failActive = filter === 'failure' || filter === 'risk';
    visiblePoints.filter(p => p.label === 'failure').forEach(p => {
      const sx = px(p.umap_x), sy = py(p.umap_y);
      if (sx < -12 || sx > W + 12 || sy < -12 || sy > H + 12) return;
      const r = failActive ? 6 : 5;
      // glow
      const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3);
      grd.addColorStop(0, 'rgba(239,68,68,0.55)');
      grd.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.beginPath(); ctx.fillStyle = grd;
      ctx.arc(sx, sy, r * 3, 0, Math.PI * 2); ctx.fill();
      // core
      ctx.beginPath(); ctx.fillStyle = '#ef4444';
      ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    });

    // query point
    if (queryPoint) {
      const sx = px(queryPoint.umap_x), sy = py(queryPoint.umap_y);
      const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 28);
      grd.addColorStop(0, 'rgba(245,158,11,0.65)');
      grd.addColorStop(1, 'rgba(245,158,11,0)');
      ctx.beginPath(); ctx.fillStyle = grd;
      ctx.arc(sx, sy, 28, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = '#f59e0b';
      ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
    }
  }, [visiblePoints, scales, filter, queryPoint, darkMode]);

  // Keep canvas ref current (SVG ref updated after renderSVG is defined below)
  renderCanvasRef.current = renderCanvas;

  // SVG render — screen-space coords (zoom transform applied to positions, not group)
  const renderSVG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !scales || !points.length) return;
    const svgSel = d3.select(svg);
    svgSel.selectAll('*').remove();
    const g = svgSel.append('g'); // no zoom group transform

    const t = transformRef.current;
    const W = svg.clientWidth || mapW;
    const H = CHART_H;

    // Screen-space helpers
    const spx = (ux: number) => t.applyX(scales.x(ux));
    const spy = (uy: number) => t.applyY(scales.y(uy));

    // Which clusters to render
    const clustersToRender = selectedClusterId != null
      ? clusters.filter(c => c.cluster_id === selectedClusterId)
      : clusters;

    // Top-3 highest failure rate cluster IDs (always show their labels)
    const topRiskIds = new Set(
      [...clusters]
        .sort((a, b) => getFailureRate(b) - getFailureRate(a))
        .slice(0, 3)
        .map(c => c.cluster_id)
    );

    clustersToRender.forEach(c => {
      const clusterPts = points.filter(p => p.cluster_id === c.cluster_id);
      if (clusterPts.length < 3) return;

      // Compute hull in SCREEN space
      const hullInput: [number, number][] = clusterPts.map(p => [spx(p.umap_x), spy(p.umap_y)]);
      const hull = d3.polygonHull(hullInput);
      if (!hull) return;

      const failRate = getFailureRate(c);
      const isActive = selectedClusterId === c.cluster_id;

      // Centroid in screen space
      const cx = d3.mean(hull, d => d[0])!;
      const cy = d3.mean(hull, d => d[1])!;

      // Inflate by fixed 18px screen pixels
      const INFLATE = 18;
      const inflated: [number, number][] = hull.map(([x, y]) => {
        const dx = x - cx, dy = y - cy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        return [x + (dx / len) * INFLATE, y + (dy / len) * INFLATE];
      });

      const pathD = `M${inflated.map(([x, y]) => `${x},${y}`).join('L')}Z`;

      // Skip rendering if hull centroid is well off-screen
      if (cx < -120 || cx > W + 120 || cy < -120 || cy > H + 120) return;

      // Colors
      const hullFill = failRate >= 25
        ? `rgba(239,68,68,${isActive ? 0.15 : 0.06})`
        : failRate >= 12
          ? `rgba(245,158,11,${isActive ? 0.14 : 0.055})`
          : darkMode
            ? `rgba(99,102,241,${isActive ? 0.16 : 0.055})`
            : `rgba(99,102,241,${isActive ? 0.12 : 0.04})`;

      const hullStroke = failRate >= 25
        ? `rgba(239,68,68,${isActive ? 0.95 : 0.55})`
        : failRate >= 12
          ? `rgba(245,158,11,${isActive ? 0.9 : 0.5})`
          : `rgba(99,102,241,${isActive ? 0.8 : 0.42})`;

      const textColor = failRate >= 25 ? '#ef4444' : failRate >= 12 ? '#f59e0b'
        : darkMode ? '#a5b4fc' : '#4338ca';

      // Hull polygon
      g.append('path')
        .attr('d', pathD)
        .attr('fill', hullFill)
        .attr('stroke', hullStroke)
        .attr('stroke-width', isActive ? 2.5 : 1.5)
        .attr('stroke-dasharray', isActive ? 'none' : '7,4')
        .attr('stroke-linejoin', 'round')
        .style('cursor', 'pointer')
        .on('click', () => onClusterClick(c.cluster_id));

      // Label: show only for active / top-risk / zoomed in enough
      const showLabel = isActive || topRiskIds.has(c.cluster_id) || t.k >= 1.6;
      if (!showLabel) return;

      const labelText = `#${c.cluster_id} ${getClusterLabel(c).slice(0, 12)}`;
      const subText = failRate > 0 ? `실패율 ${failRate}%` : `${c.article_count}건`;
      const pillW = Math.max(84, labelText.length * 6.8 + 20);
      const pillH = 30;

      const labelG = g.append('g')
        .attr('transform', `translate(${cx},${cy})`)
        .style('cursor', 'pointer')
        .on('click', () => onClusterClick(c.cluster_id));

      labelG.append('rect')
        .attr('x', -pillW / 2).attr('y', -pillH / 2)
        .attr('width', pillW).attr('height', pillH)
        .attr('rx', 9)
        .attr('fill', darkMode ? 'rgba(8,12,28,0.92)' : 'rgba(255,255,255,0.95)')
        .attr('stroke', hullStroke)
        .attr('stroke-width', isActive ? 2 : 1);

      labelG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -4)
        .attr('font-size', '10')
        .attr('font-weight', '800')
        .attr('fill', textColor)
        .text(labelText);

      labelG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 10)
        .attr('font-size', '9')
        .attr('fill', failRate >= 25 ? '#fca5a5' : failRate >= 12 ? '#fcd34d'
          : darkMode ? '#818cf8' : '#6366f1')
        .text(subText);
    });

    // Query point SVG marker (screen-space)
    if (queryPoint) {
      const sx = spx(queryPoint.umap_x);
      const sy = spy(queryPoint.umap_y);
      if (sx >= -40 && sx <= W + 40 && sy >= -40 && sy <= H + 40) {
        const qg = g.append('g').attr('transform', `translate(${sx},${sy})`);
        [20, 28, 36].forEach((r, i) => {
          qg.append('circle')
            .attr('r', r).attr('fill', 'none')
            .attr('stroke', '#f59e0b')
            .attr('stroke-width', 1.5 - i * 0.35)
            .attr('opacity', 0.55 - i * 0.13);
        });
        const ql = qg.append('g').attr('transform', 'translate(0,-50)');
        ql.append('rect').attr('x', -50).attr('y', -13).attr('width', 100).attr('height', 24)
          .attr('rx', 12).attr('fill', '#f59e0b');
        ql.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
          .attr('font-size', '10').attr('font-weight', '900').attr('fill', '#000')
          .text('⭐ 내 전략 위치');
        qg.append('line').attr('x1', 0).attr('y1', -36).attr('x2', 0).attr('y2', -13)
          .attr('stroke', '#f59e0b').attr('stroke-width', 1.5).attr('opacity', 0.7);
      }
    }
  }, [clusters, points, scales, mapW, selectedClusterId, darkMode, queryPoint, onClusterClick]);

  // Keep refs current (must be AFTER both callbacks are defined)
  renderSVGRef.current = renderSVG;

  // Combined re-render
  const rerender = useCallback(() => {
    renderCanvas();
    renderSVG();
  }, [renderCanvas, renderSVG]);

  // Setup zoom (once when scales available)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !scales) return;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 22])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        renderCanvasRef.current();
        renderSVGRef.current(); // screen-space: full SVG redraw on each zoom tick
      });

    zoomRef.current = zoom;
    d3.select(svg).call(zoom);
    d3.select(svg).on('dblclick.zoom', () => {
      d3.select(svg).transition().duration(350).call(zoom.transform, d3.zoomIdentity);
    });

    return () => {
      d3.select(svg).on('.zoom', null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scales]);

  // Re-render on data / filter / darkMode change
  useEffect(() => {
    rerender();
  }, [rerender]);

  // Resize canvas/svg when mapW changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!canvas || !svg) return;
    canvas.width = mapW;
    canvas.height = CHART_H;
    svg.setAttribute('width', String(mapW));
    svg.setAttribute('height', String(CHART_H));
    transformRef.current = d3.zoomIdentity;
    rerender();
  }, [mapW, rerender]);

  // Build quadtree for hover (in scale-space, before zoom)
  useEffect(() => {
    if (!scales) return;
    quadtreeRef.current = d3.quadtree<MapPoint>()
      .x(p => scales.x(p.umap_x))
      .y(p => scales.y(p.umap_y))
      .addAll(visiblePoints);
  }, [visiblePoints, scales]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap || !scales || !quadtreeRef.current) return;
    const rect = wrap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const t = transformRef.current;
    const [ux, uy] = t.invert([mx, my]);
    const nearest = quadtreeRef.current.find(ux, uy, 14 / t.k);
    if (nearest) setTooltip({ x: mx, y: my, point: nearest });
    else setTooltip(null);
  }, [scales]);

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden" style={{ height: CHART_H }}>
      {/* Canvas: points */}
      <canvas
        ref={canvasRef}
        width={mapW}
        height={CHART_H}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: CHART_H }}
      />
      {/* SVG: cluster hulls + labels */}
      <svg
        ref={svgRef}
        width={mapW}
        height={CHART_H}
        className="absolute inset-0"
        style={{ width: '100%', height: CHART_H }}
      />
      {/* Transparent event overlay */}
      <div
        className="absolute inset-0"
        style={{ cursor: tooltip ? 'pointer' : 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        onClick={() => {
          if (tooltip?.point?.url) window.open(tooltip.point.url, '_blank', 'noopener,noreferrer');
        }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className={`absolute pointer-events-none z-50 p-3 rounded-xl border shadow-2xl text-xs max-w-[260px] ${
            darkMode
              ? 'bg-[#0a0e1a]/95 border-gray-700/70 text-gray-100 backdrop-blur-md'
              : 'bg-white/97 border-gray-200 text-gray-900 backdrop-blur-sm'
          }`}
          style={{
            left: Math.min(tooltip.x + 16, mapW - 272),
            top: Math.max(tooltip.y - 115, 8),
          }}
        >
          <div className={`font-bold mb-1.5 flex items-center gap-2 ${
            tooltip.point.label === 'success' ? 'text-emerald-500'
            : tooltip.point.label === 'failure' ? 'text-red-500' : 'text-slate-400'
          }`}>
            <span className={`w-2 h-2 rounded-full inline-block ${
              tooltip.point.label === 'success' ? 'bg-emerald-500'
              : tooltip.point.label === 'failure' ? 'bg-red-500' : 'bg-slate-400'
            }`} />
            {LABEL_KO[tooltip.point.label] ?? tooltip.point.label}
            <span className={`font-normal ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Cluster #{tooltip.point.cluster_id}
            </span>
          </div>
          <div className="font-semibold leading-snug line-clamp-2 mb-1">
            {tooltip.point.title}
          </div>
          {tooltip.point.category && (
            <div className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {tooltip.point.category} · {tooltip.point.source}
            </div>
          )}
          {tooltip.point.url && (
            <div className={`mt-2 font-semibold text-[11px] ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              클릭 → 원문으로 이동 ↗
            </div>
          )}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
        {[
          { label: '+', fn: () => { if (zoomRef.current && svgRef.current) d3.select(svgRef.current).transition().duration(220).call(zoomRef.current.scaleBy, 1.6); } },
          { label: '−', fn: () => { if (zoomRef.current && svgRef.current) d3.select(svgRef.current).transition().duration(220).call(zoomRef.current.scaleBy, 0.625); } },
          { label: '↺', fn: () => { if (zoomRef.current && svgRef.current) d3.select(svgRef.current).transition().duration(380).call(zoomRef.current.transform, d3.zoomIdentity); } },
        ].map(({ label, fn }) => (
          <button
            key={label}
            onClick={fn}
            className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center border shadow-sm transition-colors select-none ${
              darkMode
                ? 'bg-gray-800/90 text-gray-200 border-gray-700/80 hover:bg-gray-700'
                : 'bg-white/90 text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className={`absolute bottom-4 left-4 flex items-center gap-3 text-[11px] font-semibold px-3 py-1.5 rounded-xl border ${
        darkMode ? 'bg-gray-900/80 border-gray-700/60 text-gray-400' : 'bg-white/85 border-gray-200 text-gray-500'
      }`}>
        <span className="flex items-center gap-1.5 text-emerald-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />성공
        </span>
        <span className="flex items-center gap-1.5 text-red-500">
          <span className="w-2 h-2 rounded-full bg-red-500" />실패
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-slate-400" />중립
        </span>
        <span className={`${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
        <span className={`${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          휠 확대 · 드래그 이동 · 더블클릭 초기화
        </span>
      </div>
    </div>
  );
}

// ─── Main SemanticMap Component ───────────────────────────────────────────────
export function SemanticMap({ darkMode = false, onBack, queryPoint, highlightArticleId, highlightClusterId }: SemanticMapProps) {
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
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      const rawPoints = json.points ?? json.data ?? [];
      const normalizedPoints: MapPoint[] = rawPoints
        .map((p: any, i: number) => ({
          article_id: Number(p.article_id ?? p.id ?? i),
          umap_x: Number(p.umap_x ?? p.x),
          umap_y: Number(p.umap_y ?? p.y),
          cluster_id: Number(p.cluster_id ?? 0),
          label: (['success', 'failure', 'neutral'].includes(p.label) ? p.label : 'neutral') as MapPoint['label'],
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
      setPoints([]); setClusters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalSuccessCount = useMemo(() => points.filter(p => p.label === 'success').length, [points]);
  const totalFailureCount = useMemo(() => points.filter(p => p.label === 'failure').length, [points]);
  const totalNeutralCount = useMemo(() => points.filter(p => p.label === 'neutral').length, [points]);
  const successRate = useMemo(() => points.length ? Math.round((totalSuccessCount / points.length) * 100) : 0, [points, totalSuccessCount]);
  const failureRate = useMemo(() => points.length ? Math.round((totalFailureCount / points.length) * 100) : 0, [points, totalFailureCount]);

  const topRiskClusters = useMemo(() =>
    [...clusters].sort((a, b) => {
      const d = getFailureRate(b) - getFailureRate(a);
      return d !== 0 ? d : (b.failure_count ?? 0) - (a.failure_count ?? 0);
    }).slice(0, 3), [clusters]);

  const topRiskCluster = topRiskClusters[0] ?? null;

  // article_id로 로드된 UMAP 데이터에서 직접 좌표 검색 → 클러스터 센터 폴백
  const effectiveQueryPoint = useMemo<QueryPoint | null>(() => {
    if (queryPoint != null) return queryPoint;
    if (highlightArticleId != null && points.length) {
      const found = points.find(p => p.article_id === highlightArticleId);
      if (found) return { umap_x: found.umap_x, umap_y: found.umap_y, cluster_name: found.category || found.source };
    }
    if (highlightClusterId != null && clusters.length) {
      const cl = clusters.find(c => c.cluster_id === highlightClusterId);
      if (cl?.center_x != null && cl?.center_y != null) {
        return { umap_x: cl.center_x, umap_y: cl.center_y, cluster_name: cl.cluster_name };
      }
    }
    return null;
  }, [queryPoint, highlightArticleId, highlightClusterId, points, clusters]);

  const selectedCluster = useMemo(() =>
    selectedClusterId != null ? clusters.find(c => c.cluster_id === selectedClusterId) ?? null : null,
    [clusters, selectedClusterId]);

  const searchedPoints = useMemo(() => {
    const kw = searchText.trim().toLowerCase();
    if (!kw) return points;
    return points.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.category.toLowerCase().includes(kw) ||
      p.source.toLowerCase().includes(kw)
    );
  }, [points, searchText]);

  const visibleCount = useMemo(() => {
    let pts = selectedClusterId != null ? searchedPoints.filter(p => p.cluster_id === selectedClusterId) : searchedPoints;
    if (filter === 'success') return pts.filter(p => p.label === 'success').length;
    if (filter === 'failure' || filter === 'risk') return pts.filter(p => p.label === 'failure').length;
    return pts.length;
  }, [searchedPoints, selectedClusterId, filter]);

  const handleClusterClick = useCallback((id: number) => {
    setSelectedClusterId(prev => prev === id ? null : id);
  }, []);

  const cardBg = darkMode ? 'bg-gray-900/55 border-gray-800/70' : 'bg-white border-gray-200 shadow-sm';
  const panelBg = darkMode ? 'bg-[#0f172a]/72 border-gray-800/70' : 'bg-white border-gray-200 shadow-sm';
  const chartBg = darkMode
    ? 'bg-[radial-gradient(ellipse_at_top_left,rgba(79,70,229,0.2),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(239,68,68,0.12),transparent_38%),#020617]'
    : 'bg-[radial-gradient(ellipse_at_top_left,rgba(79,70,229,0.1),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(239,68,68,0.07),transparent_38%),#f8fafc]';

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#020617]' : 'bg-[#F8FAFC]'} pb-10`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 border-b px-6 py-4 ${
        darkMode ? 'bg-[#020617]/90 backdrop-blur-xl border-gray-800/70' : 'bg-white/90 backdrop-blur-xl border-gray-200/70'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                  전략 시맨틱 맵
                </h1>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {points.length.toLocaleString()}건 · UMAP 전략 지형도 · D3 Canvas 렌더링
                </p>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs ${
              darkMode ? 'border-gray-800 text-gray-400 bg-gray-900/40' : 'border-gray-200 text-gray-500 bg-white'
            }`}>
              <Maximize2 className="w-3.5 h-3.5" />
              클러스터 클릭하면 해당 영역 집중분석
            </div>
            <button onClick={fetchData} className={`p-2 rounded-xl transition-all ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Hero banner */}
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
                D3 Strategy Intelligence Map
              </div>
              <h2 className={`mt-4 text-3xl md:text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                성공과 실패 사례를 한 장의 전략 지형도로 분석합니다
              </h2>
              <p className={`mt-3 max-w-2xl text-sm leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                클러스터 경계선(Convex Hull)은 유사 전략 사례들의 집합입니다. 붉은 경계선일수록 실패율이 높은 위험 영역입니다. 점은 실제 기사 사례이며 클릭하면 원문으로 이동합니다.
              </p>
            </div>
            <div className={`rounded-3xl border p-5 ${darkMode ? 'border-gray-800 bg-black/20' : 'border-white/80 bg-white/70 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>데이터 상태</div>
                  <div className={`mt-1 text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                    {points.length ? 'ACTIVE' : 'LOADING'}
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
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${successRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>실패 비중</span>
                    <span className="text-red-500">{failureRate}%</span>
                  </div>
                  <div className={`mt-1.5 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${failureRate}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: '전체 사례', value: points.length.toLocaleString(), sub: `표시 ${visibleCount.toLocaleString()}건`, icon: Layers3, color: 'text-indigo-500' },
            { label: '성공 사례', value: totalSuccessCount.toLocaleString(), sub: `전체의 ${successRate}%`, icon: TrendingUp, color: 'text-emerald-500' },
            { label: '실패 사례', value: totalFailureCount.toLocaleString(), sub: `전체의 ${failureRate}%`, icon: AlertTriangle, color: 'text-red-500' },
            {
              label: '최고 위험 영역',
              value: topRiskCluster ? `#${topRiskCluster.cluster_id}` : '-',
              sub: topRiskCluster ? `실패율 ${getFailureRate(topRiskCluster)}%` : '없음',
              icon: Flame,
              color: 'text-red-500',
            },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className={`p-5 rounded-3xl border ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</div>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className={`mt-2 text-3xl font-black ${color}`}>{value}</div>
              <div className={`mt-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Main chart + sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
          <div className={`rounded-3xl border p-5 ${panelBg}`}>
            {/* Filter toolbar */}
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
                        ? item.key === 'success' ? 'bg-emerald-500 text-white'
                          : item.key === 'failure' || item.key === 'risk' ? 'bg-red-500 text-white'
                          : darkMode ? 'bg-indigo-500 text-white' : 'bg-gray-950 text-white'
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
                      ? darkMode ? 'bg-slate-700 text-white' : 'bg-indigo-600 text-white'
                      : darkMode ? 'bg-gray-950/50 text-gray-400 hover:bg-gray-800 border border-gray-800'
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
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="제목, 카테고리 검색"
                  className={`w-full xl:w-56 bg-transparent outline-none text-xs ${
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
              <div className={`mb-4 flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 ${
                darkMode ? 'bg-indigo-500/10 border-indigo-400/20 text-indigo-100' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}>
                <div>
                  <div className="text-sm font-black">#{selectedCluster.cluster_id} {getClusterLabel(selectedCluster)}</div>
                  <div className={`text-xs mt-0.5 ${darkMode ? 'text-indigo-200/70' : 'text-indigo-700/70'}`}>
                    {selectedCluster.top_keywords || '대표 키워드 없음'}
                  </div>
                </div>
                <button onClick={() => setSelectedClusterId(null)} className={`text-xs font-black ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
                  필터 해제
                </button>
              </div>
            )}

            {effectiveQueryPoint && (
              <div className={`flex items-center gap-2 mb-4 px-4 py-3 rounded-2xl text-sm font-bold ${
                darkMode ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                <Target className="w-4 h-4" />
                {highlightArticleId != null ? '기사 위치 표시 중' : '내 전략 위치 표시 중'}
                {effectiveQueryPoint.cluster_name ? ` — ${effectiveQueryPoint.cluster_name}` : ''}
              </div>
            )}

            {/* D3 Chart */}
            {loading ? (
              <div className={`flex items-center justify-center rounded-3xl ${chartBg}`} style={{ height: CHART_H }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-11 h-11 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className={`text-sm font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    전략 지형도 생성 중…
                  </p>
                </div>
              </div>
            ) : points.length === 0 ? (
              <div className={`flex flex-col items-center justify-center gap-4 rounded-3xl ${chartBg}`} style={{ height: CHART_H }}>
                <Map className={`w-12 h-12 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                <p className={`text-sm font-bold ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  UMAP 좌표 데이터가 없습니다
                </p>
              </div>
            ) : (
              <div className={`rounded-3xl border overflow-hidden ${chartBg} ${darkMode ? 'border-gray-800/60' : 'border-gray-100'}`}>
                <D3Map
                  points={searchedPoints}
                  clusters={clusters}
                  filter={filter}
                  selectedClusterId={selectedClusterId}
                  darkMode={darkMode}
                  queryPoint={effectiveQueryPoint}
                  onClusterClick={handleClusterClick}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className={`rounded-3xl border p-5 ${panelBg}`}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className={`w-4 h-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
                <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>리스크 요약</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: '성공 사례', count: totalSuccessCount, rate: successRate, color: 'bg-emerald-500', textColor: 'text-emerald-500' },
                  { label: '실패 사례', count: totalFailureCount, rate: failureRate, color: 'bg-red-500', textColor: 'text-red-500' },
                  {
                    label: '중립 사례', count: totalNeutralCount,
                    rate: points.length ? Math.round((totalNeutralCount / points.length) * 100) : 0,
                    color: 'bg-slate-400', textColor: 'text-slate-400',
                  },
                ].map(({ label, count, rate, color, textColor }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-bold">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{label}</span>
                      <span className={textColor}>{count.toLocaleString()}</span>
                    </div>
                    <div className={`mt-1.5 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-3xl border p-5 ${panelBg}`}>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-red-500" />
                <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>위험 영역 TOP 3</h3>
              </div>
              <div className="space-y-3">
                {topRiskClusters.map(c => {
                  const rate = getFailureRate(c);
                  const isActive = selectedClusterId === c.cluster_id;
                  return (
                    <button
                      key={c.cluster_id}
                      onClick={() => handleClusterClick(c.cluster_id)}
                      className={`w-full text-left rounded-2xl border p-3 transition-all ${
                        isActive
                          ? darkMode ? 'border-red-400/40 bg-red-500/10' : 'border-red-200 bg-red-50'
                          : darkMode ? 'border-gray-800 bg-gray-950/35 hover:bg-gray-900' : 'border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm'
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
                        <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-black ${getRiskClassName(rate)}`}>
                          {rate}%
                        </span>
                      </div>
                      <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div
                          className={`h-full rounded-full ${rate >= 25 ? 'bg-red-500' : rate >= 12 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, Math.max(4, rate))}%` }}
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
                <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>읽는 법</h3>
              </div>
              <div className={`space-y-3 text-xs leading-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p><b className={darkMode ? 'text-gray-200' : 'text-gray-800'}>경계선(Hull)</b>은 전략 클러스터입니다. 붉은 경계 = 실패율 높음.</p>
                <p><b className="text-red-500">붉은 점</b>은 실패 사례이며 글로우(빛)로 강조됩니다.</p>
                <p><b className="text-emerald-500">초록 점</b>은 성공 사례, 회색 점은 중립 사례입니다.</p>
                <p>점이나 경계선을 클릭하면 해당 클러스터만 집중 분석합니다.</p>
                <p className={darkMode ? 'text-gray-600' : 'text-gray-400'}>우측 하단 버튼으로 줌 조작, 더블클릭으로 초기화.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cluster board */}
        {clusters.length > 0 && (
          <div className={`rounded-3xl border p-5 ${panelBg}`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Info className={`w-4 h-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>클러스터 리스크 보드</h3>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>클릭하면 지도에서 해당 영역 집중분석</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {clusters.map(c => {
                const active = selectedClusterId === c.cluster_id;
                const rate = getFailureRate(c);
                const riskLevel = getRiskLevel(rate);
                return (
                  <button
                    key={c.cluster_id}
                    onClick={() => handleClusterClick(c.cluster_id)}
                    className={`text-left px-4 py-4 rounded-2xl text-xs border transition-all ${
                      active
                        ? darkMode ? 'bg-indigo-500/15 border-indigo-400/40 shadow-lg' : 'bg-indigo-50 border-indigo-300 shadow-sm'
                        : darkMode ? 'bg-gray-950/40 border-gray-800 hover:bg-gray-900' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>#{c.cluster_id}</span>
                          <span className={`font-black truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{getClusterLabel(c)}</span>
                        </div>
                        <div className={`mt-1 truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{c.top_keywords || c.cluster_name}</div>
                      </div>
                      <span className={`shrink-0 px-2 py-1 rounded-full border text-[11px] font-black ${getRiskClassName(rate)}`}>
                        {riskLevel}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { label: '기사', value: c.article_count?.toLocaleString() ?? '-', color: '' },
                        { label: '실패', value: (c.failure_count ?? 0).toLocaleString(), color: 'text-red-500' },
                        { label: '실패율', value: `${rate}%`, color: rate >= 25 ? 'text-red-500' : rate >= 12 ? 'text-amber-500' : 'text-emerald-500' },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className={darkMode ? 'text-gray-600' : 'text-gray-400'}>{label}</div>
                          <div className={`mt-0.5 font-black ${color || (darkMode ? 'text-gray-200' : 'text-gray-800')}`}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full rounded-full ${rate >= 25 ? 'bg-red-500' : rate >= 12 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, Math.max(4, rate))}%` }}
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
