import { TrendingUp, TrendingDown, Target, DollarSign, Shield, Lightbulb, AlertTriangle, CheckCircle2, ArrowUpRight, Clock, Activity, ChevronDown, MessageSquare, Bookmark, Zap, BarChart3, Sparkles, Crown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface EnterpriseDashboardProps {
  darkMode: boolean;
  searchQuery?: string;
  language?: string;
}

export function EnterpriseDashboard({ darkMode, searchQuery, language = 'ko' }: EnterpriseDashboardProps) {
  const t = {
    ko: {
      title: '경영진 대시보드',
      subtitle: 'AI 기반 전략 인사이트 및 성과 분석',
      aiSearchActive: 'AI 검색 활성화',
      exportReport: '보고서 내보내기',
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
      savedComparisons: '저장된 비교',
      upgrade: '업그레이드',
      later: '나중에',
      subscribe: '구독하기',
      aiInsights: 'AI 전략 인사이트',
      recommendedStrategy: '추천 전략',
      riskSignal: '리스크 신호',
      viewDetails: '세부정보 보기'
    },
    en: {
      title: 'Executive Dashboard',
      subtitle: 'AI-powered strategic insights and performance analysis',
      aiSearchActive: 'AI Search Active',
      exportReport: 'Export Report',
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
      savedComparisons: 'Saved Comparisons',
      upgrade: 'Upgrade',
      later: 'Later',
      subscribe: 'Subscribe',
      aiInsights: 'AI Strategic Insights',
      recommendedStrategy: 'Recommended Strategy',
      riskSignal: 'Risk Signal',
      viewDetails: 'View Details'
    }
  };
  const text = language === 'en' ? t.en : t.ko;

  const [activeFilters, setActiveFilters] = useState<string[]>([language === 'ko' ? '모든 전략' : 'All Strategies']);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);
  const [savedComparisons, setSavedComparisons] = useState([
    { id: 1, name: language === 'ko' ? 'AI vs 전통 마케팅' : 'AI vs Traditional Marketing', date: language === 'ko' ? '2일 전' : '2 days ago' },
    { id: 2, name: language === 'ko' ? '디지털 전환 사례' : 'Digital Transformation Cases', date: language === 'ko' ? '1주 전' : '1 week ago' },
  ]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [timePeriod, setTimePeriod] = useState(language === 'ko' ? '최근 30일' : 'Last 30 Days');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const projects = [
    { id: 1, name: language === 'ko' ? '디지털 전환 프로젝트' : 'Digital Transformation Project' },
    { id: 2, name: language === 'ko' ? 'AI 마케팅 전략' : 'AI Marketing Strategy' },
    { id: 3, name: language === 'ko' ? '고객 경험 개선' : 'Customer Experience Improvement' },
  ];
  // KPI Data
  const kpiData = [
    {
      label: text.kpi.successRate,
      value: '78.5%',
      change: '+12.3%',
      trend: 'up',
      icon: Target,
      color: 'blue',
    },
    {
      label: text.kpi.avgROI,
      value: '342%',
      change: '+28.1%',
      trend: 'up',
      icon: DollarSign,
      color: 'green',
    },
    {
      label: text.kpi.riskIndex,
      value: '2.4/10',
      change: '-8.2%',
      trend: 'down',
      icon: Shield,
      color: 'orange',
    },
    {
      label: text.kpi.feasibility,
      value: '92',
      change: '+5.4',
      trend: 'up',
      icon: Lightbulb,
      color: 'purple',
    },
  ];

  // Strategy Cases Data
  const strategyCases = [
    {
      id: 1,
      title: '네이버 - AI 기반 개인화 추천 시스템 도입',
      industry: 'IT/기술',
      status: 'success',
      roi: 450,
      risk: '낮음',
      confidence: 94,
      growth: 52,
      tags: ['AI/ML', '개인화', '데이터 분석'],
    },
    {
      id: 2,
      title: '삼성전자 - 스마트 팩토리 전환 프로젝트',
      industry: '제조업',
      status: 'success',
      roi: 380,
      risk: '중간',
      confidence: 89,
      growth: 45,
      tags: ['IoT', '자동화', '디지털 트윈'],
    },
    {
      id: 3,
      title: 'CJ - 옴니채널 물류 플랫폼 구축',
      industry: '유통',
      status: 'success',
      roi: 320,
      risk: '중간',
      confidence: 87,
      growth: 38,
      tags: ['옴니채널', '물류', '플랫폼'],
    },
  ];

  const chartData = [
    { month: '1월', value: 65 },
    { month: '2월', value: 72 },
    { month: '3월', value: 68 },
    { month: '4월', value: 78 },
    { month: '5월', value: 85 },
    { month: '6월', value: 92 },
  ];

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-gray-100 text-[#142755] border-gray-300',
      green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
    };
    return colors[color] || colors.blue;
  };

  const filterOptions = ['모든 전략', '성공 사례만', '높은 ROI', '낮은 리스크', 'AI/ML', '디지털 전환'];

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const handleExportReport = () => {
    alert('📊 보고서를 내보내는 중입니다...');
  };

  const handleNewAnalysis = () => {
    alert('✨ 새로운 전략 분석을 시작합니다!');
  };

  const handleDismissInsight = () => {
    alert('💡 인사이트를 닫습니다.');
  };

  const handleViewComparison = (comparisonName: string) => {
    alert(`📋 "${comparisonName}" 비교 분석을 불러옵니다.`);
  };

  const handleAdClick = () => {
    alert('🚀 삼성 SDS 엔터프라이즈 AI 솔루션 페이지로 이동합니다.');
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = () => {
    alert('✨ DBR Premium Analytics로 업그레이드되었습니다!');
    setShowUpgradeModal(false);
  };

  const activities = [
    { action: '새 전략 추가됨', user: '김전략', time: '5분 전', type: 'create' },
    { action: '비교 저장됨', user: '박분석', time: '23분 전', type: 'save' },
    { action: 'AI 분석 완료', user: '시스템', time: '1시간 전', type: 'ai' },
  ];

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'}`}>
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-10">
        <div className="max-w-[1440px] mx-auto space-y-12">
          {/* Advertisement Banner - DBR Premium Analytics */}
          <div className={`${
            darkMode
              ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-purple-700/50'
              : 'bg-gradient-to-r from-purple-900 to-indigo-900 border-purple-800'
          } border rounded-xl p-4 flex items-center justify-between relative overflow-hidden group hover:shadow-2xl transition-all cursor-pointer`}>
            <div className="absolute inset-0 bg-black/20"></div>

            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-white font-bold text-lg">DBR Premium Analytics</h3>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <span className="flex items-center gap-1">
                      ⭐ 4.8
                    </span>
                    <span>•</span>
                    <span>✓ 50만+</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              className="relative z-10 px-6 py-2.5 bg-white hover:bg-gray-100 text-purple-900 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl"
            >
              {text.upgrade}
            </button>
          </div>

          {/* Upgrade Modal */}
          {showUpgradeModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl max-w-md w-full shadow-2xl`}>
                <div className="bg-gradient-to-r from-purple-600 to-[#444655] px-6 py-5 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="w-8 h-8 text-white" />
                      <h2 className="text-xl font-bold text-white">DBR Premium Analytics</h2>
                    </div>
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="text-white hover:text-gray-200 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-purple-600 to-[#444655] bg-clip-text text-transparent">₩9,900</span>
                    </div>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>월 구독</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>프리미엄 혜택:</h3>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>무제한 전략 프레임워크 분석</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>모든 전략 도구를 제한 없이 사용하세요</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI 기반 맞춤형 인사이트</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>귀사에 최적화된 전략 제안을 받아보세요</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>실시간 리스크 알림</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>시장 변화에 즉시 대응할 수 있습니다</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>우선 고객 지원</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>전담 상담사의 빠른 지원을 받으세요</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-800/20 dark:to-purple-900/20 p-4 rounded-lg mb-6 text-center border border-gray-300 dark:border-gray-600">
                    <p className="text-sm text-[#142755] dark:text-[#A9AABC]">
                      <span className="font-bold">첫 달 50% 할인!</span> 지금 가입하면 ₩4,950
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className={`flex-1 px-4 py-3 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg font-semibold transition-all`}
                    >
                      {text.later}
                    </button>
                    <button
                      onClick={handleConfirmUpgrade}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-[#444655] text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                    >
                      {text.subscribe}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Search Results */}
          {searchQuery && (
            <div className={`${
              darkMode
                ? 'bg-gradient-to-r from-gray-800/40 to-indigo-900/40 border-gray-600/50'
                : 'bg-gradient-to-r from-gray-50 to-indigo-50 border-gray-300'
            } border rounded-xl p-6 mb-8`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-[#142755] rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    AI 검색 결과: "{searchQuery}"
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                    귀하의 질문과 관련된 전략 사례와 인사이트를 찾았습니다.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className={`${
                  darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200'
                } border rounded-lg p-4`}>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    관련 전략 사례
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    3건의 유사 사례 발견
                  </p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">평균 성공률 87%</span>
                  </div>
                </div>

                <div className={`${
                  darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200'
                } border rounded-lg p-4`}>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    예상 ROI
                  </h3>
                  <p className="text-2xl font-bold text-[#142755] mb-1">320%</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    유사 프로젝트 기준
                  </p>
                </div>

                <div className={`${
                  darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200'
                } border rounded-lg p-4`}>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    리스크 분석
                  </h3>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-lg font-bold text-emerald-600">낮음</span>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    실행 가능성 높음
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Page Header with Quick Actions */}
          <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              {text.title}
            </h1>
            <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {text.subtitle}
              {searchQuery && <span className="ml-2 text-[#142755]">• {text.aiSearchActive}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportReport}
              className={`px-4 py-2.5 ${darkMode ? 'bg-gray-800 hover:bg-gray-750 text-white border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'} border rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow`}
            >
              {text.exportReport}
            </button>
            <button
              onClick={handleNewAnalysis}
              className="px-4 py-2.5 bg-gradient-to-r from-[#142755] to-[#444655] hover:from-[#444655] hover:to-gray-700 text-white rounded-lg font-medium text-sm transition-all shadow-lg hover:shadow-xl"
            >
              {text.newAnalysis}
            </button>
          </div>
        </div>

        {/* Advertisement Banner & Saved Comparisons */}
        <div className="flex items-start justify-between gap-6">
          {/* Advertisement Banner */}
          <div className="flex-1">
            <div className={`${
              darkMode
                ? 'bg-gradient-to-r from-purple-900/40 via-gray-700/40 to-indigo-900/40 border-gray-600/50'
                : 'bg-gradient-to-r from-purple-50 via-gray-100 to-indigo-50 border-gray-300'
            } border rounded-xl p-6 relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer`}>
              <div className={`absolute top-0 right-0 w-40 h-40 ${
                darkMode ? 'bg-gray-1000/10' : 'bg-gray-400/20'
              } rounded-full blur-3xl`}></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="px-2 py-1 bg-[#142755] text-white text-xs font-bold rounded">
                        SPONSORED
                      </div>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      삼성 SDS - 엔터프라이즈 AI 솔루션
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4 leading-relaxed`}>
                      Fortune 500 기업들이 선택한 AI 기반 전략 분석 플랫폼. <br />
                      <span className="font-semibold">30일 무료 체험</span> 지금 시작하세요.
                    </p>
                    <button
                      onClick={handleAdClick}
                      className="px-4 py-2 bg-[#142755] hover:bg-[#444655] text-white rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                      자세히 보기 →
                    </button>
                  </div>
                  <div className={`w-24 h-24 ${darkMode ? 'bg-[#444655]/30' : 'bg-gray-100'} rounded-2xl flex items-center justify-center ml-4`}>
                    <Zap className={`w-12 h-12 ${darkMode ? 'text-[#A9AABC]' : 'text-[#142755]'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Comparisons */}
          <div className={`w-80 ${
            darkMode ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-gray-200'
          } border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bookmark className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {text.savedComparisons}
                </h3>
              </div>
              <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <div className="space-y-2">
              {savedComparisons.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => handleViewComparison(comp.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  } transition-colors group`}
                >
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {comp.name}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {comp.date}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Insight Callout Box */}
        <div className={`relative ${
          darkMode
            ? 'bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-700/30'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
        } border-l-4 border-l-amber-500 rounded-xl p-5 overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-32 h-32 ${
            darkMode ? 'bg-amber-500/5' : 'bg-amber-400/10'
          } rounded-full blur-3xl`}></div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2.5 bg-amber-500/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                💡 빠른 인사이트
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                최근 트렌드에 따르면, <span className="font-semibold">AI 기반 개인화</span>를 활용한 전략이 기존 방식 대비 <span className="font-semibold text-emerald-600 dark:text-emerald-400">+34% 높은 성공률</span>을 보이고 있습니다.
              </p>
            </div>
            <button
              onClick={handleDismissInsight}
              className={`px-4 py-2 ${
                darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
              } border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow`}
            >
              탐색하기
            </button>
          </div>
        </div>

        {/* Executive Summary - KPI Cards */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {text.kpi.performance}
            </h2>
            <select
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value);
                alert(`📅 기간이 "${e.target.value}"로 변경되었습니다.`);
              }}
              className={`px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-700'} border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#142755] transition-all`}
            >
              <option>{text.period.last30}</option>
              <option>{text.period.last90}</option>
              <option>{text.period.thisYear}</option>
            </select>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {kpiData.map((kpi, index) => {
              const Icon = kpi.icon;
              const isPositive = kpi.trend === 'up';

              return (
                <div
                  key={index}
                  className={`${
                    darkMode
                      ? 'bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700/50'
                      : 'bg-white border-gray-200/80'
                  } border rounded-2xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative overflow-hidden`}
                >
                  {/* Subtle background gradient */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    darkMode ? 'bg-gradient-to-br from-gray-800/10 to-transparent' : 'bg-gradient-to-br from-gray-50/50 to-transparent'
                  }`}></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-5">
                      <div className={`p-2.5 ${getColorClass(kpi.color)} rounded-xl border shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {kpi.change}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className={`text-xs font-medium tracking-wide uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {kpi.label}
                      </p>
                      <p className={`text-4xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {kpi.value}
                      </p>
                    </div>

                    {/* Enhanced mini trend line */}
                    <div className="h-14 -mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <defs>
                            <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? '#10B981' : '#EF4444'}
                            strokeWidth={2.5}
                            dot={false}
                            fill={`url(#gradient-${index})`}
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

        {/* AI Insight Hero Section */}
        <section>
          <div className={`relative ${
            darkMode
              ? 'bg-gradient-to-br from-gray-900/40 via-purple-950/30 to-indigo-950/40 border-gray-600/30'
              : 'bg-gradient-to-br from-gray-50/80 via-indigo-50/60 to-purple-50/80 border-gray-300/60'
          } border rounded-2xl p-8 backdrop-blur-sm overflow-hidden`}>
            {/* Decorative elements */}
            <div className={`absolute top-0 right-0 w-64 h-64 ${darkMode ? 'bg-gray-1000/5' : 'bg-gray-400/10'} rounded-full blur-3xl`}></div>
            <div className={`absolute bottom-0 left-0 w-48 h-48 ${darkMode ? 'bg-purple-500/5' : 'bg-purple-400/10'} rounded-full blur-3xl`}></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#142755] to-indigo-600 rounded-xl shadow-lg">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {text.aiInsights}
                    </h3>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      2,458개 유사 사례 분석 • 5분 전 업데이트
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-[#142755]/10 border border-[#142755]/30 rounded-full">
                  <span className="text-xs font-semibold text-[#142755] dark:text-[#A9AABC]">94% 신뢰도</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                {/* Recommended Strategy */}
                <div className={`${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-800/60 to-gray-850/60 border-gray-700/50'
                    : 'bg-white/90 border-gray-200/80'
                } backdrop-blur-sm rounded-xl p-6 border shadow-sm hover:shadow-md transition-all group`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{text.recommendedStrategy}</h4>
                        <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full">
                          89%
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                        AI 기반 고객 세분화를 통한 맞춤형 마케팅 전략이 현재 시장 상황에서 가장 높은 성공 확률을 보입니다.
                      </p>
                    </div>
                  </div>
                  <button className={`w-full mt-3 px-4 py-2 ${
                    darkMode ? 'bg-gray-700/50 hover:bg-gray-700 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  } rounded-lg text-sm font-medium transition-all opacity-0 group-hover:opacity-100`}>
                    {text.viewDetails} →
                  </button>
                </div>

                {/* Risk Signal */}
                <div className={`${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-800/60 to-gray-850/60 border-gray-700/50'
                    : 'bg-white/90 border-gray-200/80'
                } backdrop-blur-sm rounded-xl p-6 border shadow-sm hover:shadow-md transition-all group`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>위험 신호</h4>
                        <span className="px-2.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full">
                          중간
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                        레거시 시스템 통합 과정에서 데이터 마이그레이션 리스크가 중간 수준으로 감지되었습니다.
                      </p>
                    </div>
                  </div>
                  <button className={`w-full mt-3 px-4 py-2 ${
                    darkMode ? 'bg-gray-700/50 hover:bg-gray-700 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  } rounded-lg text-sm font-medium transition-all opacity-0 group-hover:opacity-100`}>
                    리스크 완화 →
                  </button>
                </div>

                {/* Opportunity Area */}
                <div className={`${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-800/60 to-gray-850/60 border-gray-700/50'
                    : 'bg-white/90 border-gray-200/80'
                } backdrop-blur-sm rounded-xl p-6 border shadow-sm hover:shadow-md transition-all group`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-gray-100 dark:bg-[#444655]/30 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-[#142755] dark:text-[#A9AABC]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>기회 영역</h4>
                        <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-[#444655]/30 text-[#142755] dark:text-[#A9AABC] text-xs font-semibold rounded-full">
                          +42%
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                        모바일 퍼스트 전략 도입 시 MZ세대 고객층 확보에서 42% 성장률이 예상됩니다.
                      </p>
                    </div>
                  </div>
                  <button className={`w-full mt-3 px-4 py-2 ${
                    darkMode ? 'bg-gray-700/50 hover:bg-gray-700 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  } rounded-lg text-sm font-medium transition-all opacity-0 group-hover:opacity-100`}>
                    기회 탐색 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Strategy Cases List with Activity Feed */}
        <section className="grid grid-cols-[1fr_320px] gap-8">
          <div>
            <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                전략 사례 분석
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                AI 분석 기반 최고 성과 전략
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>정렬:</span>
                <select className={`text-sm font-semibold bg-transparent focus:outline-none ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <option>AI 점수</option>
                  <option>ROI</option>
                  <option>최신순</option>
                </select>
              </div>
              <button className="px-5 py-2.5 bg-gradient-to-r from-[#142755] to-[#444655] hover:from-[#444655] hover:to-gray-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl">
                전체 사례 보기
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {strategyCases.map((strategy, idx) => (
              <div
                key={strategy.id}
                className={`relative ${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700/50 hover:border-gray-600'
                    : 'bg-white border-gray-200/80 hover:border-gray-300'
                } border rounded-2xl p-7 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer group ${
                  expandedStrategy === strategy.id ? 'overflow-visible' : 'overflow-hidden'
                }`}
              >
                {/* Rank indicator */}
                <div className={`absolute top-0 left-0 px-4 py-1.5 ${
                  idx === 0
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    : idx === 1
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                    : 'bg-gradient-to-r from-orange-600 to-orange-700'
                } rounded-br-xl`}>
                  <span className="text-white text-xs font-bold">#{idx + 1}</span>
                </div>

                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  darkMode ? 'bg-gradient-to-br from-gray-800/10 to-transparent' : 'bg-gradient-to-br from-gray-50/50 to-transparent'
                }`}></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5 pt-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {strategy.title}
                        </h3>
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full shadow-sm">
                          {strategy.status === 'success' ? '✓ 성공' : '실패'}
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {strategy.industry}
                      </p>
                    </div>

                    {/* AI Confidence Ring */}
                    <div className="text-right">
                      <p className={`text-xs font-medium tracking-wide uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        AI 신뢰도
                      </p>
                      <div className="relative inline-flex items-center justify-center">
                        {/* SVG Ring */}
                        <svg className="w-20 h-20 transform -rotate-90">
                          <defs>
                            <linearGradient id={`gradient-${strategy.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3B82F6" />
                              <stop offset="100%" stopColor="#2563EB" />
                            </linearGradient>
                          </defs>
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className={darkMode ? 'text-gray-700' : 'text-gray-200'}
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            stroke={`url(#gradient-${strategy.id})`}
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 32}`}
                            strokeDashoffset={`${2 * Math.PI * 32 * (1 - strategy.confidence / 100)}`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold bg-gradient-to-r from-[#142755] to-[#444655] bg-clip-text text-transparent">
                            {strategy.confidence}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`grid grid-cols-4 gap-6 mb-5 pb-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div>
                      <p className={`text-xs font-medium tracking-wide uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        ROI
                      </p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {strategy.roi}%
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        +{Math.round(strategy.roi / 10)}% 평균 대비
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-medium tracking-wide uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        리스크 레벨
                      </p>
                      <span className={`inline-block px-3 py-1 ${
                        strategy.risk === '낮음'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                      } text-sm font-bold rounded-lg`}>
                        {strategy.risk}
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs font-medium tracking-wide uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        성장률
                      </p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        +{strategy.growth}%
                      </p>
                      <p className="text-xs text-[#142755] dark:text-[#A9AABC] font-semibold mt-1">
                        연간 예측
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className={`px-4 py-2.5 ${
                        darkMode ? 'bg-gray-700/50 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      } text-sm font-semibold rounded-lg transition-all`}>
                        비교하기
                      </button>
                      <button className="px-4 py-2.5 bg-gradient-to-r from-[#142755] to-[#444655] hover:from-[#444655] hover:to-gray-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg hover:shadow-xl">
                        세부정보
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {strategy.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 ${
                            darkMode
                              ? 'bg-[#444655]/30 border-gray-600/50 text-[#A9AABC]'
                              : 'bg-gray-100 border-gray-300 text-[#142755]'
                          } border text-xs font-semibold rounded-lg`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Expandable Strategy Drawer Toggle */}
                    <button
                      onClick={() => setExpandedStrategy(expandedStrategy === strategy.id ? null : strategy.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 ${
                        darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      } rounded-lg transition-all text-sm font-medium`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>댓글 3개</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedStrategy === strategy.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Expandable Drawer */}
                  {expandedStrategy === strategy.id && (
                    <div className={`mt-5 pt-5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} animate-in slide-in-from-top-2 duration-300 max-h-[600px] overflow-y-auto`}>
                      <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                        팀 댓글
                      </h4>
                      <div className="space-y-3 mb-4">
                        {[
                          { user: '박분석', comment: '이 전략은 우리 Q4 목표와 잘 맞습니다', time: '2시간 전' },
                          { user: '이전략', comment: 'ROI 전망이 유망해 보이네요 📈', time: '5시간 전' },
                          { user: '김데이터', comment: '파일럿 프로그램에서 테스트해봐야 할 것 같습니다', time: '1일 전' },
                        ].map((comment, cidx) => (
                          <div key={`${strategy.id}-comment-${cidx}`} className={`flex gap-3 p-3 ${
                            darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                          } rounded-lg`}>
                            <div className={`w-8 h-8 ${
                              cidx === 0 ? 'bg-purple-500' : cidx === 1 ? 'bg-gray-1000' : 'bg-emerald-500'
                            } rounded-full flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white text-xs font-bold">
                                {comment.user[0]}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {comment.user}
                                </span>
                                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {comment.time}
                                </span>
                              </div>
                              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {comment.comment}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          placeholder="댓글 추가..."
                          className={`flex-1 px-3 py-2 ${
                            darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                          } border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142755]`}
                        />
                        <button className="px-4 py-2 bg-[#142755] hover:bg-[#444655] text-white text-sm font-semibold rounded-lg transition-all">
                          게시
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className={`sticky top-8 h-fit ${
            darkMode ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-gray-200'
          } border rounded-2xl p-6 shadow-lg`}>
            <div className="flex items-center gap-2 mb-6">
              <Clock className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                최근 활동
              </h3>
            </div>

            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div key={`activity-${activity.user}-${activity.time}`} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'create' ? 'bg-gray-100 dark:bg-[#444655]/30' :
                    activity.type === 'save' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    'bg-emerald-100 dark:bg-emerald-900/30'
                  }`}>
                    {activity.type === 'create' ? <TrendingUp className="w-4 h-4 text-[#142755] dark:text-[#A9AABC]" /> :
                     activity.type === 'save' ? <Bookmark className="w-4 h-4 text-purple-600 dark:text-purple-400" /> :
                     <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                      {activity.action}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {activity.user} · {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button className={`w-full mt-6 px-4 py-2.5 ${
              darkMode ? 'bg-gray-700/50 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            } rounded-lg text-sm font-semibold transition-all`}>
              모든 활동 보기
            </button>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
