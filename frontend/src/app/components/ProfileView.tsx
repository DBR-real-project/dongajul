/**
 * src/app/components/ProfileView.tsx - 프로필/설정 화면
 */

import { ArrowLeft, User, Mail, Shield, Clock, Edit2, Check, X, Camera } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useState, useEffect, useRef } from 'react';

interface ProfileViewProps {
  onBack: () => void;
  darkMode?: boolean;
}

type SettingsPanel = 'editProfile' | null;

interface UserData {
  user_id?: number;
  email: string;
  nickname: string;
  user_type?: string;
  subscription_type?: string;
  created_at?: string;
  last_login_at?: string | null;
}

interface LocalUser {
  nickname: string;
  email: string;
  password?: string;
}

export function ProfileView({ onBack, darkMode = false }: ProfileViewProps) {
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [userData, setUserData] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [editNickname, setEditNickname] = useState(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) return savedName;
    const savedUser = localStorage.getItem('user');
    try { return savedUser ? JSON.parse(savedUser).nickname : ''; } catch { return ''; }
  });

  const [editEmail, setEditEmail] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try { return savedUser ? JSON.parse(savedUser).email : ''; } catch { return ''; }
  });

  // 계정별 프로필 이미지 키 — email 기반으로 통일
  const getImgKey = (u: UserData | null) =>
    u?.email ? `profileImage_${u.email}` : null;

  // 프로필 사진 상태 — 초기값은 로컬스토리지의 현재 계정 키
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    try {
      const u = JSON.parse(saved);
      const email = u.email;
      return email ? localStorage.getItem(`profileImage_${email}`) || null : null;
    } catch { return null; }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 서버에서 프로필 로드
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetch('/api/profile');
        const data = await res.json();
        if (data.success && data.user) {
          setUserData(data.user);
          setEditNickname(data.user.nickname || '');
          setEditEmail(data.user.email || '');
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.user.nickname) localStorage.setItem('userName', data.user.nickname);
          // email 기반 키로 재동기화
          const key = `profileImage_${data.user.email}`;
          setProfileImage(localStorage.getItem(key) || null);
        }
      } catch (err) {
        console.error('프로필 로드 실패:', err);
      }
    };
    fetchProfile();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // 프로필 사진 변경
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('5MB 이하의 이미지를 선택해주세요');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const key = getImgKey(userData);
      if (!key) return;
      setProfileImage(base64);
      localStorage.setItem(key, base64);
      window.dispatchEvent(new Event('storage'));
      showToast('프로필 사진이 변경되었습니다');
    };
    reader.readAsDataURL(file);
    // input 초기화 (같은 파일 재선택 허용)
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    const key = getImgKey(userData);
    setProfileImage(null);
    if (key) localStorage.removeItem(key);
    window.dispatchEvent(new Event('storage'));
    showToast('프로필 사진이 삭제되었습니다');
  };

  // 프로필 정보 저장
  const handleSaveProfile = async () => {
    if (!editNickname.trim()) {
      showToast('닉네임은 필수 항목입니다');
      return;
    }
    try {
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ nickname: editNickname.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setUserData(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userName', editNickname.trim());
        window.dispatchEvent(new Event('storage'));
        showToast('프로필이 저장되었습니다');
        setActivePanel(null);
      } else {
        showToast(data.message || '저장 실패');
      }
    } catch {
      showToast('서버 통신 중 오류가 발생했습니다');
    }
  };

  const dm = darkMode;

  return (
    <div className={`h-full overflow-y-auto ${dm ? 'bg-[#0A0E1A]' : 'bg-[#f5f5f5]'} relative`}>
      {/* 헤더 */}
      <header className={`${dm ? 'bg-[#0A0E1A] border-gray-800/50' : 'bg-white border-gray-200'} border-b sticky top-0 z-10`}>
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={`p-1 rounded-lg transition-colors ${dm ? 'hover:bg-gray-800' : 'hover:bg-slate-100'}`}>
              <ArrowLeft className={`w-5 h-5 ${dm ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <h1 className={`text-base font-bold ${dm ? 'text-white' : 'text-[#0B2F61]'}`}>마이 프로필 및 설정</h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 max-w-4xl mx-auto space-y-4">

        {/* 프로필 카드 */}
        <div className={`${dm ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-slate-200'} p-6 text-center rounded-2xl border shadow-sm relative overflow-hidden`}>
          {/* 프로필 편집 버튼 */}
          <button
            onClick={() => setActivePanel('editProfile')}
            className={`absolute top-4 right-4 p-2 ${dm ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'} rounded-xl transition-all`}
            title="프로필 수정"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* 아바타 */}
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md">
              {profileImage ? (
                <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#0B2F61] to-[#3B547E] flex items-center justify-center">
                  <User className="w-8 h-8 text-[#C8994B]" />
                </div>
              )}
            </div>

            {/* 카메라 버튼 — 오른쪽 위 고정 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[#0B2F61] hover:bg-[#0d3875] text-white rounded-full flex items-center justify-center shadow-md transition-colors"
              title="프로필 사진 변경"
            >
              <Camera className="w-3 h-3" />
            </button>

            {/* 사진 삭제 버튼 (사진 있을 때만) */}
            {profileImage && (
              <button
                onClick={handleRemovePhoto}
                className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                title="사진 삭제"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 숨김 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />

          <h2 className={`text-base font-bold ${dm ? 'text-white' : 'text-gray-900'} mt-1 mb-0.5`}>{userData?.nickname || '-'}</h2>
          <p className={`text-xs font-semibold uppercase tracking-wider ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{userData?.user_type || 'User'} 계정</p>
        </div>

        {/* 기본 계정 정보 */}
        <div className={`${dm ? 'bg-gray-800/40 border-gray-700/40' : 'bg-white border-slate-200'} p-5 rounded-2xl border shadow-sm`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>계정 정보</h3>
          <div className="space-y-4">
            {[
              { Icon: Mail, label: '이메일', value: userData?.email || '-', border: false },
              { Icon: Shield, label: '계정 유형', value: userData?.user_type || '-', border: true },
              { Icon: Clock, label: '가입일', value: userData?.created_at ? String(userData.created_at).split('T')[0].split(' ')[0] : '-', border: true },
            ].map(({ Icon, label, value, border }) => (
              <div key={label} className={`flex items-center gap-3 pt-3 ${border ? (dm ? 'border-t border-gray-800' : 'border-t border-slate-100') : ''}`}>
                <div className={`p-2 rounded-lg ${dm ? 'bg-blue-950/40 text-blue-400' : 'bg-slate-50 text-[#0B2F61]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-gray-400 mb-0.5">{label}</div>
                  <div className={`text-sm font-bold ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 구독 정보 */}
        <div className={`${dm ? 'bg-gray-800/40 border-gray-700/40' : 'bg-white border-slate-200'} p-5 rounded-2xl border shadow-sm flex items-center justify-between`}>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>구독 플랜</h3>
            <div className={`text-sm font-bold uppercase ${dm ? 'text-white' : 'text-gray-900'} mb-0.5`}>{userData?.subscription_type || '-'}</div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-xl font-bold shadow-inner">
            활성
          </span>
        </div>

        <div className="text-center pt-2">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
            Version 2.1.0 · © 2026 동아줄
          </p>
        </div>
      </div>

      {/* 프로필 수정 모달 */}
      {activePanel === 'editProfile' && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={() => setActivePanel(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-md ${dm ? 'bg-[#0d1220] border-gray-800' : 'bg-white border-slate-200'} rounded-2xl shadow-2xl border overflow-hidden`}>
              {/* 모달 헤더 */}
              <div className="bg-gradient-to-r from-[#0B2F61] to-[#3B547E] px-6 py-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">프로필 수정</h2>
                <button onClick={() => setActivePanel(null)} className="p-1.5 hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>닉네임</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2F61]/40 ${
                      dm ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600' : 'bg-white border-slate-200 text-gray-900'
                    }`}
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>이메일 <span className="font-normal opacity-60">(수정 불가)</span></label>
                  <input
                    type="email"
                    value={editEmail}
                    disabled
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl opacity-50 cursor-not-allowed ${
                      dm ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-slate-200 text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setActivePanel(null)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                      dm ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-slate-200 text-gray-600 hover:bg-slate-50'
                    }`}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 py-2.5 bg-[#0B2F61] hover:bg-[#0d3875] text-white rounded-xl text-sm font-bold transition-colors shadow-md"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-xl shadow-2xl z-[60] flex items-center gap-2 text-xs font-bold">
          <Check className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
