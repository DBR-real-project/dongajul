import { X, Crown, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetchJson } from '../utils/api';

export function BannerAd() {
  const [isVisible, setIsVisible] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const localSubscription = localStorage.getItem('subscription_type');

    if (localSubscription === 'premium') {
      setIsVisible(false);
      setIsChecking(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const res = await apiFetchJson('/api/subscriptions/me');

        const subscription = res.data;

        const isPremium =
          subscription?.status === 'active' &&
          (
            subscription?.subscription_type === 'premium' ||
            subscription?.plan_type === 'premium'
          );

        if (isPremium) {
          localStorage.setItem('subscription_type', 'premium');
        }

        setIsVisible(!isPremium);
      } catch (err) {
        setIsVisible(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkSubscription();
  }, []);

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    try {
      await apiFetchJson('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          plan_type: 'premium',
        }),
      });

      localStorage.setItem('subscription_type', 'premium');

      alert('프리미엄 플랜으로 업그레이드되었습니다!');
      setShowUpgradeModal(false);
      setIsVisible(false);
    } catch (err: any) {
      if (err.message?.includes('이미 활성화된 구독')) {
        localStorage.setItem('subscription_type', 'premium');
        setShowUpgradeModal(false);
        setIsVisible(false);
        alert('이미 프리미엄 구독 중입니다.');
        return;
      }

      alert(err.message || '구독 처리에 실패했습니다.');
    }
  };

  if (isChecking || !isVisible) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-4xl -translate-x-1/2 px-4">
        <div className="relative overflow-hidden rounded-2xl border border-[#E5BA73]/30 bg-gradient-to-r from-[#0B2F61] via-[#142755] to-[#111827] px-6 py-5 shadow-lg">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#E5BA73]/20 blur-2xl" />
          <div className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />

          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors"
            aria-label="광고 닫기"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex items-center justify-between gap-6 pr-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E5BA73]/15 text-[#E5BA73]">
                <Crown className="h-6 w-6" />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-[#E5BA73]/15 px-2.5 py-1 text-xs font-semibold text-[#E5BA73]">
                    Premium
                  </span>
                  <span className="text-xs text-blue-100/70">전략 리스크 고급 분석</span>
                </div>

                <h3 className="text-lg font-bold text-white">
                  더 정교한 진단 결과가 필요하다면 프리미엄으로 확장하세요
                </h3>

                <p className="mt-1 text-sm text-blue-100/75">
                  심층 실패 패턴 분석, 고급 리포트, 유사 사례 확장 검색을 제공합니다.
                </p>
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#E5BA73] px-5 py-3 text-sm font-bold text-[#0B2F61] shadow-md transition-all hover:bg-[#d4a843]"
            >
              월 ₩9,900 시작하기
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative bg-gradient-to-br from-[#0B2F61] to-[#142755] px-6 py-6 text-white">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute right-5 top-5 text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E5BA73]/15 text-[#E5BA73]">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <h2 className="text-2xl font-extrabold">동아줄 Premium</h2>
              <p className="mt-2 text-sm text-blue-100/75">
                전략 리스크를 더 깊게 분석하고, 실행 가능한 개선 방향까지 확인하세요.
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6 rounded-2xl bg-[#F8FAFC] p-5 text-center">
                <p className="text-sm text-gray-500">월 구독</p>
                <div className="mt-1 text-4xl font-extrabold text-[#0B2F61]">
                  ₩9,900
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  첫 달은 50% 할인된 ₩4,950으로 시작
                </p>
              </div>

              <div className="mb-6 space-y-4">
                {[
                  ['심층 실패 패턴 분석', '과거 실패 사례와 비교해 위험 요인을 더 구체적으로 확인'],
                  ['프리미엄 전략 리포트', '진단 결과를 보고서 형태로 정리'],
                  ['유사 성공·실패 사례 확장', '더 많은 DBR·HBR 사례 기반 비교 분석'],
                  ['고급 개선 가이드', '리스크를 줄이기 위한 실행 방향 제안'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  나중에
                </button>
                <button
                  onClick={handleConfirmUpgrade}
                  className="flex-1 rounded-xl bg-[#0B2F61] px-4 py-3 text-sm font-bold text-white hover:bg-[#142755]"
                >
                  구독하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}