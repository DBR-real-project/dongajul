import { ArrowLeft, Building2, Calendar, TrendingUp, TrendingDown, Target, Users, DollarSign, Lightbulb } from 'lucide-react';

interface ArticleDetailProps {
  articleId: number;
  onBack: () => void;
}

const articleDetails: Record<number, any> = {
  1: {
    title: '넷플릭스의 데이터 기반 콘텐츠 전략',
    company: 'Netflix',
    category: 'success',
    industry: '엔터테인먼트',
    date: '2026.04.15',
    summary: '빅데이터 분석을 통한 오리지널 콘텐츠 제작으로 구독자 2억 명 돌파',
    background: '넷플릭스는 2007년 스트리밍 서비스를 시작한 이후, 전통적인 콘텐츠 배급사에서 제작사로 전환하는 대담한 결정을 내렸습니다. 2013년 첫 오리지널 시리즈 "하우스 오브 카드"를 시작으로 데이터 기반 콘텐츠 제작 전략을 본격화했습니다.',
    strategy: ['시청 데이터 분석을 통한 콘텐츠 기획 및 제작 결정', '지역별 취향을 고려한 글로벌 콘텐츠 전략', 'A/B 테스팅을 통한 썸네일, 예고편 최적화', '알고리즘 기반 개인화 추천 시스템 고도화'],
    results: ['2020년 기준 구독자 2억 명 돌파', '오리지널 콘텐츠 투자 대비 높은 시청률 달성', '에미상 등 주요 시상식에서 다수 수상', '콘텐츠 제작 효율성 30% 향상'],
    keyInsights: ['데이터 분석을 통해 제작 리스크를 최소화하고 성공 확률을 높임', '고객 행동 패턴을 깊이 이해하여 맞춤형 경험 제공', '전통적인 방송사와 달리 시청률이 아닌 완주율을 핵심 지표로 활용', '글로벌 데이터를 활용하되 로컬 콘텐츠의 중요성도 인식'],
    lessons: ['데이터는 의사결정의 도구이지 창의성을 대체하는 것이 아님', '고객 데이터 수집과 분석 인프라에 대한 지속적인 투자 필요', '데이터 기반 의사결정 문화를 조직 전체에 확산시키는 것이 중요', '개인정보 보호와 데이터 활용 사이의 균형 유지 필요']
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
    lessons: ['혁신 기술은 보유만으로는 부족하며 과감한 사업화가 필요', '단기 수익보다 장기 생존을 우선시하는 전략적 결단 필요', '기존 사업 부서와 신사업 부서를 분리하여 자율성 부여', '경영진이 솔선수범하여 변화를 주도해야 함']
  }
};

export function ArticleDetail({ articleId, onBack }: ArticleDetailProps) {
  const article = articleDetails[articleId] || articleDetails[1];
  const isSuccess = article.category === 'success';

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-[#EA0029] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-base">목록으로</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 max-w-3xl">
        <div className={`h-1 mb-4 ${isSuccess ? 'bg-green-600' : 'bg-red-600'}`} />

        <div className="flex items-center gap-2 mb-3">
          {isSuccess ? (
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          ) : (
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          )}
          <span className={`px-3 py-1 text-xs sm:text-sm ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isSuccess ? '성공 사례' : '실패 사례'}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl mb-4 text-gray-900 leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap gap-3 mb-6 text-xs sm:text-sm text-gray-600">
          {[
            { Icon: Building2, text: article.company },
            { Icon: Users, text: article.industry },
            { Icon: Calendar, text: article.date },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-1">
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-5 mb-4 border-l-4 border-[#EA0029]">
          <div className={`inline-flex items-center gap-1.5 mb-2 text-xs sm:text-sm ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>요약</span>
          </div>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{article.summary}</p>
        </div>

        <div className="bg-white border border-gray-200 p-4 sm:p-5 mb-4">
          <h2 className="text-base sm:text-lg mb-3 text-gray-900">배경</h2>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{article.background}</p>
        </div>

        <div className="bg-white border border-gray-200 p-4 sm:p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-[#EA0029]" />
            <h2 className="text-base sm:text-lg text-gray-900">주요 전략</h2>
          </div>
          <ul className="space-y-2">
            {article.strategy.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#EA0029] text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs sm:text-sm">
                  {index + 1}
                </div>
                <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 p-4 sm:p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#EA0029]" />
            <h2 className="text-base sm:text-lg text-gray-900">결과</h2>
          </div>
          <ul className="space-y-2">
            {article.results.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 flex-shrink-0 mt-2 ${isSuccess ? 'bg-green-600' : 'bg-red-600'}`} />
                <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-5 mb-4 border-2 border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            <h2 className="text-base sm:text-lg text-gray-900">핵심 인사이트</h2>
          </div>
          <ul className="space-y-2">
            {article.keyInsights.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-amber-600 flex-shrink-0">💡</span>
                <span className="text-sm sm:text-base text-gray-800 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 p-4 sm:p-5 mb-4">
          <h2 className="text-base sm:text-lg mb-3 text-gray-900">교훈 및 시사점</h2>
          <ul className="space-y-2">
            {article.lessons.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-[#EA0029] flex-shrink-0">✓</span>
                <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
