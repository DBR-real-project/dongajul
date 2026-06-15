import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { useArticleCount } from '../utils/articleCount';

interface SignupScreenProps {
  onSignup: (email: string, token: string) => void;
  onBackToLogin: () => void;
}

export function SignupScreen({ onSignup, onBackToLogin }: SignupScreenProps) {
  const articleCount = useArticleCount();
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
    // 1. [배경 테마] 전체 화면 고정 및 이미지 속 다크 네이비 단색 톤 싱크
    <div className="fixed inset-0 flex items-center justify-center bg-[#070e1e] overflow-y-auto p-6 md:p-12 font-sans selection:bg-[#142755] selection:text-white">
      
      {/* 백그라운드 은은한 대시보드 맵 이미지 배치 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
          alt="Analytics Dashboard Background"
          className="w-full h-full object-cover opacity-5"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#060B15] via-[#070E1F] to-[#0D1935] opacity-95"></div>
      </div>

      {/* 2. [황금 비율 컨테이너] 이미지와 완벽히 일치하는 가로 분할 및 간격 고정 */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-12 md:gap-24 items-center px-4 md:px-8">
        
        {/* [왼쪽 영역] 이미지 기준 텍스트 및 오렌지/블루 컬러 강조 포인트 완벽 동기화 */}
        <div className="text-center md:text-left text-white">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            동아줄 <span className="text-[#4285F4]">AI</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold text-gray-200 mb-8 tracking-tight">AI 전략 리스크 진단 플랫폼</p>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed font-light max-w-md mx-auto md:mx-0">
            DBR·HBR <span className="text-[#E5BA73] font-medium">{articleCount}건 성공·실패 사례</span>를 분석해
            <br />
            당신의 전략이 가진 <span className="text-[#E5BA73] font-medium">리스크를 정확히 진단</span>합니다.
          </p>
        </div>

        {/* [오른쪽 영역] 회원가입 컴팩트 화이트 카드 본체 */}
        <div className="flex justify-center md:justify-end w-full">
          <div className="bg-white rounded-[24px] shadow-2xl p-8 md:p-9 w-full max-w-[430px] border border-gray-100 text-slate-900 transition-all">
            
            {/* 로그인으로 돌아가기 단추 */}
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex items-center gap-1.5 text-gray-400 hover:text-[#142755] mb-6 transition-colors group"
            >
              <span className="text-xs font-semibold transition-transform group-hover:-translate-x-0.5">←</span>
              <span className="text-xs font-semibold">로그인으로 돌아가기</span>
            </button>

            {/* 헤더 안내 타이틀 */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold mb-1.5 text-gray-900 tracking-tight">회원가입</h2>
              <p className="text-xs text-gray-400 font-medium">동아줄 AI와 함께 전략 리스크를 진단하세요</p>
            </div>

            {/* 에러 피드백 바 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium animate-pulse">
                {error}
              </div>
            )}

            {/* 입력 폼 데이터 섹션 (인풋 필드 라운드 및 백그라운드 완벽 싱크) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-xs text-slate-700 font-bold">
                  이름 <span className="text-[#E5BA73] font-black">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-slate-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#142755]/20 focus:border-[#142755] transition-all"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs text-slate-700 font-bold">
                  이메일 <span className="text-[#E5BA73] font-black">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@company.com"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-slate-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#142755]/20 focus:border-[#142755] transition-all"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs text-slate-700 font-bold">
                  비밀번호 <span className="text-[#E5BA73] font-black">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-slate-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#142755]/20 focus:border-[#142755] transition-all"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs text-slate-700 font-bold">
                  비밀번호 확인 <span className="text-[#E5BA73] font-black">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-slate-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#142755]/20 focus:border-[#142755] transition-all"
                />
              </div>

              {/* 동의 체크박스 영역 */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#142755] focus:ring-[#142755] cursor-pointer"
                />
                <label
                  htmlFor="agree-terms"
                  className="text-xs font-medium text-slate-500 cursor-pointer select-none"
                >
                  이용약관 및 개인정보 처리방침에 동의합니다
                </label>
              </div>

              {/* 회원가입 제출 버튼 */}
              <button
                type="submit"
                className="w-full bg-[#142755] hover:bg-[#1a316c] text-white py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] mt-4 text-sm tracking-wide"
              >
                회원가입 완료
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}