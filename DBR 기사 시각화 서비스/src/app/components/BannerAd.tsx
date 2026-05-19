import { X, Download, Star, Crown, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function BannerAd() {
  const [isVisible, setIsVisible] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = () => {
    alert('프리미엄 플랜으로 업그레이드되었습니다!');
    setShowUpgradeModal(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-gray-900 to-black px-3 py-1.5 rounded-lg shadow-lg relative">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-0.5 right-0.5 p-0.5 text-gray-400 hover:text-white"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#142755] to-purple-600 flex items-center justify-center flex-shrink-0 rounded">
            <span className="text-white text-sm">📊</span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-white text-xs font-semibold truncate">DBR Premium Analytics</h4>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-xs text-gray-300">4.8</span>
              </div>
              <span className="text-xs text-gray-400">|</span>
              <div className="flex items-center gap-0.5">
                <Download className="w-2.5 h-2.5 text-gray-400" />
                <span className="text-xs text-gray-300">50만+</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            className="bg-white text-gray-900 px-3 py-1.5 text-xs font-semibold hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer rounded"
          >
            업그레이드
          </button>
        </div>
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-[#444655] px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-white" />
                  <h2 className="text-lg sm:text-xl text-white">프리미엄 플랜</h2>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">
                  <span className="text-purple-600">₩9,900</span>
                </div>
                <p className="text-gray-600">월 구독</p>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="text-sm text-gray-700 mb-3">프리미엄 혜택:</h3>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">무제한 전략 프레임워크 분석</p>
                    <p className="text-xs text-gray-500">모든 전략 도구를 제한 없이 사용하세요</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">AI 기반 맞춤형 인사이트</p>
                    <p className="text-xs text-gray-500">귀사에 최적화된 전략 제안을 받아보세요</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">실시간 리스크 알림</p>
                    <p className="text-xs text-gray-500">시장 변화에 즉시 대응할 수 있습니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">우선 고객 지원</p>
                    <p className="text-xs text-gray-500">전담 상담사의 빠른 지원을 받으세요</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-3 rounded-lg mb-6 text-center">
                <p className="text-sm text-[#142755]">
                  <span className="font-semibold">첫 달 50% 할인!</span> 지금 가입하면 ₩4,950
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  나중에
                </button>
                <button
                  onClick={handleConfirmUpgrade}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-[#444655] text-white rounded-lg hover:opacity-90"
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
