import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { TopNavigation } from './components/TopNavigation';
import { EnterpriseDashboard } from './components/EnterpriseDashboard';
import { StrategyWorkspace } from './components/StrategyWorkspace';
import { SearchHistory } from './components/SearchHistory';
import { RiskAnalysis } from './components/RiskAnalysis';
import { DiagnosisInterview } from './components/DiagnosisInterview';
import { DiagnosisResult, DiagnosisData } from './components/DiagnosisResult';
import { InsightDashboard } from './components/InsightDashboard';
import { ArticleDetail } from './components/ArticleDetail';
import { NotificationView } from './components/NotificationView';
import { ProfileView } from './components/ProfileView';
import { CompareView } from './components/CompareView';
import { SemanticMap } from './components/SemanticMap';
import { SubscriptionPage } from './components/SubscriptionPage';
import { CheckoutPage } from './components/CheckoutPage';

export type ViewType =
  | 'dashboard'
  | 'analysis'
  | 'strategy'
  | 'compare'
  | 'history'
  | 'settings'
  | 'risk'
  | 'article'
  | 'notifications'
  | 'profile'
  | 'result'
  | 'semantic-map'
  | 'subscription'
  | 'checkout';

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
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [showSignup, setShowSignup] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [comparedItems, setComparedItems] = useState<CompareItem[]>([]);
  const [previousView, setPreviousView] = useState<ViewType>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    JSON.parse(localStorage.getItem('darkMode') || 'false')
  );
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisData | null>(null);
  const [diagnosisId, setDiagnosisId] = useState<number | undefined>(undefined);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // 소셜 로그인 콜백 토큰 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) return;

    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');

      // UTF-8 디코딩 시도 → 실패 시 단순 atob fallback (이름 깨질 수 있지만 로그인은 됨)
      let payload: any;
      try {
        payload = JSON.parse(
          decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
        );
      } catch {
        payload = JSON.parse(atob(token.split('.')[1]));
      }

      const user = {
        id: payload.user_id,
        email: payload.email,
        name: payload.name,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userName', user.name || user.email || '사용자');

      // 소셜 로그인 refresh token 저장
      const refreshToken = params.get('refresh_token');
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      setIsLoggedIn(true);
      window.history.replaceState({}, '', '/');
    } catch (e) {
      // 토큰 자체가 손상된 경우에만 제거
      console.error('토큰 파싱 실패:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('userName');
    }
  }, []);

  const handleLogin = (email: string, token: string) => {
    if (token) {
      localStorage.setItem('token', token);
    }

    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      localStorage.setItem(
        'user',
        JSON.stringify({ email })
      );
    }

    setIsLoggedIn(true);
    setShowSignup(false);
    setCurrentView('dashboard');
  };

  const handleSignup = (email: string, token: string) => {
    localStorage.setItem('token', token);

    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      localStorage.setItem(
        'user',
        JSON.stringify({ email })
      );
    }

    setIsLoggedIn(true);
    setShowSignup(false);
    setCurrentView('dashboard');
  };

  const handleSocialLogin = (provider: string) => {
    window.location.href = `http://localhost:3001/api/auth/${provider}`;
  };

  const handleLogout = () => {
    // 서버 측 refresh token 무효화 (fire-and-forget)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.id) {
      fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setShowSignup(false);
    setCurrentView('dashboard');
    setActiveTab('dashboard');
    setPreviousView('dashboard');
    setSelectedArticle(null);
    setDiagnosisResult(null);
    setDiagnosisId(undefined);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);

    const viewMap: Record<TabType, ViewType> = {
      dashboard: 'analysis',
      strategy: 'strategy',
      history: 'history',
    };

    setCurrentView(viewMap[tab]);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view as ViewType);
  };

  const navigateTo = (view: ViewType, from?: ViewType) => {
    if (from) {
      setPreviousView(from);
    }

    setCurrentView(view);
  };

  const navigateToResult = (data: DiagnosisData, from: ViewType = 'risk') => {
    setDiagnosisResult(data);
    setDiagnosisId(undefined);
    navigateTo('result', from);
  };

  const navigateToResultById = (id: number, from: ViewType = 'history') => {
    setDiagnosisResult(null);
    setDiagnosisId(id);
    navigateTo('result', from);
  };

  if (!isLoggedIn) {
    return showSignup ? (
      <SignupScreen
        onSignup={handleSignup}
        onBackToLogin={() => setShowSignup(false)}
      />
    ) : (
      <LoginScreen
        onLogin={handleLogin}
        onSocialLogin={handleSocialLogin}
        onSignupClick={() => setShowSignup(true)}
        onForgotPassword={() => { }}
      />
    );
  }

  const commonProps = {
    darkMode,
    onNotificationClick: () => setCurrentView('notifications'),
    onProfileClick: () => setCurrentView('profile'),
  };

  return (
    <div className={`flex flex-col h-screen w-screen ${darkMode ? 'dark bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <TopNavigation
        currentView={currentView}
        onViewChange={handleViewChange}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onNotificationClick={() => setCurrentView('notifications')}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {currentView === 'dashboard' ? (
            <EnterpriseDashboard
              darkMode={darkMode}
              onStartDiagnosis={() => setCurrentView('risk')}
              onViewInsights={() => setCurrentView('analysis')}
              onCompareClick={(items: CompareItem[]) => {
                setComparedItems(items);
                navigateTo('compare', 'dashboard');
              }}
            />
          ) : currentView === 'analysis' ? (
            <InsightDashboard
              darkMode={darkMode}
              onArticleClick={(id: number) => {
                setSelectedArticle(id);
                navigateTo('article', 'analysis');
              }}
            />
          ) : currentView === 'strategy' ? (
            <StrategyWorkspace
              activeTab={activeTab}
              onTabChange={handleTabChange}
              {...commonProps}
              darkMode={darkMode}
              language="ko"
            />
          ) : currentView === 'history' ? (
            <SearchHistory
              darkMode={darkMode}
              onResultByIdClick={(id: number) => navigateToResultById(id, 'history')}
            />
          ) : currentView === 'compare' ? (
            <CompareView
              items={comparedItems}
              onBack={() => setCurrentView(previousView)}
              darkMode={darkMode}
            />
          ) : currentView === 'risk' ? (
            <DiagnosisInterview
              darkMode={darkMode}
              onResultClick={(data: DiagnosisData) => navigateToResult(data, 'risk')}
            />
          ) : currentView === 'result' ? (
            <DiagnosisResult
              resultData={diagnosisResult ?? undefined}
              diagnosisId={diagnosisId}
              onBack={() => setCurrentView(previousView || 'risk')}
              onSemanticMap={() => navigateTo('semantic-map', 'result')}
              darkMode={darkMode}
            />
          ) : currentView === 'semantic-map' ? (
            <SemanticMap
              darkMode={darkMode}
              onBack={() => setCurrentView(previousView || 'dashboard')}
              queryPoint={diagnosisResult?.query_umap_x != null ? {
                umap_x: diagnosisResult.query_umap_x!,
                umap_y: diagnosisResult.query_umap_y!,
                cluster_name: diagnosisResult.cluster_name,
              } : null}
            />
          ) : currentView === 'article' && selectedArticle !== null ? (
            <ArticleDetail
              articleId={selectedArticle}
              onBack={() => setCurrentView(previousView || 'analysis')}
            />
          ) : currentView === 'notifications' ? (
            <NotificationView
              onBack={() => setCurrentView('dashboard')}
              darkMode={darkMode}
            />
          ) : currentView === 'profile' || currentView === 'settings' ? (
            <ProfileView
              onBack={() => setCurrentView('dashboard')}
              darkMode={darkMode}
            />
          ) : currentView === 'subscription' ? (
            <SubscriptionPage
              onStartBasic={() => setCurrentView('dashboard')}
              onSubscribe={() => setCurrentView('checkout')}
            />
          ) : currentView === 'checkout' ? (
            <CheckoutPage onBack={() => setCurrentView('subscription')} />
          ) : (
            <EnterpriseDashboard
              darkMode={darkMode}
              onStartDiagnosis={() => setCurrentView('risk')}
              onViewInsights={() => setCurrentView('analysis')}
              onCompareClick={(items: CompareItem[]) => {
                setComparedItems(items);
                navigateTo('compare', 'dashboard');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
