export function SubscriptionPage() {
  return (
    <div className="p-10 flex justify-center">
      <div className="w-[350px] p-6 rounded-2xl shadow-xl border">
        <h2 className="text-xl font-bold mb-4">프리미엄 구독</h2>

        <p className="text-gray-500 mb-6">
          더 많은 분석 기능과 AI 사용량 확장
        </p>

        <div className="text-3xl font-bold mb-6">
          ₩9,900 / 월
        </div>

        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">
          구독하기
        </button>
      </div>
    </div>
  );
}