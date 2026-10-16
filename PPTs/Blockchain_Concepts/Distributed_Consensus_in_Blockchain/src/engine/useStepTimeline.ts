import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { STEP_S } from '../config/world';
import { reducedMotion } from './StepEngine';

type StepFn = (at: number) => void;

/**
 * One paused GSAP master timeline per slide, one labelled segment per step ("s0", "s1", …).
 * Step changes tween the playhead to the step's label, so Back plays the exact reverse.
 *
 * `build(tl, step)`: tweens placed at time 0 form the intro segment that ends on "s0" (the
 * step-0 state; it plays as the slide's entrance). Then call `step(at => …)` once per further
 * step and put that step's tweens at position `at`.
 *
 * `deps` rebuild the timeline (e.g. a reset token). StrictMode-safe: gsap.context reverts
 * and kills everything the previous build created.
 */
export function useStepTimeline(
  stepIndex: number,
  build: (tl: gsap.core.Timeline, step: (fn: StepFn) => void) => void,
  deps: unknown[] = [],
) {
  const tl = useRef<gsap.core.Timeline | null>(null);
  const playhead = useRef<gsap.core.Tween | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const t = gsap.timeline({
        paused: true,
        defaults: { duration: STEP_S, ease: 'power3.out', overwrite: 'auto' },
      });
      // Intro segment [0, ≥STEP_S] ends on s0. The playhead must actually move to render a
      // state, so step 0 cannot live at time 0 itself.
      // Each label sits after its segment's LAST tween (staggered / delayed tweens included),
      // so landing on a label always shows that step fully finished.
      t.to({}, { duration: STEP_S }, 0);
      let n = 0;
      const close = () => t.addLabel(`s${n}`, t.duration());
      build(t, (fn) => {
        if (n === 0 && t.labels.s0 === undefined) close(); // intro ends where step 1 begins
        // start strictly after the previous label: landing on a label must not begin
        // rendering the next step's tweens (GSAP renders tweens that start exactly at the playhead)
        const at = t.duration() + 0.01;
        t.to({}, { duration: STEP_S }, at); // spacer: every step owns at least a full segment
        fn(at);
        n++;
        close();
      });
      if (t.labels.s0 === undefined) close(); // single-step slides
      // Arriving at step 0 plays the entrance; deep links / Back-into-slide land without playing.
      if (stepIndex === 0 && !reducedMotion()) playhead.current = t.tweenTo('s0', { ease: 'none' });
      else t.seek(`s${stepIndex}`, false);
      tl.current = t;
    });
    return () => {
      playhead.current?.kill();
      ctx.revert();
      tl.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    const label = `s${stepIndex}`;
    if (t.labels[label] === undefined || t.labels[label] === t.time()) return;
    playhead.current?.kill(); // never let two playhead tweens fight
    if (reducedMotion()) {
      t.seek(label, false);
      return;
    }
    playhead.current = t.tweenTo(label, { ease: 'none' });
  }, [stepIndex]);
}
