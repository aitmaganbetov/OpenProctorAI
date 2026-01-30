import React, { useRef, useState, useEffect } from 'react';
import api from '../services/api';

interface PhotoCaptureProps {
  studentId: number;
  onPhotoCapture: (photoBase64: string) => Promise<void>;
  onComplete: () => void;
  onCancel: () => void;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  studentId,
  onPhotoCapture,
  onComplete,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean;
    confidence: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        console.log('[PHOTO] Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        console.log('[PHOTO] Camera stream obtained:', stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('[PHOTO] Video element connected to stream');
          // Wait for video to load
          videoRef.current.onloadedmetadata = () => {
            console.log('[PHOTO] Video metadata loaded, video is playing');
            setCameraActive(true);
          };
        }
      } catch (err) {
        const errorMessage = 'Unable to access camera. Please check permissions.';
        setError(errorMessage);
        console.error('[PHOTO] Camera error:', err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('[PHOTO] Missing video or canvas reference');
      return;
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) {
      console.error('[PHOTO] Could not get canvas context');
      return;
    }

    // Get the actual video dimensions
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    
    console.log('[PHOTO] Video dimensions:', { videoWidth, videoHeight });
    
    if (videoWidth === 0 || videoHeight === 0) {
      setError('Camera is still loading. Please wait a moment and try again.');
      console.error('[PHOTO] Video dimensions are 0');
      return;
    }

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    const photoData = canvasRef.current.toDataURL('image/jpeg', 0.9);
    console.log('[PHOTO] Photo captured, data URL length:', photoData.length);
    setCapturedPhoto(photoData);
  };

  const submitPhoto = async () => {
    if (!capturedPhoto) {
      setError('Please capture a photo first');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationStatus(null);

    try {
      // Convert data URL to base64 string
      const base64String = capturedPhoto.split(',')[1];
      
      console.log('[PHOTO] Uploading photo for student:', studentId);
      await onPhotoCapture(base64String);
      
      // Upload to API
      await api.uploadStudentPhoto(studentId, base64String);
      
      console.log('[PHOTO] Photo uploaded successfully, verifying identity...');
      
      // Verify photo matches profile
      const verificationResult = await api.verifyStudentPhoto(studentId, base64String);
      console.log('[PHOTO] Verification result:', verificationResult);
      
      setVerificationStatus({
        verified: verificationResult.verified,
        confidence: verificationResult.confidence,
        message: verificationResult.message,
      });
      
      if (verificationResult.verified) {
        console.log('[PHOTO] Identity verified successfully');
        setTimeout(() => {
          setCapturedPhoto(null);
          onComplete();
        }, 1500); // Show success message for 1.5 seconds
      } else {
        console.warn('[PHOTO] Identity verification failed:', verificationResult.message);
        setError(`Identity verification failed: ${verificationResult.message}`);
      }
    } catch (err: any) {
      console.error('[PHOTO] Upload/verification failed:', err);
      setError(err.message || 'Failed to upload and verify photo');
    } finally {
      setLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setCameraActive(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-blue-900/30 border border-blue-700 rounded-full mb-4">
            <p className="text-blue-400 text-sm font-medium">📸 Required for Exam Access</p>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Student Identification</h1>
          <p className="text-gray-400">Please capture a clear photo of yourself for identification verification before starting the exam</p>
        </div>

        {/* Camera/Photo Display */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
          {/* Hidden canvas - always present for capturing photos */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />

          {!capturedPhoto ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-96 object-cover bg-black"
              />
              {!cameraActive && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <p className="text-white text-center">Initializing camera...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-96 bg-black" />
          )}

          {/* Captured Photo Display */}
          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-96 object-cover"
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Verification Status */}
        {verificationStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${
            verificationStatus.verified
              ? 'bg-green-900/20 border-green-700'
              : 'bg-orange-900/20 border-orange-700'
          }`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {verificationStatus.verified ? '✅' : '⚠️'}
              </div>
              <div className="flex-1">
                <p className={verificationStatus.verified ? 'text-green-400' : 'text-orange-400'}>
                  {verificationStatus.message}
                </p>
                <p className={`text-sm mt-1 ${verificationStatus.verified ? 'text-green-300' : 'text-orange-300'}`}>
                  Match confidence: {(verificationStatus.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!capturedPhoto && (
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-blue-300 text-center">
              📷 Position yourself in front of the camera with good lighting and clear visibility of your face
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Cancel
          </button>

          {!capturedPhoto ? (
            <button
              onClick={capturePhoto}
              disabled={!cameraActive || loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              📸 Capture Photo
            </button>
          ) : (
            <>
              <button
                onClick={retakePhoto}
                disabled={loading}
                className="px-6 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Retake
              </button>
              <button
                onClick={submitPhoto}
                disabled={loading || !!verificationStatus?.verified}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Verifying identity...
                  </>
                ) : verificationStatus?.verified ? (
                  <>
                    <span>✓ Identity verified!</span>
                  </>
                ) : (
                  '✓ Confirm & Verify'
                )}
              </button>
            </>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 p-4 bg-slate-700/50 rounded-lg border border-slate-600 text-center">
          <p className="text-sm text-gray-400">
            🔒 Your photo is encrypted and stored securely for exam verification purposes only
          </p>
        </div>
      </div>
    </div>
  );
};
