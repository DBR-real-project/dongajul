import { ChevronDown, Plus, FileText, FileUp, TrendingUp, DollarSign, Target, Users, ChevronUp, Image, X } from 'lucide-react';
import { TabType } from '../App';
import { ContextSwitcher } from './ContextSwitcher';
import { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface StrategyWorkspaceProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  darkMode: boolean;
  language: string;
}

interface Strategy {
  id: number;
  name: string;
  keywords: string[];
  content: string;
  files: { name: string; type: string; url?: string }[];
  metrics: {
    conversion: number;
    roi: number;
    growth: number;
    cost: number;
    engagement: number;
  };
  score?: number;
}

export function StrategyWorkspace({ activeTab, onTabChange, onNotificationClick, onProfileClick, darkMode, language }: StrategyWorkspaceProps) {
  const t = {
    ko: {
      currentContext: '프로젝트 A',
      dashboard: '데이터분석',
      strategy: '전략 관리',
      history: '히스토리',
      avgConversion: '평균 전환율',
      avgROI: '평균 ROI',
      avgGrowth: '평균 성장률',
      totalStrategies: '총 전략 수',
      strategyList: '전략 목록',
      sortByScore: '점수순',
      sortByROI: 'ROI순',
      sortByGrowth: '성장률순',
      addStrategy: '추가',
      recommended: '추천',
      viewDetails: '자세히 보기',
      collapse: '접기',
      edit: '편집하기',
      editComplete: '편집 완료',
      attachedFiles: '첨부 파일',
      addFile: '파일 추가',
      addKeyword: '키워드 추가',
      conversion: '전환율',
      roi: 'ROI',
      growth: '성장률',
      cost: '비용',
      engagement: '참여도',
      possibilityScore: '가능성 점수',
      radarChart: '전략 비교 (레이더)',
      barChart: '점수 비교 (바 차트)',
      lineChart: 'ROI 추세',
      score: '점수',
      performanceAnalytics: '성과 분석 지표',
      cardSubLabels: {
        conversion: '업계 평균 이상',
        roi: '전년 대비 증가',
        growth: '분기별 성장 추세',
        campaigns: '활성화된 캠페인'
      },
      chartLabels: {
        conversionRate: '전환율',
        roi: 'ROI',
        growthRate: '성장률',
        engagement: '참여도',
        name: '이름',
      },
      strategies: {
        socialMedia: '소셜미디어 광고 캠페인',
        socialMediaContent: '인스타그램과 틱톡을 활용한 타겟 광고 집행. MZ세대 공략을 위한 숏폼 콘텐츠 중심 전략.',
        contentMarketing: '콘텐츠 마케팅 강화',
        contentMarketingContent: '검색 최적화된 블로그 콘텐츠 생산. 주 3회 업로드를 통한 자연 유입 확대.',
        influencer: '인플루언서 협업',
        influencerContent: '마이크로 인플루언서 10명과 협업. 진정성 있는 리뷰를 통한 브랜드 신뢰도 향상.',
      },
      keywords: {
        sns: 'SNS',
        targetAd: '타겟광고',
        genZ: 'MZ세대',
        blog: '블로그',
        seo: 'SEO',
        traffic: '유입',
        influencer: '인플루언서',
        sponsorship: '협찬',
        viral: '바이럴',
      },
      modal: {
        title: '새 전략 추가',
        name: '전략 이름',
        content: '상세 내용',
        cancel: '취소',
        submit: '등록'
      }
    },
    en: {
      currentContext: 'Project A',
      dashboard: 'Data Analysis',
      strategy: 'Strategy Management',
      history: 'History',
      avgConversion: 'Avg Conversion',
      avgROI: 'Avg ROI',
      avgGrowth: 'Avg Growth',
      totalStrategies: 'Total Strategies',
      strategyList: 'Strategy List',
      sortByScore: 'By Score',
      sortByROI: 'By ROI',
      sortByGrowth: 'By Growth',
      addStrategy: 'Add',
      recommended: 'Recommended',
      viewDetails: 'View Details',
      collapse: 'Collapse',
      edit: 'Edit',
      editComplete: 'Done',
      attachedFiles: 'Attached Files',
      addFile: 'Add File',
      addKeyword: 'Add Keyword',
      conversion: 'Conversion',
      roi: 'ROI',
      growth: 'Growth',
      cost: 'Cost',
      engagement: 'Engagement',
      possibilityScore: 'Possibility Score',
      radarChart: 'Strategy Comparison (Radar)',
      barChart: 'Score Comparison (Bar)',
      lineChart: 'ROI Trend',
      score: 'Score',
      performanceAnalytics: 'Performance Analytics',
      cardSubLabels: {
        conversion: 'Above industry avg',
        roi: 'Year over year',
        growth: 'Quarterly trend',
        campaigns: 'Active campaigns'
      },
      chartLabels: {
        conversionRate: 'Conversion',
        roi: 'ROI',
        growthRate: 'Growth',
        engagement: 'Engagement',
        name: 'Name',
      },
      strategies: {
        socialMedia: 'Social Media Ad Campaign',
        socialMediaContent: 'Targeted advertising on Instagram and TikTok. Short-form content strategy targeting Gen Z.',
        contentMarketing: 'Content Marketing Enhancement',
        contentMarketingContent: 'SEO-optimized blog content production. Expanding organic traffic through 3 uploads per week.',
        influencer: 'Influencer Collaboration',
        influencerContent: 'Collaboration with 10 micro-influencers. Enhancing brand trust through authentic reviews.',
      },
      keywords: {
        sns: 'SNS',
        targetAd: 'Targeted Ads',
        genZ: 'Gen Z',
        blog: 'Blog',
        seo: 'SEO',
        traffic: 'Traffic',
        influencer: 'Influencer',
        sponsorship: 'Sponsorship',
        viral: 'Viral',
      },
      modal: {
        title: 'Add New Strategy',
        name: 'Strategy Name',
        content: 'Details',
        cancel: 'Cancel',
        submit: 'Submit'
      }
    }
  };

  const text = language === 'en' ? t.en : t.ko;

  const [currentContext, setCurrentContext] = useState(text.currentContext);
  const [selectedCategory, setSelectedCategory] = useState(language === 'en' ? 'Digital Marketing' : '디지털 마케팅');
  // TODO: 사용자가 등록한 전략 목록 — 백엔드 연동 전까지 빈 배열
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);
  const [editingStrategy, setEditingStrategy] = useState<number | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'roi' | 'growth'>('score');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    content: '',
    conversion: 5.0,
    roi: 100,
    growth: 10,
    cost: 1000,
    engagement: 5.0
  });

  useEffect(() => {
    setCurrentContext(text.currentContext);
  }, [language]);

  const calculateScore = (metrics: Strategy['metrics']) => {
    const normalized = {
      conversion: (metrics.conversion / 10) * 20,
      roi: Math.min((metrics.roi / 500) * 25, 25),
      growth: Math.min((metrics.growth / 100) * 20, 20),
      engagement: Math.min((metrics.engagement / 20) * 20, 20),
      cost: Math.max(25 - (metrics.cost / 10000) * 25, 0),
    };
    return Math.round(Object.values(normalized).reduce((a, b) => a + b, 0));
  };

  const strategiesWithScores = strategies
    .map(s => ({ ...s, score: calculateScore(s.metrics) }))
    .sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'roi') return b.metrics.roi - a.metrics.roi;
      if (sortBy === 'growth') return b.metrics.growth - a.metrics.growth;
      return 0;
    });

  const addKeyword = (strategyId: number) => {
    if (!newKeyword.trim()) return;
    setStrategies(prev =>
      prev.map(s =>
        s.id === strategyId ? { ...s, keywords: [...s.keywords, newKeyword.trim()] } : s
      )
    );
    setNewKeyword('');
  };

  const handleFileUpload = (strategyId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'text';
    setStrategies(prev =>
      prev.map(s =>
        s.id === strategyId
          ? { ...s, files: [...s.files, { name: file.name, type: fileType }] }
          : s
      )
    );
  };

  const handleAddStrategySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStrategy.name.trim()) return;

    const createdStrategy: Strategy = {
      id: Date.now(),
      name: newStrategy.name,
      keywords: [language === 'en' ? 'New' : '신규'],
      content: newStrategy.content || (language === 'en' ? 'No description available.' : '등록된 상세 내용이 없습니다.'),
      files: [],
      metrics: {
        conversion: Number(newStrategy.conversion),
        roi: Number(newStrategy.roi),
        growth: Number(newStrategy.growth),
        cost: Number(newStrategy.cost),
        engagement: Number(newStrategy.engagement),
      }
    };

    setStrategies(prev => [...prev, createdStrategy]);
    setIsAddModalOpen(false);
    setNewStrategy({
      name: '',
      content: '',
      conversion: 5.0,
      roi: 100,
      growth: 10,
      cost: 1000,
      engagement: 5.0
    });
  };

  const radarData = strategiesWithScores.slice(0, 3).map((s) => ({
    id: `strategy-${s.id}`,
    strategy: `${s.name.slice(0, language === 'en' ? 15 : 10)}-${s.id}`,
    conversion: s.metrics.conversion,
    roi: s.metrics.roi / 50,
    growth: s.metrics.growth,
    engagement: s.metrics.engagement,
  }));

  const comparisonData = strategiesWithScores.map((s) => ({
    id: `strategy-${s.id}`,
    name: `${s.name.slice(0, language === 'en' ? 12 : 8)}-${s.id}`,
    score: s.score,
    roi: s.metrics.roi / 10,
  }));

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      
      {/* 서브 헤더 */}
      <header className={`${darkMode ? 'bg-[#0A0E1A]/80 backdrop-blur-xl border-gray-800/50' : 'bg-white/80 backdrop-blur-xl border-gray-200/50'} border-b sticky top-0 z-40`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-start">
            <ContextSwitcher
              currentContext={currentContext}
              onSelect={setCurrentContext}
              darkMode={darkMode}
              language={language}
            />
          </div>
        </div>
      </header>

      <div className="px-6 py-6 max-w-[1600px] mx-auto">
        {/* 🛠️ 상단 4구 통계 카드 다크모드 가독성 강화 (text-gray-400 -> text-gray-200/white로 전면 톤업) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/70 to-gray-800/40 border border-gray-700/50' : 'bg-gradient-to-br from-indigo-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                <Target className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-400'} uppercase tracking-wide`}>{text.avgConversion}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-indigo-600'} mb-1`}>
              {strategiesWithScores.length ? (strategiesWithScores.reduce((sum, s) => sum + s.metrics.conversion, 0) / strategiesWithScores.length).toFixed(1) : '0.0'}%
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{text.cardSubLabels.conversion}</div>
          </div>

          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/70 to-gray-800/40 border border-gray-700/50' : 'bg-gradient-to-br from-green-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <DollarSign className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-400'} uppercase tracking-wide`}>{text.avgROI}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-green-600'} mb-1`}>
              {strategiesWithScores.length ? Math.round(strategiesWithScores.reduce((sum, s) => sum + s.metrics.roi, 0) / strategiesWithScores.length) : 0}%
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{text.cardSubLabels.roi}</div>
          </div>

          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/70 to-gray-800/40 border border-gray-700/50' : 'bg-gradient-to-br from-purple-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-400'} uppercase tracking-wide`}>{text.avgGrowth}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-purple-600'} mb-1`}>
              {strategiesWithScores.length ? Math.round(strategiesWithScores.reduce((sum, s) => sum + s.metrics.growth, 0) / strategiesWithScores.length) : 0}%
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{text.cardSubLabels.growth}</div>
          </div>

          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/70 to-gray-800/40 border border-gray-700/50' : 'bg-gradient-to-br from-orange-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                <Users className={`w-5 h-5 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
              <div className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-400'} uppercase tracking-wide`}>{text.totalStrategies}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-orange-600'} mb-1`}>{strategies.length}</div>
            <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{text.cardSubLabels.campaigns}</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {text.strategyList}
                <span className={`ml-2 text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {strategies.length}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-3 py-2 text-xs font-bold border ${darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142755] transition-all`}
                >
                  <option value="score">{text.sortByScore}</option>
                  <option value="roi">{text.sortByROI}</option>
                  <option value="growth">{text.sortByGrowth}</option>
                </select>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#142755] to-[#444655] text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="w-4 h-4" />
                  {text.addStrategy}
                </button>
              </div>
            </div>

            {strategiesWithScores.map((strategy, index) => (
              <div
                key={strategy.id}
                className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/80 to-gray-800/40 border border-gray-700/60' : 'bg-white border border-gray-200'} p-5 rounded-2xl transition-all duration-300 ${darkMode ? 'hover:shadow-xl hover:shadow-gray-950/40' : 'shadow-sm hover:shadow-md'} overflow-hidden`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {index === 0 && (
                        <span className={`px-2.5 py-1 ${darkMode ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-50 text-amber-700'} text-xs font-bold rounded-lg`}>
                          {text.recommended}
                        </span>
                      )}
                      {/* 🛠️ 전략 카드 타이틀 다크모드 가독성 전면 개선 */}
                      <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {strategy.keywords.map((kw) => (
                        <span key={`${strategy.id}-keyword-${kw}`} className={`px-2.5 py-1 ${darkMode ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'bg-indigo-50 text-indigo-700'} text-xs font-medium rounded-lg`}>
                          #{kw}
                        </span>
                      ))}
                      {editingStrategy === strategy.id && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addKeyword(strategy.id)}
                            placeholder={text.addKeyword}
                            className={`px-3 py-1 text-xs border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-indigo-300 text-gray-900'} rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          />
                          <button
                            onClick={() => addKeyword(strategy.id)}
                            className={`p-1 rounded ${darkMode ? 'text-indigo-300 hover:bg-indigo-500/20' : 'text-indigo-600 hover:bg-indigo-50'} transition-colors`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 🛠️ 우측 가능성 점수 뱃지 다크모드 배경 가인성 정비 */}
                  <div className={`flex flex-col items-end gap-1 ${darkMode ? 'bg-gray-900 border border-gray-700/50' : 'bg-gray-50/50'} px-4 py-3 rounded-xl ml-4`}>
                    <div className={`text-3xl font-extrabold ${(strategy.score || 0) >= 70 ? (darkMode ? 'text-green-400' : 'text-green-600') : (strategy.score || 0) >= 50 ? (darkMode ? 'text-amber-400' : 'text-amber-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                      {strategy.score}
                    </div>
                    <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{text.possibilityScore}</span>
                  </div>
                </div>

                {expandedStrategy === strategy.id && (
                  <div className="mb-4 space-y-3">
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-900/60 border border-gray-800' : 'bg-gray-50/50'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed mb-3 font-medium`}>{strategy.content}</p>
                      <button
                        onClick={() => setEditingStrategy(editingStrategy === strategy.id ? null : strategy.id)}
                        className={`text-xs font-bold ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} transition-colors`}
                      >
                        {editingStrategy === strategy.id ? text.editComplete : text.edit}
                      </button>
                    </div>

                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-900/60 border border-gray-800' : 'bg-gray-50/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{text.attachedFiles}</span>
                        <label className={`cursor-pointer text-xs font-bold ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} transition-colors`}>
                          {text.addFile}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(strategy.id, e)}
                            accept=".txt,.pdf,image/*"
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {strategy.files.map((file) => (
                          <div key={`${strategy.id}-file-${file.name}`} className={`flex items-center gap-1.5 px-2.5 py-1.5 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white text-gray-700 border-gray-200'} rounded-lg text-xs border`}>
                            {file.type === 'image' ? <Image className="w-3.5 h-3.5" /> : file.type === 'pdf' ? <FileText className="w-3.5 h-3.5" /> : <FileUp className="w-3.5 h-3.5" />}
                            <span className="font-medium">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`grid grid-cols-5 gap-3 ${darkMode ? 'bg-gray-950 border border-gray-800' : 'bg-gray-50/50'} p-4 rounded-xl`}>
                      <div>
                        <div className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{text.conversion}</div>
                        <div className={`text-sm sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.metrics.conversion}%</div>
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{text.roi}</div>
                        <div className={`text-sm sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.metrics.roi}%</div>
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{text.growth}</div>
                        <div className={`text-sm sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.metrics.growth}%</div>
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{text.cost}</div>
                        <div className={`text-sm sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {language === 'ko' ? `${(strategy.metrics.cost * 1350).toLocaleString()}원` : `$${strategy.metrics.cost}`}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{text.engagement}</div>
                        <div className={`text-sm sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.metrics.engagement}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🛠️ 자세히 보기 / 접기 제어 텍스트 다크모드 가독성 강화 */}
                <button
                  onClick={() => setExpandedStrategy(expandedStrategy === strategy.id ? null : strategy.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold ${darkMode ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                >
                  {expandedStrategy === strategy.id ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      {text.collapse}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      {text.viewDetails}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* 데이터 시각화 차트 섹션 */}
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-5`}>
              {text.performanceAnalytics}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/50' : 'bg-white'} p-6 rounded-2xl ${darkMode ? 'shadow-xl shadow-gray-950/40' : 'shadow-sm'}`}>
                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>{text.radarChart}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={darkMode ? '#4b5563' : '#e5e7eb'} strokeWidth={1} />
                    <PolarAngleAxis
                      dataKey="strategy"
                      tick={{ fontSize: 11, fill: darkMode ? '#d1d5db' : '#6b7280', fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 50]}
                      tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                    />
                    <Radar
                      key="radar-conversion"
                      name={text.chartLabels.conversionRate}
                      dataKey="conversion"
                      stroke={darkMode ? '#6366f1' : '#142755'}
                      fill={darkMode ? '#6366f1' : '#142755'}
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <Radar
                      key="radar-roi"
                      name={text.chartLabels.roi}
                      dataKey="roi"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: darkMode ? '#fff' : '#000' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/50' : 'bg-white'} p-6 rounded-2xl ${darkMode ? 'shadow-xl shadow-gray-950/40' : 'shadow-sm'}`}>
                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>{text.barChart}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? '#4b5563' : '#e5e7eb'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: darkMode ? '#d1d5db' : '#6b7280', fontWeight: 600 }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                    <Tooltip
                      contentStyle={darkMode ? {
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      } : {
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    />
                    <Bar
                      dataKey="score"
                      fill={darkMode ? '#3b82f6' : '#142755'}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={`col-span-1 md:col-span-2 ${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30 border border-gray-700/50' : 'bg-white'} p-6 rounded-2xl ${darkMode ? 'shadow-xl shadow-gray-950/40' : 'shadow-sm'}`}>
                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>{text.lineChart}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? '#4b5563' : '#e5e7eb'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: darkMode ? '#d1d5db' : '#6b7280', fontWeight: 600 }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                    <Tooltip
                      contentStyle={darkMode ? {
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      } : {
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="roi"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 신규 전략 추가 모달 오버레이 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all ${darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900'}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                {text.modal.title}
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddStrategySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">{text.modal.name}</label>
                <input
                  type="text"
                  required
                  value={newStrategy.name}
                  onChange={e => setNewStrategy(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={language === 'en' ? 'Enter strategy name' : '전략 이름을 입력하세요'}
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">{text.modal.content}</label>
                <textarea
                  value={newStrategy.content}
                  onChange={e => setNewStrategy(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={language === 'en' ? 'Describe the strategy details' : '전략의 세부 내용을 입력하세요'}
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium mb-1">{text.conversion} (%)</label>
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={newStrategy.conversion}
                    onChange={e => setNewStrategy(prev => ({ ...prev, conversion: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{text.roi} (%)</label>
                  <input
                    type="number" min="0"
                    value={newStrategy.roi}
                    onChange={e => setNewStrategy(prev => ({ ...prev, roi: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{text.growth} (%)</label>
                  <input
                    type="number" min="0"
                    value={newStrategy.growth}
                    onChange={e => setNewStrategy(prev => ({ ...prev, growth: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{text.engagement} (%)</label>
                  <input
                    type="number" step="0.1" min="0"
                    value={newStrategy.engagement}
                    onChange={e => setNewStrategy(prev => ({ ...prev, engagement: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">{text.cost} ($)</label>
                  <input
                    type="number" min="0"
                    value={newStrategy.cost}
                    onChange={e => setNewStrategy(prev => ({ ...prev, cost: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                >
                  {text.modal.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white rounded-xl bg-gradient-to-r from-[#142755] to-[#444655] hover:shadow-lg transition-all"
                >
                  {text.modal.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}