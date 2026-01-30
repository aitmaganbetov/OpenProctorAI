// src/utils/SmartRecorder.ts

export class SmartRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private readonly bufferSize: number; // Сколько секунд храним "до"
  private isCapturingViolation: boolean = false;
  private onViolationCaptured: ((blob: Blob) => void) | null = null;
  
  // Таймер для записи "хвоста" после нарушения
  private violationTailCounter: number = 0; 
  private readonly tailDuration: number = 10; // Сколько секунд писать "после"

  constructor(stream: MediaStream, bufferDurationSec: number = 15) {
    this.bufferSize = bufferDurationSec;
    
    // Выбираем лучший кодек: VP9 (эффективный) -> VP8 -> H264
    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ].find(type => MediaRecorder.isTypeSupported(type)) || '';

    if (!mimeType) {
      console.error("No supported mime type found for MediaRecorder");
      return;
    }

    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 500000 // 500 kbps - баланс качества и веса
      });
    } catch (e) {
      console.error("MediaRecorder init failed", e);
    }

    if (this.mediaRecorder) {
      // Самое важное: timeslice обработчик
      this.mediaRecorder.ondataavailable = (event) => this.handleDataAvailable(event);
    }
  }

  start() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      // timeslice = 1000ms. Браузер будет отдавать Blob каждую секунду
      this.mediaRecorder.start(1000); 
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.chunks = [];
  }

  private handleDataAvailable(event: BlobEvent) {
    if (event.data.size === 0) return;

    this.chunks.push(event.data);

    // Логика состояний
    if (this.isCapturingViolation) {
      // Если пишем нарушение — копим "хвост"
      this.violationTailCounter--;
      
      if (this.violationTailCounter <= 0) {
        this.finishViolationCapture();
      }
    } else {
      // Обычный режим: держим буфер фиксированного размера
      if (this.chunks.length > this.bufferSize) {
        this.chunks.shift(); // Удаляем самую старую секунду
      }
    }
  }

  // Вызывается из React при сигнале от AI
  public triggerViolation(callback: (blob: Blob) => void) {
    // Если уже пишем нарушение, игнорируем (или можно продлевать таймер)
    if (this.isCapturingViolation) return;

    console.log("🎥 VIOLATION TRIGGERED: Recording tail...");
    this.isCapturingViolation = true;
    this.violationTailCounter = this.tailDuration; // Пишем еще N секунд
    this.onViolationCaptured = callback;
  }

  private finishViolationCapture() {
    console.log("📦 Packaging violation video...");
    
    // Склеиваем все накопленные чанки
    const fullBlob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType });
    
    // Отдаем наружу
    if (this.onViolationCaptured) {
      this.onViolationCaptured(fullBlob);
    }

    // Сброс состояния
    this.isCapturingViolation = false;
    this.onViolationCaptured = null;
    
    // ВАЖНО: После сброса мы должны оставить в буфере последние N секунд, 
    // чтобы если через 5 секунд случится новое нарушение, у нас был контекст.
    // Оставляем последние bufferSize элементов.
    if (this.chunks.length > this.bufferSize) {
      this.chunks = this.chunks.slice(-this.bufferSize);
    }
  }
}