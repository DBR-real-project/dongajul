import { LayoutDashboard, BarChart3, GitCompare, History, FileText, User, Bell, Moon, Sun } from 'lucide-react';
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
  hasUnreadNotifications?: boolean;
}

export function LeftSidebar({
  currentView,
  onViewChange,
  darkMode,
  onToggleDarkMode,
  language = 'ko',
  onToggleLanguage,
  onNotificationClick,
  hasUnreadNotifications = true
}: LeftSidebarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 💡 '전략 워크스페이스' 메뉴를 목록에서 완전히 제거했습니다.
  const menuItems = language === 'ko' ? [
    { id: 'dashboard', icon: LayoutDashboard, label: 'AI 채팅' },
    { id: 'analysis', icon: BarChart3, label: '데이터 분석' },
    { id: 'compare', icon: GitCompare, label: '비교 분석' },
    { id: 'history', icon: History, label: '히스토리' },
    { id: 'reports', icon: FileText, label: '보고서' },
  ] : [
    { id: 'dashboard', icon: LayoutDashboard, label: 'AI Chat' },
    { id: 'analysis', icon: BarChart3, label: 'Data Analysis' },
    { id: 'compare', icon: GitCompare, label: 'Compare' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <div className={`w-64 h-full ${darkMode ? 'bg-[#0A0E1A] border-gray-800' : 'bg-white border-gray-200'} border-r flex flex-col select-none`}>
      {/* Logo */}
      <div className="p-6 pb-8 border-b border-gray-200 dark:border-gray-800 flex items-center justify-center">
        <img
          src={logoImg}
          alt="STRAND Logo"
          className="w-14 h-14 object-contain"
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? darkMode
                    ? 'bg-gray-850 text-white shadow-inner'
                    : 'bg-[#0B2F61] text-white shadow-sm'
                  : darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} space-y-1.5`}>
        {/* Notification */}
        <button
          onClick={onNotificationClick}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentView === 'notifications'
              ? darkMode ? 'bg-gray-850 text-white' : 'bg-gray-100 text-gray-900'
              : darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          } relative`}
        >
          <Bell className="w-5 h-5 flex-shrink-0" />
          <span>{language === 'ko' ? '알림 센터' : 'Notification Center'}</span>
          {hasUnreadNotifications && (
            <span className="absolute top-3 left-7 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-[#0B2F61]" />}
          <span>{language === 'ko' ? '화면 테마 변경' : 'Toggle Theme'}</span>
        </button>

        {/* Language Toggle */}
        {onToggleLanguage && (
          <button
            onClick={onToggleLanguage}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-extrabold border ${
              darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
            } rounded-md bg-transparent`}>
              {language === 'ko' ? 'KO' : 'EN'}
            </span>
            <span>{language === 'ko' ? 'Global 언어 전환' : 'Switch Language'}</span>
          </button>
        )}

        {/* User Profile */}
        <div className="relative pt-1">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
              showUserMenu || currentView === 'profile'
                ? darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                : darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#0B2F61] to-[#C8994B] rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>Account</p>
              <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{(typeof window !== 'undefined' && localStorage.getItem('userName')) || '사용자'}</p>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className={`absolute bottom-full left-0 right-0 mb-2 w-full z-50 rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                darkMode ? 'bg-gray-850 border-gray-700 text-white' : 'bg-white border-gray-150 text-gray-800'
              }`}>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onViewChange('profile');
                  }}
                  className={`w-full px-4 py-3 text-left text-xs sm:text-sm font-medium ${
                    darkMode ? 'hover:bg-gray-700/60' : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  {language === 'ko' ? '개인 프로필 설정' : 'Profile Settings'}
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (confirm(language === 'ko' ? '보안 세션을 종료하고 로그아웃 하시겠습니까?' : 'Are you sure you want to log out?')) {
                      localStorage.removeItem('user');
                      window.location.reload();
                    }
                  }}
                  className={`w-full px-4 py-3 text-left text-xs sm:text-sm font-bold border-t ${
                    darkMode 
                      ? 'hover:bg-red-950/20 text-red-400 border-gray-700' 
                      : 'hover:bg-red-50/50 text-red-600 border-gray-100'
                  } transition-colors`}
                >
                  {language === 'ko' ? '안전 로그아웃' : 'Logout'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}