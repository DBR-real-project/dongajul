import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import {
  ArrowLeft, Map, RefreshCw, Info, Search, Maximize2, Target, Flame,
  Layers3, ExternalLink, TrendingUp, AlertTriangle, ShieldCheck, Radar,
  Sparkles, BarChart3, X,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { SimilarArticle } from './DiagnosisResult';

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
  initialClusterId?: number | null;
  similarArticles?: SimilarArticle[] | null;
}

type FilterType = 'all' | 'success' | 'failure';

const LABEL_KO: Record<string, string> = { success: '성공', failure: '실패', neutral: '중립' };
const CHART_H = 720;

const getClusterLabel = (cluster: ClusterInfo) => {
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
  const overlayRef = useRef<HTMLDivElement>(null);
  // overlay div에 zoom 적용: SVG가 overlay 아래에 있어서 drag 이벤트를 SVG가 못 받는 문제 해결
  const zoomRef = useRef<d3.ZoomBehavior<HTMLDivElement, unknown>>(null!);
  const transformRef = useRef(d3.zoomIdentity);
  const quadtreeRef = useRef<d3.Quadtree<MapPoint>>(null!);
  const renderCanvasRef = useRef<() => void>(() => {});
  const renderSVGRef = useRef<() => void>(() => {});
  const dragging = useRef(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: MapPoint } | null>(null);
  const [multiPopup, setMultiPopup] = useState<{ x: number; y: number; points: MapPoint[] } | null>(null);
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
    if (filter === 'failure') return pts.filter(p => p.label === 'failure');
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

    // neutral (draw first, slightly more visible)
    ctx.fillStyle = darkMode ? 'rgba(100,116,139,0.26)' : 'rgba(100,116,139,0.22)';
    visiblePoints.filter(p => p.label === 'neutral').forEach(p => {
      const sx = px(p.umap_x), sy = py(p.umap_y);
      if (sx < -5 || sx > W + 5 || sy < -5 || sy > H + 5) return;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // success
    const successActive = filter === 'success';
    ctx.fillStyle = `rgba(16,185,129,${successActive ? 0.92 : 0.55})`;
    visiblePoints.filter(p => p.label === 'success').forEach(p => {
      const sx = px(p.umap_x), sy = py(p.umap_y);
      if (sx < -5 || sx > W + 5 || sy < -5 || sy > H + 5) return;
      ctx.beginPath();
      ctx.arc(sx, sy, successActive ? 4.2 : 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // failure (with glow)
    const failActive = filter === 'failure';
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

      // Colors — increased opacity for better cluster visibility
      const hullFill = failRate >= 25
        ? `rgba(239,68,68,${isActive ? 0.22 : 0.10})`
        : failRate >= 12
          ? `rgba(245,158,11,${isActive ? 0.20 : 0.09})`
          : darkMode
            ? `rgba(99,102,241,${isActive ? 0.22 : 0.09})`
            : `rgba(99,102,241,${isActive ? 0.16 : 0.07})`;

      const hullStroke = failRate >= 25
        ? `rgba(239,68,68,${isActive ? 1.0 : 0.72})`
        : failRate >= 12
          ? `rgba(245,158,11,${isActive ? 0.95 : 0.65})`
          : `rgba(99,102,241,${isActive ? 0.88 : 0.58})`;

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

      // Label: always show all cluster labels (was: only top-3 + active + zoomed)
      const clusterName = getClusterLabel(c).slice(0, 15);
      const labelText = `#${c.cluster_id} ${clusterName}`;
      const subText = failRate > 0 ? `실패율 ${failRate}%` : `${c.article_count}건`;
      const mainFontSize = isActive ? '11' : '10';
      const pillW = Math.max(90, labelText.length * 7.0 + 24);
      const pillH = isActive ? 36 : 32;

      const labelG = g.append('g')
        .attr('transform', `translate(${cx},${cy})`)
        .style('cursor', 'pointer')
        .on('click', () => onClusterClick(c.cluster_id));

      // Shadow/glow for better readability
      labelG.append('rect')
        .attr('x', -pillW / 2 - 1).attr('y', -pillH / 2 - 1)
        .attr('width', pillW + 2).attr('height', pillH + 2)
        .attr('rx', 10)
        .attr('fill', 'none')
        .attr('stroke', hullStroke)
        .attr('stroke-width', isActive ? 0 : 3)
        .attr('opacity', 0.25);

      labelG.append('rect')
        .attr('x', -pillW / 2).attr('y', -pillH / 2)
        .attr('width', pillW).attr('height', pillH)
        .attr('rx', 9)
        .attr('fill', darkMode ? 'rgba(6,9,24,0.95)' : 'rgba(255,255,255,0.97)')
        .attr('stroke', hullStroke)
        .attr('stroke-width', isActive ? 2.5 : 1.5);

      labelG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -3)
        .attr('font-size', mainFontSize)
        .attr('font-weight', '800')
        .attr('fill', textColor)
        .text(labelText);

      labelG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 12)
        .attr('font-size', '10')
        .attr('font-weight', failRate >= 25 ? '700' : '500')
        .attr('fill', failRate >= 25 ? '#f87171' : failRate >= 12 ? '#fbbf24'
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

  // Setup zoom on overlay div (SVG 아래 레이어라 drag 이벤트가 SVG에 안 닿는 문제 해결)
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !scales) return;

    const zoom = d3.zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.3, 120])
      .on('start', () => { dragging.current = false; })
      .on('zoom', (event) => {
        if (event.sourceEvent?.type === 'mousemove') dragging.current = true;
        transformRef.current = event.transform;
        renderCanvasRef.current();
        renderSVGRef.current();
      });

    zoomRef.current = zoom;
    d3.select(overlay).call(zoom);
    d3.select(overlay).on('dblclick.zoom', () => {
      d3.select(overlay).transition().duration(350).call(zoom.transform, d3.zoomIdentity);
    });

    return () => {
      d3.select(overlay).on('.zoom', null);
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
      {/* SVG: cluster hulls + labels (pointer-events-none — zoom/pan은 overlay에서 처리) */}
      <svg
        ref={svgRef}
        width={mapW}
        height={CHART_H}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: CHART_H }}
      />
      {/* Overlay: zoom/pan + tooltip + click 이벤트 모두 여기서 처리 */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{ cursor: tooltip ? 'pointer' : 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        onClick={(e) => {
          if (dragging.current) { dragging.current = false; return; }
          if (multiPopup) { setMultiPopup(null); return; }
          const wrap = wrapRef.current;
          if (!wrap || !scales) return;
          const rect = wrap.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const t = transformRef.current;
          const RADIUS_PX = 20;
          const nearby = visiblePoints.filter(p => {
            const sx = t.applyX(scales.x(p.umap_x));
            const sy = t.applyY(scales.y(p.umap_y));
            return Math.hypot(sx - mx, sy - my) <= RADIUS_PX;
          });
          if (nearby.length === 0) return;
          if (nearby.length === 1) {
            if (nearby[0].url) window.open(nearby[0].url, '_blank', 'noopener,noreferrer');
            return;
          }
          setMultiPopup({ x: mx, y: my, points: nearby });
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

      {/* Multi-article popup */}
      {multiPopup && (
        <div
          className={`absolute z-50 rounded-xl border shadow-2xl text-xs overflow-hidden ${
            darkMode
              ? 'bg-[#0a0e1a]/97 border-gray-700/70 text-gray-100 backdrop-blur-md'
              : 'bg-white/97 border-gray-200 text-gray-900 backdrop-blur-sm'
          }`}
          style={{
            left: Math.min(multiPopup.x + 12, mapW - 290),
            top: Math.max(multiPopup.y - 20, 8),
            width: 275,
          }}
        >
          <div className={`flex items-center justify-between px-3 py-2 border-b font-semibold ${
            darkMode ? 'border-gray-700/60 text-gray-300' : 'border-gray-100 text-gray-700'
          }`}>
            <span>이 위치의 기사 {multiPopup.points.length}개</span>
            <button
              onClick={(e) => { e.stopPropagation(); setMultiPopup(null); }}
              className={`w-5 h-5 flex items-center justify-center rounded hover:bg-gray-500/20 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}
            >✕</button>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {multiPopup.points.map((p, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); if (p.url) window.open(p.url, '_blank', 'noopener,noreferrer'); setMultiPopup(null); }}
                className={`w-full text-left px-3 py-2.5 flex items-start gap-2 border-b last:border-0 transition-colors ${
                  darkMode
                    ? 'border-gray-700/40 hover:bg-gray-700/40'
                    : 'border-gray-50 hover:bg-gray-50'
                }`}
              >
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  p.label === 'success' ? 'bg-emerald-500' : p.label === 'failure' ? 'bg-red-500' : 'bg-slate-400'
                }`} />
                <div className="min-w-0">
                  <div className="font-medium leading-snug line-clamp-2">{p.title}</div>
                  <div className={`mt-0.5 text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {LABEL_KO[p.label] ?? p.label} · {p.source}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
        {[
          { label: '+', fn: () => { if (zoomRef.current && overlayRef.current) d3.select(overlayRef.current).transition().duration(220).call(zoomRef.current.scaleBy, 1.6); } },
          { label: '−', fn: () => { if (zoomRef.current && overlayRef.current) d3.select(overlayRef.current).transition().duration(220).call(zoomRef.current.scaleBy, 0.625); } },
          { label: '↺', fn: () => { if (zoomRef.current && overlayRef.current) d3.select(overlayRef.current).transition().duration(380).call(zoomRef.current.transform, d3.zoomIdentity); } },
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
export function SemanticMap({ darkMode = false, onBack, queryPoint, highlightArticleId, highlightClusterId, initialClusterId, similarArticles }: SemanticMapProps) {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(initialClusterId ?? null);
  const [searchText, setSearchText] = useState('');
  const [showPosiMap, setShowPosiMap] = useState(false);

  useEffect(() => { setShowPosiMap(false); }, [similarArticles]);

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

  // ─── 전략 포지셔닝 맵 전체 페이지 ───────────────────────────────────────────
  if (showPosiMap && effectiveQueryPoint && similarArticles && similarArticles.length > 0) {
    const arts = similarArticles.slice(0, 5);
    const CX = 300, CY = 260;
    const MAX_R = 195, MIN_R = 45;
    const sims = arts.map(a => a.similarity);
    const best = Math.max(...sims);
    const worst = Math.min(...sims);
    const spread = Math.max(best - worst, 0.08);
    const getR = (sim: number) => MIN_R + ((best - sim) / spread) * (MAX_R - MIN_R);
    const ANGLES = arts.map((_, i) => ((-90 + i * (360 / arts.length)) * Math.PI) / 180);
    const positions = arts.map((a, i) => {
      const r = getR(a.similarity);
      return { x: CX + r * Math.cos(ANGLES[i]), y: CY + r * Math.sin(ANGLES[i]) };
    });
    const RINGS = [70, 130, 195];
    const RING_LABELS = ['근접', '중간', '원거리'];

    return (
      <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#020617]' : 'bg-[#F8FAFC]'} pb-10`}>
        {/* 헤더 */}
        <div className={`sticky top-0 z-10 border-b px-6 py-4 flex items-center gap-3 ${
          darkMode ? 'bg-[#020617]/90 border-gray-800 backdrop-blur' : 'bg-white/90 border-gray-200 backdrop-blur'
        }`}>
          <button
            onClick={() => setShowPosiMap(false)}
            className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl transition-all ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </button>
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-indigo-500" />
            <h2 className={`text-base font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>전략 포지셔닝 맵</h2>
          </div>
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            중심에 가까울수록 내 전략과 의미적으로 유사한 사례
          </span>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col items-center gap-8">
          {/* SVG 차트 */}
          <div className={`w-full rounded-3xl border overflow-hidden ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <svg viewBox="0 0 600 520" className="w-full" style={{ maxHeight: 520 }}>
              {/* 배경 그라디언트 */}
              <defs>
                <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={darkMode ? 'rgba(79,70,229,0.08)' : 'rgba(79,70,229,0.05)'} />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <rect width="600" height="520" fill="url(#bgGrad)" />

              {/* 참조 링 */}
              {RINGS.map((r, i) => (
                <g key={r}>
                  <circle cx={CX} cy={CY} r={r}
                    fill="none"
                    stroke={darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}
                    strokeWidth="1.5" strokeDasharray="5 5"
                  />
                  <text x={CX + r + 5} y={CY - 4}
                    fontSize="11" fill={darkMode ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)'}
                  >{RING_LABELS[i]}</text>
                </g>
              ))}

              {/* 중심 → 기사 연결선 */}
              {positions.map((pos, i) => (
                <line key={i} x1={CX} y1={CY} x2={pos.x} y2={pos.y}
                  stroke={arts[i].label === 'success' ? '#10b981' : arts[i].label === 'failure' ? '#ef4444' : '#94a3b8'}
                  strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="4 4"
                />
              ))}

              {/* 내 전략 (중심) */}
              <circle cx={CX} cy={CY} r={28} fill="#f59e0b" fillOpacity="0.15" />
              <circle cx={CX} cy={CY} r={18} fill="#f59e0b" />
              <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="900" fill="#000">나</text>
              <text x={CX} y={CY + 34} textAnchor="middle" fontSize="11" fontWeight="700" fill={darkMode ? '#9ca3af' : '#6b7280'}>내 전략</text>

              {/* 기사 노드 */}
              {positions.map((pos, i) => {
                const a = arts[i];
                const stroke = a.label === 'success' ? '#10b981' : a.label === 'failure' ? '#ef4444' : '#94a3b8';
                const fillOpacity = darkMode ? '0.22' : '0.13';
                const fillColor = a.label === 'success' ? `rgba(16,185,129,${fillOpacity})` : a.label === 'failure' ? `rgba(239,68,68,${fillOpacity})` : `rgba(148,163,184,${fillOpacity})`;
                const simPct = Math.round(a.similarity * 100);
                const pctColor = simPct >= 80 ? '#10b981' : simPct >= 65 ? '#f59e0b' : '#94a3b8';
                // 제목 표시 위치: 노드 바깥쪽 방향
                const dx = pos.x - CX, dy = pos.y - CY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const nx = dx / dist, ny = dy / dist;
                const tx = pos.x + nx * 34, ty = pos.y + ny * 22;
                const titleShort = a.title.length > 14 ? a.title.slice(0, 13) + '…' : a.title;
                return (
                  <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r={24} fill={fillColor} stroke={stroke} strokeWidth="2.5" />
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="900" fill={stroke}>{i + 1}</text>
                    <text x={tx} y={ty} textAnchor="middle" fontSize="10" fontWeight="700"
                      fill={darkMode ? '#cbd5e1' : '#475569'}>{titleShort}</text>
                    <text x={pos.x} y={pos.y + 34} textAnchor="middle" fontSize="10" fontWeight="800" fill={pctColor}>{simPct}%</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 기사 카드 그리드 */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            {arts.map((a, i) => {
              const stroke = a.label === 'success' ? 'border-emerald-500' : a.label === 'failure' ? 'border-red-500' : 'border-slate-400';
              const textColor = a.label === 'success' ? 'text-emerald-500' : a.label === 'failure' ? 'text-red-500' : 'text-slate-400';
              const badgeBg = a.label === 'success'
                ? (darkMode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                : a.label === 'failure'
                  ? (darkMode ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-700')
                  : (darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600');
              const simPct = Math.round(a.similarity * 100);
              return (
                <a key={i} href={a.url || '#'} target="_blank" rel="noopener noreferrer"
                  className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                    darkMode
                      ? 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <span className={`shrink-0 w-8 h-8 rounded-full border-2 ${stroke} ${textColor} flex items-center justify-center text-sm font-black`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-bold leading-snug mb-2 group-hover:underline ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {a.title}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${badgeBg}`}>
                        {a.label === 'success' ? '성공' : a.label === 'failure' ? '실패' : '중립'}
                      </span>
                      {a.source && <span className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.source}</span>}
                      {a.published_date && <span className={`text-[11px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{a.published_date.slice(0, 7)}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`text-base font-black tabular-nums ${textColor}`}>{simPct}%</span>
                    <ExternalLink className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

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

            {/* 유사 사례 TOP 5 — 진단 결과에서 진입 시에만 표시 */}
            {effectiveQueryPoint && similarArticles && similarArticles.length > 0 && (
              <div className={`rounded-3xl border p-5 ${panelBg}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-amber-500" />
                  <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                    유사 사례 TOP {similarArticles.length}
                  </h3>
                  <span className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>내 전략 기준</span>
                  <button
                    onClick={() => setShowPosiMap(true)}
                    className={`ml-auto flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-all ${
                      darkMode ? 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    <Radar className="w-3 h-3" />
                    포지셔닝 맵
                  </button>
                </div>
                <div className="space-y-2">
                  {similarArticles.map((a, i) => (
                    <a
                      key={i}
                      href={a.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-start gap-2.5 rounded-2xl border p-3 transition-all group ${
                        darkMode
                          ? 'border-gray-800 bg-gray-950/35 hover:bg-gray-900 hover:border-gray-700'
                          : 'border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5 ${
                        darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'
                      }`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold leading-snug line-clamp-2 mb-1.5 ${
                          darkMode ? 'text-gray-200 group-hover:text-amber-300' : 'text-gray-800 group-hover:text-amber-700'
                        } transition-colors`}>
                          {a.title}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                            a.label === 'success'
                              ? darkMode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                              : a.label === 'failure'
                                ? darkMode ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-700'
                                : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {a.label === 'success' ? '성공' : a.label === 'failure' ? '실패' : '중립'}
                          </span>
                          {a.source && (
                            <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{a.source}</span>
                          )}
                          <span className={`ml-auto text-[11px] font-black tabular-nums ${
                            a.similarity >= 0.75 ? 'text-emerald-500' : a.similarity >= 0.55 ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            {Math.round(a.similarity * 100)}%
                          </span>
                        </div>
                      </div>
                      <ExternalLink className={`shrink-0 w-3 h-3 mt-1 opacity-0 group-hover:opacity-50 transition-opacity ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className={`rounded-3xl border p-5 ${panelBg}`}>
              <div className="flex items-center gap-2 mb-4">
                <Info className={`w-4 h-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
                <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-950'}`}>읽는 법</h3>
              </div>
              <div className={`space-y-3 text-xs leading-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p><b className={darkMode ? 'text-gray-200' : 'text-gray-800'}>경계선(Hull)</b>은 전략 클러스터입니다. 붉은 경계 = 실패율 높음.</p>
                <p><b className="text-red-500">붉은 점</b>은 실패 사례이며 글로우(빛)로 강조됩니다. <b className="text-red-400">밀집된 붉은 덩어리</b>는 여러 실패 사례가 겹쳐 생긴 고위험 밀집 구역입니다.</p>
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
