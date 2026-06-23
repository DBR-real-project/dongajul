import { useState } from 'react';
import {
  BookOpen, Shield, Map, BarChart2, FileText, MessageSquare,
  ChevronDown, ChevronRight, Lightbulb, AlertTriangle, CheckCircle,
  Search, TrendingUp, Star, Clock, Target, Zap
} from 'lucide-react';

interface HelpGuideProps {
  darkMode?: boolean;
  onNavigate?: (view: string) => void;
}

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: '전략 진단은 어떤 원리로 작동하나요?',
    a: 'DBR·HBR 15,451건의 경영 사례를 SBERT(다국어 문장 임베딩) 모델로 벡터화한 뒤, 입력한 전략 텍스트와 가장 유사한 과거 사례들을 FAISS 벡터 검색으로 찾아냅니다. 이후 유사 사례의 성공/실패 비율과 MLP 리스크 모델을 결합해 0~100% 리스크 스코어를 산출합니다.',
  },
  {
    q: '리스크 스코어가 높으면 무조건 위험한 전략인가요?',
    a: '리스크 스코어는 과거 유사 전략 사례에서 실패 패턴이 얼마나 많이 나타났는지를 수치화한 것입니다. 높다고 해서 반드시 실패하는 게 아니라 "유사 사례에서 이런 패턴이 많았다"는 경고 신호입니다. AI 리포트의 리스크 요인과 개선 제언을 함께 참고하세요.',
  },
  {
    q: '전략 텍스트를 어떻게 작성해야 정확한 진단을 받을 수 있나요?',
    a: '타깃 고객, 수익 모델, 경쟁사 대비 차별화 포인트, 실행 방식을 모두 포함하면 더 정확한 진단이 가능합니다. 너무 짧거나 모호한 텍스트보다는 150~300자 내외로 구체적으로 작성하는 것이 좋습니다. 전략 진단 화면의 "AI 작성 도우미"를 활용하면 최적화된 텍스트를 자동 생성해줍니다.',
  },
  {
    q: '시맨틱 맵에서 제 전략 위치는 어떻게 확인하나요?',
    a: '전략 진단 후 결과 화면에서 "시맨틱 맵에서 보기" 버튼을 클릭하면 내 전략의 UMAP 좌표가 ⭐ 황금색 마커로 표시됩니다. 주변에 어떤 클러스터(산업 주제)의 사례들이 분포하는지 확인해 전략의 맥락을 파악할 수 있습니다.',
  },
  {
    q: '유사 사례 기사 원문은 어디서 볼 수 있나요?',
    a: '진단 결과 화면의 "유사 성공/실패 사례" 카드에서 각 기사 제목을 클릭하면 원문 링크로 이동합니다. DBR 기사는 DBR 사이트, HBR 기사는 HBR 사이트로 연결됩니다.',
  },
  {
    q: 'AI 리포트가 생성되지 않아요.',
    a: 'GPT API 사용량 한도 초과 또는 네트워크 오류 시 AI 리포트가 생성되지 않을 수 있습니다. 이 경우에도 리스크 스코어와 유사 사례는 정상적으로 제공됩니다. 잠시 후 다시 진단하거나, 문의 메일(dongajul@dongajul.com)로 연락해주세요.',
  },
  {
    q: '진단 이력은 어디서 확인하나요?',
    a: '상단 네비게이션의 "진단 이력" 탭에서 이전 진단 기록을 모두 확인할 수 있습니다. 각 이력 카드를 클릭하면 당시의 리스크 스코어, 유사 사례, AI 리포트를 다시 볼 수 있습니다. 휴지통 아이콘으로 원하는 이력을 삭제할 수도 있습니다.',
  },
  {
    q: 'PDF 저장은 어떻게 하나요?',
    a: '전략 진단 결과 화면의 AI 리포트 섹션 우측 상단 "PDF 저장" 버튼을 클릭하면 A4 형식의 리포트 파일이 자동으로 다운로드됩니다.',
  },
];

