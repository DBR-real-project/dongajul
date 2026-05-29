import { ArrowLeft, Building2, Calendar, TrendingUp, TrendingDown, Target, Users, DollarSign, Lightbulb, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

// 외부에서 전달하는 컴포넌트 Props 규격 정의
interface ArticleDetailProps {
  articleId: number; // 조회할 아티클의 고유 ID
  onBack: () => void; // '목록으로' 버튼을 누를 때 뷰 상태를 원복할 이벤트 콜백 함수
  darkMode?: boolean; // 가독성 선제 조치를 위한 다크모드 옵션 추가
}

// 아티클 상세 데이터를 보관하는 데이터 레이어 객체
const articleDetails: Record<number, any> = {
  1: {
    title: '넷플릭스의 데이터 기반 콘텐츠 전략',
    company: 'Netflix',
    category: 'success',
    industry: '엔터테인먼트',
    date: '2026.04.15',
    summary: '빅데이터 분석을 통한 오리지널 콘텐츠 제작으로 구독자 2억 명 돌파',
    background: '넷픽스는 2007년 스트리밍 서비스를 시작한 이후, 전통적인 콘텐츠 배급사에서 제작사로 전환하는 대담한 결정을 내렸습니다. 2013년 첫 오리지널 시리즈 "하우스 오브 카드"를 시작으로 데이터 기반 콘텐츠 제작 전략을 본격화했습니다.',
    strategy: ['시청 데이터 분석을 통한 콘텐츠 기획 및 제작 결정', '지역별 취향을 고려한 글로벌 콘텐츠 전략', 'A/B 테스팅을 통한 썸네일, 예고편 최적화', '알고리즘 기반 개인화 추천 시스템 고도화'],
    results: ['2020년 기준 구독자 2억 명 돌파', '오리지널 콘텐츠 투자 대비 높은 시청률 달성', '에미상 등 주요 시상식에서 다수 수상', '콘텐츠 제작 효율성 30% 향상'],
    keyInsights: ['데이터 분석을 통해 제작 리스크를 최소화하고 성공 확률을 높임', '고객 행동 패턴을 깊이 이해하여 맞춤형 경험 제공', '전통적인 방송사와 달리 시청률이 아닌 완주율을 핵심 지표로 활용', '글로벌 데이터를 활용하되 로컬 콘텐츠의 중요성도 인식'],
    lessons: ['데이터는 의사결정의 도구이지 창의성을 대체하는 것이 아님', '고객 데이터 수집과 분석 인프라에 대한 지속적인 투자 필요', '데이터 기반 의사결정 문화를 조직 전체에 확산시키는 것이 중요', '개인정보 보호와 데이터 활용 사이의 균형 유지 필요'],
    // 지표 분석 레이아웃을 위한 수치 데이터 추가
    metrics: [
      { name: '효율성', score: 85 },
      { name: '성장률', score: 92 },
      { name: 'ROI', score: 78 },
      { name: '리스크', score: 30 },
      { name: '고객참여', score: 95 }
    ]
  },
  3: {
    title: '코닥의 디지털 전환 실패',
    company: 'Kodak',
    category: 'failure',
    industry: '사진/이미징',
    date: '2026.04.05',
    summary: '디지털 카메라를 최초 개발했으나 필름 사업 고수로 몰락',
    background: '코닥은 1975년 세계 최초로 디지털 카메라를 개발한 회사였습니다. 하지만 필름 사업에서 발생하는 높은 수익성을 포기하지 못하고 디지털 전환을 미루다가 결국 2012년 파산 보호를 신청하게 되었습니다.',
    strategy: ['디지털 카메라 기술을 개발했지만 상용화를 미룸', '필름 사업의 높은 마진율에 의존', '디지털 시장 진입을 늦추고 방어적 전략 채택', '조직 내부의 저항과 기존 사업 보호 우선'],
    results: ['2000년대 초 시장 점유율 급락', '2012년 파산 보호 신청', '직원 수 14만 명에서 수천 명으로 감소', '디지털 카메라 시장을 경쟁사에게 내어줌'],
    keyInsights: ['기술 혁신을 이루었어도 사업화하지 않으면 의미 없음', '기존 수익 모델에 대한 집착이 혁신의 최대 장애물', '조직 내부의 저항을 극복하는 리더십의 중요성', '시장 변화를 인지했지만 행동으로 옮기지 못한 전형적 사례'],
    lessons: ['혁신 기술은 보유만으로는 부족하며 과감한 사업화가 필요', '단기 수익보다 장기 생존을 우선시하는 전략적 결단 필요', '기존 사업 부서와 신사업 부서를 분리하여 자율성 부여', '경영진이 솔선수범하여 변화를 주도해야 함'],
    metrics: [
      { name: '효율성', score: 40 },
      { name: '성장률', score: 15 },
      { name: 'ROI', score: 25 },
      { name: '리스크', score: 85 },
      { name: '고객참여', score: 35 }
    ]
  }
};

// 상징색 연동을 위한 브랜드 상수 설정 (CompareView 스타일 상속)
const BRAND_NAVY = '#0B2F61'; // 성공/혁신 지표용
const BRAND_GOLD = '#C8994B'; // 위험/실패 지표용

export function ArticleDetail({ articleId, onBack, darkMode = false }: ArticleDetailProps) {
  const article = articleDetails[articleId] || articleDetails[1];
  const isSuccess = article.category === 'success';

  // 차트 컴포넌트 가독성을 높이기 위한 메인 색상 분기
  const primaryColor = isSuccess ? BRAND_NAVY : BRAND_GOLD;

  return (
    <div className={`h-full min-h-screen overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} pb-24`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-8">
        
        {/* 상단 스티키 헤더 바 영역 */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={onBack}
              className={`flex items-center gap-2 mb-4 px-3 py-2 ${
                darkMode ? 'hover:bg-gray-800/60 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              } rounded-xl transition-all`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">목록으로</span>
            </button>

            {/* 성공 / 실패 배지 */}
            <div className="flex items-center gap-2 mb-3">
              {isSuccess ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                isSuccess 
                  ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                  : darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
              }`}>
                {isSuccess ? '성공 사례' : '실패 사례'}
              </span>
            </div>

            {/* 아티클 대형 타이틀 */}
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 leading-snug`}>
              {article.title}
            </h1>

            {/* 메타 데이터 컬렉션 */}
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{article.company}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{article.industry}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{article.date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 요약 그리드 카드 (좌측 바 하이라이팅 적용) */}
        <div className={`relative p-6 rounded-2xl border-l-4 ${isSuccess ? 'border-emerald-500' : 'border-red-500'} ${
          darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white shadow-sm'
        }`}>
          <div className={`inline-flex items-center gap-1.5 mb-2 text-sm font-semibold ${isSuccess ? 'text-emerald-600' : 'text-red-500'}`}>
            <Lightbulb className="w-4 h-4" />
            <span>핵심 요약</span>
          </div>
          <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed font-medium`}>
            {article.summary}
          </p>
        </div>

        {/* 지표 비교 분석 차트 섹션 (글씨 짤림 절대 방지 공간 설계) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 바 차트 영역 */}
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'} p-6 rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>정량 성과 분석</h3>
              <BarChart3 className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              {/* margin 공간을 사방으로 충분히 확보하여 바깥 텍스트 짤림 방지 */}
              <BarChart data={article.metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E2E8F0'} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#64748B', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${darkMode ? '#374151' : '#E2E8F0'}`,
                    borderRadius: '12px'
                  }}
                  itemStyle={{ color: darkMode ? '#FFF' : '#000' }}
                />
                <Bar dataKey="score" fill={primaryColor} radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 레이더 차트 영역 */}
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'} p-6 rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>밸런스 종합 평가</h3>
              <Target className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              {/* 사방 margin 레이아웃 패딩을 넓혀 겉의 텍스트가 잘려나가는 현상 물리적 차단 */}
              <RadarChart data={article.metrics} margin={{ top: 15, right: 30, left: 30, bottom: 15 }}>
                <PolarGrid stroke={darkMode ? '#374151' : '#E2E8F0'} strokeWidth={1.2} />
                <PolarAngleAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#64748B', fontWeight: 500 }} 
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar 
                  name="역량 스코어" 
                  dataKey="score" 
                  stroke={primaryColor} 
                  fill={primaryColor} 
                  fillOpacity={0.15} 
                  dot={{ fill: primaryColor, r: 3 }}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 상세 텍스트 종속 영역 (테이블 및 리스크 구조 매핑) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 배경 정보 */}
          <div className={`${darkMode ? 'bg-gray-800/30' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/60'} shadow-sm`}>
            <h3 className={`text-base font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>사례 배경</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>{article.background}</p>
          </div>

          {/* 주요 전략 리스트 (서클 넘버 마크업 유지) */}
          <div className={`${darkMode ? 'bg-gray-800/30' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/60'} shadow-sm`}>
            <h3 className={`text-base font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Target className="w-4 h-4 text-indigo-500" /> 주요 추진 전략
            </h3>
            <ul className="space-y-2.5">
              {article.strategy.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 bg-[#0B2F61] text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold rounded-md">
                    {index + 1}
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 결과 및 성과 상세 테이블 (CompareView 구조 수용) */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/60 to-gray-800/30' : 'bg-white'} rounded-2xl overflow-hidden shadow-sm border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
          <div className={`px-6 py-4 ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50/70'} border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/60'}`}>
            <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>성과 및 결과 지표</h3>
          </div>
          <div className="p-6 space-y-3">
            {article.results.map((item: string, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-900/20">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSuccess ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 핵심 인사이트 분석 블록 (엠버/오렌지 계열 그라데이션) */}
        <div className={`p-6 rounded-2xl border-2 ${darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-gradient-to-br from-amber-50/60 to-orange-50/60 border-amber-100'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className={`text-base font-bold ${darkMode ? 'text-amber-400' : 'text-amber-900'}`}>핵심 인사이트 분석</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {article.keyInsights.map((item: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">💡</span>
                <span className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 결론 및 시사점 체크리스트 블록 */}
        <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800/30' : 'bg-gradient-to-br from-indigo-50/40 to-purple-50/40'} border ${darkMode ? 'border-gray-700/50' : 'border-indigo-100/50'}`}>
          <h3 className={`text-base font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>교훈 및 시사점</h3>
          <div className="space-y-2.5">
            {article.lessons.map((item: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-[#0B2F61] dark:text-indigo-400 font-bold flex-shrink-0">✓</span>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}