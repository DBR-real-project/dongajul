import React, { useEffect } from 'react';

interface CheckoutPageProps {
  onBack: () => void;
}

export function CheckoutPage({ onBack }: CheckoutPageProps) {
  
  // 💡 컴포넌트가 마운트될 때 결제 모듈(스크립트)을 동적으로 불러옵니다. 
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.iamport.kr/v1/iamport.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 💡 [결제 진행하기] 버튼 클릭 시 실행되는 함수
  const handlePayment = () => {
    const { window: globalWindow } = globalThis as any;
    
    if (!globalWindow.IMP) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const IMP = globalWindow.IMP;
    // 테스트용 가맹점 식별코드입니다. 실제 서비스 시 포트원 관리자 페이지에서 발급받은 내 코드로 변경해야 합니다.
    IMP.init('imp00000000'); 

    const data = {
      pg: 'html5_inicis', // PG사 (KG이니시스)
      pay_method: 'card', // 결제수단 (신용카드)
      merchant_uid: `mid_${new Date().getTime()}`, // 주문번호 (고유한 값이어야 함)
      amount: 9900, // 결제 금액
      name: '전략 리스크 진단 프리미엄 플랜', // 주문명
      buyer_name: '테스트 유저',
      buyer_tel: '010-1234-5678',
      buyer_email: 'test3@email.com',
    };

    // 실제 결제창 호출
    IMP.request_pay(data, (response: any) => {
      if (response.success) {
        alert('결제가 완료되었습니다! 🎉 (결제번호: ' + response.imp_uid + ')');
        // TODO: 여기서 백엔드 서버로 결제 성공 정보를 보내서 실제 DB를 업데이트해야 합니다.
      } else {
        alert('결제에 실패하였습니다. 😢 에러 내용: ' + response.error_msg);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-3xl bg-white rounded-[24px] p-10 shadow-xl border border-gray-200">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">결제 창</h1>
          <p className="text-gray-500">
            지금부터 구독 결제 화면으로 이동합니다. 실제 결제 연동은 해당 화면에서 추가 구성하면 됩니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-6 bg-slate-50">
            <h2 className="text-xl font-semibold mb-4">프리미엄 플랜</h2>
            <p className="text-sm text-gray-600 mb-6">월 ₩9,900으로 모든 AI 분석 기능 무제한 이용.</p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li>✓ 최신 AI 모델 사용</li>
              <li>✓ 우선 응답 속도</li>
              <li>✓ 심층 진단 리포트</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
            <div className="mb-4 text-sm font-semibold text-slate-500">결제 정보</div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-gray-100 p-4">
                <div className="text-sm text-gray-500">결제 금액</div>
                <div className="text-2xl font-bold text-slate-900">₩9,900</div>
              </div>
              <div className="rounded-2xl bg-gray-100 p-4">
                <div className="text-sm text-gray-500">결제 수단</div>
                <div className="text-base text-slate-700">카드 / 간편결제 / 계좌이체</div>
              </div>
              
              {/* 💡 onClick 이벤트에 handlePayment 함수 연결 */}
              <button 
                onClick={handlePayment}
                className="w-full rounded-xl bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] py-3 text-white font-bold transition hover:opacity-90 active:scale-95 shadow-md"
              >
                결제 진행하기
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold transition hover:bg-slate-100"
          >
            이전으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
