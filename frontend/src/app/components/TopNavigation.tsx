import { User, Moon, Sun, Bell, LayoutDashboard, BarChart3, Layers, GitCompare, History, FileText } from 'lucide-react';
import { useState } from 'react';
import logoImg from '../../imports/lg.png';

interface TopNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNotificationClick: () => void;
  language?: string;
  onToggleLanguage?: () => void;
}

export function TopNavigation({ currentView, onViewChange, darkMode, onToggleDarkMode, onNotificationClick, language = 'ko', onToggleLanguage }: TopNavigationProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = language === 'ko' ? [
    { id: 'dashboard', icon: LayoutDashboard, label: 'AI 채팅' },
    { id: 'analysis', icon: BarChart3, label: '데이터 분석' },
    { id: 'strategy', icon: Layers, label: '전략 워크스페이스' },
    { id: 'compare', icon: GitCompare, label: '비교 분석' },
    { id: 'history', icon: History, label: '히스토리' },
    { id: 'reports', icon: FileText, label: '보고서' },
  ] : [
    { id: 'dashboard', icon: LayoutDashboard, label: 'AI Chat' },
    { id: 'analysis', icon: BarChart3, label: 'Data Analysis' },
    { id: 'strategy', icon: Layers, label: 'Strategy Workspace' },
    { id: 'compare', icon: GitCompare, label: 'Compare' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <div className={`w-full h-16 ${darkMode ? 'bg-[#0A0E1A] border-gray-800/50' : 'bg-white border-gray-200'} border-b flex flex-nowrap items-center justify-between px-6 shadow-sm`}>
      {/* Logo */}
      <div className="flex-shrink-0 mr-6">
        <img
          src={logoImg}
          alt="Logo"
          className="w-10 h-10 object-contain"
        />
      </div>

      {/* Navigation Menu */}
      <nav className="flex flex-nowrap items-center gap-1 overflow-x-auto scrollbar-hide flex-1 mr-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-[#142755] to-[#444655] text-white shadow-lg'
                  : darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex flex-nowrap items-center gap-2">
        {/* AI Usage Indicator */}
        <div className={`px-3 py-1.5 ${
          darkMode
            ? 'bg-gradient-to-br from-gray-800/60 to-gray-850/60 border border-gray-700/50'
            : 'bg-gradient-to-br from-gray-50 to-indigo-50 border border-gray-300/50'
        } rounded-lg flex items-center gap-2`}>
          <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'ko' ? 'AI 사용량' : 'AI Usage'}
          </span>
          <span className="text-xs font-bold bg-gradient-to-r from-[#142755] to-indigo-600 bg-clip-text text-transparent">
            73%
          </span>
        </div>

        {/* Notification */}
        <button
          onClick={onNotificationClick}
          className={`p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} rounded-lg transition-colors relative`}
          title={language === 'ko' ? '알림' : 'Notifications'}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} rounded-lg transition-colors`}
          title={language === 'ko' ? '테마 전환' : 'Toggle theme'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Language Toggle */}
        {onToggleLanguage && (
          <button
            onClick={onToggleLanguage}
            className={`px-3 py-1.5 ${
              darkMode
                ? 'bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 text-gray-300'
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
            } rounded-lg transition-all text-xs font-semibold`}
            title={language === 'en' ? 'Switch language' : '언어 전환'}
          >
            한/영
          </button>
        )}

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2 px-3 py-2 ${
              darkMode
                ? 'bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50'
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            } rounded-lg transition-all shadow-sm hover:shadow`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>김전략</p>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className={`absolute top-full right-0 mt-2 min-w-[200px] ${
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
                {language === 'ko' ? '프로필 설정' : 'Profile Settings'}
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  if (confirm(language === 'ko' ? '로그아웃 하시겠습니까?' : 'Are you sure you want to log out?')) {
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
                {language === 'ko' ? '로그아웃' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
