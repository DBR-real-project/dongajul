import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, token: string) => void;
  onSocialLogin: (provider: string) => void;
  onSignupClick: () => void;
  onForgotPassword?: () => void;
}

export function LoginScreen({ onLogin, onSocialLogin, onSignupClick, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [resetMsg, setResetMsg] = useState('');

  // 1. 에러 해결 포인트: React.FormEvent 대신 권장 표준인 React.SubmitEvent 사용
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

  if (res.ok) {
    // 1. 서버가 준 토큰을 'token'이라는 이름으로 지갑에 넣기
    const tokenValue = data.token || data.accessToken;
    if (tokenValue) {
      localStorage.setItem('token', tokenValue);
    }

    // 2. user 전체 저장 (user.id가 있어야 히스토리 조회 가능)
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      const displayName = data.user.nickname || data.user.name || data.user.email || '사용자';
      localStorage.setItem('userName', displayName);
    }

    // 3. 기존 로그인 처리 로직 실행
    onLogin(data.user.email, tokenValue);
  } else {
    setError((data as { message?: string }).message || '로그인 실패');
      }
    } catch (err) {
      console.error(err);
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  };
  const handlePasswordReset = async () => {
  if (!resetEmail) {
    setResetStatus('error');
    setResetMsg('이메일을 입력해주세요.');
    return;
  }

  try {
    setResetStatus('loading');

    const res = await fetch('http://localhost:3001/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail }),
    });

    const data = await res.json();

    if (res.ok) {
      setResetStatus('done');
      setResetMsg('이메일로 재설정 링크를 보냈습니다.');
    } else {
      setResetStatus('error');
      setResetMsg(data.message || '실패했습니다.');
    }
  } catch (err) {
    setResetStatus('error');
    setResetMsg('서버 오류가 발생했습니다.');
  }
};


  return (
    <>
      <div className="fixed inset-0 min-h-screen w-screen grid grid-cols-[1.618fr_1fr] bg-[#142755] overflow-hidden">
        
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 w-full h-full z-0">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Analytics Dashboard Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[#0f1d3e] via-[#142755]/90 to-[#1d3573]/80"></div>
        </div>

        {/* Left Side - Branding & Background */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20">
          <h1 className="text-6xl font-extrabold tracking-tight text-white mb-4 select-none">
            동아줄 <span className="text-[#E5BA73]">AI</span>
          </h1>
          <p className="text-2xl font-medium text-gray-300 mb-8 select-none">AI 전략 리스크 진단 플랫폼</p>
          <p className="text-lg text-blue-100/90 max-w-xl leading-relaxed font-light select-none">
            DBR·HBR <span className="text-[#E5BA73] font-medium">13,335건 성공·실패 사례</span>를 분석해
            <br />
            당신의 전략이 가진 <span className="text-[#E5BA73] font-medium">리스크를 정확히 진단</span>합니다.
          </p>

        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#E5BA73]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Right Side - Login Card */}
        <div className="relative z-10 flex items-center justify-center p-8 bg-black/5 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2 text-gray-900 tracking-tight">
                로그인
              </h1>
              <p className="text-sm text-gray-500">
                동아줄 AI 플랫폼에 오신 것을 환영합니다
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm text-gray-700 font-medium">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@company.com"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-sm text-gray-700 font-medium">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <label htmlFor="keep-logged-in" className="flex items-center cursor-pointer select-none">
                  <input
                    id="keep-logged-in"
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#142755] focus:ring-[#142755] cursor-pointer"
                  />
                  <span className="ml-2 text-gray-600">로그인 유지</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#142755] hover:bg-[#1f3a7a] text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl mt-6 tracking-wide"
              >
                로그인
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-400">간편 로그인</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { window.location.href = 'http://localhost:3001/api/auth/kakao'; }}
                  className="flex flex-col items-center justify-center py-2.5 bg-[#FEE500] hover:bg-[#FDD835] rounded-lg transition-all border border-transparent shadow-sm"
                >
                  <span className="text-xl mb-0.5">💬</span>
                  <span className="text-[11px] text-gray-800 font-semibold">카카오</span>
                </button>
                <button
                  type="button"
                  onClick={() => { window.location.href = 'http://localhost:3001/api/auth/naver'; }}
                  className="flex flex-col items-center justify-center py-2.5 bg-[#03C75A] hover:bg-[#02B350] rounded-lg transition-all border border-transparent shadow-sm"
                >
                  <span className="text-lg text-white mb-0.5 font-black leading-none">N</span>
                  <span className="text-[11px] text-white font-semibold">네이버</span>
                </button>
                <button
                  type="button"
                  onClick={() => { window.location.href = 'http://localhost:3001/api/auth/google'; }}
                  className="flex flex-col items-center justify-center py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-200 shadow-sm"
                >
                  <span className="text-xl mb-0.5 font-bold text-gray-700">G</span>
                  <span className="text-[11px] text-gray-600 font-semibold">구글</span>
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6">
                계정이 없으신가요?{' '}
                <button 
                  type="button" 
                  onClick={onSignupClick} 
                  className="text-[#142755] hover:text-[#1f3a7a] font-bold hover:underline transition-colors"
                >
                  회원가입
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* 비밀번호 재설정 모달 */}
      {showResetModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setShowResetModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 sm:p-8 rounded-xl shadow-2xl z-50 w-[90%] max-w-md border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">비밀번호 찾기</h2>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              등록된 이메일로 비밀번호 재설정 링크를 보내드립니다.
            </p>
            {resetStatus === 'done' ? (
              <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
                ✅ {resetMsg}
              </div>
            ) : (
              <>
                {resetStatus === 'error' && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
                    {resetMsg}
                  </div>
                )}
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => { setResetEmail(e.target.value); setResetStatus('idle'); }}
                  placeholder="example@company.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-5 focus:outline-none focus:ring-2 focus:ring-[#142755] text-gray-900 placeholder-gray-400"
                />
              </>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowResetModal(false); setResetStatus('idle'); setResetMsg(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                {resetStatus === 'done' ? '닫기' : '취소'}
              </button>
              {resetStatus !== 'done' && (
                <button
                  onClick={handlePasswordReset}
                  disabled={resetStatus === 'loading'}
                  className="flex-1 px-4 py-2.5 bg-[#142755] text-white rounded-lg font-medium hover:bg-[#1f3a7a] transition-colors text-sm shadow-md disabled:opacity-60"
                >
                  {resetStatus === 'loading' ? '전송 중...' : '전송'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
