import { useRef } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { fadeTo, colorTo } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// Forks on an actual chain: split, longest chain wins, then soft vs hard forks.

type V = [number, number, number];
const S: [number, number, number] = [1.8, 1.0, 0.25];
const B = (x: number, y = 0): V => [x, y, 0];
const MAIN = [-5.4, -3.1, -0.8];
const A_Y = 1.25;
const B_Y = -1.25;
const POOL: V = [1.7, -3.3, 0];

function Blk({ label, sub, color = COLORS.honest, position, refCb, selected }: { label: string; sub: string; color?: string; position: V; refCb?: (g: THREE.Group | null) => void; selected?: boolean }) {
  return (
    <ChainBlock ref={refCb} position={position} size={S} edge={color} selected={selected}>
      <Label semi size={0.17} color={COLORS.bone} position={[0, 0.16, 0]}>{label}</Label>
      <Label mono size={0.085} color={color} position={[0, -0.16, 0]}>{sub}</Label>
    </ChainBlock>
  );
}

const edgeOf = (g: THREE.Object3D | null) => {
  const found: (THREE.Material & { color: THREE.Color })[] = [];
  g?.traverse((o) => { if (o.userData.role === 'edge') found.push((o as THREE.Mesh).material as never); });
  return found[0]?.color;
};

/** Mini chain diagram for the soft/hard fork comparison. */
function MiniChain({ points, color, badges = [] }: { points: V[]; color: string; badges?: number[] }) {
  return (
    <>
      {points.map((p, i) => (
        <ChainBlock key={i} position={p} size={[0.75, 0.45, 0.12]} edge={badges.includes(i) ? COLORS.stake : color} />
      ))}
      {points.slice(1).map((p, i) => (
        <Link key={i} color={color} opacity={0.7} points={[[points[i][0] + 0.38, points[i][1], 0], [p[0] - 0.38, p[1], 0]]} />
      ))}
    </>
  );
}

