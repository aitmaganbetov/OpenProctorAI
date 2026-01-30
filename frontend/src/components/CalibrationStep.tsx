import React, { useState, FC } from 'react';
import { useAIWorker } from '../hooks/useAIWorker';

// Точки для калибровки (CSS координаты)
const POINTS = [
  { id: 'center', top: '50%', left: '50%' },
  { id: 'tl', top: '10%', left: '10%' }, // Top-Left
  { id: 'tr', top: '10%', left: '90%' },
  { id: 'bl', top: '90%', left: '10%' },
  { id: 'br', top: '90%', left: '90%' },
];

interface CalibrationStepProps {
  onComplete: (config: any) => void;
}

export const CalibrationStep: FC<CalibrationStepProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [calibrationData, setCalibrationData] = useState<{yaw: number[], pitch: number[]}>({ yaw: [], pitch: [] });
  const { currentPose } = useAIWorker();

  const capturePoint = () => {
    if (!currentPose) return;

    // Сохраняем текущие углы
    const newYaw = [...calibrationData.yaw, currentPose.yaw];
    const newPitch = [...calibrationData.pitch, currentPose.pitch];
    
    setCalibrationData({ yaw: newYaw, pitch: newPitch });

    if (step < POINTS.length - 1) {
      setStep(step + 1);
    } else {
      finishCalibration(newYaw, newPitch);
    }
  };

  const finishCalibration = (yaws: number[], pitches: number[]) => {
    // Вычисляем границы экрана для конкретного пользователя
    // Добавляем 20% толерантности (padding), чтобы не было ложных срабатываний на краях
    const minYaw = Math.min(...yaws) * 1.2;
    const maxYaw = Math.max(...yaws) * 1.2;
    const minPitch = Math.min(...pitches) * 1.2; // Обычно взгляд вверх
    const maxPitch = Math.max(...pitches) * 1.2; // Обычно взгляд вниз

    const config = {
      limits: { minYaw, maxYaw, minPitch, maxPitch },
      isCalibrated: true
    };
    
    console.log("Calibration Result:", config);
    onComplete(config);
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 text-white overflow-hidden">
      <h2 className="text-center mt-10 text-xl">
        Калибровка взгляда ({step + 1}/{POINTS.length})
      </h2>
      <p className="text-center text-gray-400">
        Посмотрите на красную точку и нажмите Пробел (или кликните)
      </p>

      {/* Calibration Dot */}
      <div 
        className="absolute w-8 h-8 bg-red-500 rounded-full cursor-pointer transition-all duration-500 border-4 border-white shadow-[0_0_15px_rgba(255,0,0,0.8)]"
        style={{ top: POINTS[step].top, left: POINTS[step].left }}
        onClick={capturePoint}
      />
      
      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 font-mono text-xs text-green-400">
        Current: Yaw {currentPose?.yaw.toFixed(3)} | Pitch {currentPose?.pitch.toFixed(3)}
      </div>
    </div>
  );
};