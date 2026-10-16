import { useRef, type ComponentType } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { Label, Link, FrameBox } from '../world/primitives';
import { fadeTo } from '../world/anim';
import { COLORS } from '../config/world';
import { slide01 } from './Slide01';
import { slide06 } from './Slide06';
import { slide07 } from './Slide07';
import { slide08 } from './Slide08';
import { slide11 } from './Slide11';
import { slide12 } from './Slide12';
import { slide13 } from './Slide13';
import { slide15 } from './Slide15';
import { AttackGrid } from './Slide18';
import type { SlideV2 } from './registry';

// Everything in one picture: the deck's own scenes, shrunk onto one board, revealed by theme.

interface Panel { scene: ComponentType<{ step: number }>; step: number; title: string; group: number; scale?: number; offset?: [number, number, number] }
const PANELS: Panel[] = [
  { scene: slide01.Scene, step: 0, title: 'A NETWORK KEEPING ONE CHAIN', group: 0, scale: 0.29 },
  { scene: slide07.Scene, step: 4, title: 'EVERYONE AGREES: 42', group: 0, scale: 0.36, offset: [0, 0.2, 0] },
  { scene: slide08.Scene, step: 3, title: 'STOPS DOUBLE SPENDING', group: 1, scale: 0.3 },
  { scene: slide06.Scene, step: 2, title: 'SURVIVES LIARS', group: 1, scale: 0.29, offset: [0, 0.3, 0] },
  { scene: slide12.Scene, step: 3, title: 'THE FAMILY OF METHODS', group: 2, scale: 0.3, offset: [0, -0.2, 0] },
  { scene: slide13.Scene, step: 4, title: 'PROOF OF WORK', group: 2, scale: 0.31 },
  { scene: slide15.Scene, step: 4, title: 'PROOF OF STAKE', group: 2, scale: 0.31 },
  { scene: slide11.Scene, step: 3, title: 'SECURITY · DECENTRALIZATION · SPEED', group: 3, scale: 0.38 },
  { scene: AttackGrid, step: 0, title: 'ATTACKS', group: 4, scale: 0.15, offset: [0, -0.05, 0] },
];
const CELL_W = 4.9;
const CELL_H = 3.15;
const cell = (i: number): [number, number, number] => [((i % 3) - 1) * CELL_W, (1 - Math.floor(i / 3)) * CELL_H, 0];
const GROUP_COLORS = [COLORS.bone, COLORS.fault, COLORS.stake, COLORS.signal, COLORS.ash];

function Frame({ color }: { color: string }) {
  const w = CELL_W - 0.25;
  const h = CELL_H - 0.25;
  return <Link color={color} opacity={0.8} points={[[-w / 2, -h / 2, 0.5], [w / 2, -h / 2, 0.5], [w / 2, h / 2, 0.5], [-w / 2, h / 2, 0.5], [-w / 2, -h / 2, 0.5]]} />;
}

function Scene({ step }: { step: number }) {
  const panels = useRef<(THREE.Group | null)[]>([]);
  useStepTimeline(step, (tl, next) => {
    const reveal = (g: number, at: number) =>
      PANELS.forEach((p, i) => {
        const el = panels.current[i];
        if (p.group !== g || !el) return;
        tl.to(el.scale, { x: 1, y: 1, z: 1, ease: 'power3.out' }, at);
        fadeTo(tl, el, 1, at, 0.4);
      });
    panels.current.forEach((el) => {
      if (!el) return;
      tl.set(el.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
    });
    reveal(0, 0.1);
    for (let g = 1; g <= 4; g++) next((at) => reveal(g, at));
  });

  return (
    <group>
      <FrameBox name="sum-all" size={[CELL_W * 3 + 0.4, CELL_H * 3 + 0.6, 1]} />
      {PANELS.map((p, i) => {
        const S = p.scene;
        return (
          <group key={p.title} ref={(g) => { panels.current[i] = g; }} position={cell(i)}>
            <Frame color={GROUP_COLORS[p.group]} />
            <Label semi size={0.15} color={GROUP_COLORS[p.group]} position={[0, CELL_H / 2 - 0.3, 0.5]}>{p.title}</Label>
            <group scale={p.scale ?? 0.3} position={(p.offset ?? [0, 0, 0]).map((v, k) => (k === 1 ? v - 0.15 : v)) as [number, number, number]}>
              <S step={p.step} />
            </group>
          </group>
        );
      })}
    </group>
  );
}

const ITEMS = [
  { title: 'Consensus', body: 'Agreeing on one truth.', css: 'var(--bone)' },
  { title: 'Why', body: 'To stop double spending and lying computers.', css: 'var(--fault)' },
  { title: 'How', body: 'PoW, PoS, DPoS, PBFT, Raft, PoA.', css: 'var(--stake)' },
  { title: 'Trade-off', body: 'Security vs speed vs openness.', css: 'var(--signal)' },
  { title: 'Risks', body: '51% attack, Sybil, smart contract bugs, DDoS.', css: 'var(--ash)' },
];

export const slide21: SlideV2 = {
  Scene,
  steps: ITEMS.map((it) => ({
    title: it.title,
    caption: `${it.title}: ${it.body}`,
    camera: { fit: 'sum-all', padding: 0.2 },
    body: <p className="rail-lead" style={{ color: it.css }}>{it.body}</p>,
  })),
};
