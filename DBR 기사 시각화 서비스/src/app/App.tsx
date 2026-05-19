import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { TopNavigation } from './components/TopNavigation';
import { GlobalHeader } from './components/GlobalHeader';
import { CommandPalette } from './components/CommandPalette';
import { EnterpriseDashboard } from './components/EnterpriseDashboard';
import { MainDashboard } from './components/MainDashboard';
import { StrategyWorkspace } from './components/StrategyWorkspace';
import { SearchHistory } from './components/SearchHistory';
import { RiskAnalysis } from './components/RiskAnalysis';
import { ArticleDetail } from './components/ArticleDetail';
import { NotificationView } from './components/NotificationView';
import { ProfileView } from './components/ProfileView';
import { CompareView } from './components/CompareView';

export type ViewType = 'dashboard' | 'analysis' | 'strategy' | 'compare' | 'history' | 'reports' | 'settings' | 'risk' | 'article' | 'notifications' | 'profile';
export type TabType = 'dashboard' | 'strategy' | 'history';

interface CompareItem {
  id: number;
  status: string;
  strategy: string;
  riskLevel: string;
  industry: string;
  title: string;
  strategySum: string;
  riskSum: string;
}

// App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [comparedItems, setComparedItems] = useState<CompareItem[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ko';
  });
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');

  // 로그인 상태 확인 및 테스트 계정 생성
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setIsLoggedIn(true);
    }

    // 테스트 계정이 없으면 생성
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) {
      const testUsers = [
        { name: '테스트 사용자', email: 'test@test.com', password: '123456' },
        { name: '김전략', email: 'admin@startq.ai', password: 'admin123' }
      ];
      localStorage.setItem('users', JSON.stringify(testUsers));
    }
  }, []);

  // Command Palette 단축키 (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 다크 모드 및 언어 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      const savedDarkMode = localStorage.getItem('darkMode');
      const savedLanguage = localStorage.getItem('language');
      if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 다크모드 body 클래스 적용
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setIsLoggedIn(true);
    } else {
      alert('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const handleSignup = (email: string, password: string, name: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find((u: any) => u.email === email);

    if (existingUser) {
      alert('이미 등록된 이메일입니다.');
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('user', JSON.stringify(newUser));
    setIsLoggedIn(true);
    setShowSignup(false);
  };

  const handleSocialLogin = (provider: string) => {
    // 소셜 로그인 시뮬레이션
    const socialUser = {
      name: `${provider} 사용자`,
      email: `user@${provider}.com`,
      provider: provider
    };
    localStorage.setItem('user', JSON.stringify(socialUser));
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'dashboard') {
      setCurrentView('analysis');
    } else if (tab === 'strategy') {
      setCurrentView('strategy');
    } else if (tab === 'history') {
      setCurrentView('history');
    }
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  const handleToggleLanguage = () => {
    const newLanguage = language === 'ko' ? 'en' : 'ko';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  if (!isLoggedIn) {
    if (showSignup) {
      return (
        <SignupScreen
          onSignup={handleSignup}
          onBackToLogin={() => setShowSignup(false)}
        />
      );
    }
    return (
      <LoginScreen
        onLogin={handleLogin}
        onSocialLogin={handleSocialLogin}
        onSignupClick={() => setShowSignup(true)}
        onForgotPassword={() => setShowPasswordReset(true)}
      />
    );
  }

  return (
    <div className={`flex flex-col h-screen w-screen ${darkMode ? 'dark bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        darkMode={darkMode}
      />

      {/* Top Navigation */}
      <TopNavigation
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view as ViewType)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onNotificationClick={() => setCurrentView('notifications')}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI Chat Panel - Left Sidebar */}
        {currentView === 'dashboard' && (
          <div className="w-[400px] border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
            <GlobalHeader
              darkMode={darkMode}
              onToggleDarkMode={handleToggleDarkMode}
              onNotificationClick={() => setCurrentView('notifications')}
              onSearch={setAiSearchQuery}
            />
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {currentView === 'dashboard' ? (
            <EnterpriseDashboard darkMode={darkMode} searchQuery={aiSearchQuery} language={language} />
          ) : currentView === 'analysis' ? (
            <MainDashboard
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onNavigateToRisk={() => setCurrentView('risk')}
              onArticleClick={(id) => {
                setSelectedArticle(id);
                setCurrentView('article');
              }}
              onCompareClick={(items) => {
                setComparedItems(items);
                setCurrentView('compare');
              }}
              onNotificationClick={() => setCurrentView('notifications')}
              onProfileClick={() => setCurrentView('profile')}
              darkMode={darkMode}
              language={language}
            />
          ) : currentView === 'strategy' ? (
            <StrategyWorkspace
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onNotificationClick={() => setCurrentView('notifications')}
              onProfileClick={() => setCurrentView('profile')}
              darkMode={darkMode}
              language={language}
            />
          ) : currentView === 'history' ? (
            <SearchHistory
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onNotificationClick={() => setCurrentView('notifications')}
              onProfileClick={() => setCurrentView('profile')}
              darkMode={darkMode}
              language={language}
            />
          ) : currentView === 'compare' ? (
            <CompareView
              items={comparedItems}
              onBack={() => setCurrentView('analysis')}
              darkMode={darkMode}
              language={language}
            />
          ) : currentView === 'risk' ? (
            <RiskAnalysis
              onBack={() => setCurrentView('analysis')}
              onArticleClick={(id) => {
                setSelectedArticle(id);
                setCurrentView('article');
              }}
              onNotificationClick={() => setCurrentView('notifications')}
              onProfileClick={() => setCurrentView('profile')}
              darkMode={darkMode}
              language={language}
            />
          ) : currentView === 'article' && selectedArticle !== null ? (
            <ArticleDetail
              articleId={selectedArticle}
              onBack={() => setCurrentView('analysis')}
              darkMode={darkMode}
              language={language}
            />
          ) : currentView === 'notifications' ? (
            <NotificationView
              onBack={() => setCurrentView('dashboard')}
              darkMode={darkMode}
              language={language}
            />
          ) : currentView === 'profile' ? (
            <ProfileView
              onBack={() => setCurrentView('dashboard')}
              darkMode={darkMode}
              language={language}
            />
          ) : currentView === 'reports' ? (
            <div className={`h-full flex items-center justify-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Reports</h2>
                <p className="text-gray-500">Coming soon...</p>
              </div>
            </div>
          ) : currentView === 'settings' ? (
            <ProfileView
              onBack={() => setCurrentView('dashboard')}
              darkMode={darkMode}
              language={language}
            />
          ) : (
            <EnterpriseDashboard darkMode={darkMode} language={language} />
          )}
        </main>
      </div>
    </div>
  );
}
