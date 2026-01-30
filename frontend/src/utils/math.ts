// src/utils/math.ts
import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Константы порогов (можно вынести в конфиг экзамена)
const YAW_THRESHOLD = 0.25; // ~30 градусов
const PITCH_THRESHOLD = 0.20; // ~20 градусов

export type HeadPose = {
    yaw: number;   // < 0 (влево), > 0 (вправо)
    pitch: number; // < 0 (вниз), > 0 (вверх)
    roll: number;  // Наклон головы к плечу
    isLookingAway: boolean;
};

export const calculateHeadPose = (landmarks: NormalizedLandmark[]): HeadPose => {
    // Безопасность: проверяем наличие точек
    if (!landmarks || landmarks.length < 468) {
        return { yaw: 0, pitch: 0, roll: 0, isLookingAway: false };
    }

    const nose = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const topHead = landmarks[10];
    const chin = landmarks[152];

    // --- Расчет YAW (Вправо/Влево) ---
    // Вычисляем ширину лица
    const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
    // Вычисляем центр между скулами
    const midPointX = (rightCheek.x + leftCheek.x) / 2;
    // Нормализованное отклонение носа от центра (-0.5 ... 0.5)
    // Делим на ширину, чтобы не зависеть от приближения к камере
    const yaw = (nose.x - midPointX) / faceWidth;

    // --- Расчет PITCH (Вверх/Вниз) ---
    const faceHeight = Math.abs(chin.y - topHead.y);
    const midPointY = (chin.y + topHead.y) / 2;
    const pitch = (nose.y - midPointY) / faceHeight;
    
    // --- Расчет ROLL (Наклон к плечам) ---
    // atan2 разницы Y и X между скулами
    const roll = Math.atan2(rightCheek.y - leftCheek.y, rightCheek.x - leftCheek.x);

    // --- Детекция нарушения ---
    // Используем абсолютные значения для простоты порогов
    const isLookingAway = Math.abs(yaw) > YAW_THRESHOLD || Math.abs(pitch) > PITCH_THRESHOLD;

    return { yaw, pitch, roll, isLookingAway };
};