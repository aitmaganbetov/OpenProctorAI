// Это запускается в отдельном потоке
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let faceLandmarker;
let lastVideoTime = -1;

// Инициализация WASM
self.onmessage = async (e) => {
  if (e.data.action === "INIT") {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "face_landmarker.task",
        delegate: "GPU" // Используем WebGL
      },
      runningMode: "VIDEO",
      numFaces: 2 
    });
    postMessage({ status: "READY" });
  }
  
  if (e.data.action === "PROCESS_FRAME") {
    const { imageBitmap, timestamp } = e.data;
    if (timestamp > lastVideoTime) {
       const result = faceLandmarker.detectForVideo(imageBitmap, timestamp);
       analyzeResult(result); // Ваша функция анализа
       lastVideoTime = timestamp;
    }
  }
};

function analyzeResult(result) {
  // 1. Проверка наличия лица
  if (result.faceLandmarks.length === 0) {
     postMessage({ type: "VIOLATION", kind: "FACE_MISSING" });
     return;
  }
  
  // 2. Проверка количества лиц
  if (result.faceLandmarks.length > 1) {
     postMessage({ type: "VIOLATION", kind: "MULTIPLE_FACES" });
     return;
  }

  // 3. Расчет углов поворота головы (Pitch, Yaw, Roll)
  // Это математика на основе 3D координат landmarks
  const { yaw, pitch } = calculateHeadPose(result.faceLandmarks[0]);
  
  if (Math.abs(yaw) > 30 || Math.abs(pitch) > 25) {
      postMessage({ type: "VIOLATION", kind: "GAZE_AWAY" });
  }
}