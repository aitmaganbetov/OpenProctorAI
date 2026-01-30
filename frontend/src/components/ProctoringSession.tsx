import React, { useCallback, useRef } from 'react';
import { useEnvironmentMonitor } from '../hooks/useEnvironmentMonitor';
import api from '../services/api';

export const ProctoringSession: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isUploadingRef = useRef(false);

  const captureViolation = useCallback(async (): Promise<Blob> => {
    // Placeholder implementation
    return new Blob();
  }, []);

  const handleViolation = useCallback(
    async (type: string, contextData: any = {}) => {
      console.warn(`🚨 VIOLATION: ${type}`, contextData);

      // const isCritical = ['MULTIPLE_FACES', 'FACE_MISSING'].includes(type);
      // const isSoft = ['CLIPBOARD_ATTEMPT', 'FOCUS_LOSS'].includes(type);

      if (type === 'CLIPBOARD_ATTEMPT') {
        await api.post('/log-event', { type, ...contextData });
        return;
      }

      if (!isUploadingRef.current) {
        isUploadingRef.current = true;
        try {
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
    },
    [captureViolation]
  );

  const { enterFullscreen } = useEnvironmentMonitor(
    (type: string, details: any) => handleViolation(type, { details })
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={enterFullscreen}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          🖥️ Go Fullscreen
        </button>
      </div>

      <div className="relative flex-grow flex justify-center items-center">
        <video ref={videoRef} className="max-w-full max-h-full" />
      </div>
    </div>
  );
};