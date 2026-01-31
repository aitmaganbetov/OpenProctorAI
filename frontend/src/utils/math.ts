// src/utils/math.ts
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Detection thresholds (can be configured per exam)
const YAW_THRESHOLD = 0.25; // ~30 degrees
const PITCH_THRESHOLD = 0.20; // ~20 degrees

// Key landmark indices for head pose estimation
const LANDMARKS = {
  NOSE: 1,
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454,
  TOP_HEAD: 10,
  CHIN: 152,
  MIN_REQUIRED: 468,
} as const;

export interface HeadPose {
  /** Horizontal rotation: < 0 (left), > 0 (right) */
  yaw: number;
  /** Vertical rotation: < 0 (down), > 0 (up) */
  pitch: number;
  /** Tilt towards shoulder */
  roll: number;
  /** Whether the user is looking away from screen */
  isLookingAway: boolean;
}

const DEFAULT_POSE: HeadPose = {
  yaw: 0,
  pitch: 0,
  roll: 0,
  isLookingAway: false,
};

/**
 * Calculate head pose from facial landmarks.
 * Uses geometric relationships between key facial points to estimate orientation.
 *
 * @param landmarks - Array of normalized facial landmarks from MediaPipe
 * @returns Head pose estimation with yaw, pitch, roll, and looking-away flag
 */
export const calculateHeadPose = (landmarks: NormalizedLandmark[]): HeadPose => {
  // Validate landmark array
  if (!landmarks || landmarks.length < LANDMARKS.MIN_REQUIRED) {
    return DEFAULT_POSE;
  }

  const nose = landmarks[LANDMARKS.NOSE];
  const leftCheek = landmarks[LANDMARKS.LEFT_CHEEK];
  const rightCheek = landmarks[LANDMARKS.RIGHT_CHEEK];
  const topHead = landmarks[LANDMARKS.TOP_HEAD];
  const chin = landmarks[LANDMARKS.CHIN];

  // Calculate face dimensions (used for normalization)
  const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
  const faceHeight = Math.abs(chin.y - topHead.y);

  // Avoid division by zero
  if (faceWidth === 0 || faceHeight === 0) {
    return DEFAULT_POSE;
  }

  // === YAW (Left/Right) ===
  // Normalized nose offset from cheek midpoint
  const midPointX = (rightCheek.x + leftCheek.x) / 2;
  const yaw = (nose.x - midPointX) / faceWidth;

  // === PITCH (Up/Down) ===
  // Normalized nose offset from vertical center
  const midPointY = (chin.y + topHead.y) / 2;
  const pitch = (nose.y - midPointY) / faceHeight;

  // === ROLL (Tilt) ===
  // Angle between cheeks
  const roll = Math.atan2(
    rightCheek.y - leftCheek.y,
    rightCheek.x - leftCheek.x
  );

  // === Detection ===
  const isLookingAway =
    Math.abs(yaw) > YAW_THRESHOLD || Math.abs(pitch) > PITCH_THRESHOLD;

  return { yaw, pitch, roll, isLookingAway };
};

/**
 * Convert radians to degrees.
 */
export const radToDeg = (rad: number): number => rad * (180 / Math.PI);

/**
 * Clamp a value between min and max.
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Linear interpolation between two values.
 */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * clamp(t, 0, 1);