import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStepTimeline } from '../engine/useStepTimeline';
import { reducedMotion } from '../engine/StepEngine';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { Coin, CoinStack } from '../world/props';
import { fadeTo, colorTo } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// Bitcoin's rhythm: a block every ~10 minutes, 6 confirmations ≈ 1 hour, reward halves every 4 years.

const N = 7;
const BX = (i: number) => (i - 3) * 1.95;
const ROW = 0.2;
const HALVINGS = [
  { year: '2009', reward: '50', coins: 16 },
  { year: '2012', reward: '25', coins: 8 },
  { year: '2016', reward: '12.5', coins: 4 },
  { year: '2020', reward: '6.25', coins: 2 },
  { year: '2024', reward: '3.125', coins: 1 },
];

/** A wall clock whose minute hand sweeps once per block interval. */
function BlockClock(props: { position: [number, number, number] }) {
  const hand = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (hand.current && !reducedMotion()) hand.current.rotation.z = -state.clock.elapsedTime * 1.2;
  });
  return (
    <group {...props}>
      <mesh>
        <circleGeometry args={[0.62, 64]} />
        <meshStandardMaterial color="#101216" roughness={0.6} transparent />
      </mesh>
      <mesh>
        <torusGeometry args={[0.62, 0.04, 12, 64]} />
        <meshPhysicalMaterial color={COLORS.signal} metalness={0.9} roughness={0.3} transparent />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.5, Math.cos(a) * 0.5, 0.01]} rotation={[0, 0, -a]}>
            <planeGeometry args={[0.025, i % 3 ? 0.06 : 0.12]} />
            <meshBasicMaterial color={COLORS.bone} transparent />
          </mesh>
        );
      })}
      <group ref={hand} position={[0, 0, 0.02]}>
        <mesh position={[0, 0.2, 0]}>
          <planeGeometry args={[0.035, 0.42]} />
          <meshBasicMaterial color={COLORS.signal} toneMapped={false} transparent />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.03]}>
        <circleGeometry args={[0.04, 24]} />
        <meshBasicMaterial color={COLORS.signal} transparent />
      </mesh>
      <Label semi size={0.17} color={COLORS.bone} position={[0, -0.92, 0]}>~10 MIN PER BLOCK</Label>
    </group>
  );
}

