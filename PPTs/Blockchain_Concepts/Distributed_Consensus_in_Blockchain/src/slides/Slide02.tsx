import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { StepEngine, reducedMotion } from '../engine/StepEngine';
import { useStepTimeline } from '../engine/useStepTimeline';
import { GlassNode, Label, FrameBox } from '../world/primitives';
import { focusOn, coreOf } from '../world/anim';
import { COLORS, GLOW } from '../config/world';
import type { SlideV2 } from './registry';

const ISLANDS = [
  { x: -4.6, color: COLORS.honest, label: 'PART A  ·  THE BASICS' },
  { x: 0, color: COLORS.stake, label: 'PART B  ·  THE METHODS' },
  { x: 4.6, color: COLORS.signal, label: 'PART C  ·  REAL WORLD' },
];
/** One bubble per part, gently bobbing; no satellites. */
function Island({ color, label }: { color: string; label: string }) {
  const bubble = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  useFrame((state, delta) => {
    if (!bubble.current || reducedMotion()) return;
    easing.damp(bubble.current.position, 'y', Math.sin(state.clock.elapsedTime * 0.8 + phase.current) * 0.12, 0.3, delta);
  });
  return (
    <>
      <group ref={bubble}>
        <GlassNode radius={0.7} color={color} />
      </group>
      <Label semi size={0.19} color={color} position={[0, -1.35, 0]}>{label}</Label>
    </>
  );
}

function Scene({ step }: { step: number }) {
  const isles = useRef<(THREE.Group | null)[]>([]);

  useStepTimeline(step, (tl, next) => {
    const all = isles.current;
    const light = (at: number, i: number) => {
      all.forEach((g, j) => {
        const core = coreOf(g);
        if (core) tl.to(core, { emissiveIntensity: j === i ? GLOW.active : GLOW.off }, at);
      });
      focusOn(tl, at, all, [all[i]]);
    };
    light(0, 0);
    next((at) => light(at, 1));
    next((at) => light(at, 2));
  });

  return (
    <group>
      {ISLANDS.map((isle, i) => (
        <group key={i} position={[isle.x, 0, 0]} ref={(g) => { isles.current[i] = g; }}>
          <FrameBox name={`island-${i}`} size={[4.2, 3.6, 2]} position={[0, -0.3, 0]} />
          <Island color={isle.color} label={isle.label} />
        </group>
      ))}
    </group>
  );
}

const PARTS = [
  {
    label: 'Part A · The Basics',
    color: 'var(--honest)',
    slides: ['Key words', 'Blockchain', 'Networks', 'Strangers agree', 'Consensus', 'Why we need it', 'What makes it good', 'Two failures', 'Trilemma'],
    first: 3,
    jumpTo: 2,
  },
  {
    label: 'Part B · The Methods',
    color: 'var(--stake)',
    slides: ['Family tree', 'Proof of Work', 'PoW: Bitcoin', 'Proof of Stake', 'More methods'],
    first: 12,
    jumpTo: 11,
  },
  {
    label: 'Part C · Real World',
    color: 'var(--signal)',
    slides: ['Forks', 'Attacks', 'Who uses what', "What's next", 'Summary', 'Thank you'],
    first: 17,
    jumpTo: 16,
  },
];

const CAPTIONS = [
  'Part A, the basics: key words, what a blockchain is, kinds of networks, and why agreement matters.',
  'Part B, the methods: Proof of Work, Proof of Stake, and a quick look at the rest.',
  'Part C, the real world: forks, attacks, who uses what, and what comes next.',
];

export const slide02: SlideV2 = {
  Scene,
  steps: PARTS.map((p, i) => ({
    title: p.label,
    caption: CAPTIONS[i],
    camera: { fit: `island-${i}`, padding: 0.3 },
    body: (
      <div className="flex flex-col gap-static-md">
        <ol className="rail-list">
          {p.slides.map((s, k) => (
            <li key={s}>
              <span className="rail-num">{String(p.first + k).padStart(2, '0')}</span>
              {s}
            </li>
          ))}
        </ol>
        <button type="button" className="rail-link" style={{ color: p.color }} onClick={() => StepEngine.goTo(p.jumpTo)}>
          Jump to {p.label.split(' · ')[0]}
        </button>
      </div>
    ),
  })),
};
