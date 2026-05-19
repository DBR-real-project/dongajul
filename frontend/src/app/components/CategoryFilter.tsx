import { TrendingUp, TrendingDown, Grid3x3 } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: 'all' | 'success' | 'failure';
  onCategoryChange: (category: 'all' | 'success' | 'failure') => void;
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="bg-white px-4 py-4 sticky top-[52px] z-40 border-b border-gray-200">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => onCategoryChange('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-[#EA0029] text-white shadow-md'
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}
          style={{ fontSize: '14px' }}
        >
          <Grid3x3 className="w-4 h-4" />
          전체
        </button>
        <button
          onClick={() => onCategoryChange('success')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${
            selectedCategory === 'success'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}
          style={{ fontSize: '14px' }}
        >
          <TrendingUp className="w-4 h-4" />
          성공 사례
        </button>
        <button
          onClick={() => onCategoryChange('failure')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${
            selectedCategory === 'failure'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}
          style={{ fontSize: '14px' }}
        >
          <TrendingDown className="w-4 h-4" />
          실패 사례
        </button>
      </div>
    </div>
  );
}
