import { Bell, User, ChevronDown, Plus, FileText, FileUp, TrendingUp, DollarSign, Target, Users, ChevronUp, Image } from 'lucide-react';
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
      }
    }
  };

  const text = language === 'en' ? t.en : t.ko;

  const [currentContext, setCurrentContext] = useState(text.currentContext);
  const [selectedCategory, setSelectedCategory] = useState(language === 'en' ? 'Digital Marketing' : '디지털 마케팅');
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: 1,
      name: text.strategies.socialMedia,
      keywords: [text.keywords.sns, text.keywords.targetAd, text.keywords.genZ],
      content: text.strategies.socialMediaContent,
      files: [{ name: language === 'en' ? 'ad_materials.png' : '광고_소재.png', type: 'image' }],
      metrics: { conversion: 8.5, roi: 320, growth: 45, cost: 5000, engagement: 12.3 },
    },
    {
      id: 2,
      name: text.strategies.contentMarketing,
      keywords: [text.keywords.blog, text.keywords.seo, text.keywords.traffic],
      content: text.strategies.contentMarketingContent,
      files: [{ name: language === 'en' ? 'content_plan.pdf' : '콘텐츠_계획.pdf', type: 'pdf' }],
      metrics: { conversion: 6.2, roi: 180, growth: 28, cost: 3000, engagement: 8.7 },
    },
    {
      id: 3,
      name: text.strategies.influencer,
      keywords: [text.keywords.influencer, text.keywords.sponsorship, text.keywords.viral],
      content: text.strategies.influencerContent,
      files: [],
      metrics: { conversion: 7.8, roi: 250, growth: 38, cost: 4000, engagement: 15.2 },
    },
  ]);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);
  const [editingStrategy, setEditingStrategy] = useState<number | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'roi' | 'growth'>('score');

  // Update strategies when language changes
  useEffect(() => {
    setStrategies([
      {
        id: 1,
        name: text.strategies.socialMedia,
        keywords: [text.keywords.sns, text.keywords.targetAd, text.keywords.genZ],
        content: text.strategies.socialMediaContent,
        files: [{ name: language === 'en' ? 'ad_materials.png' : '광고_소재.png', type: 'image' }],
        metrics: { conversion: 8.5, roi: 320, growth: 45, cost: 5000, engagement: 12.3 },
      },
      {
        id: 2,
        name: text.strategies.contentMarketing,
        keywords: [text.keywords.blog, text.keywords.seo, text.keywords.traffic],
        content: text.strategies.contentMarketingContent,
        files: [{ name: language === 'en' ? 'content_plan.pdf' : '콘텐츠_계획.pdf', type: 'pdf' }],
        metrics: { conversion: 6.2, roi: 180, growth: 28, cost: 3000, engagement: 8.7 },
      },
      {
        id: 3,
        name: text.strategies.influencer,
        keywords: [text.keywords.influencer, text.keywords.sponsorship, text.keywords.viral],
        content: text.strategies.influencerContent,
        files: [],
        metrics: { conversion: 7.8, roi: 250, growth: 38, cost: 4000, engagement: 15.2 },
      },
    ]);
    setCurrentContext(text.currentContext);
  }, [language]);

  // 점수 계산 (정량 지표 기반)
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

  // 레이더 차트 데이터
  const radarData = strategiesWithScores.slice(0, 3).map((s, index) => ({
    id: `strategy-${s.id}`,
    strategy: `${s.name.slice(0, language === 'en' ? 15 : 10)}-${s.id}`,
    conversion: s.metrics.conversion,
    roi: s.metrics.roi / 50,
    growth: s.metrics.growth,
    engagement: s.metrics.engagement,
  }));

  // 비교 차트 데이터
  const comparisonData = strategiesWithScores.map((s, index) => ({
    id: `strategy-${s.id}`,
    name: `${s.name.slice(0, language === 'en' ? 12 : 8)}-${s.id}`,
    score: s.score,
    roi: s.metrics.roi / 10,
  }));

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      {/* 상단 선택 바 */}
      <header className={`${darkMode ? 'bg-[#0A0E1A]/80 backdrop-blur-xl border-gray-800/50' : 'bg-white/80 backdrop-blur-xl border-gray-200/50'} border-b sticky top-0 z-50`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <ContextSwitcher
              currentContext={currentContext}
              onSelect={setCurrentContext}
              darkMode={darkMode}
              language={language}
            />

            <div className="flex items-center gap-3">
              <button onClick={onNotificationClick} className={`p-2.5 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} relative rounded-lg transition-all`}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
              </button>
              <button onClick={onProfileClick} className={`p-2.5 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-all`}>
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 max-w-[1600px] mx-auto">
        {/* 상단 인사이트 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/40 to-gray-800/20' : 'bg-gradient-to-br from-indigo-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-100'}`}>
                <Target className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wide`}>{text.avgConversion}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} mb-1`}>
              {(strategiesWithScores.reduce((sum, s) => sum + s.metrics.conversion, 0) / strategiesWithScores.length).toFixed(1)}%
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Above industry avg</div>
          </div>

          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/40 to-gray-800/20' : 'bg-gradient-to-br from-green-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/10' : 'bg-green-100'}`}>
                <DollarSign className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wide`}>{text.avgROI}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'} mb-1`}>
              {Math.round(strategiesWithScores.reduce((sum, s) => sum + s.metrics.roi, 0) / strategiesWithScores.length)}%
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Year over year</div>
          </div>

          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/40 to-gray-800/20' : 'bg-gradient-to-br from-purple-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wide`}>{text.avgGrowth}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'} mb-1`}>
              {Math.round(strategiesWithScores.reduce((sum, s) => sum + s.metrics.growth, 0) / strategiesWithScores.length)}%
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quarterly trend</div>
          </div>

          <div className={`group relative ${darkMode ? 'bg-gradient-to-br from-gray-800/40 to-gray-800/20' : 'bg-gradient-to-br from-orange-50 to-white'} p-5 rounded-2xl backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-orange-500/10' : 'bg-orange-100'}`}>
                <Users className={`w-5 h-5 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
              <div className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-wide`}>{text.totalStrategies}</div>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'} mb-1`}>{strategies.length}</div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active campaigns</div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 전략 리스트 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {text.strategyList}
                <span className={`ml-2 text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {strategies.length}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-3 py-2 text-xs font-medium border ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142755] transition-all`}
                >
                  <option value="score">{text.sortByScore}</option>
                  <option value="roi">{text.sortByROI}</option>
                  <option value="growth">{text.sortByGrowth}</option>
                </select>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#142755] to-[#444655] text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all duration-300">
                  <Plus className="w-4 h-4" />
                  {text.addStrategy}
                </button>
              </div>
            </div>

            {strategiesWithScores.map((strategy, index) => (
              <div
                key={strategy.id}
                className={`group relative ${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30'
                    : 'bg-white'
                } p-5 rounded-2xl transition-all duration-300 ${
                  darkMode
                    ? 'hover:shadow-xl hover:shadow-gray-900/20'
                    : 'shadow-sm hover:shadow-md'
                } overflow-hidden`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {index === 0 && (
                        <span className={`px-2.5 py-1 ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'} text-xs font-medium rounded-lg`}>
                          {text.recommended}
                        </span>
                      )}
                      <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {strategy.keywords.map((kw) => (
                        <span key={`${strategy.id}-keyword-${kw}`} className={`px-2.5 py-1 ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'} text-xs font-medium rounded-lg`}>
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
                            className={`p-1 rounded ${darkMode ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-indigo-600 hover:bg-indigo-50'} transition-colors`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`flex flex-col items-end gap-1 ${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} px-4 py-3 rounded-xl ml-4`}>
                    <div className={`text-3xl font-bold ${
                      (strategy.score || 0) >= 70 ? (darkMode ? 'text-green-400' : 'text-green-600') :
                      (strategy.score || 0) >= 50 ? (darkMode ? 'text-amber-400' : 'text-amber-600') :
                      (darkMode ? 'text-red-400' : 'text-red-600')
                    }`}>
                      {strategy.score}
                    </div>
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{text.possibilityScore}</span>
                  </div>
                </div>

                  {expandedStrategy === strategy.id && (
                    <div className="mb-4 space-y-3">
                      <div className={`${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} p-4 rounded-xl`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>{strategy.content}</p>
                        <button
                          onClick={() => setEditingStrategy(editingStrategy === strategy.id ? null : strategy.id)}
                          className={`text-xs font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} transition-colors`}
                        >
                          {editingStrategy === strategy.id ? text.editComplete : text.edit}
                        </button>
                      </div>

                      {/* 파일 목록 */}
                      <div className={`${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} p-4 rounded-xl`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{text.attachedFiles}</span>
                          <label className={`cursor-pointer text-xs font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} transition-colors`}>
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
                            <div key={`${strategy.id}-file-${file.name}`} className={`flex items-center gap-1.5 px-2.5 py-1.5 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-xs border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              {file.type === 'image' ? <Image className="w-3.5 h-3.5" /> :
                               file.type === 'pdf' ? <FileText className="w-3.5 h-3.5" /> :
                               <FileUp className="w-3.5 h-3.5" />}
                              <span>{file.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 정량 지표 */}
                      <div className={`grid grid-cols-5 gap-3 ${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'} p-4 rounded-xl`}>
                        <div>
                          <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{text.conversion}</div>
                          <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.metrics.conversion}%</div>
                        </div>
                        <div>
                          <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{text.roi}</div>
                          <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.metrics.roi}%</div>
                        </div>
                        <div>
                          <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{text.growth}</div>
                          <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.metrics.growth}%</div>
                        </div>
                        <div>
                          <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{text.cost}</div>
                          <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>${strategy.metrics.cost}</div>
                        </div>
                        <div>
                          <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{text.engagement}</div>
                          <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{strategy.metrics.engagement}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                <button
                  onClick={() => setExpandedStrategy(expandedStrategy === strategy.id ? null : strategy.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
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

          {/* 데이터 시각화 */}
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-5`}>
              Performance Analytics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'} p-6 rounded-2xl ${darkMode ? 'shadow-xl shadow-gray-900/20' : 'shadow-sm'}`}>
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>{text.radarChart}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth={1} />
                    <PolarAngleAxis
                      dataKey="strategy"
                      tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280', fontWeight: 500 }}
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
                      stroke="#142755"
                      fill="#142755"
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
                    <Legend
                      wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'} p-6 rounded-2xl ${darkMode ? 'shadow-xl shadow-gray-900/20' : 'shadow-sm'}`}>
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>{text.barChart}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? '#374151' : '#e5e7eb'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280', fontWeight: 500 }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                    />
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
                      fill="#142755"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={`col-span-2 ${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'} p-6 rounded-2xl ${darkMode ? 'shadow-xl shadow-gray-900/20' : 'shadow-sm'}`}>
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>{text.lineChart}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? '#374151' : '#e5e7eb'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280', fontWeight: 500 }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                    />
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
    </div>
  );
}
