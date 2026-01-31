// src/hooks/useSmartRecorder.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import { SmartRecorder } from '../utils/SmartRecorder';

interface UseSmartRecorderOptions {
  bufferDurationSec?: number;
}

interface UseSmartRecorderReturn {
  isRecording: boolean;
  captureViolation: () => Promise<Blob>;
  error: Error | null;
}

/**
 * Hook for smart video recording with rolling buffer.
 * Maintains a buffer of recent footage and captures violations on demand.
 */
export const useSmartRecorder = (
  stream: MediaStream | null,
  options: UseSmartRecorderOptions = {}
): UseSmartRecorderReturn => {
  const recorderRef = useRef<SmartRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!stream) {
      recorderRef.current = null;
      setIsRecording(false);
      return;
    }

    try {
      const recorder = new SmartRecorder(stream, options.bufferDurationSec);
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setError(null);

      console.log('✅ Smart Recorder started');
    } catch (err) {
      console.error('Failed to initialize SmartRecorder:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize recorder'));
    }

    return () => {
      recorderRef.current?.stop();
      recorderRef.current = null;
      setIsRecording(false);
    };
  }, [stream, options.bufferDurationSec]);

  const captureViolation = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = recorderRef.current;

      if (!recorder) {
        reject(new Error('Recorder not initialized'));
        return;
      }

      try {
        recorder.triggerViolation((blob) => {
          resolve(blob);
        });
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  return { isRecording, captureViolation, error };
};