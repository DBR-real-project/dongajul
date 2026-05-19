import { useState } from 'react';
import { FlipCard } from './FlipCard';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  onSocialLogin: (provider: string) => void;
  onSignupClick: () => void;
  onForgotPassword?: () => void;
}

interface User {
  name: string;
  email: string;
  password: string;
}

export function LoginScreen({ onLogin, onSocialLogin, onSignupClick, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('올바른 이메일을 입력해주세요.');
      return;
    }

    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    onLogin(email, password);
  };

  const handlePasswordReset = () => {
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      alert('올바른 이메일을 입력해주세요.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const user = users.find((u) => u.email === resetEmail);

    if (user) {
      alert('비밀번호 재설정 링크가 이메일로 전송되었습니다.');
      setResetEmail('');
      setShowResetModal(false);
    } else {
      alert('등록되지 않은 이메일입니다.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 grid grid-cols-[1.618fr_1fr] bg-[#142755] relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Analytics Dashboard Background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[#142755]/70"></div>
        </div>

        {/* Left Side - Branding & Background */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20">
          <h1 className="text-6xl font-bold text-white mb-4">Start Q AI</h1>
          <p className="text-2xl text-gray-300 mb-8">전략 분석 플랫폼</p>
          <p className="text-lg text-blue-100 max-w-xl leading-relaxed">
            AI 기반 전략 분석으로 데이터를 인사이트로 전환하세요
          </p>

          {/* Decorative Stats - Flip Cards */}
          <div className="mt-16">
            <FlipCard isLoggedIn={false} />
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gray-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>

        {/* Right Side - Login Card */}
        <div className="relative z-10 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                로그인
              </h1>
              <p className="text-sm text-gray-600">
                전략 분석 플랫폼
              </p>
            </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm text-gray-700 font-medium">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-gray-700 font-medium">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#142755] focus:ring-[#142755]"
                />
                <span className="ml-2 text-gray-700">로그인 유지</span>
              </label>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-[#142755] hover:text-[#142755] hover:underline"
              >
                비밀번호 찾기
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#142755] hover:bg-[#444655] text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl mt-6"
            >
              로그인
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onSocialLogin('kakao')}
                className="flex flex-col items-center justify-center py-3 bg-[#FEE500] hover:bg-[#FDD835] rounded-lg transition-all border border-gray-200"
              >
                <span className="text-2xl mb-1">💬</span>
                <span className="text-xs text-gray-800 font-medium">카카오</span>
              </button>
              <button
                type="button"
                onClick={() => onSocialLogin('naver')}
                className="flex flex-col items-center justify-center py-3 bg-[#03C75A] hover:bg-[#02B350] rounded-lg transition-all border border-gray-200"
              >
                <span className="text-2xl text-white mb-1 font-bold">N</span>
                <span className="text-xs text-white font-medium">네이버</span>
              </button>
              <button
                type="button"
                onClick={() => onSocialLogin('google')}
                className="flex flex-col items-center justify-center py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
              >
                <span className="text-2xl mb-1">G</span>
                <span className="text-xs text-gray-700 font-medium">구글</span>
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-6">
              {"계정이 없으신가요? "}
              <button type="button" onClick={onSignupClick} className="text-[#142755] hover:text-[#142755] font-semibold hover:underline">
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
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowResetModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 sm:p-8 rounded-xl shadow-2xl z-50 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">비밀번호 찾기</h2>
            <p className="text-sm text-gray-600 mb-4">
              등록된 이메일로 비밀번호 재설정 링크를 보내드립니다.
            </p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="example@company.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#142755]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handlePasswordReset}
                className="flex-1 px-4 py-2 bg-[#142755] text-white rounded-lg hover:bg-[#444655] transition-colors"
              >
                전송
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
