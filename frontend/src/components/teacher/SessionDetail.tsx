// src/components/teacher/SessionDetail.tsx

export const SessionDetail: React.FC<{ session: any }> = ({ session }) => {
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  return (
    <div className="flex h-[80vh]">
      {/* Левая колонка: AI Отчет и Таймлайн */}
      <div className="w-1/3 border-r overflow-y-auto p-4 bg-gray-50">
        <div className="mb-6 p-4 bg-white rounded shadow-sm border-l-4 border-purple-500">
          <h3 className="font-bold text-gray-700">🧠 AI Analysis</h3>
          <p className="text-gray-600 mt-2 text-sm">{session.ai_verdict_text}</p>
        </div>

        <h4 className="font-bold mb-3">Хронология нарушений</h4>
        <div className="space-y-2">
          {session.violations.map((v: any, idx: number) => (
            <div 
              key={idx}
              onClick={() => setCurrentVideo(v.video_url)} // Клик загружает видео
              className={`
                p-3 rounded cursor-pointer border hover:bg-white hover:shadow transition
                ${currentVideo === v.video_url ? 'bg-white ring-2 ring-blue-400' : 'bg-gray-100'}
              `}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-red-600">{v.type}</span>
                <span className="text-xs text-gray-500">{new Date(v.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Confidence: {(v.confidence * 100).toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Правая колонка: Плеер */}
      <div className="w-2/3 p-6 flex flex-col items-center justify-center bg-black">
        {currentVideo ? (
          <video 
            src={currentVideo} 
            controls 
            autoPlay 
            className="max-w-full max-h-full rounded shadow-2xl"
          />
        ) : (
          <div className="text-gray-500 text-center">
            <p className="text-xl">Выберите нарушение из списка слева,</p>
            <p className="text-sm">чтобы просмотреть видеодоказательство</p>
          </div>
        )}
      </div>
    </div>
  );
};