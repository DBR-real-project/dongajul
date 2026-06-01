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

// TODO: GET /api/articles 응답으로 교체
const articles: Article[] = [];

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
