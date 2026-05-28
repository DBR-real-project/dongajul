import { TrendingUp, TrendingDown, Building2, Calendar } from 'lucide-react';

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
    summary: '빅데이터 분석을 통한 오리지널 콘텐츠 제작',
    keyInsight: '시청 패턴 분석으로 성공 확률 향상',
    date: '2026.04.15'
  },
  {
    id: 2,
    title: '테슬라의 수직 계열화 전략',
    company: 'Tesla',
    category: 'success',
    industry: '자동차',
    summary: '배터리부터 소프트웨어까지 직접 개발',
    keyInsight: '공급망 통제로 원가 절감 실현',
    date: '2026.04.10'
  },
  {
    id: 3,
    title: '코닥의 디지털 전환 실패',
    company: 'Kodak',
    category: 'failure',
    industry: '사진/이미징',
    summary: '디지털 카메라 최초 개발했으나 필름 사업 고수',
    keyInsight: '기존 수익 모델 집착이 몰락 원인',
    date: '2026.04.05'
  },
  {
    id: 4,
    title: '애플의 생태계 전략',
    company: 'Apple',
    category: 'success',
    industry: '기술',
    summary: '하드웨어-소프트웨어 통합 생태계 구축',
    keyInsight: '제품 간 시너지로 고객 락인',
    date: '2026.03.28'
  },
  {
    id: 5,
    title: '블록버스터의 스트리밍 거부',
    company: 'Blockbuster',
    category: 'failure',
    industry: '엔터테인먼트',
    summary: '넷플릭스 인수 거절하고 오프라인 고수',
    keyInsight: '시장 변화 대응 실패 사례',
    date: '2026.03.20'
  },
  {
    id: 6,
    title: '스타벅스의 제3의 공간 전략',
    company: 'Starbucks',
    category: 'success',
    industry: '식음료',
    summary: '커피숍을 문화 공간으로 포지셔닝',
    keyInsight: '경험 중심 브랜드 가치 창출',
    date: '2026.03.15'
  },
  {
    id: 7,
    title: '노키아의 스마트폰 시장 진입 지연',
    company: 'Nokia',
    category: 'failure',
    industry: '모바일',
    summary: '피처폰 1위에서 스마트폰 전환 실패',
    keyInsight: '조직 경직성이 혁신 저해',
    date: '2026.03.10'
  },
  {
    id: 8,
    title: '아마존의 AWS 사업 확장',
    company: 'Amazon',
    category: 'success',
    industry: '클라우드',
    summary: '내부 인프라를 외부 서비스로 전환',
    keyInsight: '핵심 역량의 새로운 시장 적용',
    date: '2026.03.05'
  }
];

interface ArticleCardsProps {
  selectedCategory: 'all' | 'success' | 'failure';
  onArticleClick: (id: number) => void;
}

export function ArticleCards({ selectedCategory, onArticleClick }: ArticleCardsProps) {
  const filteredArticles = articles.filter(article =>
    selectedCategory === 'all' || article.category === selectedCategory
  );

  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        {filteredArticles.map(article => (
          <div
            key={article.id}
            onClick={() => onArticleClick(article.id)}
            className={`bg-white rounded-lg overflow-hidden cursor-pointer transition-all active:scale-95 ${
              article.category === 'success'
                ? 'border-2 border-green-500'
                : 'border-2 border-red-500'
            }`}
          >
            <div className={`h-24 flex items-center justify-center ${
              article.category === 'success'
                ? 'bg-gradient-to-br from-green-50 to-green-100'
                : 'bg-gradient-to-br from-red-50 to-red-100'
            }`}>
              <div className="text-center px-3">
                <div className={`text-4xl mb-1 ${
                  article.category === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {article.category === 'success' ? (
                    <TrendingUp className="w-10 h-10 mx-auto" />
                  ) : (
                    <TrendingDown className="w-10 h-10 mx-auto" />
                  )}
                </div>
                <div className="text-xs text-gray-600">{article.company}</div>
              </div>
            </div>

            <div className="p-3">
              <div className={`inline-block px-2 py-0.5 rounded text-xs mb-2 ${
                article.category === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {article.industry}
              </div>
              <h3 className="text-sm mb-2 line-clamp-2 min-h-[2.5rem]" style={{ fontSize: '13px', lineHeight: '1.3' }}>
                {article.title}
              </h3>
              <p className="text-xs text-gray-600 line-clamp-2 mb-2" style={{ fontSize: '11px' }}>
                {article.summary}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                <span style={{ fontSize: '10px' }}>{article.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
