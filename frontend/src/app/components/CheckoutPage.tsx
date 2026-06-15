import React, { useEffect, useState } from 'react';
import { apiFetchJson } from '../utils/api';

interface CheckoutPageProps {
  onBack: () => void;
  onSuccess: () => void;
  darkMode?: boolean;
}

export function CheckoutPage({ onBack, onSuccess, darkMode = false }: CheckoutPageProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.iamport.kr/v1/iamport.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.subscription_type === 'premium') setAlreadySubscribed(true);
    } catch {}
  }, []);

  const handlePayment = async () => {
    if (loading) return;
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const result = await apiFetchJson('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ plan_type: 'premium' }),
      });
      setSuccessMessage(result?.message || '구독이 완료되었습니다.');
      setTimeout(() => { onSuccess(); }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '구독 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const dm = darkMode;

  return (
    <div className={`min-h-screen py-20 px-4 flex flex-col items-center justify-center font-sans ${dm ? 'bg-[#0A0E1A]' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-3xl rounded-[24px] p-10 shadow-xl border ${dm ? 'bg-[#111827] border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="mb-8 text-center">
          <h1 className={`text-3xl font-bold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>결제 창</h1>
          <p className={dm ? 'text-gray-400' : 'text-gray-500'}>
            지금부터 구독 결제 화면으로 이동합니다. 실제 결제 연동은 해당 화면에서 추가 구성하면 됩니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className={`rounded-2xl border p-6 ${dm ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-slate-50'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${dm ? 'text-white' : 'text-slate-900'}`}>프리미엄 플랜</h2>
            <p className={`text-sm mb-6 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              월 ₩9,900으로 모든 AI 분석 기능 무제한 이용.
            </p>
            <ul className={`space-y-3 text-sm ${dm ? 'text-gray-300' : 'text-slate-700'}`}>
              <li>✓ 최신 AI 모델 사용</li>
              <li>✓ 우선 응답 속도</li>
              <li>✓ 심층 진단 리포트</li>
            </ul>
          </div>

          <div className={`rounded-2xl border p-6 shadow-sm ${dm ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-white'}`}>
            <div className={`mb-4 text-sm font-semibold ${dm ? 'text-gray-400' : 'text-slate-500'}`}>결제 정보</div>
            <div className="space-y-4">
              <div className={`rounded-2xl p-4 ${dm ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                <div className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>결제 금액</div>
                <div className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>₩9,900</div>
              </div>
              <div className={`rounded-2xl p-4 ${dm ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                <div className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>결제 수단</div>
                <div className={`text-base ${dm ? 'text-gray-200' : 'text-slate-700'}`}>카드 / 간편결제 / 계좌이체</div>
              </div>
              {alreadySubscribed && (
                <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${dm ? 'border-blue-700 bg-blue-900/30 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                  이미 프리미엄을 구독 중입니다 ✓
                </div>
              )}
              {successMessage && (
                <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${dm ? 'border-green-700 bg-green-900/30 text-green-400' : 'border-green-200 bg-green-50 text-green-700'}`}>
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${dm ? 'border-red-700 bg-red-900/30 text-red-400' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {errorMessage}
                </div>
              )}
              <button
                onClick={handlePayment}
                disabled={loading || alreadySubscribed}
                className="w-full rounded-xl bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] py-3 text-white font-bold transition hover:opacity-90 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? '구독 처리 중...' : alreadySubscribed ? '현재 구독 중' : '결제 진행하기'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={onBack}
            disabled={loading}
            className={`px-6 py-3 rounded-xl border font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              dm
                ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            이전으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
