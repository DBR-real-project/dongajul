import React, { useEffect } from 'react';
import { apiFetchJson } from '../utils/api';

interface CheckoutPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function CheckoutPage({ onBack, onSuccess }: CheckoutPageProps) {
  // 결제 모듈 스크립트 불러오기
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.iamport.kr/v1/iamport.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    try {
      await apiFetchJson('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          plan_type: 'premium',
        }),
      });

      alert('구독 완료!');

      // 결제 성공 후 App.tsx에서 넘겨준 화면 이동 함수 실행
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(err.message || '구독 실패');
    }
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