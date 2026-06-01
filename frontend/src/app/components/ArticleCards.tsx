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

// TODO: GET /api/articles 응답으로 교체
const articles: Article[] = [];

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
