import { type ComponentType, type ReactNode } from 'react';
import { slide01 } from './Slide01';
import { slide02 } from './Slide02';
import { slide03 } from './Slide03';

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
};

export function getSlideEntry(slideIndex: number): SlideV2 {
  return SLIDES[slideIndex] ?? SLIDES[0];
}
