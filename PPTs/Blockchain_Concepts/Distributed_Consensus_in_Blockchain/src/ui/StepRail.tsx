import { useLayoutEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { SLIDE_META } from '../slides/meta';
import { reducedMotion } from '../engine/StepEngine';
import type { StepDef } from '../slides/registry';

const PART_LABELS: Record<string, string> = {
  intro: 'Introduction',
  A: 'Part A · The Basics',
  B: 'Part B · The Methods',
  C: 'Part C · Real World',
};

/**
 * The text rail: its own scroll container holding every step revealed so far.
 * On each step change the newest card is scrolled into view inside the rail only
 * (scrollTo on the container, never scrollIntoView, so the page itself never moves).
 */
export function StepRail({ steps }: { steps: StepDef[] }) {
  const slideIndex = useStore((s) => s.slideIndex);
  const stepIndex = useStore((s) => s.stepIndex);
  const resetToken = useStore((s) => s.resetToken);
  const scroller = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const listRef = useRef<HTMLOListElement>(null);
  const meta = SLIDE_META[slideIndex];

  // Runs after layout so offsetTop includes the new card; smooth unless reduced motion.
  // Fonts and images can still change card heights afterwards, so the list is observed
  // and the target re-applied whenever it resizes.
  useLayoutEffect(() => {
    const el = scroller.current;
    const list = listRef.current;
    if (!el || !list) return;
    const scroll = (behavior: ScrollBehavior) => {
      const card = cards.current[stepIndex];
      if (!card || stepIndex === 0) {
        el.scrollTo({ top: 0, behavior });
        return;
      }
      // newest card's bottom at the rail's bottom; if it's taller than the rail, its top
      const top = card.offsetTop + card.offsetHeight - el.clientHeight + 24;
      el.scrollTo({ top: Math.max(0, Math.min(top, card.offsetTop - 24)), behavior });
    };
    scroll(reducedMotion() ? 'auto' : 'smooth');
    let initial = true; // RO reports once on observe; that one would cut the smooth scroll short
    const ro = new ResizeObserver(() => {
      if (initial) initial = false;
      else scroll('auto');
    });
    ro.observe(list);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slideIndex, stepIndex, resetToken]);

  return (
    <aside className="rail" aria-label="Slide notes">
      <header className="rail-head">
        <p className="rail-kicker">{PART_LABELS[meta?.part ?? 'intro']}</p>
        <h2 className="rail-title">{meta?.title}</h2>
      </header>
      <div ref={scroller} className="rail-scroll" data-own-scroll>
        <ol ref={listRef} className="rail-steps">
          <AnimatePresence initial={false}>
            {steps.slice(0, stepIndex + 1).map((s, i) => (
              <motion.li
                key={`${slideIndex}-${i}`}
                ref={(el) => { cards.current[i] = el; }}
                className="rail-card"
                data-active={i === stepIndex || undefined}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: i === stepIndex ? 1 : 0.45, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="rail-card-title">
                  <span className="rail-num">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </h3>
                {s.body}
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </div>
    </aside>
  );
}
