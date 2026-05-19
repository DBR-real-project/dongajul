import { Menu, Search, ShoppingCart, BarChart3 } from 'lucide-react';

interface MobileHeaderProps {
  currentView: 'home' | 'insights';
  onViewChange: (view: 'home' | 'insights') => void;
}

export function MobileHeader({ currentView, onViewChange }: MobileHeaderProps) {
  return (
    <header className="bg-[#1a1a1a] text-white sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <button className="p-2">
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          <div className="text-lg tracking-wide">DBR</div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2">
            <Search className="w-5 h-5" />
          </button>
          <button
            className="p-2"
            onClick={() => onViewChange(currentView === 'home' ? 'insights' : 'home')}
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
