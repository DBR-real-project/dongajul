import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { FlipCard } from './FlipCard';

interface SignupScreenProps {
  onSignup: (email: string, password: string, name: string) => void;
  onBackToLogin: () => void;
}

export function SignupScreen({ onSignup, onBackToLogin }: SignupScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('올바른 이메일을 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!agreeTerms) {
      setError('이용약관에 동의해주세요.');
      return;
    }

    onSignup(email, password, name);
  };

  return (
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

      {/* Right Side - Signup Card */}
      <div className="relative z-10 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">로그인으로 돌아가기</span>
          </button>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              회원가입
            </h1>
            <p className="text-sm text-gray-600">
              전략 분석 플랫폼에 오신 것을 환영합니다
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
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent"
            />
          </div>

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
              placeholder="최소 6자 이상"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-700 font-medium">
              비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent"
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 mt-1 rounded border-gray-300 text-[#142755] focus:ring-[#142755]"
            />
            <label className="ml-2 text-sm text-gray-700">
              이용약관 및 개인정보 처리방침에 동의합니다
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-[#142755] hover:bg-[#444655] text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl mt-6"
          >
            회원가입
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
