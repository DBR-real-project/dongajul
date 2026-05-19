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

  const handleNotificationAction = (item: Notification) => {
    setSelectedNotification(item);
  };

  const handleMarkAllAsRead = () => {
    alert('모든 알림을 읽음으로 표시했습니다.');
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = () => {
    alert('프리미엄 플랜으로 업그레이드되었습니다!');
    setShowUpgradeModal(false);
  };

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-[#f5f5f5]'}`}>
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1">
              <ArrowLeft className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <div className="flex items-center gap-2">
              <Bell className={`w-5 h-5 ${darkMode ? 'text-[#A9AABC]' : 'text-[#1e3a5f]'}`} />
              <h1 className={`text-base ${darkMode ? 'text-white' : 'text-[#1e3a5f]'}`}>알림</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="px-3 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>최근 알림</h2>
          <button onClick={handleMarkAllAsRead} className={`text-xs ${darkMode ? 'text-[#A9AABC]' : 'text-[#142755]'} hover:underline`}>모두 읽음 표시</button>
        </div>

        <div className="space-y-3">
          {[
            { border: 'red', bg: 'bg-red-100', Icon: AlertTriangle, iconColor: 'text-red-600', title: '리스크 경고', time: '5분 전', desc: '시장 변동성 리스크 점수가 6.1로 상승했습니다. 관련 대응 전략을 확인하세요.', action: '자세히 보기 →', actionColor: 'text-red-600', read: true, detailContent: '현재 시장 변동성이 급증하고 있습니다.\n\n주요 리스크 요인:\n- 글로벌 경제 불확실성 증가\n- 주요 산업 섹터 변동성 확대\n- 공급망 이슈 지속\n\n권장 대응 전략:\n1. 포트폴리오 다각화\n2. 리스크 헤징 강화\n3. 시장 모니터링 주기 단축' },
            { border: 'green', bg: 'bg-green-100', Icon: TrendingUp, iconColor: 'text-green-600', title: '새로운 성공 사례', time: '1시간 전', desc: '귀사와 유사한 산업군의 디지털 전환 성공 사례가 추가되었습니다.', action: '사례 보기 →', actionColor: 'text-green-600', read: true, detailContent: '제조업 디지털 전환 성공 사례\n\n기업명: ㈜테크매뉴팩처링\n산업군: 정밀 제조업\n프로젝트 기간: 18개월\n\n주요 성과:\n- 생산성 35% 향상\n- 불량률 60% 감소\n- 운영 비용 25% 절감\n\n핵심 전략:\n1. AI 기반 품질관리 시스템 도입\n2. IoT 센서를 활용한 실시간 모니터링\n3. 데이터 분석을 통한 예측 유지보수\n\n귀사에 적용 가능한 인사이트를 확인해보세요.' },
            { border: 'blue', bg: 'bg-gray-100', Icon: Info, iconColor: 'text-[#142755]', title: '시스템 업데이트', time: '3시간 전', desc: '새로운 전략 프레임워크 분석 기능이 추가되었습니다.', action: '자세히 보기 →', actionColor: 'text-[#142755]', read: true, detailContent: '새로운 기능 안내\n\n업데이트 내용:\n- AI 기반 전략 프레임워크 분석 기능\n- 실시간 시장 데이터 연동\n- 경쟁사 벤치마킹 자동화\n\n주요 특징:\n1. 업계 최신 트렌드 자동 분석\n2. 맞춤형 전략 추천\n3. 시각화된 대시보드\n\n사용 방법:\n전략 워크스페이스 > 프레임워크 분석 메뉴에서 이용하실 수 있습니다.' },
          ].map((item) => (
            <div key={item.title} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-3 border-l-4 border-${item.border}-500`}>
              <div className="flex items-start gap-2">
                <div className={`w-8 h-8 ${item.bg} flex items-center justify-center flex-shrink-0 rounded`}>
                  <item.Icon className={`w-4 h-4 ${item.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.time}</span>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{item.desc}</p>
                  <button
                    onClick={() => handleNotificationAction(item)}
                    className={`text-xs ${item.actionColor} hover:underline cursor-pointer`}
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
            <div key={item.title} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} p-3 border`}>
              <div className="flex items-start gap-2">
                <div className={`w-8 h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0 rounded`}>
                  <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.title}</h3>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{item.time}</span>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
                </div>
              </div>
            </div>
          ))}

          {/* 광고 알림 */}
          <div className={`${darkMode ? 'bg-gradient-to-r from-purple-900 to-blue-900' : 'bg-gradient-to-r from-purple-50 to-blue-50'} p-3 border-l-4 border-purple-500`}>
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-[#444655] flex items-center justify-center flex-shrink-0 rounded-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>프리미엄 플랜으로 업그레이드하세요!</h3>
                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">광고</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                  무제한 전략 분석, AI 기반 인사이트, 실시간 리스크 모니터링 등 프리미엄 기능을 이용해보세요.
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <div className={darkMode ? 'text-purple-400' : 'text-purple-600'}>
                    <span className="text-xl">₩9,900</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}> / 월</span>
                  </div>
                </div>
                <div className={`space-y-1 mb-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>무제한 전략 프레임워크 분석</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>AI 기반 맞춤형 인사이트 제공</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>실시간 리스크 알림 및 대응 전략</span>
                  </div>
                </div>
                <button
                  onClick={handleUpgrade}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-[#444655] text-white text-xs rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  지금 업그레이드
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600'} hover:underline`}>이전 알림 더보기</button>
        </div>
      </div>

      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto`}>
            <div className={`sticky top-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${selectedNotification.bg} flex items-center justify-center rounded`}>
                  <selectedNotification.Icon className={`w-4 h-4 ${selectedNotification.iconColor}`} />
                </div>
                <h2 className={`text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedNotification.title}</h2>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} text-2xl`}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedNotification.time}</span>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3 text-sm`}>{selectedNotification.desc}</p>
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-3 rounded-lg`}>
                <pre className={`whitespace-pre-wrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-sans`}>
                  {selectedNotification.detailContent}
                </pre>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className={`px-4 py-2 text-sm ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg`}
                >
                  닫기
                </button>
                <button
                  className={`px-4 py-2 text-sm ${selectedNotification.border === 'red' ? 'bg-red-600' : selectedNotification.border === 'green' ? 'bg-green-600' : 'bg-[#142755]'} text-white rounded-lg hover:opacity-90`}
                >
                  관련 페이지로 이동
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-md w-full`}>
            <div className="bg-gradient-to-r from-purple-600 to-[#444655] px-4 py-3 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-white" />
                  <h2 className="text-base text-white">프리미엄 플랜</h2>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="text-center mb-4">
                <div className="text-3xl mb-1">
                  <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>₩9,900</span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>월 구독</p>
              </div>

              <div className="space-y-2 mb-4">
                <h3 className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>프리미엄 혜택:</h3>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>무제한 전략 프레임워크 분석</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>모든 전략 도구를 제한 없이 사용하세요</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>AI 기반 맞춤형 인사이트</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>귀사에 최적화된 전략 제안을 받아보세요</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>실시간 리스크 알림</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>시장 변화에 즉시 대응할 수 있습니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>우선 고객 지원</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>전담 상담사의 빠른 지원을 받으세요</p>
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-[#444655]' : 'bg-gray-100'} p-3 rounded-lg mb-4 text-center`}>
                <p className={`text-sm ${darkMode ? 'text-[#A9AABC]' : 'text-[#142755]'}`}>
                  <span className="font-semibold">첫 달 50% 할인!</span> 지금 가입하면 ₩4,950
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className={`flex-1 px-4 py-2 text-sm ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg`}
                >
                  나중에
                </button>
                <button
                  onClick={handleConfirmUpgrade}
                  className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-[#444655] text-white rounded-lg hover:opacity-90"
                >
                  구독하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
