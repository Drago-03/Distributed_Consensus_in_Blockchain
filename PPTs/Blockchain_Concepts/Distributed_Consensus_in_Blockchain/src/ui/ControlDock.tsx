import { PButton } from '@porsche-design-system/components-react';
import { useStore } from '../store/useStore';
import { StepEngine } from '../engine/StepEngine';
import { SLIDE_META } from '../slides/meta';

export function ControlDock() {
  const slideIndex = useStore((s) => s.slideIndex);
  const stepIndex = useStore((s) => s.stepIndex);

  const totalSteps = SLIDE_META[slideIndex]?.stepCount ?? 1;
  const isLastStep = stepIndex >= totalSteps - 1;
  const isLastSlide = slideIndex >= SLIDE_META.length - 1;
  const isFirst = slideIndex === 0 && stepIndex === 0;
  const atEnd = isLastSlide && isLastStep;

  return (
    <nav className="dock" aria-label="Step controls">
      <PButton variant="secondary" compact icon="arrow-left" disabled={isFirst} onClick={() => StepEngine.prev()}>
        Back
      </PButton>
      <PButton variant="primary" compact icon={isLastStep ? 'check' : 'arrow-right'} disabled={atEnd} onClick={() => StepEngine.next()}>
        {atEnd ? 'Done' : 'Next'}
        <span className="dock-wide">{atEnd ? '' : isLastStep ? ' slide' : ' step'}</span>
      </PButton>
      <PButton variant="secondary" compact icon="refresh" onClick={() => StepEngine.resetSlide()}>
        Reset
      </PButton>
    </nav>
  );
}
