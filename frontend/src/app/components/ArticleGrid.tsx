import { TrendingUp, TrendingDown, Building2, Users, Lightbulb } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  company: string;
  category: 'success' | 'failure';
  industry: string;
  summary: string;
  keyInsight: string;
  date: string;
}

const articles: Article[] = [
  {
    id: 1,
    title: '넷플릭스의 데이터 기반 콘텐츠 전략',
    company: 'Netflix',
    category: 'success',
    industry: '엔터테인먼트',
    summary: '빅데이터 분석을 통한 오리지널 콘텐츠 제작으로 구독자 2억 명 돌파',
    keyInsight: '시청 패턴 분석을 통한 맞춤형 콘텐츠 큐레이션',
    date: '2026.04.15'
  },
  {
    id: 2,
    title: '테슬라의 수직 계열화 전략',
    company: 'Tesla',
    category: 'success',
    industry: '자동차',
    summary: '배터리부터 소프트웨어까지 직접 개발하며 전기차 시장 선도',
    keyInsight: '공급망 통제를 통한 원가 절감 및 품질 향상',
    date: '2026.04.10'
  },
  {
    id: 3,
    title: '코닥의 디지털 전환 실패',
    company: 'Kodak',
    category: 'failure',
    industry: '사진/이미징',
    summary: '디지털 카메라를 최초 개발했으나 필름 사업 고수로 몰락',
    keyInsight: '혁신 기술을 보유했으나 기존 사업 모델에 집착한 사례',
    date: '2026.04.05'
  },
  {
    id: 4,
    title: '애플의 생태계 전략',
    company: 'Apple',
    category: 'success',
    industry: '기술',
    summary: '하드웨어-소프트웨어-서비스 통합 생태계로 고객 충성도 극대화',
    keyInsight: '제품 간 시너지를 통한 락인 효과 창출',
    date: '2026.03.28'
  },
  {
    id: 5,
    title: '블록버스터의 스트리밍 거부',
    company: 'Blockbuster',
    category: 'failure',
    industry: '엔터테인먼트',
    summary: '넷플릭스 인수 기회를 거절하고 오프라인 매장 고수',
    keyInsight: '시장 변화를 읽지 못한 경영진의 판단 착오',
    date: '2026.03.20'
  },
  {
    id: 6,
    title: '스타벅스의 제3의 공간 전략',
    company: 'Starbucks',
    category: 'success',
    industry: '식음료',
    summary: '커피숍을 넘어 문화 공간으로 포지셔닝하여 프리미엄 가격 정당화',
    keyInsight: '경험 중심의 브랜드 가치 창출',
    date: '2026.03.15'
  },
  {
    id: 7,
    title: '노키아의 스마트폰 시장 진입 지연',
    company: 'Nokia',
    category: 'failure',
    industry: '모바일',
    summary: '피처폰 시장 1위였으나 스마트폰 전환 실패로 시장 점유율 급락',
    keyInsight: '안주와 조직 경직성이 초래한 혁신 실패',
    date: '2026.03.10'
  },
  {
    id: 8,
    title: '아마존의 AWS 사업 확장',
    company: 'Amazon',
    category: 'success',
    industry: '클라우드',
    summary: '내부 인프라를 외부 서비스로 전환하여 새로운 수익원 창출',
    keyInsight: '핵심 역량을 새로운 시장에 적용한 다각화 전략',
    date: '2026.03.05'
  }
];

interface ArticleGridProps {
  selectedCategory: 'all' | 'success' | 'failure';
  onCategoryChange: (category: 'all' | 'success' | 'failure') => void;
  onArticleClick: (id: number) => void;
}

export function ArticleGrid({ selectedCategory, onCategoryChange, onArticleClick }: ArticleGridProps) {
  const filteredArticles = articles.filter(article =>
    selectedCategory === 'all' || article.category === selectedCategory
  );

  const successCount = articles.filter(a => a.category === 'success').length;
  const failureCount = articles.filter(a => a.category === 'failure').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-6 py-3 rounded-lg transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#EA0029] text-white shadow-lg'
                : 'bg-white border-2 border-gray-200 hover:border-[#EA0029]'
            }`}
          >
            전체 ({articles.length})
          </button>
          <button
            onClick={() => onCategoryChange('success')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              selectedCategory === 'success'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-200 hover:border-green-600'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            성공 사례 ({successCount})
          </button>
          <button
            onClick={() => onCategoryChange('failure')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              selectedCategory === 'failure'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-200 hover:border-red-600'
            }`}
          >
            <TrendingDown className="w-5 h-5" />
            실패 사례 ({failureCount})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map(article => (
          <div
            key={article.id}
            onClick={() => onArticleClick(article.id)}
            className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all cursor-pointer overflow-hidden border-2 border-transparent hover:border-[#EA0029]"
          >
            <div className={`h-2 ${article.category === 'success' ? 'bg-green-600' : 'bg-red-600'}`} />

            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                {article.category === 'success' ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <span className={`px-3 py-1 rounded-full text-xs ${
                  article.category === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {article.category === 'success' ? '성공 사례' : '실패 사례'}
                </span>
              </div>

              <h3 className="mb-3 text-gray-900 min-h-[3rem]">
                {article.title}
              </h3>

              <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>{article.company}</span>
                <span className="text-gray-400">|</span>
                <span>{article.industry}</span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {article.summary}
              </p>

              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-900 line-clamp-2">
                  {article.keyInsight}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">{article.date}</span>
                <button className="text-[#EA0029] text-sm hover:underline">
                  자세히 보기 →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
