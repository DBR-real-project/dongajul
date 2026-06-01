import { LayoutDashboard, BarChart3, Layers, GitCompare, History, FileText, Settings, ChevronDown, User, Zap, Plus } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  darkMode: boolean;
}

export function Sidebar({ currentView, onViewChange, darkMode }: SidebarProps) {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'AI 채팅' },
    { id: 'analysis', icon: BarChart3, label: '데이터 분석' },
    { id: 'strategy', icon: Layers, label: '전략 워크스페이스' },
    { id: 'compare', icon: GitCompare, label: '비교 분석' },
    { id: 'history', icon: History, label: '히스토리' },
    { id: 'reports', icon: FileText, label: '보고서' },
    { id: 'settings', icon: Settings, label: '설정' },
  ];

  // TODO: 사용자 프로젝트 목록 API 연동 후 교체
  const projects: { id: number; name: string }[] = [];

  return (
    <div className={`w-64 h-full ${darkMode ? 'bg-[#0A0E1A] border-gray-800/50' : 'bg-white border-gray-200'} border-r flex flex-col`}>
      {/* Navigation Menu */}
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#142755] to-[#444655] text-white shadow-lg hover:shadow-xl'
                  : darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? '' : 'opacity-70'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & AI Usage */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} space-y-3 mt-auto`}>
        {/* AI Usage Indicator */}
        <div className={`px-3.5 py-3 ${
          darkMode
            ? 'bg-gradient-to-br from-gray-800/60 to-gray-850/60 border border-gray-700/50'
            : 'bg-gradient-to-br from-gray-50 to-indigo-50 border border-gray-300/50'
        } rounded-xl`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              AI Usage
            </span>
            <span className="text-sm font-bold bg-gradient-to-r from-[#142755] to-indigo-600 bg-clip-text text-transparent">
              -
            </span>
          </div>
          <div className={`w-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
            <div className="h-full bg-gradient-to-r from-[#142755] to-indigo-600 rounded-full shadow-lg" style={{ width: '0%' }}></div>
          </div>
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full px-3.5 py-3 ${
              darkMode
                ? 'bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50'
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            } rounded-xl flex items-center gap-3 transition-all shadow-sm hover:shadow`}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{(typeof window !== 'undefined' && localStorage.getItem('userName')) || '사용자'}</p>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>-</p>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className={`absolute bottom-full left-0 right-0 mb-2 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border rounded-xl shadow-xl z-50 overflow-hidden`}>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onViewChange('profile');
                }}
                className={`w-full px-5 py-3 text-left text-sm ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-50 text-gray-700'
                } transition-colors`}
              >
                프로필 설정
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onViewChange('settings');
                }}
                className={`w-full px-5 py-3 text-left text-sm ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-50 text-gray-700'
                } transition-colors`}
              >
                계정 설정
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  if (confirm('로그아웃 하시겠습니까?')) {
                    localStorage.removeItem('user');
                    window.location.reload();
                  }
                }}
                className={`w-full px-5 py-3 text-left text-sm font-semibold ${
                  darkMode
                    ? 'hover:bg-gray-700 text-red-400 border-t border-gray-700'
                    : 'hover:bg-gray-50 text-red-600 border-t border-gray-200'
                } transition-colors`}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
