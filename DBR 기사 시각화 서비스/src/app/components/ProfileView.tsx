import { ArrowLeft, User, Mail, Building2, Briefcase, Settings, LogOut, Bell, Lock, X, Check, Eye, Shield, Globe, Moon, Sun, ChevronRight, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProfileViewProps {
  onBack: () => void;
  darkMode?: boolean;
  language?: string;
}

type SettingsPanel = 'notification' | 'security' | 'environment' | 'editProfile' | 'resetPassword' | null;

interface UserData {
  name: string;
  email: string;
  company?: string;
  department?: string;
  provider?: string;
}

interface User {
  name: string;
  email: string;
  password: string;
}

export function ProfileView({ onBack, darkMode: propDarkMode, language: propLanguage = 'ko' }: ProfileViewProps) {
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 사용자 정보
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

  // 비밀번호 찾기
  const [resetEmail, setResetEmail] = useState('');

  // 환경 설정 상태
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : (propDarkMode || false);
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || propLanguage;
  });

  // 사용자 정보 로드
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserData(parsedUser);
      setEditName(parsedUser.name || '김전략');
      setEditEmail(parsedUser.email || '');
      setEditCompany(parsedUser.company || 'DBR Authority Inc.');
      setEditDepartment(parsedUser.department || '전략기획팀');
    }
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveNotification = () => {
    localStorage.setItem('pushEnabled', JSON.stringify(pushEnabled));
    localStorage.setItem('emailEnabled', JSON.stringify(emailEnabled));
    showToast('알림 설정이 저장되었습니다');
    setActivePanel(null);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('모든 필드를 입력해주세요');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('새 비밀번호가 일치하지 않습니다');
      return;
    }
    if (newPassword.length < 6) {
      showToast('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    // 실제 비밀번호 업데이트
    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const userIndex = users.findIndex((u) => u.email === userData?.email);
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
    }

    showToast('비밀번호가 변경되었습니다');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSaveEnvironment = () => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    localStorage.setItem('language', language);
    showToast(language === 'ko' ? '환경 설정이 저장되었습니다. 새로고침 중...' : 'Settings saved. Refreshing...');
    setTimeout(() => {
      window.location.reload(); // 언어/다크모드 변경 적용을 위해 새로고침
    }, 500);
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      showToast('이름과 이메일을 입력해주세요');
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

    // users 배열도 업데이트
    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const userIndex = users.findIndex((u) => u.email === userData?.email);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], name: editName, email: editEmail };
      localStorage.setItem('users', JSON.stringify(users));
    }

    showToast('프로필이 업데이트되었습니다');
    setActivePanel(null);
  };

  const handleResetPassword = () => {
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      showToast('올바른 이메일을 입력해주세요');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const user = users.find((u: any) => u.email === resetEmail);

    if (user) {
      showToast('비밀번호 재설정 링크가 이메일로 전송되었습니다');
      setResetEmail('');
      setActivePanel(null);
    } else {
      showToast('등록되지 않은 이메일입니다');
    }
  };

  const handleToggleTwoFactor = () => {
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);
    localStorage.setItem('twoFactorEnabled', JSON.stringify(newValue));
    showToast(newValue ? '2단계 인증이 활성화되었습니다' : '2단계 인증이 비활성화되었습니다');
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('user');
      window.location.reload();
    }
  };

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-black' : 'bg-[#f5f5f5]'} relative`}>
      <header className={`${darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1">
              <ArrowLeft className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <h1 className={`text-base ${darkMode ? 'text-white' : 'text-[#1e3a5f]'}`}>프로필</h1>
          </div>
        </div>
      </header>

      <div className="px-3 py-4">
        <div className={`${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'} p-4 mb-4 text-center rounded-xl shadow-sm relative`}>
          <button
            onClick={() => setActivePanel('editProfile')}
            className={`absolute top-3 right-3 p-1.5 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
            title="프로필 수정"
          >
            <Edit2 className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
          <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
            <User className="w-8 h-8" />
          </div>
          <h2 className={`text-base mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userData?.name || '김전략'}</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{userData?.department || '전략기획팀'} {userData?.position || '팀장'}</p>
        </div>

        <div className={`${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'} p-3 mb-4 rounded-xl shadow-sm`}>
          <h3 className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>계정 정보</h3>
          <div className="space-y-3">
            {[
              { Icon: Mail, label: '이메일', value: userData?.email || 'analyst@dbrauthority.com', border: false },
              { Icon: Building2, label: '회사', value: userData?.company || 'DBR Authority Inc.', border: true },
              { Icon: Briefcase, label: '부서', value: userData?.department || '전략기획팀', border: true },
            ].map(({ Icon, label, value, border }) => (
              <div key={label} className={`flex items-center gap-2 py-1.5 ${border ? (darkMode ? 'border-t border-gray-800' : 'border-t border-gray-100') : ''}`}>
                <Icon className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{label}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'} p-3 mb-4 rounded-xl shadow-sm`}>
          <h3 className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>구독 정보</h3>
          <div className="flex items-center justify-between py-1.5">
            <div>
              <div className={`text-sm mb-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Professional Plan</div>
              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>다음 결제일: 2026.06.04</div>
            </div>
            <span className={`px-2 py-0.5 ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'} text-xs rounded-full font-semibold`}>
              활성
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {[
            { Icon: Bell, label: '알림 설정', key: 'notification' as SettingsPanel },
            { Icon: Lock, label: '보안 설정', key: 'security' as SettingsPanel },
            { Icon: Settings, label: '환경 설정', key: 'environment' as SettingsPanel },
          ].map(({ Icon, label, key }) => (
            <button
              key={label}
              onClick={() => setActivePanel(key)}
              className={`w-full ${darkMode ? 'bg-[#1a1a1a] hover:bg-[#252525] hover:border-[#142755]' : 'bg-white hover:bg-gray-100 hover:border-gray-300'} p-3 rounded-xl shadow-sm flex items-center justify-between transition-all border border-transparent`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${darkMode ? 'bg-[#444655]' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${darkMode ? 'text-[#A9AABC]' : 'text-[#142755]'}`} />
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className={`w-full ${darkMode ? 'bg-[#1a1a1a] hover:bg-red-950' : 'bg-white hover:bg-red-50'} p-3 rounded-xl shadow-sm flex items-center justify-center gap-2 ${darkMode ? 'text-red-400 border-red-900' : 'text-red-600 border-red-200'} transition-colors border`}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">로그아웃</span>
        </button>

        <div className="mt-4 text-center">
          <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            Version 2.1.0 • © 2026 DBR Authority
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      {activePanel && (
        <>
          <div
            className={`fixed inset-0 ${darkMode ? 'bg-black bg-opacity-80' : 'bg-white bg-opacity-95'} z-50 transition-opacity`}
            onClick={() => setActivePanel(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className={`w-full max-w-4xl max-h-[90vh] ${darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border-2`}>
              <div className="sticky top-0 bg-gradient-to-r from-[#142755] to-[#444655] px-8 py-6 flex items-center justify-between shadow-lg">
                <h2 className="text-2xl font-bold text-white">
                  {activePanel === 'notification' && '알림 설정'}
                  {activePanel === 'security' && '보안 설정'}
                  {activePanel === 'environment' && '환경 설정'}
                  {activePanel === 'editProfile' && '프로필 수정'}
                  {activePanel === 'resetPassword' && '비밀번호 찾기'}
                </h2>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className={`p-8 overflow-y-auto max-h-[calc(90vh-88px)] ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
              {/* 알림 설정 패널 */}
              {activePanel === 'notification' && (
                <div className="space-y-8">
                  <div className={`bg-gradient-to-r ${darkMode ? 'from-gray-900 to-blue-900 border-gray-600' : 'from-gray-50 to-blue-100 border-gray-300'} p-6 rounded-2xl border-2 shadow-sm`}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-[#142755] rounded-xl flex items-center justify-center shadow-md">
                        <Bell className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-300' : 'text-blue-900'}`}>알림 설정</h3>
                        <p className={`text-sm ${darkMode ? 'text-[#A9AABC]' : 'text-[#142755]'}`}>
                          중요한 업데이트와 분석 결과를 놓치지 마세요
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className={`${darkMode ? 'bg-[#1a1a1a] border-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-blue-300'} p-6 rounded-2xl border-2 hover:shadow-lg transition-all`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'} mb-2`}>푸시 알림</h4>
                          <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            실시간 분석 결과 및 중요 알림을 받습니다
                          </p>
                        </div>
                        <button
                          onClick={() => setPushEnabled(!pushEnabled)}
                          className={`relative w-16 h-8 rounded-full transition-all duration-300 shadow-md ${
                            pushEnabled ? 'bg-[#142755]' : (darkMode ? 'bg-gray-700' : 'bg-gray-300')
                          }`}
                        >
                          <div
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                              pushEnabled ? 'transform translate-x-8' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className={`${darkMode ? 'bg-[#1a1a1a] border-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-blue-300'} p-6 rounded-2xl border-2 hover:shadow-lg transition-all`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'} mb-2`}>이메일 알림</h4>
                          <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            주간 리포트 및 요약 정보를 이메일로 받습니다
                          </p>
                        </div>
                        <button
                          onClick={() => setEmailEnabled(!emailEnabled)}
                          className={`relative w-16 h-8 rounded-full transition-all duration-300 shadow-md ${
                            emailEnabled ? 'bg-[#142755]' : (darkMode ? 'bg-gray-700' : 'bg-gray-300')
                          }`}
                        >
                          <div
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                              emailEnabled ? 'transform translate-x-8' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveNotification}
                    className="w-full bg-gradient-to-r from-[#142755] to-[#444655] text-white py-4 px-6 rounded-xl text-lg font-bold hover:from-[#444655] hover:to-[#444655] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <Check className="w-6 h-6" />
                    설정 저장
                  </button>
                </div>
              )}

              {/* 보안 설정 패널 */}
              {activePanel === 'security' && (
                <div className="space-y-8">
                  <div className={`bg-gradient-to-r ${darkMode ? 'from-red-950 to-orange-950 border-red-900' : 'from-red-50 to-orange-50 border-red-200'} p-6 rounded-2xl border-2 shadow-sm`}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-md">
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-red-300' : 'text-red-900'}`}>보안 설정</h3>
                        <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                          계정 보안을 강화하고 안전하게 관리하세요
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`${darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'} p-6 rounded-2xl border-2 shadow-sm`}>
                    <h4 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'} mb-5`}>비밀번호 변경</h4>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>현재 비밀번호</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className={`w-full px-4 py-3 text-base border-2 ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-[#142755] transition-all`}
                          placeholder="현재 비밀번호 입력"
                        />
                      </div>
                      <div>
                        <label className={`block text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>새 비밀번호</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`w-full px-4 py-3 text-base border-2 ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-[#142755] transition-all`}
                          placeholder="새 비밀번호 입력 (최소 6자)"
                        />
                      </div>
                      <div>
                        <label className={`block text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>비밀번호 확인</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full px-4 py-3 text-base border-2 ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-[#142755] transition-all`}
                          placeholder="새 비밀번호 다시 입력"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        className="w-full bg-gradient-to-r from-[#142755] to-[#444655] text-white py-3 px-4 rounded-xl text-base font-bold hover:from-[#444655] hover:to-[#444655] transition-all shadow-md hover:shadow-lg"
                      >
                        비밀번호 변경
                      </button>
                    </div>
                  </div>

                  <div className={`${darkMode ? 'bg-[#1a1a1a] border-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-blue-300'} p-6 rounded-2xl border-2 hover:shadow-lg transition-all`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'} mb-2`}>2단계 인증</h4>
                        <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          추가 보안 계층으로 계정을 보호합니다
                        </p>
                      </div>
                      <button
                        onClick={handleToggleTwoFactor}
                        className={`relative w-16 h-8 rounded-full transition-all duration-300 shadow-md ${
                          twoFactorEnabled ? 'bg-[#142755]' : (darkMode ? 'bg-gray-700' : 'bg-gray-300')
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                            twoFactorEnabled ? 'transform translate-x-8' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className={`${darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'} p-6 rounded-2xl border-2 shadow-sm`}>
                    <h4 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'} mb-4`}>로그인 기록</h4>
                    <div className="space-y-4">
                      {[
                        { device: 'Chrome (Windows)', location: '서울, 대한민국', time: '2시간 전', current: true },
                        { device: 'Safari (iPhone)', location: '서울, 대한민국', time: '1일 전', current: false },
                        { device: 'Chrome (macOS)', location: '부산, 대한민국', time: '3일 전', current: false },
                      ].map((log, idx) => (
                        <div key={idx} className={`flex items-start gap-4 pb-4 border-b-2 ${darkMode ? 'border-gray-800' : 'border-gray-100'} last:border-0`}>
                          <div className={`w-10 h-10 ${darkMode ? 'bg-blue-950' : 'bg-gray-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Eye className={`w-5 h-5 ${darkMode ? 'text-[#A9AABC]' : 'text-[#142755]'}`} />
                          </div>
                          <div className="flex-1">
                            <div className={`text-base font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-2 mb-1`}>
                              {log.device}
                              {log.current && (
                                <span className={`text-xs ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'} px-2 py-1 rounded-full font-bold`}>현재</span>
                              )}
                            </div>
                            <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{log.location} • {log.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 환경 설정 패널 */}
              {activePanel === 'environment' && (
                <div className="space-y-8">
                  <div className={`bg-gradient-to-r ${darkMode ? 'from-purple-950 to-pink-950 border-purple-900' : 'from-purple-50 to-pink-50 border-purple-200'} p-6 rounded-2xl border-2 shadow-sm`}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <Settings className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>{language === 'ko' ? '환경 설정' : 'Preferences'}</h3>
                        <p className={`text-sm ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                          {language === 'ko' ? '개인화된 사용 환경을 설정하세요' : 'Customize your experience'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`${darkMode ? 'bg-[#1a1a1a] border-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-blue-300'} p-6 rounded-2xl border-2 hover:shadow-lg transition-all`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {darkMode ? <Moon className="w-6 h-6 text-[#A9AABC]" /> : <Sun className="w-6 h-6 text-amber-500" />}
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{language === 'ko' ? '다크 모드' : 'Dark Mode'}</h4>
                        </div>
                        <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'ko' ? '어두운 테마로 눈의 피로를 줄입니다' : 'Reduce eye strain with dark theme'}
                        </p>
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`relative w-16 h-8 rounded-full transition-all duration-300 shadow-md ${
                          darkMode ? 'bg-[#142755]' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                            darkMode ? 'transform translate-x-8' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className={`${darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'} p-6 rounded-2xl border-2 shadow-sm`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 ${darkMode ? 'bg-blue-950' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                        <Globe className={`w-6 h-6 ${darkMode ? 'text-[#A9AABC]' : 'text-[#142755]'}`} />
                      </div>
                      <h4 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{language === 'ko' ? '언어 설정' : 'Language'}</h4>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className={`w-full px-4 py-3 text-base border-2 ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-[#142755] transition-all cursor-pointer`}
                    >
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveEnvironment}
                    className="w-full bg-gradient-to-r from-[#142755] to-[#444655] text-white py-4 px-6 rounded-xl text-lg font-bold hover:from-[#444655] hover:to-[#444655] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <Check className="w-6 h-6" />
                    {language === 'ko' ? '설정 저장' : 'Save Settings'}
                  </button>
                </div>
              )}

              {/* 프로필 편집 패널 */}
              {activePanel === 'editProfile' && (
                <div className="space-y-8">
                  <div className={`bg-gradient-to-r ${darkMode ? 'from-green-950 to-emerald-950 border-green-900' : 'from-green-50 to-emerald-50 border-green-200'} p-6 rounded-2xl border-2 shadow-sm`}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-green-300' : 'text-green-900'}`}>프로필 수정</h3>
                        <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                          개인 정보를 업데이트하세요
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`${darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'} p-6 rounded-2xl border-2 shadow-sm`}>
                    <div className="space-y-5">
                      <div>
                        <label className={`block text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 font-bold`}>이름</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`w-full px-4 py-3 text-base border-2 ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-[#142755] transition-all`}
                          placeholder="이름 입력"
                        />
                      </div>

                      <div>
                        <label className={`block text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 font-bold`}>이메일</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className={`w-full px-4 py-3 text-base border-2 ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-[#142755] transition-all`}
                          placeholder="example@company.com"
                        />
                      </div>

                      <div>
                        <label className={`block text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 font-bold`}>회사</label>
                        <input
                          type="text"
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          className={`w-full px-4 py-3 text-base border-2 ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-[#142755] transition-all`}
                          placeholder="회사명 입력"
                        />
                      </div>

                      <div>
                        <label className={`block text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 font-bold`}>부서</label>
                        <input
                          type="text"
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                          className={`w-full px-4 py-3 text-base border-2 ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-[#142755] transition-all`}
                          placeholder="부서명 입력"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    className="w-full bg-gradient-to-r from-[#142755] to-[#444655] text-white py-4 px-6 rounded-xl text-lg font-bold hover:from-[#444655] hover:to-[#444655] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <Check className="w-6 h-6" />
                    저장하기
                  </button>
                </div>
              )}

              {/* 비밀번호 재설정 패널 */}
              {activePanel === 'resetPassword' && (
                <div className="space-y-8">
                  <div className={`bg-gradient-to-r ${darkMode ? 'from-amber-950 to-yellow-950 border-amber-900' : 'from-amber-50 to-yellow-50 border-amber-200'} p-6 rounded-2xl border-2 shadow-sm`}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center shadow-md">
                        <Lock className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>비밀번호 찾기</h3>
                        <p className={`text-sm ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                          등록된 이메일로 비밀번호 재설정 링크를 보내드립니다
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`${darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'} p-6 rounded-2xl border-2 shadow-sm`}>
                    <label className={`block text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3 font-bold`}>이메일 주소</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className={`w-full px-4 py-3 text-base border-2 ${darkMode ? 'bg-black border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#142755] focus:border-[#142755] transition-all`}
                      placeholder="example@company.com"
                    />
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-3`}>
                      회원가입 시 사용한 이메일 주소를 입력해주세요
                    </p>
                  </div>

                  <button
                    onClick={handleResetPassword}
                    className="w-full bg-gradient-to-r from-[#142755] to-[#444655] text-white py-4 px-6 rounded-xl text-lg font-bold hover:from-[#444655] hover:to-[#444655] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <Mail className="w-6 h-6" />
                    재설정 링크 전송
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'} px-6 py-3 rounded-lg shadow-2xl z-[60] flex items-center gap-2 animate-fade-in`}>
          <Check className="w-5 h-5 text-green-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
