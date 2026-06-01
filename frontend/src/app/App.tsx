import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { TopNavigation } from './components/TopNavigation';
import { GlobalHeader } from './components/GlobalHeader';
import { EnterpriseDashboard } from './components/EnterpriseDashboard';
import { MainDashboard } from './components/MainDashboard';
import { StrategyWorkspace } from './components/StrategyWorkspace';
import { SearchHistory } from './components/SearchHistory';
import { RiskAnalysis } from './components/RiskAnalysis';
import { ArticleDetail } from './components/ArticleDetail';
import { NotificationView } from './components/NotificationView';
import { ProfileView } from './components/ProfileView';
import { CompareView } from './components/CompareView';

export type ViewType = 'dashboard' | 'analysis' | 'strategy' | 'compare' | 'history' | 'settings' | 'risk' | 'article' | 'notifications' | 'profile';
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('user'));
  const [showSignup, setShowSignup] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [comparedItems, setComparedItems] = useState<CompareItem[]>([]);
  const [previousView, setPreviousView] = useState<ViewType>('dashboard');
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('darkMode') || 'false'));
  const [aiSearchQuery, setAiSearchQuery] = useState('');

  // 다크모드 body 클래스 적용
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // --- 인증 핸들러 ---
  const handleLogin = (user: { id: number; email: string; name: string }) => {
    localStorage.setItem('user', JSON.stringify(user));
    setIsLoggedIn(true);
  };

  const handleSignup = () => {
    setShowSignup(false);
  };

  const handleSocialLogin = (provider: string) => {
    const socialUser = { name: `${provider} 사용자`, email: `user@${provider}.com`, provider };
    localStorage.setItem('user', JSON.stringify(socialUser));
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  // --- 네비게이션 핸들러 ---
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const viewMap: Record<TabType, ViewType> = { dashboard: 'analysis', strategy: 'strategy', history: 'history' };
    setCurrentView(viewMap[tab]);
  };

  const handleViewChange = (view: string) => {
    // compare는 TopNav에서 직접 클릭 시 아이템이 없으므로 analysis로 이동
    setCurrentView(view === 'compare' ? 'analysis' : view as ViewType);
  };

  const navigateTo = (view: ViewType, from?: ViewType) => {
    if (from) setPreviousView(from);
    setCurrentView(view);
  };

  // --- 비인증 화면 ---
  if (!isLoggedIn) {
    return showSignup
      ? <SignupScreen onSignup={handleSignup} onBackToLogin={() => setShowSignup(false)} />
      : <LoginScreen onLogin={handleLogin} onSocialLogin={handleSocialLogin} onSignupClick={() => setShowSignup(true)} onForgotPassword={() => {}} />;
  }

  // --- 공통 props ---
  const commonProps = { darkMode, onNotificationClick: () => setCurrentView('notifications'), onProfileClick: () => setCurrentView('profile') };

  return (
    <div className={`flex flex-col h-screen w-screen ${darkMode ? 'dark bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <TopNavigation
        currentView={currentView}
        onViewChange={handleViewChange}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d: boolean) => !d)}
        onNotificationClick={() => setCurrentView('notifications')}
      />

      <div className="flex-1 flex overflow-hidden">
        {currentView === 'dashboard' && (
          <div className="w-[400px] border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
            <GlobalHeader
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode((d: boolean) => !d)}
              onNotificationClick={() => setCurrentView('notifications')}
              onSearch={setAiSearchQuery}
            />
          </div>
        )}

        <main className="flex-1 overflow-hidden">
          {currentView === 'dashboard' ? (
            <EnterpriseDashboard
              darkMode={darkMode}
              searchQuery={aiSearchQuery}
              onCompareClick={(items) => { setComparedItems(items); navigateTo('compare', 'dashboard'); }}
            />
          ) : currentView === 'analysis' ? (
            <MainDashboard
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onNavigateToRisk={() => setCurrentView('risk')}
              onArticleClick={(id) => { setSelectedArticle(id); navigateTo('article', 'analysis'); }}
              onCompareClick={(items) => { setComparedItems(items); navigateTo('compare', 'analysis'); }}
              {...commonProps}
            />
          ) : currentView === 'strategy' ? (
            <StrategyWorkspace activeTab={activeTab} onTabChange={handleTabChange} {...commonProps} darkMode={darkMode} language="ko" />
          ) : currentView === 'history' ? (
            <SearchHistory activeTab={activeTab} onTabChange={handleTabChange} {...commonProps} />
          ) : currentView === 'compare' ? (
            <CompareView items={comparedItems} onBack={() => setCurrentView(previousView)} darkMode={darkMode} />
          ) : currentView === 'risk' ? (
            <RiskAnalysis
              onBack={() => setCurrentView('analysis')}
              onArticleClick={(id) => { setSelectedArticle(id); navigateTo('article', 'risk'); }}
              {...commonProps}
            />
          ) : currentView === 'article' && selectedArticle !== null ? (
            <ArticleDetail articleId={selectedArticle} onBack={() => setCurrentView(previousView || 'analysis')} />
          ) : currentView === 'notifications' ? (
            <NotificationView onBack={() => setCurrentView('dashboard')} darkMode={darkMode} />
          ) : (currentView === 'profile' || currentView === 'settings') ? (
            <ProfileView onBack={() => setCurrentView('dashboard')} darkMode={darkMode} />
          ) : (
            <EnterpriseDashboard
              darkMode={darkMode}
              onCompareClick={(items) => { setComparedItems(items); navigateTo('compare', 'dashboard'); }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
