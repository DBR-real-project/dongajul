import { useState, useEffect } from 'react';
import { Clock, Shield, AlertTriangle, Activity, Trash2, ChevronRight } from 'lucide-react';
import { TabType } from '../App';
import { apiFetch } from '../utils/api';
import { DiagnosisData } from './DiagnosisResult';

interface DiagnosisHistoryItem {
  diagnosis_id: number;
  input_text: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
  status: string;
}

interface SearchHistoryProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  onResultClick?: (data: DiagnosisData) => void;
  onResultByIdClick?: (id: number) => void;
  darkMode?: boolean;
  language?: string;
  onSearchAgain?: (query: string) => void;
  onClearAllHistory?: () => void;
}

export function SearchHistory({ onResultByIdClick, darkMode = false }: SearchHistoryProps) {
  const [history, setHistory] = useState<DiagnosisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      if (!localStorage.getItem('token')) { setLoading(false); return; }
      const res = await apiFetch('/api/history');
      if (res.ok) {
        const json = await res.json();
        const rows = Array.isArray(json) ? json : (json.data ?? []);
        setHistory(rows);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, diagnosisId: number) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 차단
    if (!window.confirm('이 진단 이력을 삭제하시겠습니까?')) return;
    setDeletingId(diagnosisId);
    try {
      const res = await apiFetch(`/api/diagnose/${diagnosisId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.diagnosis_id !== diagnosisId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || '삭제에 실패했습니다.');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const riskColor = (level: string) =>
    level === 'high' ? 'text-red-500' : level === 'medium' ? 'text-yellow-500' : 'text-green-500';
  const riskBg = (level: string) =>
    level === 'high'
      ? darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
      : level === 'medium'
      ? darkMode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'
      : darkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200';

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#0A0E1A]' : 'bg-[#F8FAFC]'} pb-20`}>
      {/* 헤더 */}
      <div className={`sticky top-0 z-40 border-b px-6 py-4 ${darkMode ? 'bg-[#0A0E1A]/90 backdrop-blur-xl border-gray-800/50' : 'bg-white/90 backdrop-blur-xl border-gray-200/50'}`}>
        <div className="max-w-3xl mx-auto">
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>진단 이력</h1>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>과거 전략 리스크 진단 기록</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#142755] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="text-center py-20">
            <div className={`w-16 h-16 ${darkMode ? 'bg-red-500/10' : 'bg-red-50'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>이력을 불러올 수 없습니다</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>서버 연결을 확인하고 다시 시도해주세요.</p>
            <button
              onClick={fetchHistory}
              className="mt-4 px-4 py-2 text-sm bg-[#142755] text-white rounded-lg hover:bg-[#1a3470] transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-16 h-16 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <Clock className={`w-8 h-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>진단 이력이 없습니다</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>전략 진단을 실행하면 여기에 기록됩니다.</p>
          </div>
        ) : (
          history.map((item) => {
            const pct = Math.round(item.risk_score * 100);
            const isDeleting = deletingId === item.diagnosis_id;
            return (
              <div
                key={item.diagnosis_id}
                onClick={() => !isDeleting && onResultByIdClick?.(item.diagnosis_id)}
                className={`group ${darkMode ? 'bg-gray-800/50 border-gray-700/40 hover:bg-gray-800/80' : 'bg-white border-gray-100 hover:shadow-md'} border rounded-2xl p-5 cursor-pointer transition-all ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${riskBg(item.risk_level)}`}>
                        {item.risk_level === 'high' ? <AlertTriangle className="w-3 h-3" /> : item.risk_level === 'medium' ? <Activity className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        <span className={riskColor(item.risk_level)}>
                          리스크 {pct}% · {item.risk_level === 'high' ? '높음' : item.risk_level === 'medium' ? '중간' : '낮음'}
                        </span>
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-2 leading-relaxed`}>
                      {item.input_text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    <button
                      onClick={(e) => handleDelete(e, item.diagnosis_id)}
                      className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                        darkMode
                          ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                          : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title="이력 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-600' : 'text-gray-300'} group-hover:text-[#142755] transition-colors`} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
