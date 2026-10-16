import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PButton, PText } from '@porsche-design-system/components-react';
import { useStore } from './store/useStore';
import { useStage } from './store/useStage';
import { StepEngine, parseURL, bindInputs } from './engine/StepEngine';
import { Stage } from './world/Stage';
import { TopBar } from './ui/TopBar';
import { ControlDock } from './ui/ControlDock';
import { StepRail } from './ui/StepRail';
import { PRESENTER_CHANNEL, openPresenter, type PresenterMessage } from './engine/presenterSync';
import { getSlideEntry } from './slides/registry';

const PROGRESS_KEY = 'quorum-progress';

function readSaved(): { slide: number; step: number } | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Publishes the stage column's rect so the camera frames into it (not behind the rail). */
function useStageRect(ref: React.RefObject<HTMLDivElement | null>) {
  const setRect = useStage((s) => s.setRect);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () => {
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    window.addEventListener('resize', publish);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', publish);
    };
  }, [ref, setRect]);
}

function App() {
  const slideIndex = useStore((s) => s.slideIndex);
  const stepIndex = useStore((s) => s.stepIndex);
  const stageRef = useRef<HTMLDivElement>(null);
  const [continuePrompt, setContinuePrompt] = useState(() => {
    const fromURL = parseURL();
    if (fromURL.slide > 0 || fromURL.step > 0) return false;
    return (readSaved()?.slide ?? 0) > 0;
  });

  useStageRect(stageRef);

  // Restore from URL once.
  useEffect(() => {
    const fromURL = parseURL();
    if (fromURL.slide > 0 || fromURL.step > 0) StepEngine.goTo(fromURL.slide, fromURL.step);
  }, []);

  // Persist progress + mirror slide/step to the presenter popup.
  useEffect(() => {
    const channel = new BroadcastChannel(PRESENTER_CHANNEL);
    const sendState = () => {
      const s = useStore.getState();
      channel.postMessage({ type: 'state', slideIndex: s.slideIndex, stepIndex: s.stepIndex } satisfies PresenterMessage);
    };
    channel.onmessage = (e: MessageEvent<PresenterMessage>) => {
      if (e.data.type === 'request') sendState();
    };
    const unsubscribe = useStore.subscribe((s, prev) => {
      if (s.slideIndex === prev.slideIndex && s.stepIndex === prev.stepIndex) return;
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify({ slide: s.slideIndex, step: s.stepIndex }));
      } catch {
        /* storage blocked: progress just isn't remembered */
      }
      sendState();
    });
    return () => {
      unsubscribe();
      channel.close();
    };
  }, []);

  // Keyboard / wheel / touch → engine. App-level shortcuts handled first.
  useEffect(
    () =>
      bindInputs((e) => {
        switch (e.key.toLowerCase()) {
          case 'r':
            if (e.shiftKey) StepEngine.resetAll();
            else StepEngine.resetSlide();
            return true;
          case 'n':
            openPresenter();
            return true;
        }
        return false;
      }),
    [],
  );

  const resumeProgress = () => {
    const saved = readSaved();
    if (saved) StepEngine.goTo(saved.slide, saved.step);
    setContinuePrompt(false);
  };

  const entry = getSlideEntry(slideIndex);
  const steps = entry.steps;
  const step = steps?.[stepIndex];
  const caption = step?.caption ?? '';
  // Overlay steps (e.g. the risks list, the closing slide) take the whole screen instead of the rail.
  const showRail = !!steps && !step?.overlay;

  return (
    <div className="app scheme-dark" data-rail={showRail || undefined}>
      <Stage />
      <div className="vignette" aria-hidden />
      <div key={slideIndex} className="cut-fade" aria-hidden />

      <div className="shell">
        <TopBar />
        {showRail && <StepRail steps={steps} />}
        <div ref={stageRef} className="stage-slot" aria-hidden />
      </div>


      {step?.overlay && (
        <section key={`${slideIndex}-${stepIndex}`} className="overlay-panel" aria-label={step.title} data-own-scroll>
          {step.body}
        </section>
      )}

      <ControlDock />

      {/* Screen readers hear every step change. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {caption}
      </p>

      {continuePrompt && (
        <div className="resume glass-rail" role="dialog" aria-label="Resume">
          <PText size="small">Continue where you left off?</PText>
          <PButton variant="primary" compact onClick={resumeProgress}>
            Continue
          </PButton>
          <PButton variant="secondary" compact onClick={() => setContinuePrompt(false)}>
            Start over
          </PButton>
        </div>
      )}
    </div>
  );
}

export default App;
