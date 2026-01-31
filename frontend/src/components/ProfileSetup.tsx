import React, { useRef, useState, useEffect } from 'react';
import api from '../services/api';
import LanguageSwitcher from './ui/LanguageSwitcher';
import MirrorToggle from './ui/MirrorToggle';
import ThemeToggle from './ui/ThemeToggle';

interface ProfileSetupProps {
  studentId: number;
  onComplete: (profilePhotoBase64: string) => void;
}

// Minimal translations (adapted for teacher UI)
const translations: Record<string, Record<string, string>> = {
  en: {
    profileSetup: 'Profile Setup',
    createProfile: 'Create Your Profile',
    instructions: 'Take a clear photo of yourself. This will be used to verify your identity during exams.',
    capture: 'Capture Photo',
    retake: 'Retake',
    save: 'Save Profile',
    uploading: 'Uploading...',
    saved: 'Profile photo saved',
    initializing: 'Initializing camera...',
    cameraError: 'Unable to access camera. Check permissions.',
    privacy: 'Your profile photo is encrypted and stored securely for exam verification only',
  },
  ru: {
    profileSetup: 'Настройка профиля',
    createProfile: 'Создайте профиль',
    instructions: 'Сфотографируйтесь. Фото будет использовано для проверки личности на экзамене.',
    capture: 'Сделать фото',
    retake: 'Повторить',
    save: 'Сохранить профиль',
    uploading: 'Загрузка...',
    saved: 'Фото сохранено',
    initializing: 'Инициализация камеры...',
    cameraError: 'Невозможно получить доступ к камере. Проверьте разрешения.',
    privacy: 'Ваше фото шифруется и хранится безопасно только для проверки на экзамене',
  }
};

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ studentId, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [lang, setLang] = useState<'en'|'ru'>('ru');
  const [mirror, setMirror] = useState(true);

  const t = (k: string) => translations[lang][k] || k;

  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!mounted) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCameraActive(true);
        }
      } catch (err) {
        console.error('[ProfileSetup] camera error', err);
        setError(t('cameraError'));
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [lang]);

  const capturePhoto = () => {
    setError(null);
    if (!videoRef.current || !canvasRef.current) return setError('Internal error');
    const vw = videoRef.current.videoWidth;
    const vh = videoRef.current.videoHeight;
    if (vw === 0 || vh === 0) return setError(t('initializing'));

    canvasRef.current.width = vw;
    canvasRef.current.height = vh;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return setError('Canvas not available');

    if (mirror) {
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, vw, vh);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      ctx.drawImage(videoRef.current, 0, 0, vw, vh);
    }

    const data = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(data);
  };

  const submitPhoto = async () => {
    if (!capturedPhoto) return setError('No photo');
    setLoading(true);
    setError(null);
    try {
      const base64 = capturedPhoto.split(',')[1];
      await api.uploadStudentPhoto(studentId, base64);
      setUploadSuccess(true);
      setTimeout(() => onComplete(base64), 1400);
    } catch (err: any) {
      console.error('[ProfileSetup] upload', err);
      setError(err?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
    setUploadSuccess(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{t('createProfile')}</h1>
            <p className="text-gray-400">{t('instructions')}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher lang={lang} setLang={(l) => setLang(l as 'ru'|'en')} isDark />
            <MirrorToggle mirror={mirror} setMirror={setMirror} />
            <ThemeToggle isDark={false} setIsDark={() => {}} />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
            <div className="bg-black rounded-xl overflow-hidden relative">
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {!capturedPhoto ? (
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-96 object-cover ${mirror ? 'scale-x-[-1]' : ''}`} />
              ) : (
                <img src={capturedPhoto} alt="captured" className="w-full h-96 object-cover" />
              )}
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">{t('initializing')}</div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              {!capturedPhoto ? (
                <button onClick={capturePhoto} disabled={!cameraActive || loading} className="px-5 py-3 bg-orange-500 text-white rounded-lg font-bold disabled:opacity-50">{t('capture')}</button>
              ) : (
                <>
                  <button onClick={retake} disabled={loading || uploadSuccess} className="px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700">{t('retake')}</button>
                  <button onClick={submitPhoto} disabled={loading || uploadSuccess} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">
                    {loading ? t('uploading') : uploadSuccess ? t('saved') : t('save')}
                  </button>
                </>
              )}
            </div>

            {error && <div className="mt-4 p-3 bg-red-900/20 text-red-400 rounded-lg">{error}</div>}
            {uploadSuccess && <div className="mt-4 p-3 bg-emerald-900/20 text-emerald-300 rounded-lg">{t('saved')}</div>}
          </div>

          <aside className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm text-slate-300">
            <h3 className="font-black mb-3 text-white">{t('profileSetup')}</h3>
            <p className="text-sm text-slate-400 mb-4">{t('privacy')}</p>
            <div className="flex flex-col gap-2">
              <div className="text-xs text-slate-400">Student ID</div>
              <div className="font-mono text-sm text-white p-2 bg-slate-800 rounded">{studentId}</div>
              <div className="mt-4">
                <button onClick={() => { if (capturedPhoto) navigator.clipboard.writeText(capturedPhoto); }} className="w-full py-2 rounded-lg border border-slate-700">Copy Preview Data</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
