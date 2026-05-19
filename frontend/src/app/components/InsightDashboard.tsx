import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Target, Lightbulb, ArrowLeft } from 'lucide-react';

interface InsightDashboardProps {
  onBack: () => void;
}

const categoryData = [
  { name: '성공', value: 5, color: '#16a34a' },
  { name: '실패', value: 3, color: '#dc2626' }
];

const industryData = [
  { industry: '기술', success: 2, failure: 1 },
  { industry: '엔터테인먼트', success: 1, failure: 1 },
  { industry: '자동차', success: 1, failure: 0 },
  { industry: '모바일', success: 0, failure: 1 },
  { industry: '식음료', success: 1, failure: 0 },
  { industry: '클라우드', success: 1, failure: 0 }
];

const trendData = [
  { year: '2020', success: 8, failure: 5 },
  { year: '2021', success: 12, failure: 7 },
  { year: '2022', success: 15, failure: 6 },
  { year: '2023', success: 18, failure: 8 },
  { year: '2024', success: 22, failure: 7 },
  { year: '2025', success: 25, failure: 9 },
  { year: '2026', success: 5, failure: 3 }
];

const successFactors = [
  { factor: '데이터 기반 의사결정', count: 4 },
  { factor: '혁신적 비즈니스 모델', count: 3 },
  { factor: '고객 중심 전략', count: 5 },
  { factor: '수직 계열화', count: 2 },
  { factor: '생태계 구축', count: 3 }
];

const failureFactors = [
  { factor: '시장 변화 대응 실패', count: 3 },
  { factor: '기존 사업 고수', count: 2 },
  { factor: '혁신 지연', count: 2 },
  { factor: '조직 경직성', count: 1 }
];

export function InsightDashboard({ onBack }: InsightDashboardProps) {
  return (
    <div className="px-4 py-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 active:text-[#EA0029] transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span style={{ fontSize: '14px' }}>홈으로</span>
      </button>

      <div className="mb-6">
        <h1 className="mb-1 text-gray-900" style={{ fontSize: '20px' }}>인사이트 대시보드</h1>
        <p className="text-gray-600" style={{ fontSize: '13px' }}>성공과 실패 사례 분석</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col items-center">
            <Target className="w-6 h-6 text-[#EA0029] mb-2" />
            <div className="text-2xl mb-1 text-gray-900">8</div>
            <div className="text-xs text-gray-500">전체</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200 p-4">
          <div className="flex flex-col items-center">
            <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
            <div className="text-2xl mb-1 text-green-900">5</div>
            <div className="text-xs text-green-700">성공</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200 p-4">
          <div className="flex flex-col items-center">
            <TrendingDown className="w-6 h-6 text-red-600 mb-2" />
            <div className="text-2xl mb-1 text-red-900">3</div>
            <div className="text-xs text-red-700">실패</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="mb-3 text-gray-900" style={{ fontSize: '15px' }}>성공/실패 비율</h2>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="mb-3 text-gray-900" style={{ fontSize: '15px' }}>산업별 분포</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={industryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="industry" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="success" fill="#16a34a" name="성공" />
            <Bar dataKey="failure" fill="#dc2626" name="실패" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="mb-3 text-gray-900" style={{ fontSize: '15px' }}>연도별 추이</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="success" stroke="#16a34a" strokeWidth={2} name="성공" />
            <Line type="monotone" dataKey="failure" stroke="#dc2626" strokeWidth={2} name="실패" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h2 className="text-gray-900" style={{ fontSize: '15px' }}>성공 요인</h2>
        </div>
        <div className="space-y-2">
          {successFactors.map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-900">{item.factor}</span>
                <span className="px-2 py-0.5 bg-green-600 text-white rounded-full text-xs">
                  {item.count}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${(item.count / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-5 h-5 text-red-600" />
          <h2 className="text-gray-900" style={{ fontSize: '15px' }}>실패 요인</h2>
        </div>
        <div className="space-y-2">
          {failureFactors.map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-900">{item.factor}</span>
                <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-xs">
                  {item.count}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-red-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${(item.count / 3) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <h2 className="text-gray-900" style={{ fontSize: '15px' }}>핵심 인사이트</h2>
        </div>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border-l-4 border-green-600">
            <h3 className="mb-2 text-green-900" style={{ fontSize: '13px' }}>성공의 공통점</h3>
            <ul className="space-y-1 text-xs text-gray-700">
              <li>• 데이터 기반 의사결정</li>
              <li>• 고객 니즈 깊은 이해</li>
              <li>• 강점의 새로운 확장</li>
              <li>• 지속적 혁신 정신</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-3 border-l-4 border-red-600">
            <h3 className="mb-2 text-red-900" style={{ fontSize: '13px' }}>실패의 공통점</h3>
            <ul className="space-y-1 text-xs text-gray-700">
              <li>• 변화 인지 후 행동 지연</li>
              <li>• 기존 모델 과도한 집착</li>
              <li>• 조직 경직성과 저항</li>
              <li>• 기술 보유 사업화 실패</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
