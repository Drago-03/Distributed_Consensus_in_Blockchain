import gsap from 'gsap';
import { useStore } from '../store/useStore';
import { SLIDE_META } from '../slides/meta';
import {
  STEP_S,
  SLIDE_S,
  REDUCED_FADE_S,
  WHEEL_THRESHOLD,
  WHEEL_COOLDOWN_MS,
  WHEEL_GESTURE_GAP_MS,
  SWIPE_PX,
} from '../config/world';

// The single source of step changes. Every visible reaction (3D timeline, camera, rail
// scroll, focus highlight, aria caption, URL) subscribes to the store position this
// engine writes, so they all fire from the same event and can never drift apart.
//
// Input lock: while a transition runs, at most ONE extra request is queued; the rest
// are dropped. The lock is a killable gsap.delayedCall, never a stray setTimeout.

type Dir = 1 | -1;

let lock: gsap.core.Tween | null = null;
let queued: Dir | null = null;

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const get = () => useStore.getState();
const stepsOf = (slide: number) => SLIDE_META[slide]?.stepCount ?? 1;

function holdLock(seconds: number) {
  lock?.kill();
  get().setTransitioning(true);
  lock = gsap.delayedCall(reducedMotion() ? REDUCED_FADE_S : seconds, () => {
    lock = null;
    get().setTransitioning(false);
    const q = queued;
    queued = null;
    if (q) move(q);
  });
}

function commit(slide: number, step: number) {
  const changedSlide = slide !== get().slideIndex;
  get().setPosition(slide, step);
  updateURL(slide, step);
  holdLock(changedSlide ? SLIDE_S : STEP_S);
}

function move(dir: Dir) {
  if (lock) {
    if (queued === null) queued = dir;
    return;
  }
  const { slideIndex, stepIndex } = get();
  if (dir === 1) {
    if (stepIndex < stepsOf(slideIndex) - 1) commit(slideIndex, stepIndex + 1);
    else if (slideIndex < SLIDE_META.length - 1) commit(slideIndex + 1, 0);
  } else {
    if (stepIndex > 0) commit(slideIndex, stepIndex - 1);
    else if (slideIndex > 0) commit(slideIndex - 1, stepsOf(slideIndex - 1) - 1);
  }
}

/** Jumps cancel any queued press and any running lock: an explicit target always wins. */
function jump(slide: number, step: number) {
  queued = null;
  lock?.kill();
  lock = null;
  commit(slide, step);
}

export const StepEngine = {
  next: () => move(1),
  prev: () => move(-1),
  goTo: (slide: number, step = 0) => jump(slide, Math.min(step, stepsOf(slide) - 1)),
  resetSlide() {
    get().bumpReset();
    jump(get().slideIndex, 0);
  },
  resetAll() {
    queued = null;
    lock?.kill();
    lock = null;
    get().resetProgress();
    updateURL(0, 0);
    holdLock(SLIDE_S);
  },
};

function updateURL(slide: number, step: number) {
  // replaceState: no history entry per step.
  window.history.replaceState(null, '', `#/slide/${slide + 1}/step/${step + 1}`);
}

export function parseURL(): { slide: number; step: number } {
  const match = window.location.hash.match(/\/slide\/(\d+)\/step\/(\d+)/);
  if (!match) return { slide: 0, step: 0 };
  const slide = Math.max(0, Math.min(parseInt(match[1]) - 1, SLIDE_META.length - 1));
  return { slide, step: Math.max(0, Math.min(parseInt(match[2]) - 1, stepsOf(slide) - 1)) };
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement;

/** Elements marked data-own-scroll (the rail) keep native wheel/touch scrolling. */
const ownsScroll = (t: EventTarget | null) => t instanceof Element && !!t.closest('[data-own-scroll]');

/**
 * Binds keyboard, wheel/trackpad and touch to the engine. Returns the cleanup.
 * One deliberate gesture = one step: wheel deltas accumulate to a threshold, then input is
 * locked until both the cooldown has passed AND the trackpad's inertia tail has gone quiet.
 */
export function bindInputs(extraKeys: (e: KeyboardEvent) => boolean): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (extraKeys(e)) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      StepEngine.next();
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      StepEngine.prev();
    }
  };

  let acc = 0;
  let fired = false; // the current gesture already produced its one step
  let cooldownEnd = 0;
  let lastWheel = 0;
  let lastAbs = 0;
  const onWheel = (e: WheelEvent) => {
    if (ownsScroll(e.target)) return;
    e.preventDefault();
    const now = performance.now();
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    const abs = Math.abs(d);
    const gap = now - lastWheel;
    lastWheel = now;
    // A gesture ends after a quiet gap. While a fired gesture's inertia tail is still decaying,
    // slow frames can stretch the gaps, so the tail only counts as a new swipe if it
    // accelerates again (|delta| clearly above the previous event's) or truly goes quiet.
    const quiet = gap > WHEEL_GESTURE_GAP_MS * (fired ? 3 : 1);
    const reaccelerated = fired && abs > lastAbs * 1.6 && abs > 8;
    lastAbs = abs;
    if (quiet || reaccelerated) {
      acc = 0;
      fired = false;
    }
    if (fired || now < cooldownEnd) return;
    acc += d;
    if (Math.abs(acc) < WHEEL_THRESHOLD) return;
    if (acc > 0) StepEngine.next();
    else StepEngine.prev();
    fired = true;
    cooldownEnd = now + WHEEL_COOLDOWN_MS;
  };

  let startX = 0;
  let startY = 0;
  let tracking = false;
  const onTouchStart = (e: TouchEvent) => {
    tracking = e.touches.length === 1 && !ownsScroll(e.target) && !isTyping(e.target);
    if (!tracking) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const d = Math.abs(dx) > Math.abs(dy) ? -dx : -dy; // swipe left / up = forward
    if (Math.abs(d) < SWIPE_PX) return;
    if (d > 0) StepEngine.next();
    else StepEngine.prev();
  };

  window.addEventListener('keydown', onKey);
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  return () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchend', onTouchEnd);
  };
}
