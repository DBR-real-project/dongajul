import { ArrowLeft, Bell, TrendingUp, AlertTriangle, Info, CheckCircle, Crown } from 'lucide-react';
import { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface NotificationViewProps {
  onBack: () => void;
  darkMode?: boolean;
}

interface Notification {
  border: string;
  bg: string;
  Icon: LucideIcon;
  iconColor: string;
  title: string;
  time: string;
  desc: string;
  action: string;
  actionColor: string;
  read: boolean;
  detailContent: string;
}

export function NotificationView({ onBack, darkMode = false }: NotificationViewProps) {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 💡 토스트 메시지와 가시성을 제어하기 위한 상태 변수 추가
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // 토스트 트리거 범용 헬퍼 함수
  const triggerToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleNotificationAction = (item: Notification) => {
    setSelectedNotification(item);
  };

  // 💡 바인딩 완료: 브라우저 기본창을 지우고 세련된 상단 토스트 알림으로 연동했습니다.
  const handleMarkAllAsRead = () => {
    triggerToast('모든 알림을 성공적으로 읽음으로 표시했습니다. ✨');
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  // 💡 바인딩 완료: 플랜 업그레이드 완료 피드백 역시 토스트 연동으로 깔끔하게 개선했습니다.
  const handleConfirmUpgrade = () => {
    setShowUpgradeModal(false);
    triggerToast('STRAND 프리미엄 플랜으로 업그레이드 완료되었습니다! 👑');
  };

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-[#f5f5f5]'} relative`}>
      
      {/* 🌟 인앱 디자인 무드와 통일된 상단 액션 인터랙티브 토스트 피드백 */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md border border-white/10 dark:border-slate-200 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toast.message}</span>
        </div>
      )}

      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1">
              <ArrowLeft className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <div className="flex items-center gap-2">
              <Bell className={`w-5 h-5 ${darkMode ? 'text-[#A9AABC]' : 'text-[#1e3a5f]'}`} />
              <h1 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-[#1e3a5f]'}`}>알림</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="px-3 py-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>최근 알림</h2>
          <button 
            onClick={handleMarkAllAsRead} 
            className={`text-xs font-bold ${darkMode ? 'text-[#A9AABC] hover:text-white' : 'text-[#142755] hover:text-indigo-500'} hover:underline cursor-pointer transition-colors`}
          >
            모두 읽음 표시
          </button>
        </div>

        <div className="space-y-3">
          {[
            { border: 'red', bg: 'bg-red-100 dark:bg-red-950/30', Icon: AlertTriangle, iconColor: 'text-red-600 dark:text-red-400', title: '리스크 경고', time: '5분 전', desc: '시장 변동성 리스크 점수가 6.1로 상승했습니다. 관련 대응 전략을 확인하세요.', action: '자세히 보기 →', actionColor: 'text-red-600 dark:text-red-400', read: true, detailContent: '현재 시장 변동성이 급증하고 있습니다.\n\n주요 리스크 요인:\n- 글로벌 경제 불확실성 증가\n- 주요 산업 섹터 변동성 확대\n- 공급망 이슈 지속\n\n권장 대응 전략:\n1. 포트폴리오 다각화\n2. 리스크 헤징 강화\n3. 시장 모니터링 주기 단축' },
            { border: 'green', bg: 'bg-green-100 dark:bg-green-950/30', Icon: TrendingUp, iconColor: 'text-green-600 dark:text-green-400', title: '새로운 성공 사례', time: '1시간 전', desc: '귀사와 유사한 산업군의 디지털 전환 성공 사례가 추가되었습니다.', action: '사례 보기 →', actionColor: 'text-green-600 dark:text-green-400', read: true, detailContent: '제조업 디지털 전환 성공 사례\n\n기업명: ㈜테크매뉴팩처링\n산업군: 정밀 제조업\n프로젝트 기간: 18개월\n\n주요 성과:\n- 생산성 35% 향상\n- 불량률 60% 감소\n- 운영 비용 25% 절감\n\n핵심 전략:\n1. AI 기반 품질관리 시스템 도입\n2. IoT 센서를 활용한 실시간 모니터링\n3. 데이터 분석을 통한 예측 유지보수\n\n귀사에 적용 가능한 인사이트를 확인해보세요.' },
            { border: 'blue', bg: 'bg-gray-100 dark:bg-gray-800/60', Icon: Info, iconColor: 'text-[#142755] dark:text-blue-400', title: '시스템 업데이트', time: '3시간 전', desc: '새로운 전략 프레임워크 분석 기능이 추가되었습니다.', action: '자세히 보기 →', actionColor: 'text-[#142755] dark:text-blue-400', read: true, detailContent: '새로운 기능 안내\n\n업데이트 내용:\n- AI 기반 전략 프레임워크 분석 기능\n- 실시간 시장 데이터 연동\n- 경쟁사 벤치마킹 자동화\n\n주요 특징:\n1. 업계 최신 트렌드 자동 분석\n2. 맞춤형 전략 추천\n3. 시각화된 대시보드\n\n사용 방법:\n전략 워크스페이스 > 프레임워크 분석 메뉴에서 이용하실 수 있습니다.' },
          ].map((item) => (
            <div key={item.title} className={`${darkMode ? 'bg-gray-800/60 border border-gray-700/50' : 'bg-white border border-gray-100'} p-4 rounded-xl border-l-4 border-l-${item.border === 'red' ? 'red' : item.border === 'green' ? 'green' : 'blue'}-500 shadow-sm transition-all`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 ${item.bg} flex items-center justify-center flex-shrink-0 rounded-lg`}>
                  <item.Icon className={`w-4 h-4 ${item.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.time}</span>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2.5 leading-relaxed`}>{item.desc}</p>
                  <button
                    onClick={() => handleNotificationAction(item)}
                    className={`text-xs font-bold ${item.actionColor} hover:underline cursor-pointer`}
                  >
                    {item.action}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {[
            { title: '월간 리포트 생성 완료', time: '어제', desc: '5월 전략 분석 리포트가 생성되었습니다.' },
            { title: '리스크 평가 완료', time: '2일 전', desc: '정기 리스크 평가가 완료되었습니다. 종합 점수: 5.2' },
          ].map((item) => (
            <div key={item.title} className={`${darkMode ? 'bg-gray-800/40 border-gray-700/60 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'} p-4 border rounded-xl shadow-sm`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0 rounded-lg`}>
                  <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{item.title}</h3>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{item.time}</span>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>{item.desc}</p>
                </div>
              </div>
            </div>
          ))}

          {/* 광고 배너 섹션 */}
          <div className={`${darkMode ? 'bg-gradient-to-r from-purple-950/60 to-blue-950/40 border border-purple-800/40' : 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100'} p-4 rounded-xl border-l-4 border-l-purple-500 shadow-md`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 rounded-lg shadow-sm">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>프리미엄 플랜으로 업그레이드하세요!</h3>
                  <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-md">광고</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3 leading-relaxed`}>
                  무제한 전략 분석, AI 기반 인사이트, 실시간 리스크 모니터링 등 프리미엄 기능을 이용해보세요.
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <div className={darkMode ? 'text-purple-400' : 'text-purple-600'}>
                    <span className="text-2xl font-black">₩9,900</span>
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}> / 월</span>
                  </div>
                </div>
                <div className={`space-y-1.5 mb-4 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>무제한 전략 프레임워크 분석</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>AI 기반 맞춤형 인사이트 제공</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>실시간 리스크 알림 및 대응 전략</span>
                  </div>
                </div>
                <button
                  onClick={handleUpgrade}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow hover:opacity-95 transition-all cursor-pointer"
                >
                  지금 업그레이드
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 알림 상세 보기 커스텀 모달 오버레이 */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
          <div className={`${darkMode ? 'bg-gray-900 border border-gray-800 text-white' : 'bg-white text-gray-900'} rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-150`}>
            <div className={`sticky top-0 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-5 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 ${selectedNotification.bg} flex items-center justify-center rounded-lg`}>
                  <selectedNotification.Icon className={`w-4 h-4 ${selectedNotification.iconColor}`} />
                </div>
                <h2 className="text-base font-bold">{selectedNotification.title}</h2>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} text-2xl font-light px-2`}
              >
                &times;
              </button>
            </div>
            <div className="p-5">
              <div className="mb-2">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedNotification.time}</span>
              </div>
              <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-4 text-sm font-semibold leading-relaxed`}>{selectedNotification.desc}</p>
              <div className={`${darkMode ? 'bg-gray-950 border border-gray-800' : 'bg-gray-50'} p-4 rounded-xl shadow-inner`}>
                <pre className={`whitespace-pre-wrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-sans leading-relaxed`}>
                  {selectedNotification.detailContent}
                </pre>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}
                >
                  닫기
                </button>
                <button
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl ${selectedNotification.border === 'red' ? 'bg-red-600 hover:bg-red-500' : selectedNotification.border === 'green' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#142755] hover:bg-indigo-900'} transition-all`}
                >
                  관련 페이지로 이동
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 프리미엄 플랜 업그레이드 모달 */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
          <div className={`${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150`}>
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-white animate-pulse" />
                  <h2 className="text-base font-bold text-white">프리미엄 플랜 계약</h2>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-white/80 hover:text-white text-2xl font-light px-1"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="text-center mb-5">
                <div className="text-3xl font-black mb-1">
                  <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>₩9,900</span>
                </div>
                <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>월 정기 구독</p>
              </div>

              <div className="space-y-3 mb-5">
                <h3 className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>제공되는 프리미엄 전략 엔진:</h3>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>무제한 전략 프레임워크 분석</p>
                    <p className={`text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>모든 인공지능 전략 도구를 제한 없이 격상합니다.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>AI 기반 맞춤형 비즈니스 인사이트</p>
                    <p className={`text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>귀사의 전용 인더스트리에 세분화된 전략 리포트 산출.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>실시간 리스크 경보 감지 및 모니터링</p>
                    <p className={`text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>시장 급변 상황 트래킹 시 푸시 대응 로직을 작동합니다.</p>
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-purple-950/40 border border-purple-800/30' : 'bg-purple-50'} p-3 rounded-xl mb-5 text-center`}>
                <p className={`text-xs font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  🔥 <span className="underline">첫 달 50% 프로모션 특가!</span> 지금 신청 시 ₩4,950
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-xl ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                >
                  나중에 하기
                </button>
                <button
                  onClick={handleConfirmUpgrade}
                  className="flex-1 px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 active:scale-95 text-white rounded-xl shadow hover:opacity-95 transition-all"
                >
                  구독 시작하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}