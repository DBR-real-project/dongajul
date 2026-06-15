import { Shield, TrendingUp, AlertTriangle, ArrowRight, BarChart2, Database, Zap, ChevronRight, CheckCircle } from 'lucide-react';
import { useArticleCount } from '../utils/articleCount';
import { BannerAd } from './BannerAd';

interface EnterpriseDashboardProps {
  darkMode?: boolean;
  onStartDiagnosis?: () => void;
  onViewInsights?: () => void;
  searchQuery?: string;
  onCompareClick?: (items: any[]) => void;
}

export function EnterpriseDashboard({ darkMode = false, onStartDiagnosis, onViewInsights }: EnterpriseDashboardProps) {
  const totalArticles = useArticleCount();

  const stats = [
    { label: '분석 아티클', value: totalArticles || '...', unit: '건', icon: Database, color: 'blue' },
    { label: '진단 정확도', value: '97.7', unit: '%', icon: TrendingUp, color: 'green' },
    { label: '평균 진단 시간', value: '< 3', unit: '초', icon: Zap, color: 'yellow' },
    { label: '리스크 감지율', value: '87', unit: '%', icon: Shield, color: 'red' },
  ];

  const features = [
    { icon: Shield, title: '리스크 정밀 진단', desc: `${totalArticles ?? '...'}건의 DBR·HBR 성공·실패 사례와 코사인 유사도 기반으로 전략 리스크를 정량 점수화합니다.`, color: 'indigo' },
    { icon: AlertTriangle, title: '실패 패턴 대조 분석', desc: '단순 성공 사례 나열이 아닌, 과거 실패 경로와의 대조를 통해 회피 전략을 즉각 제안합니다.', color: 'red' },
    { icon: BarChart2, title: '시맨틱 인사이트 맵', desc: 'UMAP 기반 2D 벡터 공간에 전략 위치를 시각화해 성공 군집과의 거리를 한눈에 파악합니다.', color: 'green' },
  ];

  const steps = [
    { num: '01', title: '전략 입력', desc: '분석할 비즈니스 전략을 자유롭게 입력합니다.' },
    { num: '02', title: 'AI 분석', desc: 'SBERT 임베딩 + FAISS 벡터 검색으로 유사 사례를 탐색합니다.' },
    { num: '03', title: '리스크 산출', desc: 'MLP 분류기가 실패 확률과 리스크 등급을 즉시 산출합니다.' },
    { num: '04', title: '결과 확인', desc: '유사 성공·실패 사례와 함께 회피 전략을 확인합니다.' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-500', green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500', red: 'bg-red-500/10 text-red-500',
    indigo: 'bg-indigo-500/10 text-indigo-600',
  };

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#F8FAFC]'}`}>

      {/* Premium Banner */}
      <section className="px-8 pt-6 max-w-5xl mx-auto">
        <BannerAd />
      </section>

      {/* Hero */}
      {/* 💡 배경색이 딥 블랙 네이비로 수정되었습니다. */}
      <section className={`relative overflow-hidden ${darkMode ? 'bg-gradient-to-b from-[#050B14] to-[#0A1128]' : 'bg-gradient-to-b from-[#0A1128] via-[#142755] to-[#0A1128]'} px-8 py-20 text-white`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#E5BA73] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-xs font-semibold text-[#E5BA73] mb-6 border border-white/10">
            <Zap className="w-3.5 h-3.5" /> DBR · HBR {totalArticles ?? '...'}건 사례 기반 AI 진단
          </div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            당신의 전략,<br /><span className="text-[#E5BA73]">실패할 확률</span>을 알고 계신가요?
          </h1>
          <p className="text-lg text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            동아줄은 15년간 축적된 경영 사례 데이터를 AI로 분석해<br />
            전략 리스크를 정량화하고 실패 패턴을 사전에 차단합니다.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={onStartDiagnosis} className="flex items-center gap-2 px-8 py-4 bg-[#E5BA73] hover:bg-[#d4a843] text-[#0B2F61] font-bold rounded-xl text-base shadow-xl hover:shadow-2xl transition-all">
              지금 전략 진단하기 <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={onViewInsights} className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-base border border-white/20 backdrop-blur transition-all">
              인사이트 보기 <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-8 py-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-4 gap-4">
          {stats.map(({ label, value, unit, icon: Icon, color }) => (
            <div key={label} className={`${darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-100'} p-5 rounded-2xl border shadow-sm text-center`}>
              <div className={`w-10 h-10 ${colorMap[color]} rounded-xl flex items-center justify-center mx-auto mb-3`}><Icon className="w-5 h-5" /></div>
              <div className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>{value}<span className="text-lg font-semibold text-gray-400 ml-0.5">{unit}</span></div>
              <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 pb-10 max-w-5xl mx-auto">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} text-center mb-2`}>왜 동아줄인가?</h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center mb-8`}>단순 정보 나열이 아닌, 실패를 방지하는 대조 분석 기반 AI 플랫폼</p>
        <div className="grid grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className={`${darkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-white border-gray-100'} p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all`}>
              <div className={`w-11 h-11 ${colorMap[color]} rounded-xl flex items-center justify-center mb-4`}><Icon className="w-6 h-6" /></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{title}</h3>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className={`px-8 py-12 ${darkMode ? 'bg-gray-900/40' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} text-center mb-2`}>진단 프로세스</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center mb-10`}>단 3초 만에 전문 컨설턴트 수준의 전략 리스크 진단</p>
          <div className="grid grid-cols-4 gap-4">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-[#F8FAFC] border-gray-200'} p-5 rounded-2xl border`}>
                <div className="w-10 h-10 bg-gradient-to-br from-[#142755] to-[#3B547E] text-white rounded-xl flex items-center justify-center text-sm font-bold mb-4">{num}</div>
                <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{title}</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-14 max-w-5xl mx-auto text-center">
        {/* 💡 상단 Hero 섹션과 톤을 맞춰 딥 블랙 네이비로 수정되었습니다. */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-[#050B14] to-[#0A1128]' : 'bg-gradient-to-br from-[#0A1128] to-[#142755]'} rounded-3xl p-12 text-white shadow-lg`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-[#E5BA73]" />
            <span className="text-sm font-semibold text-[#E5BA73]">지금 바로 무료로 시작하세요</span>
          </div>
          <h2 className="text-3xl font-extrabold mb-3">데이터로 증명되지 않는 전략은<br />비싼 비용을 치르는 도박입니다.</h2>
          <p className="text-blue-200 text-sm mb-8">동아줄이 그 연결을 증명하겠습니다.</p>
          <button onClick={onStartDiagnosis} className="inline-flex items-center gap-2 px-10 py-4 bg-[#E5BA73] hover:bg-[#d4a843] text-[#0B2F61] font-bold rounded-xl text-base shadow-xl transition-all">
            전략 진단 시작하기 <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}