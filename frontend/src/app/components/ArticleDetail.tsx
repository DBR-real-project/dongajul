import { ArrowLeft, Building2, Calendar, TrendingUp, TrendingDown, Target, Users, DollarSign, Lightbulb, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

// 외부에서 전달하는 컴포넌트 Props 규격 정의
interface ArticleDetailProps {
  articleId: number; // 조회할 아티클의 고유 ID
  onBack: () => void; // '목록으로' 버튼을 누를 때 뷰 상태를 원복할 이벤트 콜백 함수
  darkMode?: boolean; // 가독성 선제 조치를 위한 다크모드 옵션 추가
}

// TODO: GET /api/articles/:id 응답으로 교체
const articleDetails: Record<number, any> = {};

// 상징색 연동을 위한 브랜드 상수 설정 (CompareView 스타일 상속)
const BRAND_NAVY = '#0B2F61'; // 성공/혁신 지표용
const BRAND_GOLD = '#C8994B'; // 위험/실패 지표용

export function ArticleDetail({ articleId, onBack, darkMode = false }: ArticleDetailProps) {
  const article = articleDetails[articleId] || null;

  if (!article) {
    return (
      <div className={`h-full flex items-center justify-center ${darkMode ? 'bg-[#0A0E1A] text-gray-400' : 'bg-[#FAFBFC] text-gray-500'}`}>
        <div className="text-center">
          <p className="text-sm font-medium mb-4">기사 데이터를 불러올 수 없습니다.</p>
          <button onClick={onBack} className="px-4 py-2 bg-[#0B2F61] text-white rounded-xl text-sm font-bold">목록으로</button>
        </div>
      </div>
    );
  }

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