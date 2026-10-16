import { useRef } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { fadeTo, focusOn } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// The four properties of a good consensus method, as a chain of blocks (same visual
// language as "What is a blockchain?"), one block per step, each in its own colour.

const PROPS = [
  { title: 'Safety', sub: 'Never agree on a wrong answer', body: 'No two honest computers ever show different balances for the same account.', color: COLORS.honest, css: 'var(--honest)' },
  { title: 'Liveness', sub: 'Keep moving, never get stuck', body: 'New payments keep getting added: the network never freezes forever.', color: COLORS.vote, css: 'var(--vote)' },
  { title: 'Fault Tolerance', sub: 'Keep working when some fail', body: 'Works even if a few computers crash or actively lie, up to a limit.', color: COLORS.stake, css: 'var(--stake)' },
  { title: 'Finality', sub: 'Once done, it can’t be undone', body: 'A confirmed payment stays confirmed: no one can reverse it later.', color: COLORS.signal, css: 'var(--signal)' },
];
const SIZE: [number, number, number] = [3.4, 1.9, 0.3];
const LINKS: [number, number, number][][] = [
  [[-0.35, 1.2, 0], [0.35, 1.2, 0]],
  [[2.05, 0.25, 0], [2.05, -0.25, 0]],
  [[0.35, -1.2, 0], [-0.35, -1.2, 0]],
];
// a 2×2 "snake" (top-left → top-right → bottom-right → bottom-left), so each block is large
const POS: [number, number, number][] = [[-2.05, 1.2, 0], [2.05, 1.2, 0], [2.05, -1.2, 0], [-2.05, -1.2, 0]];

function Scene({ step }: { step: number }) {
  const blocks = useRef<(THREE.Group | null)[]>([]);
  const links = useRef<(THREE.Group | null)[]>([]);

  useStepTimeline(step, (tl, next) => {
    blocks.current.slice(1).forEach((g) => {
      if (!g) return;
      tl.set(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
      fadeTo(tl, g, 0, 0, 0);
    });
    links.current.forEach((g) => fadeTo(tl, g, 0, 0, 0));
    for (let k = 1; k < PROPS.length; k++) {
      next((at) => {
        const g = blocks.current[k];
        if (g) tl.to(g.scale, { x: 1, y: 1, z: 1 }, at);
        fadeTo(tl, links.current[k - 1], 1, at + 0.2, 0.4);
        focusOn(tl, at, blocks.current.slice(0, k + 1), [g]);
      });
    }
  });

  const left = -SIZE[0] / 2 + 0.18;
  return (
    <group>
      <FrameBox name="first" size={[8.2, 2.6, 1]} position={[0, 1.2, 0]} />
      <FrameBox name="all" size={[8.2, 5.0, 1]} />
      {PROPS.map((p, i) => (
        <ChainBlock key={p.title} ref={(g) => { blocks.current[i] = g; }} position={POS[i]} size={SIZE} edge={p.color} selected={i === step}>
          <Label mono size={0.11} color={COLORS.ash} anchorX="left" position={[left, 0.68, 0]}>{`PROPERTY ${i + 1}`}</Label>
          <Label semi size={0.3} color={p.color} anchorX="left" position={[left, 0.34, 0]}>{p.title.toUpperCase()}</Label>
          <Label size={0.16} color={COLORS.bone} anchorX="left" position={[left, -0.05, 0]} maxWidth={SIZE[0] - 0.36}>{p.sub}</Label>
          <Label mono size={0.1} color={p.color} anchorX="left" position={[left, -0.66, 0]}>{`hash  ${['5AF3', 'B17C', '0E92', 'D44A'][i]}`}</Label>
        </ChainBlock>
      ))}
      {[0, 1, 2].map((k) => (
        <group key={k} ref={(g) => { links.current[k] = g; }}>
          <Link flowing color={PROPS[k + 1].color} points={LINKS[k]} />
        </group>
      ))}
    </group>
  );
}

export const slide09: SlideV2 = {
  Scene,
  steps: PROPS.map((p, i) => ({
    title: p.title,
    caption: `${p.title}: ${p.sub}. ${p.body}`,
    camera: i === 0 ? { fit: 'first', padding: 0.4 } : { fit: 'all', padding: 0.3 },
    body: (
      <div className="flex flex-col gap-static-md">
        <p className="rail-lead" style={{ color: p.css }}>{p.sub}</p>
        <p className="rail-body">{p.body}</p>
        {i === 3 && (
          <div className="rail-inset">
            <p className="rail-kicker" style={{ color: 'var(--signal)' }}>FLP impossibility (1985)</p>
            <p className="rail-meta">
              Fischer, Lynch &amp; Paterson proved: with arbitrarily delayed messages, no deterministic method can always guarantee both safety and liveness if even one node may crash. Real systems use timeouts or randomness to get around it.
            </p>
          </div>
        )}
      </div>
    ),
  })),
};
