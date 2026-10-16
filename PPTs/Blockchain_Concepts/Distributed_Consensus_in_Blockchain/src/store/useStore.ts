import { create } from 'zustand';

interface QuorumState {
  slideIndex: number;
  stepIndex: number;
  /** Where the last slide change came from: that station stays mounted while the camera flies away. */
  from: { slide: number; step: number };
  /** Bumped by Reset so widgets and rail scroll can restore. */
  resetToken: number;
  visitedSlides: Set<number>;
  /** True while the engine's input lock is held (step or slide transition running). */
  transitioning: boolean;
  setPosition: (slide: number, step: number) => void;
  setTransitioning: (t: boolean) => void;
  bumpReset: () => void;
  resetProgress: () => void;
}

export const useStore = create<QuorumState>((set) => ({
  slideIndex: 0,
  stepIndex: 0,
  from: { slide: 0, step: 0 },
  resetToken: 0,
  visitedSlides: new Set([0]),
  transitioning: false,

  setPosition: (slide, step) =>
    set((state) => ({
      from: slide !== state.slideIndex ? { slide: state.slideIndex, step: state.stepIndex } : state.from,
      slideIndex: slide,
      stepIndex: step,
      visitedSlides: state.visitedSlides.has(slide)
        ? state.visitedSlides
        : new Set([...state.visitedSlides, slide]),
    })),
  // Once a transition ends the old station is gone for good: clearing `from` stops later
  // step changes on this slide from re-mounting (and replaying) the previous slide.
  setTransitioning: (t) =>
    set((s) => (t ? { transitioning: t } : { transitioning: t, from: { slide: s.slideIndex, step: s.stepIndex } })),
  bumpReset: () => set((s) => ({ resetToken: s.resetToken + 1 })),
  resetProgress: () =>
    set((s) => ({
      from: { slide: s.slideIndex, step: s.stepIndex },
      slideIndex: 0,
      stepIndex: 0,
      visitedSlides: new Set([0]),
      resetToken: s.resetToken + 1,
    })),
}));
