export function HeroBanner() {
  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-[#EA0029] to-[#c4001f] px-6 py-8 text-white">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2" style={{ fontFamily: 'serif', fontStyle: 'italic' }}>
            DBR Insights
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#fff8e1] to-[#ffe082] px-6 py-8 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="mb-2" style={{ fontSize: '15px', color: '#333' }}>
            성공과 실패 사례로 배우는
          </div>
          <div className="mb-3" style={{ fontSize: '20px', color: '#EA0029' }}>
            비즈니스 인사이트
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            세계적 기업들의 전략 분석
          </div>
        </div>

        <div className="absolute top-0 right-0 text-8xl opacity-10">
          💡
        </div>
        <div className="absolute bottom-0 left-0 text-6xl opacity-10">
          📊
        </div>
      </div>
    </div>
  );
}
