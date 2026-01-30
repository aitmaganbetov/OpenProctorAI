import React, { useRef, useState, useEffect } from 'react';
import api from '../services/api';

interface ProfileSetupProps {
  studentId: number;
  onComplete: (profilePhotoBase64: string) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({
  studentId,
  onComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        console.log('[PROFILE] Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        console.log('[PROFILE] Camera stream obtained:', stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('[PROFILE] Video element connected to stream');
          videoRef.current.onloadedmetadata = () => {
            console.log('[PROFILE] Video metadata loaded');
            setCameraActive(true);
          };
        }
      } catch (err) {
        const errorMessage = 'Unable to access camera. Please check permissions.';
        setError(errorMessage);
        console.error('[PROFILE] Camera error:', err);
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
      console.error('[PROFILE] Missing video or canvas reference');
      return;
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) {
      console.error('[PROFILE] Could not get canvas context');
      return;
    }

    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    console.log('[PROFILE] Video dimensions:', { videoWidth, videoHeight });

    if (videoWidth === 0 || videoHeight === 0) {
      setError('Camera is still loading. Please wait a moment and try again.');
      return;
    }

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    const photoData = canvasRef.current.toDataURL('image/jpeg', 0.9);
    console.log('[PROFILE] Photo captured, data URL length:', photoData.length);
    setCapturedPhoto(photoData);
  };

  const submitPhoto = async () => {
    if (!capturedPhoto) {
      setError('Please capture a photo first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert data URL to base64 string
      const base64String = capturedPhoto.split(',')[1];

      console.log('[PROFILE] Uploading profile photo for student:', studentId);
      await api.uploadStudentPhoto(studentId, base64String);

      console.log('[PROFILE] Profile photo uploaded successfully');
      setUploadSuccess(true);

      // Show success message for 2 seconds, then proceed
      setTimeout(() => {
        onComplete(base64String);
      }, 2000);
    } catch (err: any) {
      console.error('[PROFILE] Upload failed:', err);
      setError(err.message || 'Failed to upload profile photo');
    } finally {
      setLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setCameraActive(true);
    setUploadSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-amber-900/30 border border-amber-700 rounded-full mb-4">
            <p className="text-amber-400 text-sm font-medium">👤 Profile Setup</p>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Create Your Profile</h1>
          <p className="text-gray-400">
            Take a clear photo of yourself. This will be used to verify your identity during exams.
          </p>
        </div>

        {/* Camera/Photo Display */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
          {/* Hidden canvas */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

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
              alt="Profile Photo"
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

        {/* Success Message */}
        {uploadSuccess && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <p className="text-green-400 font-medium">Profile photo saved successfully!</p>
                <p className="text-sm text-green-300">Proceeding to exam selection...</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!capturedPhoto && (
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-blue-300 text-center">
              📷 Make sure you're in a well-lit area with your face clearly visible
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {!capturedPhoto ? (
            <button
              onClick={capturePhoto}
              disabled={!cameraActive || loading}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              📸 Capture Photo
            </button>
          ) : (
            <>
              <button
                onClick={retakePhoto}
                disabled={loading || uploadSuccess}
                className="px-6 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Retake
              </button>
              <button
                onClick={submitPhoto}
                disabled={loading || uploadSuccess}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Uploading...
                  </>
                ) : uploadSuccess ? (
                  '✓ Profile Saved'
                ) : (
                  '✓ Save Profile'
                )}
              </button>
            </>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 p-4 bg-slate-700/50 rounded-lg border border-slate-600 text-center">
          <p className="text-sm text-gray-400">
            🔒 Your profile photo is encrypted and stored securely for exam verification only
          </p>
        </div>
      </div>
    </div>
  );
};
