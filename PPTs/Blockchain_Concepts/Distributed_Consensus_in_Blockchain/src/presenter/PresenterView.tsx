import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SLIDE_META } from '../slides/meta';
import { getStepNotes } from '../slides/notes';
import { getSlideEntry } from '../slides/registry';
import { PRESENTER_CHANNEL, type PresenterMessage } from '../engine/presenterSync';

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const reset = () => setSeconds(0);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return { label: `${mm}:${ss}`, reset };
}

const PART_COLOR: Record<string, string> = { intro: '#8A8F9A', A: '#3ED6C5', B: '#8C7DFF', C: '#FFB547' };

// A read-only strip across every slide, grouped by part — purely a "where are we" marker,
// mirroring the main window's Chain Navigator at a glance. Not clickable: the presenter
// drives the deck from the projected window, this window only follows.
function SlideMarks({ slideIndex }: { slideIndex: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {SLIDE_META.map((m, i) => (
        <div
          key={m.id}
          title={`${m.id}. ${m.title}`}
          style={{
            width: i === slideIndex ? 14 : 6,
            height: 6,
            borderRadius: 1,
            background: i === slideIndex ? '#FFB547' : i < slideIndex ? PART_COLOR[m.part] : '#23262E',
            opacity: i === slideIndex ? 1 : i < slideIndex ? 0.7 : 0.4,
            transition: 'all 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}

export default function PresenterView() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const timer = useTimer();

  useEffect(() => {
    const channel = new BroadcastChannel(PRESENTER_CHANNEL);
    channelRef.current = channel;
    channel.onmessage = (e: MessageEvent<PresenterMessage>) => {
      if (e.data.type === 'state') {
        setSlideIndex(e.data.slideIndex);
        setStepIndex(e.data.stepIndex);
      }
    };
    channel.postMessage({ type: 'request' } satisfies PresenterMessage);
    return () => channel.close();
  }, []);

  const meta = SLIDE_META[slideIndex];
  const totalSteps = meta?.stepCount ?? 1;
  const isLastStep = stepIndex >= totalSteps - 1;
  const nextSlideIndex = isLastStep ? slideIndex + 1 : slideIndex;
  const nextStepIndex = isLastStep ? 0 : stepIndex + 1;
  const nextMeta = SLIDE_META[nextSlideIndex];
  const nextPreview = nextMeta ? getStepNotes(nextSlideIndex, nextStepIndex) : null;
  const LiveScene = getSlideEntry(slideIndex).Scene;

  return (
    <div className="scheme-dark" style={{ position: 'relative', minHeight: '100vh', background: '#07080B', color: '#ECE7DC', overflow: 'hidden' }}>
      {/* Mirrors the projected slide, dimmed, so the presenter can see at a glance that
          this window and the real screen are showing the same thing — no glitch, no drift. */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.22, pointerEvents: 'none' }}>
        <Canvas key={slideIndex} camera={{ position: [0, 0, 12], fov: 50 }} dpr={1}>
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 2, 5]} intensity={1.2} color="#3ED6C5" />
          <LiveScene step={stepIndex} />
        </Canvas>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,8,11,0.75), rgba(7,8,11,0.96) 60%)' }} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          fontFamily: "'Porsche Next', system-ui, sans-serif",
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8F9A' }}>
            Presenter view — not shown on projector
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: '#FFB547' }}>{timer.label}</span>
            <button
              onClick={timer.reset}
              style={{ fontSize: 11, color: '#8A8F9A', background: 'none', border: '1px solid #23262E', borderRadius: 2, padding: '2px 8px' }}
            >
              reset
            </button>
          </div>
        </div>

        <SlideMarks slideIndex={slideIndex} />

        <div>
          <p style={{ fontSize: 12, color: '#8A8F9A', margin: 0 }}>
            Slide {meta?.id} / {SLIDE_META.length} · suggested ~{meta?.suggestedMinutes} min
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 600, margin: '4px 0' }}>{meta?.title}</h1>
          <p style={{ fontSize: 13, color: '#3ED6C5', margin: 0 }}>
            Step {stepIndex + 1} / {totalSteps}
          </p>
        </div>

        <div style={{ background: 'rgba(17,19,24,0.9)', border: '1px solid #23262E', borderRadius: 12, padding: 20, flex: 1 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFB547', margin: '0 0 8px' }}>
            Say this now
          </p>
          <p style={{ fontSize: 20, lineHeight: 1.6, margin: 0 }}>{getStepNotes(slideIndex, stepIndex)}</p>
        </div>

        {nextPreview && (
          <div style={{ background: 'rgba(17,19,24,0.9)', border: '1px solid #23262E', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6FB7FF', margin: '0 0 6px' }}>
              Coming up {isLastStep ? `(Slide ${nextMeta?.id})` : '(next step)'}
            </p>
            <p style={{ fontSize: 14, color: '#8A8F9A', margin: 0, lineHeight: 1.5 }}>{nextPreview}</p>
          </div>
        )}

        <p style={{ fontSize: 11, color: '#4A4E57' }}>
          Keep this window on your laptop screen only — drive the deck from the projected window.
        </p>
      </div>
    </div>
  );
}
