import * as THREE from 'three';
import interUrl from '@fontsource/inter/files/inter-latin-500-normal.woff?url';
import interSemiUrl from '@fontsource/inter/files/inter-latin-600-normal.woff?url';
import interExtUrl from '@fontsource/inter/files/inter-latin-ext-600-normal.woff?url';
import chalkUrl from '@fontsource/cabin-sketch/files/cabin-sketch-latin-700-normal.woff?url';
import monoUrl from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff?url';

// Every tunable for motion, camera and the world path lives here.

/** Step choreography duration (s). Brief: 600–900ms per step. */
export const STEP_S = 0.8;
/** Camera fly between slides (s). camera-controls uses smoothTime, this is the input lock. */
export const SLIDE_S = 1.4;
/** camera-controls smoothTime (s). */
export const CAMERA_SMOOTH = 0.6;
/** Reduced-motion crossfade (s). */
export const REDUCED_FADE_S = 0.3;

/** Wheel: accumulated |deltaY| px that counts as one deliberate gesture. */
export const WHEEL_THRESHOLD = 60;
/** Wheel: lockout after a step fires (ms). Extended while inertia events keep arriving. */
export const WHEEL_COOLDOWN_MS = 700;
/** Wheel: quiet gap that ends a trackpad gesture (ms). */
export const WHEEL_GESTURE_GAP_MS = 160;
/** Touch: min swipe distance (px). */
export const SWIPE_PX = 50;

/** Limited orbit once a transition ends (radians). */
export const ORBIT_LIMIT = THREE.MathUtils.degToRad(20);

/**
 * Distance between slide stations along the path. Must exceed the widest slide (slide 18's five
 * attack zones span ~63 units) plus the fog's far range, or neighbouring scenes overlap in view.
 */
export const STATION_GAP = 80;

/** World-space anchor for slide i: a gentle S-curve so the camera visibly travels. */
export function station(i: number): THREE.Vector3 {
  return new THREE.Vector3(i * STATION_GAP, Math.sin(i * 0.5) * 1.5, -Math.sin(i * 0.35) * 10);
}

// Subsets: `latin` has ASCII but no → or ₹; `latin-ext` has ₹ but no ASCII. 3D labels avoid
// arrows, and amounts draw the ₹ sign from `rupee` beside latin digits (see <Amount>).
export const FONTS = { ui: interUrl, uiSemi: interSemiUrl, mono: monoUrl, rupee: interExtUrl, chalk: chalkUrl };

/** Semantic colours. three.js converts hex (sRGB) to linear on assignment. */
export const COLORS = {
  bg: '#0A0B0E',
  graphite: '#2A2E36',
  bone: '#ECE7DC',
  ash: '#8A8F9A',
  signal: '#FFB547',
  honest: '#3ED6C5',
  fault: '#FF5A4E',
  stake: '#8C7DFF',
  vote: '#6FB7FF',
  trust: '#D9C27A',
  gridCell: '#1A1D23',
  gridSection: '#23262E',
} as const;

/** Emissive intensities: only the active element goes above 1, so bloom (threshold 0.9) picks it alone. */
export const GLOW = { off: 0.25, idle: 0.9, active: 1.7 } as const;

/** Opacity of objects not involved in the current step. */
export const DIM_OPACITY = 0.35;
