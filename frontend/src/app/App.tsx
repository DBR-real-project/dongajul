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
import { AIChatbot } from './components/AIChatbot';
import { BASE_URL } from './utils/api';

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

// URL path ↔ ViewType 매핑 (브라우저 뒤로/앞으로 가기 지원)
const VIEW_PATHS: Record<ViewType, string> = {
  dashboard:    '/',
  analysis:     '/analysis',
  strategy:     '/strategy',
  history:      '/history',
  compare:      '/compare',
  risk:         '/risk',
  result:       '/result',
  'semantic-map': '/semantic-map',
  article:      '/article',
  notifications: '/notifications',
  profile:      '/profile',
  settings:     '/settings',
  subscription: '/subscription',
  checkout:     '/checkout',
};

const PATH_TO_VIEW: Record<string, ViewType> = Object.fromEntries(
  (Object.entries(VIEW_PATHS) as [ViewType, string][]).map(([v, p]) => [p, v])
);

export type TabType = 'dashboard' | 'strategy' | 'history';

interface CompareItem {
  id: number;
  status: string;
  label?: string;
  strategy: string;
  riskLevel: string;
  industry: string;
  title: string;
  strategySum: string;
  riskSum: string;
  source?: string;
  url?: string;
  published_at?: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [showSignup, setShowSignup] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    // URL 경로에서 초기 뷰 결정 (직접 URL 접근 또는 새로고침 대응)
    const path = window.location.pathname;
    return PATH_TO_VIEW[path] ?? 'dashboard';
  });
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [comparedItems, setComparedItems] = useState<CompareItem[]>([]);
  const [semanticQueryPoint, setSemanticQueryPoint] = useState<{
    umap_x: number;
    umap_y: number;
    cluster_name?: string;
  } | null>(null);
  const [semanticHighlightArticleId, setSemanticHighlightArticleId] = useState<number | null>(null);
  const [semanticHighlightClusterId, setSemanticHighlightClusterId] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    JSON.parse(localStorage.getItem('darkMode') || 'false')
  );
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisData | null>(null);
  const [diagnosisId, setDiagnosisId] = useState<number | undefined>(undefined);

  // 브라우저 뒤로/앞으로 가기 처리
  useEffect(() => {
    // 초기 history 엔트리에 view 정보 주입 (없으면 replaceState)
    if (!window.history.state?.view) {
      window.history.replaceState(
        { view: currentView, depth: 0 },
        '',
        VIEW_PATHS[currentView] ?? '/'
      );
    }

    const handlePopState = (e: PopStateEvent) => {
      const view = (e.state?.view as ViewType) ?? 'dashboard';
      setCurrentView(view);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      window.history.replaceState({ view: 'dashboard', depth: 0 }, '', '/');
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
      localStorage.setItem('user', JSON.stringify({ email }));
    }

    window.dispatchEvent(new Event('storage'));
    setIsLoggedIn(true);
    setShowSignup(false);
    window.history.replaceState({ view: 'dashboard', depth: 0 }, '', '/');
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
    window.history.replaceState({ view: 'dashboard', depth: 0 }, '', '/');
    setCurrentView('dashboard');
  };

  const handleSocialLogin = (provider: string) => {
    window.location.href = `${BASE_URL}/api/auth/${provider}`;
  };

  const handleLogout = () => {
    // 서버 측 refresh token 무효화 (fire-and-forget)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.id) {
      fetch(`${BASE_URL}/api/auth/logout`, {
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
    setSelectedArticle(null);
    setDiagnosisResult(null);
    setDiagnosisId(undefined);
    setActiveTab('dashboard');
    window.history.replaceState({ view: 'dashboard', depth: 0 }, '', '/');
    setCurrentView('dashboard');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const viewMap: Record<TabType, ViewType> = {
      dashboard: 'analysis',
      strategy: 'strategy',
      history: 'history',
    };
    const view = viewMap[tab];
    // 탭 전환은 depth=0 (최상위), pushState로 히스토리에 쌓음
    window.history.pushState({ view, depth: 0 }, '', VIEW_PATHS[view] ?? '/');
    setCurrentView(view);
  };

  const handleViewChange = (view: string) => {
    navigateTo(view as ViewType);
  };

  const navigateTo = (view: ViewType, _from?: ViewType) => {
    const depth = (window.history.state?.depth ?? 0) + 1;
    window.history.pushState({ view, depth }, '', VIEW_PATHS[view] ?? '/');
    setCurrentView(view);
  };

  const navigateBack = (fallback: ViewType = 'dashboard') => {
    const depth = window.history.state?.depth ?? 0;
    if (depth > 0) {
      // 브라우저 히스토리에 이전 엔트리 있음 → popstate가 뷰 업데이트
      window.history.back();
    } else {
      // 최상위(탭 루트) — 히스토리 없이 대체
      window.history.replaceState({ view: fallback, depth: 0 }, '', VIEW_PATHS[fallback] ?? '/');
      setCurrentView(fallback);
    }
  };

  const navigateToResult = (data: DiagnosisData, from: ViewType = 'risk') => {
    setDiagnosisResult(data);
    setDiagnosisId(undefined);
    // 새 진단 결과 좌표 미리 저장 (시맨틱맵에서 바로 사용 가능하도록)
    if (data.query_umap_x != null) {
      setSemanticQueryPoint({ umap_x: data.query_umap_x, umap_y: data.query_umap_y!, cluster_name: data.cluster_name });
    }
    navigateTo('result', from);
  };

  const navigateToResultById = (id: number, from: ViewType = 'history') => {
    setDiagnosisResult(null);
    setDiagnosisId(id);
    navigateTo('result', from);
  };

  const handleInsightSemanticMap = (article: {
    article_id?: number | null;
    umap_x?: number | null;
    umap_y?: number | null;
    cluster_id?: number | null;
    cluster_name?: string | null;
    category?: string | null;
    source?: string | null;
  }) => {
    // ai_server 시맨틱맵 포인트의 id는 행 인덱스라 DB article_id와 불일치
    // → article_vectors에서 JOIN된 umap_x/y 좌표를 직접 queryPoint로 사용
    setSemanticHighlightArticleId(null);
    setSemanticHighlightClusterId(null);
    if (article.umap_x != null && article.umap_y != null) {
      setSemanticQueryPoint({
        umap_x: article.umap_x,
        umap_y: article.umap_y,
        cluster_name: article.cluster_name || article.category || article.source || undefined,
      });
    } else if (article.cluster_id != null) {
      // 좌표 없는 경우(HBS 등) → cluster 센터 폴백은 SemanticMap이 처리
      setSemanticHighlightClusterId(article.cluster_id);
      setSemanticQueryPoint(null);
    } else {
      setSemanticQueryPoint(null);
    }
    navigateTo('semantic-map', 'analysis');
  };

  const handleDiagnosisSemanticMap = (coords?: { umap_x: number; umap_y: number; cluster_name?: string }) => {
    // 진단 결과 → 시맨틱맵: DiagnosisResult 로컬 데이터에서 좌표 전달받음
    setSemanticHighlightArticleId(null);
    setSemanticHighlightClusterId(null);
    if (coords) {
      setSemanticQueryPoint(coords);
    }
    navigateTo('semantic-map', 'result');
  };

  const handleInsightCompare = (articles: Array<any>) => {
    const compareItems = articles.map((article) => {
      const lbl = article.label || '';
      return {
        id: Number(article.article_id || article.id || 0),
        label: lbl,
        status: lbl === 'success' ? '성공' : lbl === 'failure' ? '실패' : '중립',
        strategy: String(article.strategy || article.category || article.source || '전략 정보 없음'),
        riskLevel: lbl === 'failure' ? 'High' : lbl === 'success' ? 'Low' : 'Medium',
        industry: String(article.industry || article.source || article.category || '-'),
        title: String(article.title || '제목 없음'),
        strategySum: String(article.summary || article.strategySum || '전략 요약 없음'),
        riskSum: String(article.summary || article.riskSum || '리스크 요약 없음'),
        source: article.source,
        url: article.url,
        published_at: article.published_at,
      };
    });

    setComparedItems(compareItems);
    navigateTo('compare', 'analysis');
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
    onNotificationClick: () => navigateTo('notifications'),
    onProfileClick: () => navigateTo('profile'),
  };

  return (
    <div className={`flex flex-col h-screen w-screen ${darkMode ? 'dark bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <TopNavigation
        currentView={currentView}
        onViewChange={handleViewChange}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onNotificationClick={() => navigateTo('notifications')}
        onLogout={handleLogout}
      />

      <AIChatbot darkMode={darkMode} />

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {currentView === 'dashboard' ? (
            <EnterpriseDashboard
              darkMode={darkMode}
              onStartDiagnosis={() => navigateTo('risk')}
              onViewInsights={() => navigateTo('analysis')}
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
              onShowSemanticMap={handleInsightSemanticMap}
              onCompareSelected={handleInsightCompare}
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
              onBack={() => navigateBack('analysis')}
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
              onBack={() => navigateBack('risk')}
              onSemanticMap={handleDiagnosisSemanticMap}
              darkMode={darkMode}
            />
          ) : currentView === 'semantic-map' ? (
            <SemanticMap
              darkMode={darkMode}
              queryPoint={semanticQueryPoint}
              highlightArticleId={semanticHighlightArticleId}
              highlightClusterId={semanticHighlightClusterId}
            />
          ) : currentView === 'article' && selectedArticle !== null ? (
            <ArticleDetail
              articleId={selectedArticle}
              onBack={() => navigateBack('analysis')}
              darkMode={darkMode}
            />
          ) : currentView === 'notifications' ? (
            <NotificationView
              onBack={() => navigateBack('dashboard')}
              onNavigate={(view) => navigateTo(view as any)}
              darkMode={darkMode}
            />
          ) : currentView === 'profile' || currentView === 'settings' ? (
            <ProfileView
              onBack={() => navigateBack('dashboard')}
              darkMode={darkMode}
            />
          ) : currentView === 'subscription' ? (
            <SubscriptionPage
              onStartBasic={() => navigateTo('dashboard')}
              onSubscribe={() => navigateTo('checkout')}
              darkMode={darkMode}
            />
          ) : currentView === 'checkout' ? (
            <CheckoutPage onBack={() => navigateBack('subscription')} onSuccess={() => navigateTo('dashboard')} darkMode={darkMode} />
          ) : (
            <EnterpriseDashboard
              darkMode={darkMode}
              onStartDiagnosis={() => navigateTo('risk')}
              onViewInsights={() => navigateTo('analysis')}
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
