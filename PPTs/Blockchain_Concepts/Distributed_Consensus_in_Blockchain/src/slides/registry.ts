import { type ComponentType, type ReactNode } from 'react';
import { slide01 } from './Slide01';
import { slide02 } from './Slide02';
import { slide03 } from './Slide03';
import { slide04 } from './Slide04';
import { slide05 } from './Slide05';
import { slide06 } from './Slide06';
import { slide07 } from './Slide07';
import { slide08 } from './Slide08';
import { slide09 } from './Slide09';
import { slide10 } from './Slide10';
import { slide11 } from './Slide11';
import { slide12 } from './Slide12';
import { slide13 } from './Slide13';
import { slide14 } from './Slide14';
import { slide15 } from './Slide15';
import { slide16 } from './Slide16';
import { slide17 } from './Slide17';

/** Camera target for one step, relative to the slide's station: a named pose, or fitToBox on a named object. */
export type CameraSpec =
  | { pos: [number, number, number]; target: [number, number, number] }
  | { fit: string; padding?: number };

export interface StepDef {
  /** One line: aria-live announcement and the Present-mode lower third. */
  caption: string;
  /** Rail card heading. */
  title: string;
  /** Rail card body (may be interactive). */
  body?: ReactNode;
  camera: CameraSpec;
  /** Render `body` full-screen (no rail) — for text-only steps that must span the screen. */
  overlay?: boolean;
}

/** Rebuilt slides: a 3D scene driven by `step`, plus per-step rail cards and camera targets. */
export interface SlideV2 {
  Scene: ComponentType<{ step: number }>;
  steps: StepDef[];
}

// Shared by App.tsx (the projected window) and PresenterView.tsx (which mirrors the
// current slide's Scene as a background preview) so the two never drift out of sync.
export const SLIDES: Record<number, SlideV2> = {
  0: slide01,
  1: slide02,
  2: slide03,
  3: slide04,
  4: slide05,
  5: slide06,
  6: slide07,
  7: slide08,
  8: slide09,
  9: slide10,
  10: slide11,
  11: slide12,
  12: slide13,
  13: slide14,
  14: slide15,
  15: slide16,
  16: slide17,
};

export function getSlideEntry(slideIndex: number): SlideV2 {
  return SLIDES[slideIndex] ?? SLIDES[0];
}