const STEPS = [
  {
    num: '01',
    icon: Target,
    title: '전략 텍스트 작성',
    desc: '진단받을 비즈니스 전략을 직접 입력하거나 AI 작성 도우미로 자동 생성합니다.',
    tips: ['타깃 고객을 구체적으로 명시', '수익 모델 포함', '경쟁사 대비 차별화 포인트 언급'],
    color: 'indigo',
  },
  {
    num: '02',
    icon: Zap,
    title: 'AI 리스크 분석',
    desc: '15,451건의 DBR·HBR 사례와 벡터 유사도를 비교해 리스크 스코어를 산출합니다.',
    tips: ['분석 시간: 평균 20~40초', 'FAISS + SBERT 기반 유사 사례 검색', 'MLP 모델 리스크 스코어'],
    color: 'amber',
  },
  {
    num: '03',
    icon: FileText,
    title: 'AI 리포트 확인',
    desc: '패턴 분석 리포트에서 과거 유사 전략의 실패 패턴과 성공 사례 조치를 확인합니다.',
    tips: ['리스크 요인 3가지 + 심층 분석', '유사 성공 사례 기반 개선 제언', 'PDF로 저장 가능'],
    color: 'blue',
  },
  {
    num: '04',
    icon: Map,
    title: '시맨틱 맵 탐색',
    desc: '내 전략 위치를 2D 시맨틱 공간에서 확인하고 유사 사례 분포를 시각화합니다.',
    tips: ['⭐ 황금 마커 = 내 전략 위치', '빨간 점 = 실패 사례', '초록 점 = 성공 사례'],
    color: 'emerald',
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: '전략 진단',
    path: 'risk',
    desc: '비즈니스 전략을 입력하면 DBR·HBR 15,451건 사례 데이터와 벡터 유사도를 비교해 리스크 스코어(0~100%)를 산출합니다.',
    color: 'indigo',
  },
  {
    icon: FileText,
    title: 'AI 컨설팅 리포트',
    path: 'risk',
    desc: '과거 유사 전략의 실패 패턴을 분석한 데이터 기반 경고 리포트입니다. 처방이 아닌 패턴 경보 방식으로 "이런 조건에서 이런 결과가 나왔다"를 보고합니다.',
    color: 'blue',
  },
  {
    icon: Map,
    title: '시맨틱 인사이트 맵',
    path: 'semantic-map',
    desc: 'UMAP 2D 벡터 공간에 15,000+개 사례를 시각화합니다. 내 전략 위치와 성공/실패 사례 분포를 한눈에 파악할 수 있습니다.',
    color: 'emerald',
  },
  {
    icon: BarChart2,
    title: '인사이트 대시보드',
    path: 'analysis',
    desc: '전체 사례 데이터의 성공·실패 분포, 카테고리별 트렌드, 연도별 사례 추이를 차트로 제공합니다.',
    color: 'purple',
  },
  {
    icon: Search,
    title: '진단 이력',
    path: 'history',
    desc: '이전 진단 기록을 저장하고 다시 열람할 수 있습니다. AI 리포트·리스크 스코어·유사 사례가 모두 보존됩니다.',
    color: 'amber',
  },
  {
    icon: MessageSquare,
    title: 'AI 전략 챗봇',
    path: 'risk',
    desc: 'DBR·HBR·HBS 13,000건 사례를 학습한 전략 컨설턴트 챗봇입니다. 사례 검색, 리스크 분석, 프레임워크 질문 등을 대화형으로 이용할 수 있습니다.',
    color: 'pink',
  },
];

