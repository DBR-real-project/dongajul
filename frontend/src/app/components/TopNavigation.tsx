import { User, Moon, Sun, Bell, Home, Shield, BarChart2, History, LogOut, Map } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TopNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNotificationClick: () => void;
  onLogout: () => void;
  language?: string;
  onToggleLanguage?: () => void;
}

export function TopNavigation({
  currentView,
  onViewChange,
  darkMode,
  onToggleDarkMode,
  onNotificationClick,
  onLogout,
  language = 'ko',
  onToggleLanguage,
}: TopNavigationProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          return parsedUser.nickname || parsedUser.name || parsedUser.email || '사용자';
        } catch {
          return localStorage.getItem('userName') || '사용자';
        }
      }
      return localStorage.getItem('userName') || '사용자';
    }
    return '사용자';
  });

  const getProfileImgFromStorage = () => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      const u = JSON.parse(raw);
      const email = u.email;
      return email ? localStorage.getItem(`profileImage_${email}`) || null : null;
    } catch { return null; }
  };

  const [profileImage, setProfileImage] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? getProfileImgFromStorage() : null;
  });

  useEffect(() => {
    const syncFromStorage = () => {
      // 닉네임 동기화
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          setUserName(parsedUser.nickname || parsedUser.name || parsedUser.email || '사용자');
        } catch {
          setUserName(localStorage.getItem('userName') || '사용자');
        }
      }
      // 계정별 프로필 사진 동기화
      setProfileImage(getProfileImgFromStorage());
    };

    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  const menuItems =
    language === 'ko'
      ? [
          { id: 'dashboard', icon: Home, label: '홈' },
          { id: 'risk', icon: Shield, label: '전략 진단' },
          { id: 'analysis', icon: BarChart2, label: '인사이트' },
          { id: 'history', icon: History, label: '진단 이력' },
          { id: 'semantic-map', icon: Map, label: '시맨틱 맵' },
        ]
      : [
          { id: 'dashboard', icon: Home, label: 'Home' },
          { id: 'risk', icon: Shield, label: 'Diagnose' },
          { id: 'analysis', icon: BarChart2, label: 'Insights' },
          { id: 'history', icon: History, label: 'History' },
          { id: 'semantic-map', icon: Map, label: 'Semantic Map' },
        ];

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    setShowUserMenu(false);
    onLogout();
  };

  return (
    <div className={`w-full h-16 ${darkMode ? 'bg-[#0A0E1A] border-gray-800/50' : 'bg-white border-gray-200'} border-b flex flex-nowrap items-center justify-between px-6 shadow-sm sticky top-0 z-50`}>
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

      <div className="flex flex-nowrap items-center gap-2">
        <div
          className={`px-3 py-1.5 ${
            darkMode
              ? 'bg-gradient-to-br from-gray-800/60 to-gray-850/60 border border-gray-700/50'
              : 'bg-gradient-to-br from-gray-50 to-indigo-50 border border-gray-300/50'
          } rounded-lg flex items-center gap-2`}
        >
          <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'ko' ? 'AI 사용량' : 'AI Usage'}
          </span>
          <span className="text-xs font-bold bg-gradient-to-r from-[#142755] to-indigo-600 bg-clip-text text-transparent">
            -
          </span>
        </div>

        <button
          onClick={onNotificationClick}
          className={`p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} rounded-lg transition-colors relative`}
          title={language === 'ko' ? '알림' : 'Notifications'}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button
  onClick={() => onViewChange('subscription')}
  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
    darkMode
      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90'
      : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90'
  }`}
>
  {language === 'ko' ? '구독' : 'Upgrade'}
</button>

        <button
          onClick={onToggleDarkMode}
          className={`p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} rounded-lg transition-colors`}
          title={language === 'ko' ? '테마 전환' : 'Toggle theme'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

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

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2 px-3 py-2 ${
              darkMode
                ? 'bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50'
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            } rounded-lg transition-all shadow-sm hover:shadow`}
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
              {profileImage ? (
                <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="text-left">
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {userName}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div
              className={`absolute right-0 mt-2 min-w-[200px] ${
                darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
              } border rounded-xl shadow-2xl z-[100] overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-1 duration-150`}
            >
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

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsLogoutModalOpen(false)}
          />

          <div
            className={`relative transform overflow-hidden rounded-2xl ${
              darkMode
                ? 'bg-gray-900 border border-gray-800 text-white shadow-gray-950/50'
                : 'bg-white text-gray-900 shadow-xl'
            } px-6 py-6 text-left shadow-2xl transition-all sm:w-full sm:max-w-md animate-in fade-in zoom-in-95 duration-200`}
          >
            <div className="flex items-start gap-4">
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
                      ? '정말로 로그아웃 하시겠습니까?\n현재 로그인 세션이 종료됩니다.'
                      : 'Are you sure you want to log out of your session?'}
                  </p>
                </div>
              </div>
            </div>

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
                  darkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
