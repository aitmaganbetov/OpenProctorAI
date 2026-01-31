// src/utils/SmartRecorder.ts

type ViolationCallback = (blob: Blob) => void;

// Preferred video codecs in order of quality/compression efficiency
const PREFERRED_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
] as const;

const DEFAULT_BUFFER_DURATION_SEC = 15;
const DEFAULT_TAIL_DURATION_SEC = 10;
const DEFAULT_VIDEO_BITRATE = 500_000; // 500 kbps
const TIMESLICE_MS = 1000; // Emit data every second

/**
 * Smart video recorder with rolling buffer.
 * Maintains a buffer of recent footage and captures additional footage after violations.
 */
export class SmartRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private readonly bufferSize: number;
  private readonly tailDuration: number;
  private isCapturingViolation = false;
  private violationTailCounter = 0;
  private onViolationCaptured: ViolationCallback | null = null;
  private readonly mimeType: string;

  constructor(
    stream: MediaStream,
    bufferDurationSec: number = DEFAULT_BUFFER_DURATION_SEC,
    tailDurationSec: number = DEFAULT_TAIL_DURATION_SEC
  ) {
    this.bufferSize = bufferDurationSec;
    this.tailDuration = tailDurationSec;

    // Find supported codec
    const supportedType = PREFERRED_MIME_TYPES.find((type) =>
      MediaRecorder.isTypeSupported(type)
    );

    if (!supportedType) {
      console.error('No supported MIME type found for MediaRecorder');
      this.mimeType = '';
      return;
    }

    this.mimeType = supportedType;

    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedType,
        videoBitsPerSecond: DEFAULT_VIDEO_BITRATE,
      });

      this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this);
      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };
    } catch (error) {
      console.error('MediaRecorder initialization failed:', error);
    }
  }

  start(): void {
    if (this.mediaRecorder?.state === 'inactive') {
      this.mediaRecorder.start(TIMESLICE_MS);
    }
  }

  stop(): void {
    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder?.stop();
    }
    this.chunks = [];
    this.isCapturingViolation = false;
    this.onViolationCaptured = null;
  }

  /**
   * Trigger violation capture.
   * Will record additional footage after the trigger and return combined buffer.
   */
  triggerViolation(callback: ViolationCallback): void {
    if (this.isCapturingViolation) {
      console.warn('Already capturing a violation, ignoring trigger');
      return;
    }

    console.log('🎥 VIOLATION TRIGGERED: Recording tail...');
    this.isCapturingViolation = true;
    this.violationTailCounter = this.tailDuration;
    this.onViolationCaptured = callback;
  }

  private handleDataAvailable(event: BlobEvent): void {
    if (event.data.size === 0) return;

    this.chunks.push(event.data);

    if (this.isCapturingViolation) {
      this.violationTailCounter--;

      if (this.violationTailCounter <= 0) {
        this.finishViolationCapture();
      }
    } else {
      // Rolling buffer: remove oldest chunk when buffer is full
      while (this.chunks.length > this.bufferSize) {
        this.chunks.shift();
      }
    }
  }

  private finishViolationCapture(): void {
    console.log('📦 Packaging violation video...');

    const fullBlob = new Blob(this.chunks, {
      type: this.mimeType || 'video/webm',
    });

    // Reset state
    this.isCapturingViolation = false;
    this.chunks = [];

    // Invoke callback
    this.onViolationCaptured?.(fullBlob);
    this.onViolationCaptured = null;
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  get bufferDuration(): number {
    return this.chunks.length;
  }
}