const SCORE_LEVELS = [
  { range: '0 ~ 30%', label: '낮음 (Low)', color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', desc: '유사 사례에서 성공 패턴이 우세합니다. 실행 리스크가 낮은 편이나 잠재 위험 요인을 점검하세요.' },
  { range: '30 ~ 60%', label: '중간 (Medium)', color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', desc: '성공·실패 패턴이 혼재합니다. AI 리포트의 리스크 요인과 개선 제언을 꼼꼼히 확인하세요.' },
  { range: '60 ~ 100%', label: '높음 (High)', color: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', desc: '유사 사례에서 실패 패턴이 우세합니다. 전략 수정 또는 보완 후 재진단을 권장합니다.' },
];

export function HelpGuide({ darkMode = false, onNavigate }: HelpGuideProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<'guide' | 'features' | 'score' | 'faq'>('guide');

  const base = darkMode ? 'bg-[#0A0E1A] text-white' : 'bg-[#F7F8FA] text-gray-900';
  const card = darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200';
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const muted = darkMode ? 'text-gray-500' : 'text-gray-400';

  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-500 bg-indigo-50',
    blue: 'text-blue-500 bg-blue-50',
    emerald: 'text-emerald-500 bg-emerald-50',
    amber: 'text-amber-500 bg-amber-50',
    purple: 'text-purple-500 bg-purple-50',
    pink: 'text-pink-500 bg-pink-50',
  };
  const colorMapDark: Record<string, string> = {
    indigo: 'text-indigo-400 bg-indigo-900/30',
    blue: 'text-blue-400 bg-blue-900/30',
    emerald: 'text-emerald-400 bg-emerald-900/30',
    amber: 'text-amber-400 bg-amber-900/30',
    purple: 'text-purple-400 bg-purple-900/30',
    pink: 'text-pink-400 bg-pink-900/30',
  };
  const getColor = (c: string) => darkMode ? colorMapDark[c] : colorMap[c];

  const tabs = [
    { id: 'guide' as const, label: '이용 가이드', icon: BookOpen },
    { id: 'features' as const, label: '기능 안내', icon: Star },
    { id: 'score' as const, label: '리스크 스코어', icon: TrendingUp },
    { id: 'faq' as const, label: 'FAQ', icon: MessageSquare },
  ];

  return (
    <div className={`h-full overflow-y-auto ${base}`}>
      {/* 헤더 */}
      <div className={`sticky top-0 z-10 border-b ${darkMode ? 'bg-[#0D1527] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-[#0B2F61]/40' : 'bg-[#0B2F61]'}`}>
              <BookOpen className={`w-5 h-5 ${darkMode ? 'text-blue-300' : 'text-white'}`} />
            </div>
            <div>
              <h1 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>이용 안내</h1>
              <p className={`text-xs ${muted}`}>동아줄 서비스 사용 가이드 · FAQ</p>
            </div>
          </div>
          {/* 탭 */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? darkMode
                        ? 'bg-[#0B2F61] text-blue-300'
                        : 'bg-[#0B2F61] text-white'
                      : darkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ───────────── 이용 가이드 ───────────── */}
        {activeSection === 'guide' && (
          <div className="space-y-6">
            {/* 소개 배너 */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#0B2F61] to-[#1a4a8a] p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-[#C8994B]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#C8994B]">동아줄이란?</span>
              </div>
              <h2 className="text-xl font-black mb-2">AI 기반 전략 리스크 사전 진단 서비스</h2>
              <p className="text-sm text-blue-200 leading-relaxed">
                DBR·HBR 15년치 경영 사례 데이터베이스를 AI로 분석해, 당신의 전략과 유사한 과거 성공·실패 패턴을 찾아냅니다.
                처방이 아닌 <strong className="text-white">데이터 기반 패턴 경보</strong>로 전략의 취약점을 사전에 파악하세요.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[['15,451', '분석 아티클'], ['97.7%', '진단 정확도'], ['87%', '리스크 감지율']].map(([v, l]) => (
                  <div key={l} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-[#C8994B]">{v}</p>
                    <p className="text-xs text-blue-200 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4단계 사용 흐름 */}
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${muted}`}>4단계 사용 흐름</h3>
              <div className="space-y-4">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.num} className={`rounded-2xl border p-5 ${card}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColor(step.color)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-black ${muted}`}>{step.num}</span>
                            <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{step.title}</h4>
                          </div>
                          <p className={`text-xs leading-relaxed mb-3 ${sub}`}>{step.desc}</p>
                          <div className="flex flex-wrap gap-2">
                            {step.tips.map((tip) => (
                              <span key={tip} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                {tip}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 전략 작성 팁 */}
            <div className={`rounded-2xl border p-5 ${card}`}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>더 정확한 진단을 위한 전략 작성 팁</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: '🎯', title: '타깃 고객 명시', desc: '"20~35세 직장인 여성" 처럼 구체적인 고객군을 명시하면 정확도가 높아집니다.' },
                  { icon: '💰', title: '수익 모델 포함', desc: '"구독료 월 9,900원" 또는 "중개 수수료 15%" 형태로 수익화 방식을 포함하세요.' },
                  { icon: '⚡', title: '차별화 포인트', desc: '"기존 경쟁사 대비 처리 속도 3배" 등 경쟁 우위 요소를 구체적으로 언급하세요.' },
                  { icon: '📝', title: '적정 분량', desc: '150~300자 내외가 최적입니다. 너무 짧으면 유사 사례 검색 정확도가 낮아집니다.' },
                ].map((tip) => (
                  <div key={tip.title} className={`flex gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <span className="text-lg flex-shrink-0">{tip.icon}</span>
                    <div>
                      <p className={`text-xs font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tip.title}</p>
                      <p className={`text-xs leading-relaxed ${sub}`}>{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            {onNavigate && (
              <div className="flex gap-3">
                <button
                  onClick={() => onNavigate('risk')}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#0B2F61] hover:bg-[#0d3875] transition-all shadow-md"
                >
                  지금 전략 진단하기 →
                </button>
                <button
                  onClick={() => onNavigate('semantic-map')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  시맨틱 맵 보기
                </button>
              </div>
            )}
          </div>
        )}

        {/* ───────────── 기능 안내 ───────────── */}
        {activeSection === 'features' && (
          <div className="space-y-4">
            <p className={`text-xs ${sub}`}>동아줄에서 제공하는 주요 기능을 소개합니다.</p>
            <div className="grid grid-cols-1 gap-4">
              {FEATURES.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className={`rounded-2xl border p-5 ${card} group`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getColor(feat.color)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{feat.title}</h4>
                          {onNavigate && (
                            <button
                              onClick={() => onNavigate(feat.path)}
                              className={`text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-blue-400' : 'text-[#0B2F61]'}`}
                            >
                              이동 <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className={`text-xs leading-relaxed ${sub}`}>{feat.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ───────────── 리스크 스코어 ───────────── */}
        {activeSection === 'score' && (
          <div className="space-y-5">
            <div className={`rounded-2xl border p-5 ${card}`}>
              <h3 className={`text-sm font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>리스크 스코어란?</h3>
              <p className={`text-xs leading-relaxed ${sub}`}>
                입력한 전략과 유사한 과거 DBR·HBR 사례들의 성공/실패 비율을 기반으로 산출한 수치입니다.
                0%에 가까울수록 유사 사례에서 성공 패턴이 우세하고, 100%에 가까울수록 실패 패턴이 우세합니다.
              </p>
              <div className={`mt-4 p-4 rounded-xl text-xs leading-relaxed ${darkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-blue-50 text-blue-800'}`}>
                <strong>계산 방식:</strong> 모델 스코어(35%) + 유사 사례 실패율(45%, 유사도 가중) + 클러스터 리스크(20%) × 신뢰도 보정
              </div>
            </div>

            {/* 등급 설명 */}
            <div className="space-y-3">
              {SCORE_LEVELS.map((level) => (
                <div
                  key={level.range}
                  className={`rounded-2xl border p-5 ${darkMode
                    ? 'bg-gray-900/50 border-gray-800'
                    : `${level.bg} ${level.border}`
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-sm font-black ${darkMode ? 'text-white' : level.text}`}>{level.range}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${darkMode ? 'bg-gray-800 text-gray-300' : `${level.text} bg-white/70`}`}>
                      {level.label}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : level.text}`}>{level.desc}</p>
                </div>
              ))}
            </div>

            {/* 주의사항 */}
            <div className={`rounded-2xl border p-5 ${card}`}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI 면책 안내</h3>
              </div>
              <div className={`text-xs leading-relaxed space-y-1.5 ${sub}`}>
                <p>• 본 서비스의 리스크 스코어와 AI 리포트는 <strong className={darkMode ? 'text-white' : 'text-gray-900'}>참고 자료</strong>로만 활용해 주세요.</p>
                <p>• 과거 데이터 패턴 기반 분석이므로 미래 결과를 보장하지 않습니다.</p>
                <p>• 실제 전략 의사결정은 반드시 도메인 전문가와 함께 검토하세요.</p>
                <p>• 데이터 기반 진단 결과이며 개별 기업의 내부 상황은 반영되지 않습니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* ───────────── FAQ ───────────── */}
        {activeSection === 'faq' && (
          <div className="space-y-3">
            <p className={`text-xs ${sub}`}>자주 묻는 질문 {FAQS.length}개</p>
            {FAQS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className={`rounded-2xl border overflow-hidden transition-all ${card}`}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors ${darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`text-sm font-semibold pr-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.q}</span>
                    {isOpen
                      ? <ChevronDown className={`w-4 h-4 flex-shrink-0 ${muted}`} />
                      : <ChevronRight className={`w-4 h-4 flex-shrink-0 ${muted}`} />
                    }
                  </button>
                  {isOpen && (
                    <div className={`px-5 pb-5 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                      <p className={`text-xs leading-relaxed pt-4 ${sub}`}>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 추가 문의 */}
            <div className={`rounded-2xl border p-5 text-center ${card}`}>
              <p className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>더 궁금한 점이 있으신가요?</p>
              <p className={`text-xs mb-3 ${sub}`}>엔터프라이즈 문의 및 기술 지원은 메일로 연락해주세요.</p>
              <a
                href="mailto:dongajul@dongajul.com?subject=동아줄 서비스 문의"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0B2F61] hover:bg-[#0d3875] transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                dongajul@dongajul.com
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
