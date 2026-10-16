import { PButton, PText } from '@porsche-design-system/components-react';
import { useStore } from '../store/useStore';
import { SLIDE_META } from '../slides/meta';
import { HashStamp } from './HashStamp';
import { QuorumRing } from './QuorumRing';
import { ChainNavigator } from './ChainNavigator';
import { openPresenter } from '../engine/presenterSync';

const PART_LABELS: Record<string, string> = {
  intro: 'Introduction',
  A: 'Part A · The Basics',
  B: 'Part B · The Methods',
  C: 'Part C · Real World',
};

export function TopBar() {
  const slideIndex = useStore((s) => s.slideIndex);
  const stepIndex = useStore((s) => s.stepIndex);
  const meta = SLIDE_META[slideIndex];
  const hashSeed = `${meta?.title ?? ''}-${stepIndex}`;
  const progress = (slideIndex + 1) / SLIDE_META.length;

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="rail-kicker">{PART_LABELS[meta?.part ?? 'intro']}</span>
        <div className="flex items-center gap-static-sm min-w-0">
          <PText size="small" weight="semibold" ellipsis>
            {meta?.title}
          </PText>
          <span className="hidden lg:inline-flex">
            <HashStamp key={hashSeed} seed={hashSeed} />
          </span>
        </div>
      </div>

      {/* ≥768: thumbnail chain. <768: "13 / 29" + progress bar. */}
      <div className="topbar-nav">
        <ChainNavigator />
      </div>
      <div className="topbar-compact" aria-label={`Slide ${slideIndex + 1} of ${SLIDE_META.length}`}>
        <span className="font-mono">
          {slideIndex + 1} / {SLIDE_META.length}
        </span>
        <span className="topbar-bar">
          <span style={{ transform: `scaleX(${progress})` }} />
        </span>
      </div>

      <div className="topbar-actions">
        <span className="topbar-count font-mono">
          {slideIndex + 1} / {SLIDE_META.length}
        </span>
        <span className="topbar-ring">
          <QuorumRing />
        </span>
        <PButton variant="secondary" compact onClick={openPresenter} title="Opens in a separate window: put it on your laptop screen, not the projector (N)">
          Notes
        </PButton>
      </div>
    </header>
  );
}
