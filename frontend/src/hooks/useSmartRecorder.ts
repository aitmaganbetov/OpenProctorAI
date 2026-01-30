import { useEffect, useRef, useCallback } from 'react';
import { SmartRecorder } from '../utils/SmartRecorder';

export const useSmartRecorder = (stream: MediaStream | null) => {
  const recorderRef = useRef<SmartRecorder | null>(null);

  useEffect(() => {
    if (stream) {
      recorderRef.current = new SmartRecorder(stream);
      recorderRef.current.start();
      console.log("✅ Smart Recorder started");
    }

    return () => {
      recorderRef.current?.stop();
    };
  }, [stream]);

  const captureViolation = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!recorderRef.current) {
        reject("Recorder not initialized");
        return;
      }

      // Триггерим запись и ждем завершения (через 10 секунд)
      recorderRef.current.triggerViolation((blob) => {
        resolve(blob);
      });
    });
  }, []);

  return { captureViolation };
};