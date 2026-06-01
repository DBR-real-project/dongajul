import { User, Moon, Sun, Bell, LayoutDashboard, BarChart3, Layers, GitCompare, History, LogOut } from 'lucide-react';
import { useState } from 'react';

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
  
  // 💡 로그아웃 커스텀 모달 제어를 위한 상태 추가
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const menuItems = language === 'ko' ? [
    { id: 'dashboard', icon: LayoutDashboard, label: 'AI 채팅' },
    { id: 'analysis', icon: BarChart3, label: '데이터 분석' },
    { id: 'compare', icon: GitCompare, label: '비교 분석' },
    { id: 'history', icon: History, label: '히스토리' },
  ] : [
    { id: 'dashboard', icon: LayoutDashboard, label: 'AI Chat' },
    { id: 'analysis', icon: BarChart3, label: 'Data Analysis' },
    { id: 'compare', icon: GitCompare, label: 'Compare' },
    { id: 'history', icon: History, label: 'History' },
  ];

  // 💡 실제 로그아웃을 처리하는 함수
  const handleLogoutConfirm = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className={`w-full h-16 ${darkMode ? 'bg-[#0A0E1A] border-gray-800/50' : 'bg-white border-gray-200'} border-b flex flex-nowrap items-center justify-between px-6 shadow-sm sticky top-0 z-50`}>
      {/* Logo: 클릭 시 홈(dashboard)으로 이동 */}
      <button
        type="button"
        onClick={() => onViewChange('dashboard')}
        title={language === 'ko' ? '홈으로' : 'Home'}
        className="flex-shrink-0 mr-6 cursor-pointer focus:outline-none"
      >
        <img
          src={new URL('../../imports/lg.png', import.meta.url).href}
          alt="Logo"
          className="w-10 h-10 object-contain"
        />
      </button>

      {/* Navigation Menu */}
      <nav className="flex flex-nowrap items-center gap-1 overflow-x-auto scrollbar-hide flex-1 mr-4">
        {menuItems.map((item) => {
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

        {/* User Profile Container */}
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
            <div className={`absolute right-0 mt-2 min-w-[200px] ${
              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } border rounded-xl shadow-2xl z-[100] overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-1 duration-150`}>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onViewChange('profile');
                }}
                className={`w-full px-5 py-3 text-left text-sm ${
                  darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                } transition-colors`}
              >
                {language === 'ko' ? '프로필 설정' : 'Profile Settings'}
              </button>
              
              {/* 💡 기본 confirm 대신 커스텀 모달 창을 띄우도록 이벤트 연결 */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setIsLogoutModalOpen(true);
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

      {/* 🌟 힙하고 정교하게 컴포즈된 로그아웃 전용 커스텀 모달 */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* 부드러운 오버레이 백드롭 */}
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsLogoutModalOpen(false)}
          />
          
          {/* 모달 콘텐츠 본체 박스 */}
          <div className={`relative transform overflow-hidden rounded-2xl ${
            darkMode ? 'bg-gray-900 border border-gray-800 text-white shadow-gray-950/50' : 'bg-white text-gray-900 shadow-xl'
          } px-6 py-6 text-left shadow-2xl transition-all sm:w-full sm:max-w-md animate-in fade-in zoom-in-95 duration-200`}>
            
            <div className="flex items-start gap-4">
              {/* 모던한 스타일의 레드 경고 아이콘 서클 */}
              <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 sm:mx-0 sm:h-10 sm:w-10">
                <LogOut className="h-5 w-5" />
              </div>
              
              <div className="mt-1 text-left sm:ml-1">
                <h3 className="text-base font-bold leading-6">
                  {language === 'ko' ? '로그아웃' : 'Account Logout'}
                </h3>
                <div className="mt-2">
                  <p className={`text-xs sm:text-sm font-medium whitespace-pre-line ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'ko' 
                      ? '정말로 로그아웃 하시겠습니까?\n' 
                      : 'Are you sure you want to log out of your session?\nMake sure your workspace details are completely synced.'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 하단 인터랙션 제어 버튼 컴포넌트 조합 */}
            <div className="mt-6 flex flex-row-reverse gap-2">
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="inline-flex justify-center rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
              >
                {language === 'ko' ? '로그아웃' : 'Logout'}
              </button>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className={`inline-flex justify-center rounded-xl ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } active:scale-95 px-4 py-2.5 text-xs font-bold transition-all`}
              >
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}