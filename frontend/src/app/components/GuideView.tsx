import { Bell, Clock, User, BookOpen, Play, FileText, HelpCircle } from 'lucide-react';
import { TabType } from '../App';

interface GuideViewProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
}

export function GuideView({ activeTab, onTabChange, onNotificationClick, onProfileClick }: GuideViewProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-8">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs sm:text-sm text-gray-500 mb-0.5">DBR 전략 리스크 분석</div>
              <h1 className="text-base sm:text-lg md:text-xl text-[#1e3a5f]">케인 가이드</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={onNotificationClick} className="p-2 text-gray-600 relative">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500"></span>
              </button>
              <button className="p-2 text-gray-600">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button onClick={onProfileClick} className="p-2 text-gray-600">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {(['dashboard', 'strategy', 'riskIndicators', 'guide'] as TabType[]).map((tab) => {
              const labels: Record<TabType, string> = {
                dashboard: '데이터분석',
                strategy: '전략 분석',
                riskIndicators: '리스크 지표',
                guide: '케인 가이드',
              };
              return (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'bg-[#142755] text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] p-6 sm:p-8 text-white mb-6">
          <div className="text-xs sm:text-sm text-gray-300 mb-2 tracking-wide">
            USER GUIDE & TUTORIALS
          </div>
          <h2 className="text-xl sm:text-2xl mb-3 leading-tight">
            DBR 분석 플랫폼<br />
            활용 가이드
          </h2>
          <p className="text-sm sm:text-base text-gray-300">
            효과적인 전략 수립과 리스크 관리를 위한 단계별 가이드
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-base sm:text-lg mb-3">시작하기</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          {[
            { Icon: Play, color: 'blue', step: '1', title: '플랫폼 소개', desc: 'DBR 분석 플랫폼의 주요 기능과 활용 방법 소개' },
            { Icon: BookOpen, color: 'green', step: '2', title: '데이터 분석 활용법', desc: '성공/실패 사례 검색 및 분석하는 방법' },
            { Icon: FileText, color: 'purple', step: '3', title: '전략 프레임워크 적용', desc: 'SWOT, 포터의 5 Forces 등 전략 도구 활용 가이드' },
            { Icon: HelpCircle, color: 'red', step: '4', title: '리스크 지표 해석', desc: '리스크 점수 및 지표를 읽고 활용하는 방법' },
          ].map(({ Icon, color, step, title, desc }) => (
            <div key={title} className="bg-white p-4 sm:p-5 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-600`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base mb-1">{step}. {title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">{desc}</p>
                  <button className="text-xs sm:text-sm text-[#142755] hover:underline">가이드 보기 →</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <h3 className="text-base sm:text-lg mb-3">자주 묻는 질문</h3>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-6">
          {[
            { q: '리스크 점수는 어떻게 계산되나요?', a: '24,580개 이상의 글로벌 기업 사례를 머신러닝 알고리즘으로 분석하여 재무, 운영, 시장, 규제 등 4개 카테고리의 리스크를 종합적으로 평가합니다. 0-10점 척도로 표시되며, 점수가 높을수록 리스크가 높음을 의미합니다.' },
            { q: '유사 사례는 어떤 기준으로 매칭되나요?', a: '산업군, 기업 규모, 전략 유형, 시장 환경 등 다차원 데이터를 기반으로 유사도를 계산합니다. AI 알고리즘이 귀사의 상황과 가장 유사한 성공/실패 사례를 자동으로 추천합니다.' },
            { q: '데이터는 얼마나 자주 업데이트되나요?', a: '하버드비즈니스리뷰(HBR), MIT Sloan, McKinsey 등 주요 비즈니스 저널의 사례를 주 단위로 업데이트하며, 리스크 지표는 실시간으로 갱신됩니다.' },
            { q: '분석 결과를 내보낼 수 있나요?', a: '프로 플랜 이상에서 PDF, Excel 형식으로 분석 리포트를 다운로드할 수 있으며, 팀원들과 공유 가능한 링크도 생성할 수 있습니다.' },
          ].map(({ q, a }) => (
            <details key={q} className="bg-white p-4 sm:p-5 border border-gray-200">
              <summary className="text-sm sm:text-base cursor-pointer">{q}</summary>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 pl-4">{a}</p>
            </details>
          ))}
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-indigo-50 p-5 sm:p-6 border-2 border-gray-300">
          <h3 className="text-sm sm:text-base mb-3 text-blue-900">빠른 도움말</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
            {[
              { label: '검색 팁', content: '산업명, 기업명, 전략 키워드로 검색 가능' },
              { label: '필터 활용', content: '성공/실패, 산업, 기간별로 사례 필터링' },
              { label: '알림 설정', content: '관심 산업의 새로운 사례 자동 알림' },
              { label: '북마크', content: '중요 사례는 북마크하여 나중에 확인' },
            ].map(({ label, content }) => (
              <li key={label} className="flex items-start gap-2">
                <span className="text-[#142755]">💡</span>
                <span><strong>{label}:</strong> {content}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600 mb-3">추가 도움이 필요하신가요?</p>
          <button className="bg-[#142755] text-white px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base hover:bg-[#444655] transition-colors">
            고객 지원팀에 문의하기
          </button>
        </div>
      </div>
    </div>
  );
}
