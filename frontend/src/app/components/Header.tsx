import { BarChart3, BookOpen } from 'lucide-react';

interface HeaderProps {
  currentView: 'articles' | 'insights';
  onViewChange: (view: 'articles' | 'insights') => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  return (
    <header className="bg-[#EA0029] text-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-xl">DBR 인사이트</h1>
          </div>

          <nav className="flex gap-1">
            <button
              onClick={() => onViewChange('articles')}
              className={`px-6 py-2 rounded-lg transition-colors ${
                currentView === 'articles'
                  ? 'bg-white text-[#EA0029]'
                  : 'bg-transparent hover:bg-white/10'
              }`}
            >
              기사 목록
            </button>
            <button
              onClick={() => onViewChange('insights')}
              className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                currentView === 'insights'
                  ? 'bg-white text-[#EA0029]'
                  : 'bg-transparent hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              인사이트 대시보드
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
