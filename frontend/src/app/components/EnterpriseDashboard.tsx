/**
 * src/app/components/EnterpriseDashboard.tsx - 경영진 대시보드
 * * 수정 포인트:
 * - 검색 결과 패널 내 중복된 '프리미엄 업그레이드' 배너 완벽 소거
 * - '저장된 비교 분석' 아카이브 슬롯 및 관련 UI 레이아웃 전면 제거 (생략 없음)
 */

import { TrendingUp, TrendingDown, Target, DollarSign, Shield, Lightbulb, CheckCircle2, ArrowUpRight, Clock, Activity, ChevronDown, MessageSquare, Zap, BarChart3, Sparkles, Crown, X, Plus, FileText, Star, MapPin } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, Cell, PieChart, Pie } from 'recharts';
import { useState, useRef } from 'react';

interface CompareItem {
  id: number;
  status: string;
  strategy: string;
  riskLevel: string;
  industry: string;
  title: string;
  strategySum: string;
  riskSum: string;
}

interface EnterpriseDashboardProps {
  darkMode: boolean;
  searchQuery?: string;
  language?: string;
  onCompareClick?: (items: CompareItem[]) => void;
}

export function EnterpriseDashboard({ darkMode, searchQuery, language = 'ko', onCompareClick }: EnterpriseDashboardProps) {
  const t = {
    ko: {
      title: '경영진 대시보드',
      subtitle: 'AI 기반 전략 인사이트 및 성과 분석',
      aiSearchActive: 'AI 검색 활성화',
      newAnalysis: '+ 새 분석',
      kpi: {
        successRate: '성공률',
        avgROI: '평균 ROI',
        riskIndex: '리스크 지수',
        feasibility: '실행 가능성',
        performance: '핵심 성과 지표'
      },
      period: {
        last30: '최근 30일',
        last90: '최근 90일',
        thisYear: '올해'
      },
      upgrade: '프리미엄 업그레이드',
      later: '나중에',
      subscribe: '구독하기',
      aiInsights: 'AI 전략 인사이트',
      recommendedStrategy: '추천 전략',
      riskSignal: '리스크 신호',
      viewDetails: '세부정보 보기',
      successModalTitle: '업그레이드 활성화 완료',
      successModalMessage: 'STRAND 45 GOLD 비즈니스 라이선스 업그레이드가\n성공적으로 활성화되었습니다! 차세대 분석 제어 프레임을\n지금 이용해 보세요.',
      successModalBtn: '대시보드 시작하기',
      modal: {
        title: '새 핵심 전략 분석 구성',
        company: '대상 기업 / 기관명',
        strategyName: '핵심 전략 아키텍처명',
        industry: '소속 산업군',
        roi: '예측 ROI (%)',
        risk: '위협 리스크 지수',
        growth: '예상 성장률 (%)',
        summary: '아키텍처 요약 서술',
        tags: '기술 태그 (쉼표로 구분)',
        cancel: '취소',
        submit: '분석 프레임 등록'
      },
      reportModal: {
        title: '엔터프라이즈 AI 아키텍처 연구 보고서',
        subtitle: 'Fortune 500 기술 트렌드 및 실증 분석',
        section1: '1. 개요 및 배경',
        desc1: '본 보고서는 글로벌 대기업의 제조공정 및 인프라 파이프라인에 적용된 차세대 AI 제어 시스템의 효율성을 정량적으로 검증한 기술 문서입니다.',
        section2: '2. 아키텍처 핵심 파이프라인',
        desc2: '실시간 이기종 데이터 센서 수집 노드 가동을 통해 병목 지점 예측 정확도를 94.2%까지 견인하며, 분산 원장의 불량 트래킹 성능을 안정적으로 보장합니다.',
        section3: '3. 정량적 비즈니스 임계값 효과',
        close: '닫기'
      }
    },
    en: {
      title: 'Executive Dashboard',
      subtitle: 'AI-powered strategic insights and performance analysis',
      aiSearchActive: 'AI Search Active',
      newAnalysis: '+ New Analysis',
      kpi: {
        successRate: 'Success Rate',
        avgROI: 'Avg ROI',
        riskIndex: 'Risk Index',
        feasibility: 'Feasibility',
        performance: 'Key Performance Indicators'
      },
      period: {
        last30: 'Last 30 Days',
        last90: 'Last 90 Days',
        thisYear: 'This Year'
      },
      upgrade: 'Upgrade Premium',
      later: 'Later',
      subscribe: 'Subscribe',
      aiInsights: 'AI Strategic Insights',
      recommendedStrategy: 'Recommended Strategy',
      riskSignal: 'Risk Signal',
      viewDetails: 'View Details',
      successModalTitle: 'Upgrade Complete',
      successModalMessage: 'Your STRAND 45 GOLD Business license upgrade has\nbeen successfully activated! Start utilizing the next-gen matrix now.',
      successModalBtn: 'Get Started',
      modal: {
        title: 'Configure New Strategic Analysis',
        company: 'Company / Organization',
        strategyName: 'Strategic Architecture Name',
        industry: 'Industry Segment',
        roi: 'Expected ROI (%)',
        risk: 'Risk Evaluation',
        growth: 'Growth Momentum (%)',
        summary: 'Architecture Summary',
        tags: 'Tags (separated by commas)',
        cancel: 'Cancel',
        submit: 'Register Frame'
      },
      reportModal: {
        title: 'Enterprise AI Architecture Research Report',
        subtitle: 'Fortune 500 Tech Trend & Empirical Analysis',
        section1: '1. Executive Summary',
        desc1: 'This technical document quantitatively verifies the efficiency of next-generation AI control systems applied to global enterprise manufacturing and infrastructure pipelines.',
        section2: '2. Architecture Core Pipeline',
        desc2: 'By operating real-time heterogeneous data sensor nodes, bottleneck prediction accuracy is driven up to 94.2%, reliably securing decentralized defect tracking performance.',
        section3: '3. Quantitative Business Thresholds',
        close: 'Close'
      }
    }
  };
  const text = language === 'en' ? t.en : t.ko;

  const frameworkSectionRef = useRef<HTMLDivElement>(null);

  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);
  const [timePeriod, setTimePeriod] = useState(language === 'ko' ? '최근 30일' : 'Last 30 Days');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [compareSelection, setCompareSelection] = useState<number[]>([]);
  const [detailStrategy, setDetailStrategy] = useState<number | null>(null);

  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // TODO: POST /api/diagnose 응답의 similar_articles로 교체
  const [strategyCases, setStrategyCases] = useState<any[]>([]);

  const [newAnalysisData, setNewAnalysisData] = useState({
    company: '',
    strategyName: '',
    industry: '',
    roi: 150,
    risk: '낮음',
    growth: 20,
    summary: '',
    tags: ''
  });

  // TODO: DB 연동 후 실제 집계값으로 교체
  const kpiData = [
    { label: text.kpi.successRate, value: '-', change: '-', trend: 'up', icon: Target, color: 'blue' },
    { label: text.kpi.avgROI, value: '-', change: '-', trend: 'up', icon: DollarSign, color: 'green' },
    { label: text.kpi.riskIndex, value: '-', change: '-', trend: 'down', icon: Shield, color: 'orange' },
    { label: text.kpi.feasibility, value: '-', change: '-', trend: 'up', icon: Lightbulb, color: 'purple' },
  ];

  // TODO: DB 연동 후 실제 월별 데이터로 교체
  const chartData: { month: string; value: number }[] = [];

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: darkMode ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-[#0B2F61] border-blue-200',
      green: darkMode ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
      orange: darkMode ? 'bg-orange-950/40 text-orange-400 border-orange-900/50' : 'bg-orange-50 text-orange-600 border-orange-200',
      purple: darkMode ? 'bg-purple-950/40 text-purple-400 border-purple-900/50' : 'bg-purple-50 text-purple-600 border-purple-200',
    };
    return colors[color] || colors.blue;
  };

  const handleNewAnalysis = () => {
    setShowAnalysisModal(true);
  };

  const handleAnalysisSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnalysisData.company.trim() || !newAnalysisData.strategyName.trim()) return;

    const parsedTags = newAnalysisData.tags
      ? newAnalysisData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : ['AI 연동', '신규 프레임'];

    const createdCase = {
      id: Date.now(),
      title: `${newAnalysisData.company} - ${newAnalysisData.strategyName} 도입 핵심 사례`,
      strategy: newAnalysisData.strategyName,
      industry: newAnalysisData.industry || (language === 'ko' ? '일반 엔터프라이즈' : 'General Enterprise'),
      status: 'success',
      riskLevel: newAnalysisData.risk === '낮음' ? 'Low' : 'Medium',
      roi: Number(newAnalysisData.roi),
      risk: newAnalysisData.risk,
      confidence: Math.floor(Math.random() * (98 - 85 + 1)) + 85,
      growth: Number(newAnalysisData.growth),
      strategySum: newAnalysisData.summary || '신규 등록 아키텍처 데이터 분석 패키지 세그먼트입니다.',
      riskSum: '레거시 연동 장벽 및 환경 인프라 최적화 과정이 요구됩니다.',
      tags: parsedTags,
      summary: newAnalysisData.summary || '통합 제어 아키텍처 신설 도입을 통하여 실시간 처리량 다변화 임계치를 혁신적으로 방어하고 타깃 효율 최적화를 도출했습니다.'
    };

    setStrategyCases(prev => [createdCase, ...prev]);
    setShowAnalysisModal(false);
    setNewAnalysisData({
      company: '',
      strategyName: '',
      industry: '',
      roi: 150,
      risk: '낮음',
      growth: 20,
      summary: '',
      tags: ''
    });
  };

  const toggleCompareSelection = (strategyId: number) => {
    setCompareSelection(prev => {
      const nextSelection = prev.includes(strategyId)
        ? prev.filter(id => id !== strategyId)
        : prev.length < 2
          ? [...prev, strategyId]
          : prev;

      if (nextSelection.length === 2 && onCompareClick) {
        const selectedItems = strategyCases
          .filter((strategy) => nextSelection.includes(strategy.id))
          .map((strategy) => ({
            id: strategy.id,
            status: strategy.status,
            strategy: strategy.strategy,
            riskLevel: strategy.riskLevel,
            industry: strategy.industry,
            title: strategy.title,
            strategySum: strategy.strategySum,
            riskSum: strategy.riskSum,
          }));

        onCompareClick(selectedItems);
      }

      return nextSelection;
    });
  };

  const handleViewDetails = (strategyId: number) => {
    setDetailStrategy(prev => (prev === strategyId ? null : strategyId));
  };

  const handleStartCompare = () => {
    if (compareSelection.length !== 2 || !onCompareClick) return;

    const selectedItems = strategyCases
      .filter((strategy) => compareSelection.includes(strategy.id))
      .map((strategy) => ({
        id: strategy.id,
        status: strategy.status,
        strategy: strategy.strategy,
        riskLevel: strategy.riskLevel,
        industry: strategy.industry,
        title: strategy.title,
        strategySum: strategy.strategySum,
        riskSum: strategy.riskSum,
      }));

    onCompareClick(selectedItems);
  };

  const handleScrollToFramework = () => {
    frameworkSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAdClick = () => {
    setShowReportModal(true);
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = () => {
    setShowUpgradeModal(false);
    setShowSuccessModal(true);
  };

  // TODO: DB 연동 후 실제 활동 내역으로 교체
  const activities: { action: string; user: string; time: string; type: string }[] = [];

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} relative`}>
      <div className="flex-1 overflow-y-auto px-8 py-10">
        <div className="max-w-[1440px] mx-auto space-y-12">
          
          {/* 프리미엄 솔루션 홍보 배너 */}
          <div className={`${
            darkMode
              ? 'bg-gradient-to-r from-slate-900 via-[#0B2F61]/30 to-indigo-950/40 border-[#0B2F61]/40'
              : 'bg-gradient-to-r from-[#0B2F61] to-[#2B4B7C] border-[#0B2F61]'
          } border rounded-2xl p-4 flex items-center justify-between relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#C8994B] to-[#E3C28B] rounded-xl flex items-center justify-center shadow-md">
                <BarChart3 className="w-5 h-5 text-[#0B2F61]" />
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-white font-bold text-base">STRAND 45 GOLD</h3>
                  <div className="flex items-center gap-2 text-slate-200 text-xs">
                    <span className="flex items-center gap-1 text-[#C8994B]">★ 4.9 Premium</span>
                    <span>•</span>
                    <span>엔터프라이즈 최적 규격 스캔 프로 기능 탑재</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              className="relative z-10 px-5 py-2 bg-white hover:bg-slate-100 text-[#0B2F61] rounded-xl font-bold text-xs transition-all shadow"
            >
              {text.upgrade}
            </button>
          </div>

          {/* 구독 등급 조율 모달 */}
          {showUpgradeModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
              <div className={`${darkMode ? 'bg-[#0D1527] border border-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full shadow-2xl overflow-hidden`}>
                <div className="bg-gradient-to-r from-[#0B2F61] to-[#3B547E] px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="w-6 h-6 text-[#C8994B]" />
                      <h2 className="text-lg font-bold text-white">STRAND 45 GOLD</h2>
                    </div>
                    <button onClick={() => setShowUpgradeModal(false)} className="text-white/70 hover:text-white text-xl font-bold">×</button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className={`text-4xl font-bold ${darkMode ? 'text-blue-400' : 'text-[#0B2F61]'}\ mb-1`}>₩9,900</div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>월 정기 엔터프라이즈 에디션 라이선스</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h3 className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-700'} uppercase tracking-wider`}>제공 핵심 아키텍처 프레임:</h3>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>제한 없는 최고 권위 전략 매트릭스 도출</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>실시간 고밀도 산업군 마이닝 연동</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>정밀 리스크 임계값 조기 경보 전송</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(false)}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {text.later}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmUpgrade}
                      className="flex-1 px-4 py-2.5 bg-[#0B2F61] hover:bg-[#C8994B] text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      {text.subscribe}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI 핵심 탐색 동기화 지표 - 검색 결과 전체 패널 */}
          {searchQuery && (
            <div className="space-y-4">
              {/* 지표 헤더 */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI 핵심 탐색 동기화 지표
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">검색어: "{searchQuery}"</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    평균 종합 성공 타깃율 87% <span className="text-[#0B2F61] dark:text-blue-400">• 유사 섹터 ROI 320%</span>
                  </span>
                </div>
              </div>

              {/* 5개 카드 그리드 */}
              <div className="grid grid-cols-5 gap-3">
                {/* 1. 시장 지배력 분석 - 바 차트 */}
                <div className={`col-span-1 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'} border rounded-2xl p-4`}>
                  <h3 className={`text-xs font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>시장 지배력 분석</h3>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={[
                      { name: 'A사', value: 88 },
                      { name: 'B사', value: 65 },
                      { name: 'C사', value: 50 },
                      { name: '기타', value: 20 },
                    ]} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: darkMode ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {[0,1,2,3].map((i) => (
                          <Cell key={i} fill={i === 0 ? '#0B2F61' : i === 1 ? '#1e4d9b' : i === 2 ? '#3b6fcf' : '#93b4e8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 2. 연관 트렌드 예측 - 라인 차트 */}
                <div className={`col-span-1 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'} border rounded-2xl p-4`}>
                  <h3 className={`text-xs font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>연관 트렌드 예측</h3>
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={[
                      { name: 'Feb', v: 30 },
                      { name: 'Mar', v: 45 },
                      { name: 'Apr', v: 55 },
                      { name: 'Jun', v: 80 },
                    ]} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: darkMode ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
                      <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 3. 경쟁사 벤치마킹 */}
                <div className={`col-span-1 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'} border rounded-2xl p-4`}>
                  <h3 className={`text-xs font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>경쟁사 벤치마킹</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'A사', score: 92, roi: 450 },
                      { name: 'B사', score: 85, roi: 320 },
                      { name: 'C사', score: 78, roi: 210 },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Score: {item.score}</span>
                          <span className="text-[10px] font-bold text-[#0B2F61] dark:text-blue-400">ROI: {item.roi}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. 고객 세그먼트 분석 - 도넛 차트 */}
                <div className={`col-span-1 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'} border rounded-2xl p-4`}>
                  <h3 className={`text-xs font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>고객 세그먼트 분석</h3>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Enterprise', value: 45 },
                          { name: 'SMB', value: 30 },
                          { name: 'Consumer', value: 25 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={42}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        <Cell fill="#0B2F61" />
                        <Cell fill="#10b981" />
                        <Cell fill="#C8994B" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 5. 지역별 성과 지도 */}
                <div className={`col-span-1 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'} border rounded-2xl p-4`}>
                  <h3 className={`text-xs font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>지역별 성과 지도</h3>
                  <div className="flex flex-col items-center justify-center h-[80px] gap-2">
                    <MapPin className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                    <p className="text-[10px] text-center text-gray-400 leading-tight">
                      지도 시각화 플레이스홀더<br />
                      <span className="text-[9px]">(실제 맵은 추후 연동)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 타이틀 바 */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className={`text-2xl font-extrabold tracking-tight mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{text.title}</h1>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {text.subtitle}
                {searchQuery && <span className={`${darkMode ? 'text-blue-400' : 'text-[#0B2F61]'} font-bold ml-2`}>• {text.aiSearchActive}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleNewAnalysis}
                className="px-4 py-2.5 bg-[#0B2F61] hover:bg-[#C8994B] text-white rounded-xl font-bold text-xs transition-all shadow-md"
              >
                {text.newAnalysis}
              </button>
            </div>
          </div>

          {/* 인텔리전스 배너 (우측 아카이브 영역이 제거되어 가로 전체 100% 레이아웃으로 최적화) */}
          <div className="w-full">
            <div className={`${
              darkMode ? 'bg-gray-900/30 border-gray-800' : 'bg-gradient-to-r from-slate-50 to-blue-50/30 border-slate-200'
            } border rounded-2xl p-6 relative overflow-hidden group transition-all`}>
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="px-2 py-0.5 bg-[#0B2F61] text-white text-[10px] font-bold rounded">기술 트렌드</div>
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>지능형 엔터프라이즈 AI 연동 아키텍처</h3>
                    <p className={`text-xs leading-relaxed mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Fortune 대기업 공정 최적화 알고리즘 실증 분석 데이터 패키지.<br />
                      정밀 정량화 시각화 대시보드 리포트를 실시간 확인하세요.
                    </p>
                    <button
                      onClick={handleAdClick}
                      className="px-4 py-2 bg-[#0B2F61] hover:bg-[#C8994B] text-white rounded-xl text-xs font-bold transition-all"
                    >
                      연구 보고서 전문 조회 →
                    </button>
                  </div>
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl flex items-center justify-center ml-4 flex-shrink-0 shadow-sm">
                    <Zap className="w-8 h-8 text-[#C8994B]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 고속 모니터링 콜아웃 */}
          <div className={`relative ${
            darkMode ? 'bg-gray-900/30 border-gray-800' : 'bg-gradient-to-r from-amber-50/60 to-orange-50/40 border-amber-200/60'
          } border-l-4 border-l-[#C8994B] rounded-r-2xl p-5`}>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-500/10 text-[#C8994B] rounded-xl flex-shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📋 핵심 트렌드 피드백</h3>
                <p className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  실증 산업군 데이터에 의하면, <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-[#0B2F61]'}`}>자동화 공정 시뮬레이션 디지털 트윈</span> 기법을 정형화한 세그먼트가 통상 성과 대비 <span className="font-bold text-emerald-600 dark:text-emerald-400">+34% 이상 수렴 가속도</span>를 기록 중입니다.
                </p>
              </div>
              <button
                onClick={handleScrollToFramework}
                className={`px-4 py-2 text-xs font-bold rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'} flex-shrink-0 shadow-sm`}
              >
                상세 매핑
              </button>
            </div>
          </div>

          {/* 메인 KPI 모니터링 스크린 */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{text.kpi.performance}</h2>
              <select
                value={timePeriod}
                onChange={(e) => {
                  setTimePeriod(e.target.value);
                  alert(`📅 연동 윈도우 주기가 [${e.target.value}]로 재편되었습니다.`);
                }}
                className={`px-3 py-1.5 border rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-700'} focus:outline-none focus:ring-1 focus:ring-[#0B2F61]`}
              >
                <option>{text.period.last30}</option>
                <option>{text.period.last90}</option>
                <option>{text.period.thisYear}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {kpiData.map((kpi, index) => {
                const Icon = kpi.icon;
                const isPositive = kpi.trend === 'up';

                return (
                  <div
                    key={index}
                    className={`${darkMode ? 'bg-gray-800/40 border-gray-700/40' : 'bg-white border-slate-200'} border rounded-2xl p-5 hover:shadow-md transition-all relative overflow-hidden group`}
                  >
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 ${getColorClass(kpi.color)} rounded-xl border shadow-inner`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPositive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {kpi.change}
                        </div>
                      </div>

                      <div className="mb-2">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{kpi.label}</p>
                        <p className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-[#0B2F61]'}`}>{kpi.value}</p>
                      </div>

                      <div className="h-10 -mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height={100}>
                          <LineChart data={chartData}>
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={isPositive ? '#10B981' : '#EF4444'}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 실증 프레임워크 리포트 분기 그리드 */}
          <section ref={frameworkSectionRef} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 scroll-mt-24">
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>최고 성과 전략 프레임 케이스</h2>
                  <p className="text-xs text-gray-400">지능형 래핑 엔진 매칭 우선순위</p>
                </div>
              </div>

              {compareSelection.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-inner dark:border-gray-808 dark:bg-gray-950">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <p className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      정밀 비교 대상군 총 [ {compareSelection.length} ] 개 확보됨.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartCompare}
                      disabled={compareSelection.length !== 2}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        compareSelection.length === 2
                          ? 'bg-[#0B2F61] hover:bg-[#C8994B] text-white shadow'
                          : 'bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      교차 검증 비교 시작
                    </button>
                  </div>
                </div>
              )}

              {/* 동적 카드리스트 생성 엔진 */}
              <div className="space-y-4">
                {strategyCases.map((strategy, idx) => (
                  <div
                    key={strategy.id}
                    className={`relative ${
                      darkMode ? 'bg-gray-900/30 border-gray-800 hover:border-gray-700' : 'bg-white border-slate-200 hover:border-slate-300/80'
                    } border rounded-2xl p-6 hover:shadow-sm transition-all`}
                  >
                    <div className="absolute top-0 left-0 px-3 py-1 bg-[#0B2F61] rounded-br-xl border-r border-b border-[#0B2F61]/20">
                      <span className="text-white text-[10px] font-bold">MATCH #{idx + 1}</span>
                    </div>

                    <div className="relative z-10 pt-2">
                      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap md:flex-nowrap">
                        <div className="flex-1">
                          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.title}</h3>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 text-[10px] font-bold rounded-md">
                              {strategy.status === 'success' ? '실증 확인' : '보류'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#C8994B]">{strategy.industry}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">AI MATCH</p>
                            <p className={`text-sm font-extrabold ${darkMode ? 'text-blue-400' : 'text-[#0B2F61]'}`}>{strategy.confidence}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 my-2 border-t border-b border-slate-100 dark:border-gray-800">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">예측 ROI</p>
                          <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.roi}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">위협 지수</p>
                          <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                            strategy.risk === '낮음' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                          }`}>{strategy.risk}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">예상 성장 모멘텀</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{strategy.growth}%</p>
                        </div>
                        <div className="flex flex-col gap-1.5 justify-center">
                          <button
                            type="button"
                            onClick={() => toggleCompareSelection(strategy.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                              compareSelection.includes(strategy.id)
                                ? 'bg-[#C8994B] text-white'
                                : 'bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {compareSelection.includes(strategy.id) ? '선택 해제' : '선택'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewDetails(strategy.id)}
                            className="px-3 py-1.5 bg-[#0B2F61] text-white text-xs font-bold rounded-xl hover:bg-[#3B547E] flex items-center justify-center gap-1"
                          >
                            <span> 아키텍처 </span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {detailStrategy === strategy.id && (
                        <div className="my-4 p-4 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200/60 dark:border-gray-800 text-xs leading-relaxed text-gray-600 dark:text-gray-300 font-medium animate-in fade-in duration-200">
                          {strategy.summary}
                        </div>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {strategy.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="px-2.5 py-1 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-700 text-[10px] font-bold rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => setExpandedStrategy(expandedStrategy === strategy.id ? null : strategy.id)}
                          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#0B2F61] dark:text-gray-400 dark:hover:text-blue-400"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>피드백</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${expandedStrategy === strategy.id ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {expandedStrategy === strategy.id && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800">
                          <div className="space-y-3">
                            {[
                              { user: '박분석', comment: 'Q4 파일럿 검증 단계 스펙에 즉각 대응되는 레퍼런스입니다.', time: '2시간 전' },
                              { user: '이전략', comment: '임계 전송 파라미터 안정성 밸런스가 뛰어납니다.', time: '5시간 전' },
                            ].map((comment, cidx) => (
                              <div key={cidx} className="flex gap-2.5 text-xs bg-slate-50/50 dark:bg-gray-900/40 p-2.5 rounded-xl">
                                <div className="w-6 h-6 bg-[#0B2F61] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[9px]">{comment.user[0]}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold text-gray-800 dark:text-slate-200">{comment.user}</span>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{comment.time}</span>
                                  </div>
                                  <p className="text-gray-600 dark:text-gray-300 font-medium">{comment.comment}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 타임라인 피드 */}
            <div className={`h-fit ${darkMode ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-slate-200'} border rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-4 h-4 text-[#C8994B]" />
                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>워크스페이스 로그</h3>
              </div>

              <div className="space-y-4">
                {activities.map((activity, idx) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="w-6 h-6 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-3 h-3 text-[#0B2F61] dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold mb-0.5 ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{activity.action}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-[10px]">{activity.user} · {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 새 분석 입력 모달 오버레이 */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border transition-all ${
            darkMode ? 'bg-[#0D1527] border-gray-800 text-white' : 'bg-white border-slate-200 text-gray-900'
          }`}>
            <div className="bg-gradient-to-r from-[#0B2F61] to-[#1E437A] px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#C8994B]" />
                {text.modal.title}
              </h3>
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAnalysisSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-bold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{text.modal.company}</label>
                  <input
                    type="text"
                    required
                    value={newAnalysisData.company}
                    onChange={e => setNewAnalysisData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="예: 구글 코리아"
                    className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B2F61] dark:focus:ring-[#C8994B] ${
                      darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-slate-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-bold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{text.modal.strategyName}</label>
                  <input
                    type="text"
                    required
                    value={newAnalysisData.strategyName}
                    onChange={e => setNewAnalysisData(prev => ({ ...prev, strategyName: e.target.value }))}
                    placeholder="예: 클라우드 파이프라인 최적화"
                    className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B2F61] dark:focus:ring-[#C8994B] ${
                      darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-slate-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{text.modal.industry}</label>
                <input
                  type="text"
                  value={newAnalysisData.industry}
                  onChange={e => setNewAnalysisData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="예: 엔터프라이즈 SaaS 인프라"
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B2F61] dark:focus:ring-[#C8994B] ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-[10px] font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{text.modal.roi}</label>
                  <input
                    type="number"
                    min="0"
                    value={newAnalysisData.roi}
                    onChange={e => setNewAnalysisData(prev => ({ ...prev, roi: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none ${
                      darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{text.modal.risk}</label>
                  <select
                    value={newAnalysisData.risk}
                    onChange={e => setNewAnalysisData(prev => ({ ...prev, risk: e.target.value }))}
                    className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none ${
                      darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-gray-900'
                    }`}
                  >
                    <option value="낮음">낮음</option>
                    <option value="중간">중간</option>
                    <option value="높음">높음</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{text.modal.growth}</label>
                  <input
                    type="number"
                    min="0"
                    value={newAnalysisData.growth}
                    onChange={e => setNewAnalysisData(prev => ({ ...prev, growth: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none ${
                      darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{text.modal.summary}</label>
                <textarea
                  value={newAnalysisData.summary}
                  onChange={e => setNewAnalysisData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="전략 아키텍처 도입 시 기대되는 종합적인 성과 핵심을 간략히 기술하세요."
                  rows={3}
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B2F61] dark:focus:ring-[#C8994B] resize-none ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-slate-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{text.modal.tags}</label>
                <input
                  type="text"
                  value={newAnalysisData.tags}
                  onChange={e => setNewAnalysisData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="예: 데이터 분석, 인프라 자동화, 최적화"
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B2F61] dark:focus:ring-[#C8994B] ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-slate-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAnalysisModal(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border ${
                    darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {text.modal.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-[#0B2F61] hover:bg-[#C8994B] transition-all shadow-md"
                >
                  {text.modal.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 연구 보고서 조회 모달 오버레이 */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border transition-all ${
            darkMode ? 'bg-[#0A0E1A] border-gray-800 text-white' : 'bg-white border-slate-200 text-gray-900'
          }`}>
            <div className="bg-[#0B2F61] px-6 py-5 flex items-center justify-between border-b border-[#0B2F61]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 text-[#C8994B] rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{text.reportModal.title}</h3>
                  <p className="text-[10px] text-gray-300 font-medium">{text.reportModal.subtitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto text-xs leading-relaxed font-medium">
              <div>
                <h4 className={`text-xs font-bold mb-1.5 ${darkMode ? 'text-[#C8994B]' : 'text-[#0B2F61]'}`}>{text.reportModal.section1}</h4>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{text.reportModal.desc1}</p>
              </div>

              <div>
                <h4 className={`text-xs font-bold mb-1.5 ${darkMode ? 'text-[#C8994B]' : 'text-[#0B2F61]'}`}>{text.reportModal.section2}</h4>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{text.reportModal.desc2}</p>
              </div>

              <div>
                <h4 className={`text-xs font-bold mb-2 ${darkMode ? 'text-[#C8994B]' : 'text-[#0B2F61]'}`}>{text.reportModal.section3}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 border rounded-xl text-center ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-gray-400 text-[10px] uppercase mb-0.5">운영 마진</p>
                    <p className="text-sm font-extrabold text-emerald-500">+18.4%</p>
                  </div>
                  <div className={`p-3 border rounded-xl text-center ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-gray-400 text-[10px] uppercase mb-0.5">자원 효율성</p>
                    <p className="text-sm font-extrabold text-blue-500">96.8%</p>
                  </div>
                  <div className={`p-3 border rounded-xl text-center ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-gray-400 text-[10px] uppercase mb-0.5">공정 지연율</p>
                    <p className="text-sm font-extrabold text-red-400">-31.2%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 bg-slate-50 dark:bg-gray-900/40 border-t border-slate-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-5 py-2 bg-[#0B2F61] hover:bg-[#C8994B] text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                {text.reportModal.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border transform transition-all ${
            darkMode ? 'bg-[#0A0E1A] border-gray-800 text-white' : 'bg-white border-slate-100 text-gray-900'
          } animate-in zoom-in-95 duration-150`}>
            
            <div className="bg-gradient-to-r from-[#0B2F61] to-[#3B547E] px-6 py-5 flex items-center justify-between border-b border-[#0B2F61]/20">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-[#C8994B] animate-pulse" />
                <h2 className="text-sm font-bold text-white tracking-tight">{text.successModalTitle}</h2>
              </div>
              <button 
                onClick={() => setShowSuccessModal(false)} 
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-500/10 text-[#C8994B] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#C8994B]/30 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className={`text-xs sm:text-sm font-bold whitespace-pre-line leading-relaxed mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {text.successModalMessage}
              </p>
              
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-[#0B2F61] via-[#1E437A] to-[#C8994B] hover:opacity-95 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {text.successModalBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}