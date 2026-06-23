/**
 * src/app/components/NotificationView.tsx - 알림 센터 뷰
 * * 수정 포인트:
 * - 브랜드 통합 가동: #0B2F61(주조색 딥 네이비), #C8994B(보조색 웜 골드) 테마 전역 반영
 * - 레이아웃 정형화: 대시보드 시스템과 라운딩 규격 및 폰트 가독성 동적 매칭 완료 (생략 없음)
 */

import { ArrowLeft, Bell, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';
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
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // ─────────────────────────────────────────────
  // 1. API로부터 알림 데이터 불러오기
  // ─────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/notifications');
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
          } else if (noti.notification_type === '전략') {
            config = { Icon: TrendingUp, bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-500', border: 'blue' };
          } else if (noti.notification_type === '진단') {
            config = { Icon: CheckCircle, bg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-500', border: 'blue' };
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
            targetView: noti.notification_type === '진단' ? 'history'
              : noti.notification_type === '보안' ? 'risk'
              : noti.notification_type === '전략' ? 'risk'
              : noti.notification_type === '업그레이드' ? 'checkout'
              : 'dashboard'
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
      const res = await apiFetch('/api/notifications/read-all', { method: 'PUT' });
      if (res.ok) {
        setActiveNotifications([]); 
        triggerToast('모든 알림을 읽음 처리했습니다. ✨');
      }
    } catch (err) {
      triggerToast('처리 중 오류가 발생했습니다.');
    }
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
      <header className={`${darkMode ? 'bg-[#0D1527] border-gray-800' : 'bg-white border-slate-200'} border-b sticky top-0 z-10 shadow-sm`}>
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
            <div key={item.id} className={`${darkMode ? 'bg-gray-900/30 border-gray-800/80 shadow-inner' : 'bg-white border-slate-200'} p-5 rounded-2xl border transition-all shadow-sm flex flex-col md:flex-row items-start gap-4 border-l-4 ${item.border === 'red' ? 'border-l-red-500' : item.border === 'green' ? 'border-l-green-500' : 'border-l-blue-500'}`}>
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
                  {selectedNotification.title === '진단' ? '진단 이력 보기'
                    : selectedNotification.title === '보안' ? '전략 진단하기'
                    : selectedNotification.title === '업그레이드' ? '구독 플랜 보기'
                    : '바로 이동'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}