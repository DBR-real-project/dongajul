interface SubscriptionPageProps {
  onStartBasic: () => void;
  onSubscribe: () => void;
}

export function SubscriptionPage({ onStartBasic, onSubscribe }: SubscriptionPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 flex flex-col items-center justify-center font-sans">
      
      {/* 상단 타이틀 */}
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          비즈니스에 맞는 진단 플랜을 선택하세요
        </h1>
        <p className="text-gray-500">
          13,335건의 DBR·HBR 사례 기반 AI 분석으로 전략의 실패 리스크를 최소화하세요.
        </p>
      </div>

      {/* 3단 카드 컨테이너 */}
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 max-w-6xl">
        
        {/* ==============================
            1. Basic 플랜 (좌측)
        ============================== */}
        <div className="w-[320px] bg-white p-8 rounded-[24px] shadow-sm border border-gray-200 flex flex-col transition-all duration-300 hover:-translate-y-3 hover:shadow-xl cursor-pointer">
          <h2 className="text-xl font-bold mb-4 text-slate-700">베이직</h2>
          <p className="text-gray-500 mb-6 text-sm">
            기본적인 비즈니스 전략 방향성 점검
          </p>
          <div className="text-3xl font-bold mb-6 text-slate-800">
            무료
          </div>
          <button
            onClick={onStartBasic}
            className="w-full bg-[#E6B767] text-white py-3 rounded-xl font-bold transition hover:opacity-90 active:scale-95 mb-8"
          >
            시작하기
          </button>
          
          <ul className="space-y-4 text-sm text-slate-600 flex-grow">
            <li className="flex items-start gap-2">
              <span className="text-gray-400">✓</span> <span>선택 산업군 기반 기본 리스크 진단</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">✓</span> <span>DBR·HBR 핵심 유사 사례 매칭 (제한적)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">✓</span> <span>기본 진단 요약 리포트 제공</span>
            </li>
          </ul>
        </div>

        {/* ==============================
            2. Premium 플랜 (중앙 유지)
        ============================== */}
        <div className="relative w-[350px] p-[2px] rounded-[26px] bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570] shadow-2xl z-10 transition-all duration-300 hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(155,114,203,0.5)] cursor-pointer">
          <div className="bg-white p-8 rounded-[24px] h-full flex flex-col">
            
            <div className="flex items-center gap-2 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.666 0C11.666 6.136 6.636 11.166 0.5 11.166H0V12.833H0.5C6.636 12.833 11.666 17.863 11.666 23.999V24.5H13.333V23.999C13.333 17.863 18.363 12.833 24.499 12.833H24.999V11.166H24.499C18.363 11.166 13.333 6.136 13.333 0V-0.5H11.666V0Z" fill="url(#paint_gemini)"/>
                <defs>
                  <linearGradient id="paint_gemini" x1="0" y1="12" x2="25" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4285F4"/>
                    <stop offset="0.5" stopColor="#9B72CB"/>
                    <stop offset="1" stopColor="#D96570"/>
                  </linearGradient>
                </defs>
              </svg>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent">
                프리미엄 (추천)
              </h2>
            </div>

            <p className="text-gray-500 mb-6 text-sm">
              심층 리스크 분석과 맞춤형 전략 인사이트
            </p>

            <div className="text-3xl font-bold mb-6 text-slate-800">
              ₩9,900 <span className="text-lg font-normal text-gray-400">/ 월</span>
            </div>

            <button
              onClick={onSubscribe}
              className="w-full bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] text-white py-3 rounded-xl font-bold transition hover:opacity-90 shadow-md mb-8 active:scale-95"
            >
              구독하기
            </button>

            <ul className="space-y-4 text-sm text-slate-700 flex-grow font-medium">
              <li className="flex items-start gap-2">
                <span className="text-[#9b72cb] shrink-0">✓</span> <span>13,335건 사례 데이터 딥다이브 분석</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#9b72cb] shrink-0">✓</span> <span>상세 실패 패턴 및 시맨틱 맵 제공</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#9b72cb] shrink-0">✓</span> <span>산업군 맞춤형 해결책 및 액션 플랜</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#9b72cb] shrink-0">✓</span> <span>진단 이력 무제한 보관 및 시계열 비교</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ==============================
            3. Enterprise 플랜 (우측)
        ============================== */}
        <div className="w-[320px] bg-white p-8 rounded-[24px] shadow-sm border border-gray-200 flex flex-col transition-all duration-300 hover:-translate-y-3 hover:shadow-xl cursor-pointer">
          <h2 className="text-xl font-bold mb-4 text-slate-700">엔터프라이즈</h2>
          <p className="text-gray-500 mb-6 text-sm">
            전사적 리스크 관리 및 사내 데이터 연동
          </p>
          <div className="text-3xl font-bold mb-6 text-slate-800">
            별도 문의
          </div>
          <a
            href="mailto:dongajul@dongajul.com?subject=엔터프라이즈 플랜 문의"
            className="w-full bg-[#0B1931] text-white py-3 rounded-xl font-bold transition hover:opacity-90 mb-8 active:scale-95 block text-center"
          >
            영업팀 문의
          </a>
          
          <ul className="space-y-4 text-sm text-slate-600 flex-grow">
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold shrink-0">✓</span> <span>프리미엄 플랜의 모든 기능 포함</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold shrink-0">✓</span> <span>사내 비즈니스 데이터 연동 (API 지원)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold shrink-0">✓</span> <span>부서별 통합 대시보드 및 전담 매니저</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