function Scene({ step }: { step: number }) {
  const blocks = useRef<(THREE.Group | null)[]>([]);
  const links = useRef<(THREE.Group | null)[]>([]);
  const counters = useRef<THREE.Group>(null);
  const chain = useRef<THREE.Group>(null);
  const clock = useRef<THREE.Group>(null);
  const halving = useRef<THREE.Group>(null);
  const after = useRef<THREE.Group>(null);
  const chart = useRef<THREE.Group>(null);

  useStepTimeline(step, (tl, next) => {
    const hide = (g: THREE.Object3D | null) => {
      if (!g) return;
      tl.set(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
      fadeTo(tl, g, 0, 0, 0);
    };
    const show = (g: THREE.Object3D | null, at: number, d = 0.5) => {
      if (!g) return;
      tl.to(g.scale, { x: 1, y: 1, z: 1, duration: d }, at);
      fadeTo(tl, g, 1, at, 0.3);
    };
    [...blocks.current.slice(1), ...links.current, counters.current, halving.current, chart.current].forEach(hide);
    // 1. a block every ~10 minutes
    blocks.current.slice(1, 3).forEach((g, i) => show(g, 0.3 + i * 0.35));
    links.current.slice(0, 2).forEach((g, i) => show(g, 0.45 + i * 0.35));
    // 2. six more blocks on top of a payment ≈ 1 hour, then it is safe
    next((at) => {
      blocks.current.slice(3).forEach((g, i) => show(g, at + i * 0.18, 0.35));
      links.current.slice(2).forEach((g, i) => show(g, at + 0.1 + i * 0.18, 0.35));
      show(counters.current, at + 0.2);
      const first = blocks.current[0];
      let edge: THREE.Color | undefined;
      first?.traverse((o) => { if (o.userData.role === 'edge') edge = ((o as THREE.Mesh).material as unknown as { color: THREE.Color }).color; });
      colorTo(tl, edge, COLORS.honest, at + 1.2);
    });
    // 3. every 4 years the reward halves: a coin half the size slides out of the old one
    next((at) => {
      fadeTo(tl, chain.current, 0, at, 0.4);
      fadeTo(tl, clock.current, 0, at, 0.3);
      show(halving.current, at + 0.1);
      if (after.current) {
        tl.set(after.current.position, { x: -1.6 }, at + 0.1);
        tl.to(after.current.position, { x: 1.9, ease: 'power3.out', duration: 0.9 }, at + 0.5);
        fadeTo(tl, after.current, 1, at + 0.5, 0.3);
      }
    });
    // 4. the halving schedule as coin stacks
    next((at) => {
      fadeTo(tl, halving.current, 0, at, 0.3);
      show(chart.current, at + 0.15);
    });
    fadeTo(tl, after.current, 0, 0, 0);
  });

  return (
    <group>
      <FrameBox name="chain" size={[14.2, 4.6, 1]} position={[0, 0.9, 0]} />
      <FrameBox name="coin" size={[7.4, 5.0, 1]} position={[0.15, 0.3, 0]} />
      <FrameBox name="chart" size={[10.4, 4.6, 1]} position={[0, 0, 0]} />

      <group ref={chain}>
        {Array.from({ length: N }, (_, i) => (
          <ChainBlock key={i} ref={(g) => { blocks.current[i] = g; }} position={[BX(i), ROW, 0]} size={[1.6, 1.15, 0.25]} edge={i === 0 ? COLORS.signal : COLORS.honest} selected={i === 0 && step === 1}>
            <Label mono size={0.1} color={i === 0 ? COLORS.signal : COLORS.ash} position={[0, 0.34, 0]}>{i === 0 ? 'YOUR PAYMENT' : `BLOCK ${840000 + i}`}</Label>
            <Label mono size={0.1} color={COLORS.honest} position={[0, 0.06, 0]}>{`hash ${['9f3a', '41c2', '7be1', 'c03d', '15aa', '9e44', '0c6f'][i]}`}</Label>
            <Label semi size={0.13} color={COLORS.bone} position={[0, -0.26, 0]}>{`${i * 10} min`}</Label>
          </ChainBlock>
        ))}
        {Array.from({ length: N - 1 }, (_, i) => (
          <group key={i} ref={(g) => { links.current[i] = g; }}>
            <Link flowing points={[[BX(i) + 0.8, ROW, 0], [BX(i + 1) - 0.8, ROW, 0]]} />
          </group>
        ))}
        <group ref={counters}>
          {Array.from({ length: N - 1 }, (_, i) => (
            <Label key={i} semi size={0.15} color={COLORS.honest} position={[BX(i + 1), ROW - 0.75, 0]}>{`${i + 1}/6`}</Label>
          ))}
          <Label semi size={0.22} color={COLORS.honest} position={[BX(0), ROW - 0.85, 0]}>SAFE AFTER ~1 HOUR</Label>
        </group>
      </group>
      <group ref={clock}>
        <BlockClock position={[0, ROW + 2.0, 0]} />
      </group>

      <group ref={halving} position={[0, 0.5, 0]}>
        <group position={[-1.6, 0, 0]}>
          <Coin kind="btc" radius={1.0} spin={0.6} />
          <Label semi size={0.22} color={COLORS.bone} position={[0, -1.35, 0]}>6.25 BTC</Label>
          <Label mono size={0.12} color={COLORS.ash} position={[0, -1.65, 0]}>2020</Label>
        </group>
        <Label semi size={0.4} color={COLORS.signal} position={[0.15, 0, 0]}>{'\u00F7 2'}</Label>
        <group ref={after}>
          <Coin kind="btc" radius={0.71} spin={0.6} />
          <Label semi size={0.22} color={COLORS.bone} position={[0, -1.35, 0]}>3.125 BTC</Label>
          <Label mono size={0.12} color={COLORS.ash} position={[0, -1.65, 0]}>2024</Label>
        </group>
        <Label semi size={0.24} color={COLORS.signal} position={[0.15, 1.6, 0]}>THE BLOCK REWARD HALVES</Label>
        <Label mono size={0.13} color={COLORS.ash} position={[0.15, -2.15, 0]}>EVERY 210,000 BLOCKS  (~4 YEARS)</Label>
      </group>

      <group ref={chart} position={[0, -1.3, 0]}>
        {HALVINGS.map((h, i) => (
          <group key={h.year} position={[(i - 2) * 2.0, 0, 0]}>
            <CoinStack count={h.coins} kind="btc" radius={0.42} />
            <Label semi size={0.2} color={COLORS.signal} position={[0, h.coins * 0.07 + 0.35, 0]}>{`${h.reward} BTC`}</Label>
            <Label mono size={0.14} color={COLORS.ash} position={[0, -0.3, 0.3]}>{h.year}</Label>
          </group>
        ))}
        <Label semi size={0.18} color={COLORS.bone} position={[0, 2.6, 0]}>TOTAL SUPPLY WILL NEVER EXCEED 21 MILLION</Label>
      </group>
    </group>
  );
}

const ITEMS = [
  { title: '~10 minutes', body: 'For each new block. Difficulty adjusts every 2,016 blocks (~2 weeks) to keep the rhythm steady.' },
  { title: '6 blocks ≈ 1 hour', body: 'Then a payment feels safe: reversing it would need to redo all that work.' },
  { title: 'Every 4 years', body: 'The new-coin reward gets cut in half. This is called the halving.' },
  { title: 'Halving schedule', body: '2009: 50 → 2012: 25 → 2016: 12.5 → 2020: 6.25 → April 2024: 3.125 BTC per block. Total supply will never exceed 21 million.' },
];

export const slide14: SlideV2 = {
  Scene,
  steps: ITEMS.map((it, i) => ({
    title: it.title,
    caption: `${it.title}. ${it.body}`,
    camera: { fit: ['chain', 'chain', 'coin', 'chart'][i], padding: 0.3 },
    body: <p className="rail-body">{it.body}</p>,
  })),
};
