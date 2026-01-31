// src/hooks/useAIWorker.ts
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

export interface Pose {
  yaw: number;
  pitch: number;
}

export interface ViolationData {
  type: string;
  confidence?: number;
  timestamp?: number;
}

interface AIWorkerState {
  isReady: boolean;
  violation: ViolationData | null;
  currentPose: Pose | null;
}

/**
 * Hook for managing AI worker that processes video frames for proctoring.
 * Uses Web Workers to avoid blocking the main thread.
 */
export const useAIWorker = (videoRef?: React.RefObject<HTMLVideoElement>) => {
  const workerRef = useRef<Worker | null>(null);
  const requestRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  const [state, setState] = useState<AIWorkerState>({
    isReady: false,
    violation: null,
    currentPose: null,
  });

  // Initialize worker
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/ai.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'STATUS':
          if (payload === 'READY') {
            setState((prev) => ({ ...prev, isReady: true }));
          }
          break;
        case 'VIOLATION':
          setState((prev) => ({ ...prev, violation: payload }));
          break;
        case 'CLEAN':
          setState((prev) => ({ ...prev, violation: null }));
          break;
        case 'POSE':
          setState((prev) => ({ ...prev, currentPose: payload }));
          break;
      }
    };

    worker.onerror = (error) => {
      console.error('AI Worker error:', error);
    };

    worker.postMessage({ action: 'INIT' });
    workerRef.current = worker;

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Frame processing loop
  const sendFrame = useCallback(() => {
    const video = videoRef?.current;
    const worker = workerRef.current;

    if (!video || !worker || !state.isReady || video.paused || isProcessingRef.current) {
      requestRef.current = requestAnimationFrame(sendFrame);
      return;
    }

    isProcessingRef.current = true;

    // Create bitmap asynchronously (doesn't block UI)
    createImageBitmap(video)
      .then((bitmap) => {
        worker.postMessage(
          {
            action: 'PROCESS_FRAME',
            payload: {
              frame: bitmap,
              timestamp: performance.now(),
            },
          },
          [bitmap] // Transfer ownership for zero-copy
        );
      })
      .catch((error) => {
        console.error('Failed to create image bitmap:', error);
      })
      .finally(() => {
        isProcessingRef.current = false;
      });

    requestRef.current = requestAnimationFrame(sendFrame);
  }, [state.isReady, videoRef]);

  const startProcessing = useCallback(() => {
    if (!requestRef.current) {
      requestRef.current = requestAnimationFrame(sendFrame);
    }
  }, [sendFrame]);

  const stopProcessing = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const clearViolation = useCallback(() => {
    setState((prev) => ({ ...prev, violation: null }));
  }, []);

  return useMemo(
    () => ({
      isReady: state.isReady,
      violation: state.violation,
      currentPose: state.currentPose,
      startProcessing,
      stopProcessing,
      clearViolation,
    }),
    [state.isReady, state.violation, state.currentPose, startProcessing, stopProcessing, clearViolation]
  );
};