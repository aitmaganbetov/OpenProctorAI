// @ts-nocheck
// src/workers/ai.worker.ts
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { calculateHeadPose } from "../utils/math";

let faceLandmarker: FaceLandmarker | null = null;
let lastVideoTime = -1;

// Настройки гистерезиса (временного лага)
const VIOLATION_DURATION_MS = 2000; // Студент должен смотреть в сторону 2 секунды, чтобы засчитать
let violationStartTime: number | null = null;

self.onmessage = async (e: MessageEvent) => {
    const { action, payload } = e.data;

    switch (action) {
        case "INIT":
            await initializeModel();
            postMessage({ type: "STATUS", payload: "READY" });
            break;

        case "PROCESS_FRAME":
            if (faceLandmarker) {
                detect(payload.frame, payload.timestamp);
            }
            break;
    }
};

async function initializeModel() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU" // Используем WebGL в воркере
        },
        runningMode: "VIDEO",
        numFaces: 2, // Детектим до 2 лиц (чтобы поймать "помощника")
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
    });
}

function detect(frame: ImageBitmap, timestamp: number) {
    if (timestamp <= lastVideoTime) return;
    lastVideoTime = timestamp;

    const result = faceLandmarker!.detectForVideo(frame, timestamp);
    
    // Освобождаем память ImageBitmap сразу после использования
    frame.close(); 

    // 1. Проверка: Лица нет вообще
    if (result.faceLandmarks.length === 0) {
        handleViolation("FACE_MISSING", timestamp);
        return;
    }

    // 2. Проверка: Второе лицо в кадре
    if (result.faceLandmarks.length > 1) {
        handleViolation("MULTIPLE_FACES", timestamp);
        return;
    }

    // 3. Проверка: Взгляд
    const pose = calculateHeadPose(result.faceLandmarks[0]);
    
    // Отправляем сырые данные для отладочной отрисовки на UI (зеленые линии на лице)
    postMessage({ type: "DEBUG_DRAW", payload: { landmarks: result.faceLandmarks[0], pose } });

    if (pose.isLookingAway) {
        handleViolation("GAZE_AWAY", timestamp);
    } else {
        resetViolation();
    }
}

// Логика "накопления" нарушения
function handleViolation(type: string, timestamp: number) {
    const now = performance.now();
    
    if (!violationStartTime) {
        violationStartTime = now;
    }

    // Если нарушение длится дольше порога
    if (now - violationStartTime > VIOLATION_DURATION_MS) {
        postMessage({ 
            type: "VIOLATION", 
            payload: { 
                type, 
                timestamp, // Таймстамп видео
                confidence: 1.0 // Тут можно добавить логику уверенности
            } 
        });
        // Не сбрасываем violationStartTime, чтобы события шли потоком, пока он не вернется
        // Или можно сделать throttle (отправлять раз в 5 сек)
    }
}

function resetViolation() {
    violationStartTime = null;
    postMessage({ type: "CLEAN" });
}