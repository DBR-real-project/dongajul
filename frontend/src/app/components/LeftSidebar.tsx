import { LayoutDashboard, BarChart3, Layers, GitCompare, History, FileText, Settings, LogOut, User, Bell, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import logoImg from '../../imports/lg.png';

interface LeftSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  language?: string;
  onToggleLanguage?: () => void;
  onNotificationClick: () => void;
}

export function LeftSidebar({
  currentView,
  onViewChange,
  darkMode,
  onToggleDarkMode,
  language = 'ko',
  onToggleLanguage,
  onNotificationClick
}: LeftSidebarProps) {
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
    <div className={`w-64 h-full ${darkMode ? 'bg-[#0A0E1A] border-gray-800' : 'bg-white border-gray-200'} border-r flex flex-col`}>
      {/* Logo */}
      <div className="p-6 pb-8 border-b border-gray-200 dark:border-gray-800">
        <img
          src={logoImg}
          alt="Logo"
          className="w-16 h-16 mx-auto object-contain"
        />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? darkMode
                    ? 'bg-gray-800 text-white'
                    : 'bg-[#142755] text-white'
                  : darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} space-y-2`}>
        {/* Notification */}
        <button
          onClick={onNotificationClick}
          className={`w-full flex items-center gap-3 px-4 py-2.5 ${
            darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          } rounded-lg transition-all relative`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-sm font-medium">{language === 'ko' ? '알림' : 'Notifications'}</span>
          <span className="absolute top-2 left-7 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`w-full flex items-center gap-3 px-4 py-2.5 ${
            darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          } rounded-lg transition-all`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-sm font-medium">{language === 'ko' ? '테마 전환' : 'Toggle Theme'}</span>
        </button>

        {/* Language Toggle */}
        {onToggleLanguage && (
          <button
            onClick={onToggleLanguage}
            className={`w-full flex items-center gap-3 px-4 py-2.5 ${
              darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } rounded-lg transition-all`}
          >
            <span className={`w-5 h-5 flex items-center justify-center text-xs font-bold border ${
              darkMode ? 'border-gray-600' : 'border-gray-300'
            } rounded`}>
              {language === 'ko' ? 'KO' : 'EN'}
            </span>
            <span className="text-sm font-medium">{language === 'ko' ? '언어 전환' : 'Switch Language'}</span>
          </button>
        )}

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 ${
              darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } rounded-lg transition-all`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>김전략</span>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className={`absolute bottom-full left-0 mb-2 w-full ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border rounded-xl shadow-xl overflow-hidden`}>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onViewChange('profile');
                }}
                className={`w-full px-4 py-3 text-left text-sm ${
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
                className={`w-full px-4 py-3 text-left text-sm font-semibold ${
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
