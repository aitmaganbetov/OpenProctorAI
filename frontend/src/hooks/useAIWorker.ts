// src/hooks/useAIWorker.ts
import { useEffect, useRef, useState, useCallback } from 'react';

export const useAIWorker = (videoRef?: React.RefObject<HTMLVideoElement>) => {
    const workerRef = useRef<Worker | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [violation, setViolation] = useState<any>(null);
    const [currentPose, setCurrentPose] = useState<{ yaw: number; pitch: number } | null>(null);
    const requestRef = useRef<number>();

    useEffect(() => {
        // Инициализация воркера
        workerRef.current = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), {
            type: 'module' // Важно для Vite/Webpack
        });

        workerRef.current.onmessage = (event) => {
            const { type, payload } = event.data;
            if (type === 'STATUS' && payload === 'READY') setIsReady(true);
            if (type === 'VIOLATION') setViolation(payload);
            if (type === 'CLEAN') setViolation(null);
            if (type === 'POSE') setCurrentPose(payload);
            // DEBUG_DRAW можно прокинуть в Canvas overlay
        };

        workerRef.current.postMessage({ action: 'INIT' });

        return () => workerRef.current?.terminate();
    }, []);

    const sendFrame = useCallback(() => {
        if (!videoRef?.current || !isReady || videoRef.current.paused) return;
        
        // Важно: createImageBitmap асинхронен и быстр, не блокирует UI
        // Он создает снимок видео, который можно безопасно передать в воркер (Zero-copy transferable)
        createImageBitmap(videoRef.current).then((bitmap) => {
            workerRef.current?.postMessage({
                action: 'PROCESS_FRAME',
                payload: {
                    frame: bitmap,
                    timestamp: performance.now()
                }
            }, [bitmap]); // Передаем владение объектом bitmap в воркер
        });

        requestRef.current = requestAnimationFrame(sendFrame);
    }, [isReady, videoRef]);

    const startProcessing = () => {
        requestRef.current = requestAnimationFrame(sendFrame);
    };

    const stopProcessing = () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    return { isReady, violation, currentPose, startProcessing, stopProcessing };
};