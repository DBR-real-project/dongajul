/**
 * src/app/components/ProfileView.tsx - 프로필/설정 화면
 * * 수정 포인트:
 * - 영어 분기(language prop 및 관련 다국어 스왑 로직) 완전 제거 및 한국어 고정
 * - 테마 인테리어 전격 동기화: #0B2F61(로고 딥 네이비), #C8994B(보조 웜 골드 변수) 정밀 반영
 * - 마크업 다듬기: 모달 창 및 폼 컨트롤 인풋 포커스 라운딩 처리(rounded-xl) 최적화
 */

import { ArrowLeft, User, Mail, Building2, Briefcase, Settings, LogOut, Bell, Lock, X, Check, Eye, Shield, Globe, Moon, Sun, ChevronRight, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProfileViewProps {
  onBack: () => void;
  darkMode?: boolean;
}

type SettingsPanel = 'notification' | 'security' | 'environment' | 'editProfile' | 'resetPassword' | null;

interface UserData {
  name: string;
  email: string;
  company?: string;
  department?: string;
  provider?: string;
  position?: string;
}

interface User {
  name: string;
  email: string;
  password: string;
}

export function ProfileView({ onBack, darkMode: propDarkMode }: ProfileViewProps) {
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);
  const [toast, setToast] = useState<string | null>(null);
  // [로그아웃 모달 상태 추가]
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 사용자 정보 상태 관리
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editDepartment, setEditDepartment] = useState('');

  // 알림 설정 상태
  const [pushEnabled, setPushEnabled] = useState(() => {
    const saved = localStorage.getItem('pushEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [emailEnabled, setEmailEnabled] = useState(() => {
    const saved = localStorage.getItem('emailEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // 보안 설정 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    const saved = localStorage.getItem('twoFactorEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // 비밀번호 찾기 이메일
  const [resetEmail, setResetEmail] = useState('');

  // 환경 설정 상태 (다크모드 제어)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : (propDarkMode || false);
  });

  // 사용자 데이터 마이그레이션 로드
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserData(parsedUser);
      setEditName(parsedUser.name || '');
      setEditEmail(parsedUser.email || '');
      setEditCompany(parsedUser.company || '');
      setEditDepartment(parsedUser.department || '');
    }
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveNotification = () => {
    localStorage.setItem('pushEnabled', JSON.stringify(pushEnabled));
    localStorage.setItem('emailEnabled', JSON.stringify(emailEnabled));
    showToast('알림 설정이 안전하게 저장되었습니다');
    setActivePanel(null);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('모든 필수 입력칸을 기입해 주세요');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('새로 지정한 암호가 서로 일치하지 않습니다');
      return;
    }
    if (newPassword.length < 6) {
      showToast('비밀번호는 보안을 위해 최소 6자 이상 지정해야 합니다');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const userIndex = users.findIndex((u) => u.email === userData?.email);
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
    }

    showToast('비밀번호가 성공적으로 변경되었습니다');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setActivePanel(null);
  };

  const handleSaveEnvironment = () => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    showToast('환경 설정이 반영되었습니다. 새로고침 중...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      showToast('성명과 이메일 주소는 필수 항목입니다');
      return;
    }

    const updatedUser = {
      ...userData,
      name: editName,
      email: editEmail,
      company: editCompany,
      department: editDepartment,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUserData(updatedUser);

    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const userIndex = users.findIndex((u) => u.email === userData?.email);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], name: editName, email: editEmail };
      localStorage.setItem('users', JSON.stringify(users));
    }

    showToast('프로필 기본 정보가 가공 저장되었습니다');
    setActivePanel(null);
  };

  const handleResetPassword = () => {
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      showToast('정상적인 이메일 구조를 입력하세요');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const user = users.find((u: any) => u.email === resetEmail);

    if (user) {
      showToast('인증 재설정 토큰 링크가 기입하신 메일로 발송되었습니다');
      setResetEmail('');
      setActivePanel(null);
    } else {
      showToast('시스템 데이터베이스에 등록되지 않은 이메일 계정입니다');
    }
  };

  const handleToggleTwoFactor = () => {
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);
    localStorage.setItem('twoFactorEnabled', JSON.stringify(newValue));
    showToast(newValue ? '2단계 고밀도 인증 보안이 가동되었습니다' : '2단계 보안 인증이 차단 해제되었습니다');
  };

  // [수정] 실제 로그아웃 처리 함수
  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#f5f5f5]'} relative`}>
      <header className={`${darkMode ? 'bg-[#0A0E1A] border-gray-800/50' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <h1 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-[#0B2F61]'}`}>마이 프로필 및 환경설정</h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 max-w-4xl mx-auto space-y-4">
        {/* 프로필 아바타 요약 카드 */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-slate-200'} p-6 text-center rounded-2xl border shadow-sm relative overflow-hidden`}>
          <button
            onClick={() => setActivePanel('editProfile')}
            className={`absolute top-4 right-4 p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-slate-50 text-slate-500'} rounded-xl transition-all border border-transparent hover:border-slate-200/50`}
            title="프로필 수정"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 bg-gradient-to-br from-[#0B2F61] to-[#3B547E] text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <User className="w-7 h-7 text-[#C8994B]" />
          </div>
          <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>{userData?.name || '-'}</h2>
          <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userData?.department || '-'} · {userData?.position || '-'}</p>
        </div>

        {/* 세부 계정 파라미터 세그먼트 */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700/40' : 'bg-white border-slate-200'} p-5 rounded-2xl border shadow-sm`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>기본 계정 명세</h3>
          <div className="space-y-4">
            {[
              { Icon: Mail, label: '이메일 계정 주소', value: userData?.email || '-', border: false },
              { Icon: Building2, label: '소속 법인 기관명', value: userData?.company || '-', border: true },
              { Icon: Briefcase, label: '담당 실무 소속부서', value: userData?.department || '-', border: true },
            ].map(({ Icon, label, value, border }) => (
              <div key={label} className={`flex items-center gap-3 pt-3 ${border ? (darkMode ? 'border-t border-gray-800' : 'border-t border-slate-100') : ''}`}>
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-950/40 text-blue-400' : 'bg-slate-50 text-[#0B2F61]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-0.5">{label}</div>
                  <div className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 결제 구독 관리 스테이지 */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700/40' : 'bg-white border-slate-200'} p-5 rounded-2xl border shadow-sm flex items-center justify-between`}>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>라이선스 등급</h3>
            <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>{userData?.subscription || '-'}</div>
            <div className="text-[10px] text-gray-400 font-medium">-</div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-xl font-bold shadow-inner">
            서버 연동 활성
          </span>
        </div>

        {/* 핵심 제어 링크 버튼 스택 */}
        <div className="space-y-2">
          {[
            { Icon: Bell, label: '시스템 포커스 알림 설정', key: 'notification' as SettingsPanel },
            { Icon: Lock, label: '계정 보안 아키텍처 설정', key: 'security' as SettingsPanel },
            { Icon: Settings, label: '대시보드 에셋 환경 설정', key: 'environment' as SettingsPanel },
          ].map(({ Icon, label, key }) => (
            <button
              key={label}
              onClick={() => setActivePanel(key)}
              className={`w-full ${darkMode ? 'bg-gray-800/30 border-gray-800/60 hover:bg-gray-800/80 hover:border-[#0B2F61]' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'} p-4 rounded-2xl shadow-sm flex items-center justify-between transition-all border`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-[#0B2F61]'} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-gray-800'}`}>{label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>

        {/* [수정] 로그아웃 액션 버튼 */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full ${darkMode ? 'bg-gray-800/20 hover:bg-red-950/40 border-red-900/50 text-red-400' : 'bg-white hover:bg-red-50 border-red-200 text-red-600'} p-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all border font-bold text-xs sm:text-sm`}
        >
          <LogOut className="w-4 h-4" />
          <span>보안 인증 세션 로그아웃</span>
        </button>

        {/* [수정] 로그아웃 모달 UI */}
        {showLogoutConfirm && (
          <>
            <div className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
              <div className={`${darkMode ? 'bg-[#1a1f2e]' : 'bg-white'} w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>로그아웃</h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>정말로 보안 세션을 종료하시겠습니까?</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowLogoutConfirm(false)} className={`flex-1 py-3 rounded-2xl font-bold text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>취소</button>
                  <button onClick={handleLogout} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md">로그아웃</button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="text-center pt-2">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
            Version 2.1.0 PRO • © 2026 DBR Authority Visualizer
          </p>
        </div>
      </div>

      {/* 글로벌 레이어 팝업 컨테이너 */}
      {activePanel && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-sm"
            onClick={() => setActivePanel(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl max-h-[85vh] ${darkMode ? 'bg-[#0A0E1A] border-gray-800' : 'bg-white border-slate-200'} rounded-2xl shadow-2xl overflow-hidden border`}>
              
              <div className="bg-gradient-to-r from-[#0B2F61] to-[#3B547E] px-6 py-4 flex items-center justify-between shadow-md">
                <h2 className="text-base font-bold text-white">
                  {activePanel === 'notification' && '알림 시스템 세부 제어'}
                  {activePanel === 'security' && '계정 암호화 보안 세팅'}
                  {activePanel === 'environment' && '대시보드 에셋 테마 세팅'}
                  {activePanel === 'editProfile' && '프로필 명세 수정'}
                  {activePanel === 'resetPassword' && '비밀번호 유실 복구'}
                </h2>
                <button onClick={() => setActivePanel(null)} className="p-1.5 hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className={`p-6 overflow-y-auto max-h-[calc(85vh-56px)] ${darkMode ? 'bg-black/20' : 'bg-slate-50/50'} space-y-6`}>
                {activePanel === 'notification' && (
                  <div className="space-y-4">
                    <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700/40' : 'bg-white border-slate-200'} p-4 rounded-xl border flex items-center justify-between`}>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">실시간 인프라 푸시 토글</h4>
                        <p className="text-xs text-gray-500">분석 완료 트래킹 및 핵심 시각화 지표 수렴 시 실시간 브라우저 팝업 송출</p>
                      </div>
                      <button
                        onClick={() => setPushEnabled(!pushEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${pushEnabled ? 'bg-[#0B2F61]' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${pushEnabled ? 'transform translate-x-6' : ''}`} />
                      </button>
                    </div>

                    <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700/40' : 'bg-white border-slate-200'} p-4 rounded-xl border flex items-center justify-between`}>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">핵심 메일링 리포트 토글</h4>
                        <p className="text-xs text-gray-500">주간 종합 성과 트렌드 아카이빙 파일을 지정된 관리자 메일로 정기 전송</p>
                      </div>
                      <button
                        onClick={() => setEmailEnabled(!emailEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${emailEnabled ? 'bg-[#0B2F61]' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${emailEnabled ? 'transform translate-x-6' : ''}`} />
                      </button>
                    </div>

                    <button onClick={handleSaveNotification} className="w-full py-2.5 bg-[#0B2F61] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#C8994B] transition-colors">
                      알림 파라미터 업데이트 적용
                    </button>
                  </div>
                )}

                {activePanel === 'security' && (
                  <div className="space-y-4">
                    <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-slate-200'} p-5 rounded-xl border space-y-3`}>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">기존 비밀번호 검증</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={`w-full px-3 py-2 text-xs border ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-slate-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B2F61]`} placeholder="기존 계정 패스워드" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">교체 지망 암호 자격</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full px-3 py-2 text-xs border ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-slate-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B2F61]`} placeholder="6자 이상의 신규 규격 암호" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">신규 암호 교차 확인</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full px-3 py-2 text-xs border ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-slate-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0B2F61]`} placeholder="동일하게 복사 입력" />
                      </div>
                      <button onClick={handleChangePassword} className="w-full py-2.5 bg-[#0B2F61] text-white text-xs font-bold rounded-xl shadow">비밀번호 변경 컴파일 실행</button>
                    </div>

                    <div className={`${darkMode ? 'bg-gray-800/40' : 'bg-white'} p-4 rounded-xl border flex items-center justify-between`}>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">2단계 계정 로그인 인증 스왑</h4>
                        <p className="text-xs text-gray-400">이기종 디바이스 접근 시 세션 하이재킹 원천 방어막 형성</p>
                      </div>
                      <button onClick={handleToggleTwoFactor} className={`relative w-12 h-6 rounded-full transition-all duration-300 ${twoFactorEnabled ? 'bg-[#0B2F61]' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${twoFactorEnabled ? 'transform translate-x-6' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}

                {activePanel === 'environment' && (
                  <div className="space-y-4">
                    <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-slate-200'} p-4 rounded-xl border flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        {darkMode ? <Moon className="w-4 h-4 text-[#C8994B]" /> : <Sun className="w-4 h-4 text-amber-500" />}
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">다크 테마 스위치</h4>
                      </div>
                      <button onClick={() => setDarkMode(!darkMode)} className={`relative w-12 h-6 rounded-full transition-all duration-300 ${darkMode ? 'bg-[#0B2F61]' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${darkMode ? 'transform translate-x-6' : ''}`} />
                      </button>
                    </div>
                    <button onClick={handleSaveEnvironment} className="w-full py-2.5 bg-[#0B2F61] text-white text-xs font-bold rounded-xl shadow-md">테마 리로드 마이그레이션 실행</button>
                  </div>
                )}

                {activePanel === 'editProfile' && (
                  <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-slate-200'} p-5 rounded-xl border space-y-3`}>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">성명</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={`w-full px-3 py-2 text-xs border ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-slate-200'} rounded-xl focus:outline-none`} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">대표 수신 이메일</label>
                      <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={`w-full px-3 py-2 text-xs border ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-slate-200'} rounded-xl focus:outline-none`} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">법인 기관명</label>
                      <input type="text" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className={`w-full px-3 py-2 text-xs border ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-slate-200'} rounded-xl focus:outline-none`} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">실무 부서명</label>
                      <input type="text" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} className={`w-full px-3 py-2 text-xs border ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-slate-200'} rounded-xl focus:outline-none`} />
                    </div>
                    <button onClick={handleSaveProfile} className="w-full py-2.5 bg-[#0B2F61] text-white text-xs font-bold rounded-xl shadow-md">개인 인적 스펙 갱신 저장</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-xl shadow-2xl z-[60] flex items-center gap-2 text-xs font-bold animate-fade-in">
          <Check className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}
    </div>
  );
}