/**
 * src/app/components/NotificationView.tsx - 알림 센터 뷰
 * * 수정 포인트:
 * - 브랜드 통합 가동: #0B2F61(주조색 딥 네이비), #C8994B(보조색 웜 골드) 테마 전역 반영
 * - 레이아웃 정형화: 대시보드 시스템과 라운딩 규격 및 폰트 가독성 동적 매칭 완료 (생략 없음)
 */

import { ArrowLeft, Bell, TrendingUp, AlertTriangle, Info, CheckCircle, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface NotificationViewProps {
  onBack: () => void;
  onNavigate?: (viewName: string, params?: any) => void; 
  darkMode?: boolean;
}

interface Notification {
  id: number;
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
  targetView: string;
  targetParams?: any;
}

export function NotificationView({ onBack, onNavigate, darkMode = false }: NotificationViewProps) {
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const token = localStorage.getItem('accessToken') || localStorage.getItem('token'); // 토큰 가져오기

  // ─────────────────────────────────────────────
  // 1. API로부터 알림 데이터 불러오기
  // ─────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/notifications', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await res.json();

      if (result.success) {
        // DB 데이터를 UI 형식으로 변환 (매핑)
        const mappedData = result.data.map((noti: any) => {
          // 타입별로 아이콘과 색상을 다르게 설정하는 로직
          let config = {
            Icon: Bell,
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-500',
            border: 'blue'
          };

          if (noti.notification_type === '보안') {
            config = { Icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-500', border: 'red' };
          } else if (noti.notification_type === '업그레이드') {
            config = { Icon: TrendingUp, bg: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-500', border: 'green' };
          }

          return {
            id: noti.notification_id,
            title: noti.notification_type,
            desc: noti.message,
            time: new Date(noti.created_at).toLocaleDateString(), 
            read: noti.is_read === 1,
            ...config,
            action: '자세히 보기',
            actionColor: config.iconColor,
            detailContent: noti.message,
            targetView: 'Dashboard'
          };
        });

        // 읽지 않은 알림만 필터링해서 보여줌
        setActiveNotifications(mappedData.filter((n: any) => !n.read));
      }
    } catch (err) {
      console.error("알림 로딩 실패:", err);
    }
  };

  // ─────────────────────────────────────────────
  // 2. 컴포넌트 로드 시 최초 1회 실행
  // ─────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
  }, []);

  // ─────────────────────────────────────────────
  // 3. 기존 함수들 (내용만 수정)
  // ─────────────────────────────────────────────
  const triggerToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleNotificationAction = (item: Notification) => {
    setSelectedNotification(item);
  };

  const handlePageNavigation = (targetView: string, params?: any) => {
    setSelectedNotification(null);
    if (onNavigate) onNavigate(targetView, params);
  };

  // 모두 읽음 처리 API 연동
  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveNotifications([]); 
        triggerToast('모든 알림을 읽음 처리했습니다. ✨');
      }
    } catch (err) {
      triggerToast('처리 중 오류가 발생했습니다.');
    }
  };

  const handleUpgrade = () => setShowUpgradeModal(true);
  const handleConfirmUpgrade = () => {
    setShowUpgradeModal(false);
    triggerToast('업그레이드 완료되었습니다! 👑');
  };

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#FAFBFC]'} relative`}>
      {/* 상단 액션 인터랙티브 토스트 피드백 - 브랜드 주조색 및 커스텀 바인딩 */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-sm border border-[#0B2F61]/20 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-4 h-4 text-[#C8994B]" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* 헤더 바 */}
      <header className={`${darkMode ? 'bg-[#0D1527] border-gray-800' : 'bg-white border-slate-200'} border-b sticky top-0 z-50 shadow-sm`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-1 hover:opacity-80 transition-opacity">
                <ArrowLeft className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-[#0B2F61]'}`} />
              </button>
              <div className="flex items-center gap-2">
                <Bell className={`w-5 h-5 ${darkMode ? 'text-[#C8994B]' : 'text-[#0B2F61]'}`} />
                <h1 className={`text-base font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>알림 센터</h1>
              </div>
            </div>
            
            {activeNotifications.length > 0 && (
              <button 
                onClick={handleMarkAllAsRead} 
                className={`text-xs font-bold ${darkMode ? 'text-gray-400 hover:text-white' : 'text-[#0B2F61] hover:text-[#C8994B]'} cursor-pointer transition-colors`}
              >
                모두 읽음 표시
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 알림 메인 본문 피드 영역 */}
      <div className="px-6 py-8 max-w-[1440px] mx-auto space-y-6">
        <div className="space-y-4">
          {activeNotifications.map((item) => (
            <div key={item.id} className={`${darkMode ? 'bg-gray-900/30 border-gray-800/80 shadow-inner' : 'bg-white border-slate-200'} p-5 rounded-2xl border transition-all shadow-sm flex flex-col md:flex-row items-start gap-4 border-l-4 border-l-${item.border === 'red' ? 'red' : item.border === 'green' ? 'green' : 'blue'}-500`}>
              <div className={`w-9 h-9 ${item.bg} flex items-center justify-center flex-shrink-0 rounded-xl`}>
                <item.Icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{item.time}</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3 leading-relaxed font-medium`}>{item.desc}</p>
                <button
                  onClick={() => handleNotificationAction(item)}
                  className={`text-xs font-bold ${item.actionColor} hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1`}
                >
                  {item.action}
                </button>
              </div>
            </div>
          ))}

          {activeNotifications.length === 0 && (
            <div className={`p-12 text-center border-2 border-dashed ${darkMode ? 'border-gray-800 text-gray-500' : 'border-slate-200 text-gray-400'} rounded-2xl text-xs font-bold`}>
              새로운 주요 최근 알림이 없습니다.
            </div>
          )}

          {/* 읽은 보조 알림 아카이브 슬롯 - TODO: 알림 API 연동 후 실제 데이터로 교체 */}
          {([] as { title: string; time: string; desc: string; targetView: string }[]).map((item, index) => (
            <div 
              key={index} 
              className={`${darkMode ? 'bg-gray-900/10 border-gray-800/40 text-gray-100 hover:bg-gray-900/30' : 'bg-slate-50/60 border-slate-200/60 text-gray-900 hover:bg-slate-100/40'} p-5 border rounded-2xl shadow-sm transition-all cursor-pointer flex items-start gap-4`} 
              onClick={() => handlePageNavigation(item.targetView)}
            >
              <div className={`w-9 h-9 ${darkMode ? 'bg-gray-800' : 'bg-slate-200/60'} flex items-center justify-center flex-shrink-0 rounded-xl`}>
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                  <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{item.title}</h3>
                  <span className="text-xs text-gray-400 font-medium">{item.time}</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} leading-relaxed font-medium`}>{item.desc}</p>
              </div>
            </div>
          ))}

          {/* 통합 브랜드 테마 프리미엄 솔루션 프로모션 배너 */}
          <div className={`${darkMode ? 'bg-gradient-to-r from-slate-900 via-[#0B2F61]/20 to-indigo-950/30 border-purple-900/40' : 'bg-gradient-to-r from-[#0B2F61] via-[#1E437A] to-[#2B4B7C] border-slate-200'} p-6 rounded-2xl border-l-4 border-l-[#C8994B] shadow-lg relative overflow-hidden`}>
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-9 h-9 bg-gradient-to-br from-[#C8994B] to-[#E3C28B] flex items-center justify-center flex-shrink-0 rounded-xl shadow-md">
                <Crown className="w-4 h-4 text-[#0B2F61]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <h3 className="text-white font-extrabold text-sm tracking-wide">STRAND 45 GOLD 비즈니스 라이선스</h3>
                  <span className="text-[9px] font-bold bg-[#C8994B] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">PREMIUM</span>
                </div>
                <p className="text-xs text-slate-200 mb-4 leading-relaxed font-medium">
                  제한 없는 최고 권위 전략 매트릭스 도출, AI 기반 고밀도 마이닝 연동 및 정밀 리스크 임계값 경보 제어 시스템을 경험해 보세요.
                </p>
                <button
                  onClick={handleUpgrade}
                  className="w-full px-4 py-2.5 bg-white hover:bg-slate-100 text-[#0B2F61] text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer transform active:scale-95"
                >
                  지금 업그레이드 활성화
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 알림 상세 보기 모달 */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
          <div className={`${darkMode ? 'bg-[#0D1527] border border-gray-800 text-white' : 'bg-white text-gray-900'} rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-150`}>
            <div className={`sticky top-0 ${darkMode ? 'bg-[#0D1527] border-gray-800' : 'bg-white border-slate-100'} border-b px-6 py-4 flex items-center justify-between z-10`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${selectedNotification.bg} flex items-center justify-center rounded-xl`}>
                  <selectedNotification.Icon className={`w-4 h-4 ${selectedNotification.iconColor}`} />
                </div>
                <h2 className="text-base font-bold tracking-tight">{selectedNotification.title}</h2>
              </div>
              <button onClick={() => setSelectedNotification(null)} className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} text-2xl font-light px-2`}>
                &times;
              </button>
            </div>
            <div className="p-6">
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-400">{selectedNotification.time}</span>
              </div>
              <p className={`${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-4 text-sm font-bold leading-relaxed`}>{selectedNotification.desc}</p>
              <div className={`${darkMode ? 'bg-gray-950 border border-gray-800/60' : 'bg-slate-50'} p-5 rounded-xl shadow-inner`}>
                <pre className={`whitespace-pre-wrap text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-sans leading-relaxed font-medium`}>
                  {selectedNotification.detailContent}
                </pre>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'} transition-all`}
                >
                  닫기
                </button>
                <button
                  onClick={() => handlePageNavigation(selectedNotification.targetView, selectedNotification.targetParams)}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-md ${selectedNotification.border === 'red' ? 'bg-red-600 hover:bg-red-500' : selectedNotification.border === 'green' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#0B2F61] hover:bg-[#C8994B]'}`}
                >
                  관련 분석 프레임으로 이동
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 프리미엄 플랜 업그레이드 모달 (웜 골드 그라데이션 타이틀 아키텍처) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
          <div className={`${darkMode ? 'bg-[#0A0E1A] border border-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150`}>
            <div className="bg-gradient-to-r from-[#0B2F61] to-[#3B547E] px-6 py-5 border-b border-[#0B2F61]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Crown className="w-5 h-5 text-[#C8994B] animate-pulse" />
                  <h2 className="text-sm font-bold text-white tracking-tight">STRAND 45 GOLD 라이선스 구독</h2>
                </div>
                <button onClick={() => setShowUpgradeModal(false)} className="text-white/80 hover:text-white text-lg font-bold">&times;</button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-black mb-1">
                  <span className={darkMode ? 'text-blue-400' : 'text-[#0B2F61]'}>₩9,900</span>
                </div>
                <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>월 정기 엔터프라이즈 에디션</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowUpgradeModal(false)} 
                  className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-xl ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition-colors`}
                >
                  나중에 하기
                </button>
                <button 
                  onClick={handleConfirmUpgrade} 
                  className="flex-1 px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-[#0B2F61] via-[#1E437A] to-[#C8994B] text-white rounded-xl shadow-md hover:opacity-95 transition-all transform active:scale-95"
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