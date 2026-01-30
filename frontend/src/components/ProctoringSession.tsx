// src/components/ProctoringSession.tsx (Обновленный)

// ... импорты (useAIWorker, useSmartRecorder) ...
import { useEnvironmentMonitor } from '../hooks/useEnvironmentMonitor';

export const ProctoringSession: React.FC = () => {
    // ... (код видео и AI) ...

    // Единый обработчик нарушений
    const handleViolation = useCallback(async (type: string, contextData: any = {}) => {
        console.warn(`🚨 VIOLATION: ${type}`, contextData);

        // Логика "мягких" и "жестких" нарушений
        const isCritical = ['MULTIPLE_FACES', 'FACE_MISSING'].includes(type);
        const isSoft = ['CLIPBOARD_ATTEMPT', 'FOCUS_LOSS'].includes(type);

        // Для буфера обмена видео можно не писать, просто лог
        if (type === 'CLIPBOARD_ATTEMPT') {
             await api.post('/log-event', { type, ...contextData });
             return; 
        }

        // Для остальных триггерим запись видеодоказательства
        if (!isUploadingRef.current) {
            isUploadingRef.current = true;
            try {
                // Захватываем видео (если это AI нарушение или переключение вкладки)
                const videoBlob = await captureViolation(); 
                
                const formData = new FormData();
                formData.append('violation_type', type);
                formData.append('meta', JSON.stringify(contextData));
                formData.append('file', videoBlob, `${type}_${Date.now()}.webm`);
                
                await api.post('/report-violation', formData);
            } finally {
                isUploadingRef.current = false;
            }
        }
    }, [captureViolation]);

    // Подключаем монитор среды
    const { enterFullscreen } = useEnvironmentMonitor(
        (type, details) => handleViolation(type, { details }) 
    );

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            {/* Кнопка старта для Fullscreen (браузер требует жест пользователя) */}
            <div className="absolute top-4 left-4 z-50">
                <button 
                    onClick={enterFullscreen}
                    className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                >
                    🖥️ Go Fullscreen
                </button>
            </div>

            {/* Видео контейнер */}
            <div className="relative flex-grow flex justify-center items-center">
                <video ref={videoRef} className="..." />
                {/* Оверлеи предупреждений */}
            </div>
        </div>
    );
};