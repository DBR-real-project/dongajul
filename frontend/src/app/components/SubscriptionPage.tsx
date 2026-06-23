'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useArticleCount } from '../utils/articleCount';
import { X } from 'lucide-react';

interface SubscriptionPageProps {
  onStartBasic: () => void;
  onSubscribe: () => void;
  darkMode?: boolean;
}

export function SubscriptionPage({ onStartBasic, onSubscribe, darkMode = false }: SubscriptionPageProps) {
  const articleCount = useArticleCount();
  const dm = darkMode;
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentPlan(user.subscription_type || 'free');
    } catch {}
  }, []);

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert('동아줄 영업팀에 문의가 성공적으로 전달되었습니다. 담당자가 곧 연락드리겠습니다!');
    setShowContactModal(false);
    setContactForm({ name: '', email: '', message: '' });
  };

  return (
    <div className={`min-h-screen py-20 px-4 flex flex-col items-center justify-center font-sans ${dm ? 'bg-[#0A0E1A]' : 'bg-gray-50'}`}>

      {/* 상단 타이틀 */}
      <div className="text-center mb-16">
        <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${dm ? 'text-white' : 'text-slate-900'}`}>
          비즈니스에 맞는 진단 플랜을 선택하세요
        </h1>
        <p className={dm ? 'text-gray-400' : 'text-gray-500'}>
          {articleCount}건의 DBR·HBR 사례 기반 AI 분석으로 전략의 실패 리스크를 최소화하세요.
        </p>
      </div>

      {/* 3단 카드 컨테이너 */}
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 max-w-6xl">

        {/* 1. Basic 플랜 */}
        <div className={`w-[320px] p-8 rounded-[24px] shadow-sm border flex flex-col transition-all duration-300 hover:-translate-y-3 hover:shadow-xl cursor-pointer ${dm ? 'bg-[#111827] border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${dm ? 'text-gray-200' : 'text-slate-700'}`}>베이직</h2>
          <p className={`mb-6 text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
            기본적인 비즈니스 전략 방향성 점검
          </p>
          <div className={`text-3xl font-bold mb-6 ${dm ? 'text-white' : 'text-slate-800'}`}>
            무료
          </div>
          <button
            onClick={onStartBasic}
            className="w-full bg-[#E6B767] text-white py-3 rounded-xl font-bold transition hover:opacity-90 active:scale-95 mb-8"
          >
            시작하기
          </button>
          <ul className={`space-y-4 text-sm flex-grow ${dm ? 'text-gray-400' : 'text-slate-600'}`}>
            <li className="flex items-start gap-2">
              <span className={dm ? 'text-gray-500' : 'text-gray-400'}>✓</span>
              <span>선택 산업군 기반 기본 리스크 진단</span>
            </li>
            <li className="flex items-start gap-2">
              <span className={dm ? 'text-gray-500' : 'text-gray-400'}>✓</span>
              <span>DBR·HBR 핵심 유사 사례 매칭 (제한적)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className={dm ? 'text-gray-500' : 'text-gray-400'}>✓</span>
              <span>기본 진단 요약 리포트 제공</span>
            </li>
          </ul>
        </div>

        {/* 2. Premium 플랜 */}
        <div className={`relative w-[350px] p-[1.5px] rounded-[26px] bg-gradient-to-b ${dm ? 'from-[#E5BA73] to-transparent' : 'from-[#E5BA73] via-gray-200 to-transparent'} shadow-2xl z-10 transition-all duration-300 hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(229,186,115,0.15)] cursor-pointer`}>
          
          {/* 🌟 배너 텍스트를 "DONG-A PREMIUM"으로 변경하고 패딩과 자간 최적화 */}
          <div className="absolute -top-3 right-6 z-20 bg-gradient-to-r from-[#E5BA73] via-[#F3D596] to-[#C8994B] text-[#060B16] text-[9px] font-black px-3 py-0.5 rounded-full shadow-[0_3px_10px_rgba(229,186,115,0.4)] tracking-wide select-none uppercase">
            DONG-A PREMIUM
          </div>

          <div className={`p-8 rounded-[24px] h-full flex flex-col ${dm ? 'bg-[#111827]' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-4">
              
              {/* 커스텀 골드 스타 남색 메달 인라인 SVG */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 select-none shrink-0">
                <circle cx="12" cy="12" r="10.5" fill="#142755" stroke="#E5BA73" strokeWidth="1.2" />
                <path d="M8.5 8.5L15.5 14.5M15.5 8.5L8.5 14.5" stroke="#E5BA73" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
                <polygon points="12,5.5 13.6,10.4 18.5,12 13.6,13.6 12,18.5 10.4,13.6 5.5,12 10.4,10.4" fill="#E5BA73" />
                <circle cx="12" cy="12" r="1.2" fill="#FFFFFF" opacity="0.4" />
              </svg>
              
              <h2 className="text-xl font-bold text-[#E5BA73]">
                프리미엄 (추천)
              </h2>
            </div>
            <p className={`mb-6 text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
              심층 리스크 분석과 맞춤형 전략 인사이트
            </p>
            <div className={`text-3xl font-bold mb-6 ${dm ? 'text-white' : 'text-slate-800'}`}>
              ₩9,900 <span className={`text-lg font-normal ${dm ? 'text-gray-500' : 'text-gray-400'}`}>/ 월</span>
            </div>
            
            {/* 고급진 금색 그라데이션 및 네이비 텍스트 버튼 */}
            <button
              onClick={currentPlan === 'premium' ? undefined : onSubscribe}
              disabled={currentPlan === 'premium'}
              className={`w-full bg-gradient-to-r from-[#E5BA73] via-[#F3D596] to-[#C8994B] text-[#060B16] py-3 rounded-xl font-extrabold transition shadow-[0_4px_14px_rgba(229,186,115,0.3)] mb-8 ${
                currentPlan === 'premium'
                  ? 'opacity-60 cursor-not-allowed bg-none bg-slate-200 dark:bg-gray-700 !text-slate-500 dark:!text-gray-400 shadow-none'
                  : 'hover:opacity-95 hover:shadow-[0_6px_20px_rgba(229,186,115,0.4)] active:scale-[0.98]'
              }`}
            >
              {currentPlan === 'premium' ? '현재 구독 중 ✓' : '구독하기'}
            </button>
            
            <ul className={`space-y-4 text-sm flex-grow font-medium ${dm ? 'text-gray-300' : 'text-slate-700'}`}>
              <li className="flex items-start gap-2">
                <span className="text-[#E5BA73] font-bold shrink-0">✓</span>
                <span>{articleCount}건 사례 데이터 딥다이브 분석</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E5BA73] font-bold shrink-0">✓</span>
                <span>상세 실패 패턴 및 시맨틱 맵 제공</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E5BA73] font-bold shrink-0">✓</span>
                <span>산업군 맞춤형 해결책 및 액션 플랜</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E5BA73] font-bold shrink-0">✓</span>
                <span>진단 이력 무제한 보관 및 시계열 비교</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Enterprise 플랜 */}
        <div className={`w-[320px] p-8 rounded-[24px] shadow-sm border flex flex-col transition-all duration-300 hover:-translate-y-3 hover:shadow-xl cursor-pointer ${dm ? 'bg-[#111827] border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${dm ? 'text-gray-200' : 'text-slate-700'}`}>엔터프라이즈</h2>
          <p className={`mb-6 text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
            전사적 리스크 관리 및 사내 데이터 연동
          </p>
          <div className={`text-3xl font-bold mb-6 ${dm ? 'text-white' : 'text-slate-800'}`}>
            별도 문의
          </div>
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className={`w-full py-3 rounded-xl font-bold transition mb-8 active:scale-95 block text-center text-white ${dm ? 'bg-[#1F2E4D] hover:bg-[#283A66]' : 'bg-[#0B1931] hover:bg-[#142755]'}`}
          >
            영업팀 문의
          </button>
          <ul className={`space-y-4 text-sm flex-grow ${dm ? 'text-gray-400' : 'text-slate-600'}`}>
            <li className="flex items-start gap-2">
              <span className={`font-bold shrink-0 ${dm ? 'text-gray-300' : 'text-slate-900'}`}>✓</span>
              <span>프리미엄 플랜의 모든 기능 포함</span>
            </li>
            <li className="flex items-start gap-2">
              <span className={`font-bold shrink-0 ${dm ? 'text-gray-300' : 'text-slate-900'}`}>✓</span>
              <span>사내 비즈니스 데이터 연동 (API 지원)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className={`font-bold shrink-0 ${dm ? 'text-gray-300' : 'text-slate-900'}`}>✓</span>
              <span>부서별 통합 대시보드 및 전담 매니저</span>
            </li>
          </ul>
        </div>

      </div>

      {/* 영업팀 문의 모달 영역 */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl bg-[#060B18] rounded-[26px] shadow-2xl p-8 md:p-12 border border-white/10 overflow-hidden text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-[#060B16] via-[#0B1528] to-[#11203E] pointer-events-none z-0"></div>
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-5 right-5 z-20 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 lg:gap-14 items-center">
              <div className="text-center md:text-left">
                <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                  동아줄 <span className="text-[#E5BA73]">AI</span>
                </h3>
                <p className="text-base font-medium text-gray-300 mb-6 tracking-wide">AI 전략 리스크 진단 플랫폼</p>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-light max-w-sm mx-auto md:mx-0">
                  <span className="text-slate-300 font-medium">DBR·HBR</span>{' '}
                  <span className="text-amber-400/90 font-medium">{articleCount}건 성공·실패 사례</span>를 분석해
                  <br />
                  당신의 비즈니스 전략이 가진{' '}
                  <span className="text-amber-400/90 font-medium">리스크를 정확히 진단</span>합니다.
                </p>
              </div>

              <div className="flex justify-center md:justify-end w-full">
                <div className="bg-white rounded-[24px] p-6 md:p-8 w-full max-w-[390px] text-slate-900 shadow-xl border border-gray-100">
                  <div className="text-center mb-5">
                    <h4 className="text-xl font-bold mb-1 text-gray-900 tracking-tight">영업팀 문의하기</h4>
                    <p className="text-xs text-gray-400 font-medium">엔터프라이즈 도입 및 데이터 연동 상담</p>
                  </div>

                  <form onSubmit={handleContactSubmit} className="space-y-3.5">
                    <div>
                      <label className="block mb-1 text-xs text-slate-700 font-bold">회사명 / 이름 *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="동아줄테크 / 홍길동"
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-slate-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs text-slate-700 font-bold">회신받을 이메일 *</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="example@company.com"
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-slate-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs text-slate-700 font-bold">문의 내용 *</label>
                      <textarea
                        required
                        rows={3}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="인원 규모 및 연동이 필요한 사내 데이터 종류를 기재해 주세요."
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-slate-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-transparent transition-all resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#142755] hover:bg-[#1f3a7a] text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] mt-4 text-sm tracking-wide"
                    >
                      문의 신청하기
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
