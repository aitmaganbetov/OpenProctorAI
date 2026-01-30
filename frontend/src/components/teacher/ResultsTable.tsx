// src/components/teacher/ResultsTable.tsx

const getRiskBadge = (score: number) => {
  if (score >= 75) return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold">High ({score})</span>;
  if (score >= 40) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold">Medium ({score})</span>;
  return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">Low ({score})</span>;
};

export const ResultsTable: React.FC<{ sessions: any[] }> = ({ sessions }) => {
  // Сортировка: самые подозрительные сверху
  const sortedSessions = [...sessions].sort((a, b) => b.ai_risk_score - a.ai_risk_score);

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="py-3 px-6 text-left">Студент</th>
            <th className="py-3 px-6 text-left">Статус</th>
            <th className="py-3 px-6 text-left">Риск (AI)</th>
            <th className="py-3 px-6 text-left">Вердикт AI</th>
            <th className="py-3 px-6 text-center">Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedSessions.map((session) => (
            <tr key={session.id} className="border-b hover:bg-gray-50 transition">
              <td className="py-4 px-6 font-medium">{session.student_name}</td>
              <td className="py-4 px-6">
                {session.status === 'reviewed' ? '✅ Готов' : '⏳ Анализ...'}
              </td>
              <td className="py-4 px-6">
                {getRiskBadge(session.ai_risk_score)}
              </td>
              <td className="py-4 px-6 text-sm text-gray-600 max-w-xs truncate">
                {session.ai_verdict_text}
              </td>
              <td className="py-4 px-6 text-center">
                <button 
                  onClick={() => openDetailModal(session.id)}
                  className="text-blue-600 hover:text-blue-900 font-semibold"
                >
                  Обзор
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};