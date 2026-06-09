import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';

interface SignupScreenProps {
  onSignup: (email: string, token: string) => void;
  onBackToLogin: () => void;
}

export function SignupScreen({ onSignup, onBackToLogin }: SignupScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('올바른 이메일을 입력해주세요.'); return; }
    if (password.length < 6) { setError('비밀번호는 최소 6자 이상이어야 합니다.'); return; }
    if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (!agreeTerms) { setError('이용약관에 동의해주세요.'); return; }

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        localStorage.setItem('user', JSON.stringify(data.user));
        onSignup(data.user.email, data.token);
      } else {
        setError(data.message || '회원가입 실패');
      }
    } catch (err) {
      console.error(err);
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 grid grid-cols-[1.618fr_1fr] bg-[#142755] relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
          alt="Analytics Dashboard Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0f1d3e] via-[#142755]/90 to-[#1d3573]/80"></div>
      </div>

      <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20">
        <h1 className="text-6xl font-extrabold tracking-tight text-white mb-4">
          동아줄 <span className="text-[#E5BA73]">AI</span>
        </h1>
        <p className="text-2xl font-medium text-gray-300 mb-8">AI 전략 리스크 진단 플랫폼</p>
        <p className="text-lg text-blue-100/90 max-w-xl leading-relaxed font-light">
          13,335건 <span className="text-[#E5BA73] font-medium">성공·실패 사례</span>를 바탕으로
          <br />
          당신의 전략 리스크를 <span className="text-[#E5BA73] font-medium">AI가 정확히 진단</span>합니다.
        </p>
      </div>

      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#E5BA73]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex items-center justify-center p-8 bg-black/5 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-gray-500 hover:text-[#142755] mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">로그인으로 돌아가기</span>
          </button>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 text-gray-900 tracking-tight">회원가입</h2>
            <p className="text-sm text-gray-500">동아줄 AI와 함께 전략 리스크를 진단하세요</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-sm text-gray-700 font-medium">
                이름 <span className="text-[#E5BA73]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm text-gray-700 font-medium">
                이메일 <span className="text-[#E5BA73]">*</span>
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
                비밀번호 <span className="text-[#E5BA73]">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 6자 이상"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm text-gray-700 font-medium">
                비밀번호 확인 <span className="text-[#E5BA73]">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-start pt-1">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#142755] focus:ring-[#142755] cursor-pointer"
              />
              <label
                htmlFor="agree-terms"
                className="ml-2 text-sm text-gray-600 cursor-pointer select-none"
              >
                이용약관 및 개인정보 처리방침에 동의합니다
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-[#142755] hover:bg-[#1f3a7a] text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl mt-6 tracking-wide"
            >
              회원가입 완료
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
