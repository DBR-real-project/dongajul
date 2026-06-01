import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Target, Lightbulb, ArrowLeft } from 'lucide-react';

interface InsightDashboardProps {
  onBack: () => void;
}

// TODO: GET /api/stats 응답으로 교체
const categoryData: { name: string; value: number; color: string }[] = [];
const industryData: { industry: string; success: number; failure: number }[] = [];
const trendData: { year: string; success: number; failure: number }[] = [];
const successFactors: { factor: string; count: number }[] = [];
const failureFactors: { factor: string; count: number }[] = [];

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
            <div className="text-2xl mb-1 text-gray-900">-</div>
            <div className="text-xs text-gray-500">전체</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200 p-4">
          <div className="flex flex-col items-center">
            <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
            <div className="text-2xl mb-1 text-green-900">-</div>
            <div className="text-xs text-green-700">성공</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200 p-4">
          <div className="flex flex-col items-center">
            <TrendingDown className="w-6 h-6 text-red-600 mb-2" />
            <div className="text-2xl mb-1 text-red-900">-</div>
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