function Scene({ step }: { step: number }) {
  const main = useRef<THREE.Group>(null);
  const forkA = useRef<THREE.Group>(null);
  const forkB = useRef<THREE.Group>(null);
  const block4B = useRef<THREE.Group | null>(null);
  const growA = useRef<THREE.Group>(null);
  const pool = useRef<THREE.Group>(null);
  const kinds = useRef<THREE.Group>(null);
  const story = useRef<THREE.Group>(null);

  useStepTimeline(step, (tl, next) => {
    const hide = (g: THREE.Object3D | null) => {
      if (!g) return;
      tl.set(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
      fadeTo(tl, g, 0, 0, 0);
    };
    const show = (g: THREE.Object3D | null, at: number) => {
      if (!g) return;
      tl.to(g.scale, { x: 1, y: 1, z: 1 }, at);
      fadeTo(tl, g, 1, at, 0.4);
    };
    [forkA.current, forkB.current, growA.current, pool.current, kinds.current].forEach(hide);
    // 2. two valid blocks at almost the same moment
    next((at) => {
      show(forkA.current, at);
      show(forkB.current, at + 0.1);
    });
    // 3. branch A grows; 4B is orphaned and its transactions return to the pool
    next((at) => {
      show(growA.current, at);
      colorTo(tl, edgeOf(block4B.current), COLORS.ash, at + 0.5);
      if (block4B.current) tl.to(block4B.current.position, { y: POOL[1] + 0.9, ease: 'power2.in', duration: 0.8 }, at + 0.6);
      fadeTo(tl, forkB.current, 0.3, at + 0.8, 0.5);
      show(pool.current, at + 0.9);
    });
    // 4. soft fork vs hard fork
    next((at) => {
      fadeTo(tl, story.current, 0, at, 0.4);
      show(kinds.current, at + 0.2);
    });
  });

  return (
    <group>
      <FrameBox name="chain" size={[8.4, 3, 1]} position={[-3.1, 0, 0]} />
      <FrameBox name="fork" size={[10.4, 5.2, 1]} position={[-1.6, 0, 0]} />
      <FrameBox name="wins" size={[14.6, 7.4, 1]} position={[0.3, -0.8, 0]} />
      <FrameBox name="kinds" size={[13, 6, 1]} position={[0, 0.2, 0]} />

      <group ref={story}>
        <group ref={main}>
          {MAIN.map((x, i) => (
            <Blk key={i} position={B(x)} label={`BLOCK ${i + 1}`} sub={['hash 3a71', 'hash 9c0e', 'hash 41fb'][i]} />
          ))}
          {[0, 1].map((i) => <Link key={i} flowing points={[[MAIN[i] + 0.9, 0, 0], [MAIN[i + 1] - 0.9, 0, 0]]} />)}
        </group>
        <group ref={forkA}>
          <Blk position={B(1.7, A_Y)} label="BLOCK 4A" sub="miner in Asia" color={COLORS.vote} />
          <Link flowing color={COLORS.vote} points={[[MAIN[2] + 0.9, 0.1, 0], [1.7 - 0.9, A_Y, 0]]} />
          <Label mono size={0.1} color={COLORS.vote} position={[1.7, A_Y + 0.78, 0]}>HALF THE NETWORK SEES 4A FIRST</Label>
        </group>
        <group ref={forkB}>
          <Blk refCb={(g) => { block4B.current = g; }} position={B(1.7, B_Y)} label="BLOCK 4B" sub="miner in Europe" color={COLORS.signal} />
          <Link flowing color={COLORS.signal} points={[[MAIN[2] + 0.9, -0.1, 0], [1.7 - 0.9, B_Y, 0]]} />
        </group>
        <group ref={growA}>
          {[4.1, 6.5].map((x, i) => (
            <Blk key={x} position={B(x, A_Y)} label={`BLOCK ${5 + i}A`} sub={['hash 77d2', 'hash c1a8'][i]} color={COLORS.honest} selected={step === 2 && i === 1} />
          ))}
          {[[2.6, 3.2], [5.0, 5.6]].map(([a, b]) => <Link key={a} flowing points={[[a, A_Y, 0], [b, A_Y, 0]]} />)}
          <Label semi size={0.2} color={COLORS.honest} position={[4.1, A_Y + 0.85, 0]}>LONGEST CHAIN WINS</Label>
        </group>
        <group ref={pool} position={POOL}>
          <mesh>
            <boxGeometry args={[3.2, 0.1, 1.2]} />
            <meshStandardMaterial color="#1b1e24" roughness={0.7} transparent />
          </mesh>
          <Label mono size={0.11} color={COLORS.ash} position={[0, -0.32, 0.6]}>WAITING POOL: 4B’S TRANSACTIONS GO BACK HERE</Label>
        </group>
      </group>

      <group ref={kinds}>
        <group position={[-3.4, 0, 0]}>
          <Label semi size={0.26} color={COLORS.stake} position={[0, 2.1, 0]}>SOFT FORK</Label>
          <Label size={0.13} color={COLORS.ash} position={[0, 1.65, 0]}>old nodes still accept the new blocks</Label>
          <MiniChain color={COLORS.honest} badges={[3, 4, 5]} points={Array.from({ length: 7 }, (_, i) => B((i - 3) * 0.9, 0.2))} />
          <Label mono size={0.11} color={COLORS.ash} position={[0, -0.55, 0]}>ONE CHAIN CONTINUES  ·  e.g. SegWit, 2017</Label>
        </group>
        <group position={[3.6, 0, 0]}>
          <Label semi size={0.26} color={COLORS.fault} position={[0, 2.1, 0]}>HARD FORK</Label>
          <Label size={0.13} color={COLORS.ash} position={[0, 1.65, 0]}>old nodes reject them: a permanent split</Label>
          <MiniChain color={COLORS.honest} points={[B(-2.7, 0.2), B(-1.8, 0.2), B(-0.9, 0.2)]} />
          <MiniChain color={COLORS.vote} points={[B(-0.9, 0.2), B(0, 0.75), B(0.9, 0.95), B(1.8, 1.05)]} />
          <MiniChain color={COLORS.signal} points={[B(-0.9, 0.2), B(0, -0.35), B(0.9, -0.55), B(1.8, -0.65)]} />
          <Label mono size={0.1} color={COLORS.vote} position={[1.6, 1.42, 0]}>BITCOIN · ETHEREUM</Label>
          <Label mono size={0.1} color={COLORS.signal} position={[1.4, -1.05, 0]}>BITCOIN CASH (2017) · ETH CLASSIC (2016)</Label>
        </group>
      </group>
    </group>
  );
}

const CAPTIONS = [
  { title: 'A normal chain', body: 'Blocks 1, 2 and 3: agreed by everyone.' },
  { title: 'A fork appears', body: 'Two miners find a valid block at almost the same moment. Half the network sees 4A first, half sees 4B first.' },
  { title: 'Longest chain wins', body: '5A then 6A extend branch A, making it longer. All nodes switch to it: block 4B is dropped and its transactions go back into the waiting pool.' },
  { title: 'Soft fork vs hard fork', body: 'Soft fork: old nodes still accept new blocks (like a skippable app update, e.g. SegWit, 2017). Hard fork: old nodes reject them, splitting the chain permanently (e.g. Bitcoin Cash, 2017; Ethereum Classic, 2016).' },
];

export const slide17: SlideV2 = {
  Scene,
  steps: CAPTIONS.map((c, i) => ({
    title: c.title,
    caption: `${c.title}. ${c.body}`,
    camera: { fit: ['chain', 'fork', 'wins', 'kinds'][i], padding: 0.3 },
    body: <p className="rail-body">{c.body}</p>,
  })),
};
