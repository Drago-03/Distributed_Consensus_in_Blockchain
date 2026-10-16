import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStepTimeline } from '../engine/useStepTimeline';
import { reducedMotion } from '../engine/StepEngine';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { Monitor, Coin } from '../world/props';
import { fadeTo } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// What's coming next: four ideas, four small worlds, visited in turn.

const ZX = [-19.5, -6.5, 6.5, 19.5];

// ── Hybrid: two methods meshing like gears ──
function useGear(teeth: number, r: number) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const inner = r * 0.82;
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = (i / (teeth * 2)) * Math.PI * 2;
      const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
      const rr = i % 2 ? inner : r;
      if (i === 0) s.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr);
      else s.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr);
      s.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr);
    }
    const hole = new THREE.Path();
    hole.absarc(0, 0, r * 0.28, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
    g.center();
    return g;
  }, [teeth, r]);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}
function Gear({ teeth, r, color, speed, ...props }: { teeth: number; r: number; color: string; speed: number; position: [number, number, number]; phase?: number }) {
  const geo = useGear(teeth, r);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current && !reducedMotion()) ref.current.rotation.z = state.clock.elapsedTime * speed + (props.phase ?? 0);
  });
  return (
    <mesh ref={ref} geometry={geo} position={props.position}>
      <meshPhysicalMaterial color={color} metalness={0.8} roughness={0.28} clearcoat={0.6} transparent />
    </mesh>
  );
}
function Hybrid() {
  return (
    <group>
      {/* gear ratio 16:12 → angular speeds 12:16 so the teeth mesh */}
      <Gear teeth={16} r={1.5} color={COLORS.stake} speed={0.45} position={[-1.35, 0.4, 0]} />
      <Gear teeth={12} r={1.13} color={COLORS.vote} speed={-0.6} phase={0.13} position={[1.25, 0.4, 0]} />
      <Label semi size={0.17} color={COLORS.stake} position={[-1.35, -1.55, 0]}>PoS FORK CHOICE</Label>
      <Label semi size={0.17} color={COLORS.vote} position={[1.25, -1.55, 0]}>CASPER FINALITY</Label>
      <Label semi size={0.26} color={COLORS.bone} position={[0, -2.15, 0]}>= GASPER (ETHEREUM)</Label>
    </group>
  );
}

// ── Sharding: one queue becomes four lanes ──
const LANES = 4;
function Sharding() {
  const chips = useRef<(THREE.Group | null)[]>([]);
  const N = 24;
  useFrame((state) => {
    chips.current.forEach((c, i) => {
      if (!c) return;
      const lane = i % LANES;
      const t = reducedMotion() ? (i / N) : (state.clock.elapsedTime * 0.22 + i / N) % 1;
      // first third: single queue; then fan out into the lanes
      const x = -4 + t * 8;
      const split = THREE.MathUtils.smoothstep(t, 0.3, 0.45);
      c.position.set(x, THREE.MathUtils.lerp(0.4, 1.9 - lane * 1.0, split), 0);
    });
  });
  return (
    <group>
      {Array.from({ length: N }, (_, i) => (
        <group key={i} ref={(g) => { chips.current[i] = g; }}>
          <ChainBlock size={[0.42, 0.28, 0.1]} edge={[COLORS.vote, COLORS.honest, COLORS.signal, COLORS.stake][i % LANES]} />
        </group>
      ))}
      {Array.from({ length: LANES }, (_, k) => (
        <group key={k} position={[3.0, 1.9 - k * 1.0, 0]}>
          <Label mono size={0.12} color={COLORS.ash} anchorX="left" position={[1.2, 0, 0]}>{`SHARD ${k + 1}`}</Label>
        </group>
      ))}
      <Label mono size={0.12} color={COLORS.ash} position={[-3.4, 1.0, 0]}>ONE QUEUE</Label>
      <Label semi size={0.18} color={COLORS.bone} position={[0, -2.0, 0]}>LIKE OPENING MORE BILLING COUNTERS</Label>
    </group>
  );
}

// ── Layer 2: many fast payments up top, one batch settles below ──
function Layer2() {
  const chips = useRef<(THREE.Group | null)[]>([]);
  const batch = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = reducedMotion() ? 0.5 : state.clock.elapsedTime;
    chips.current.forEach((c, i) => {
      if (!c) return;
      const u = (t * 0.6 + i / 10) % 1;
      c.position.set(-3 + u * 6, 1.3 + Math.sin(u * Math.PI * 2 + i) * 0.12, 0.2);
    });
    if (batch.current) {
      const u = (t * 0.25) % 1; // every 4 s a batch drops to layer 1
      batch.current.position.y = THREE.MathUtils.lerp(1.3, -0.75, THREE.MathUtils.smoothstep(u, 0.2, 0.7));
    }
  });
  return (
    <group>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[7, 0.06, 1.6]} />
        <meshStandardMaterial color="#1c2230" emissive={COLORS.signal} emissiveIntensity={0.08} transparent />
      </mesh>
      <Label mono size={0.13} color={COLORS.signal} anchorX="left" position={[-3.5, 1.95, 0]}>LAYER 2 · FAST, CHEAP, OFF THE MAIN CHAIN</Label>
      {Array.from({ length: 10 }, (_, i) => (
        <group key={i} ref={(g) => { chips.current[i] = g; }}>
          <Coin kind="gold" radius={0.14} />
        </group>
      ))}
      <group ref={batch} position={[0.6, 1.3, 0.3]}>
        <ChainBlock size={[1.3, 0.45, 0.12]} edge={COLORS.signal}>
          <Label mono size={0.1} color={COLORS.signal}>BATCH x 1000</Label>
        </ChainBlock>
      </group>
      {[-2.4, -0.8, 0.8, 2.4].map((x, i) => (
        <ChainBlock key={x} position={[x, -1.2, 0]} size={[1.3, 0.7, 0.2]} edge={COLORS.honest}>
          <Label mono size={0.09} color={COLORS.ash}>{`L1 BLOCK ${i + 1}`}</Label>
        </ChainBlock>
      ))}
      {[-1.6, 0, 1.6].map((x) => <Link key={x} flowing points={[[x - 0.15, -1.2, 0], [x + 0.15, -1.2, 0]]} />)}
      <Label mono size={0.13} color={COLORS.honest} anchorX="left" position={[-3.5, -1.85, 0]}>LAYER 1 · SETTLES THE TOTAL</Label>
      <Label mono size={0.11} color={COLORS.ash} position={[0, -2.35, 0]}>LIGHTNING · ARBITRUM · OPTIMISM</Label>
    </group>
  );
}

// ── Greener chains: the mining rig powers down, a plant grows ──
function Green({ rig, plant }: { rig: React.RefObject<THREE.Group | null>; plant: React.RefObject<THREE.Group | null> }) {
  const leaves = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ y: 0.3 + i * 0.28, side: i % 2 ? 1 : -1, s: 0.32 - i * 0.025 })), []);
  return (
    <group>
      <group ref={rig} position={[-2.0, 0.2, 0]}>
        <Monitor color={COLORS.fault} width={1.8}>
          <Label mono size={0.11} color={COLORS.fault} position={[0, 0.15, 0]}>MINING RIG</Label>
          <Label mono size={0.09} color={COLORS.ash} position={[0, -0.08, 0]}>ENERGY-HUNGRY PoW</Label>
        </Monitor>
      </group>
      <group ref={plant} position={[2.0, -1.6, 0]}>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.35, 0.28, 0.4, 24]} />
          <meshStandardMaterial color="#8a5a3c" roughness={0.8} transparent />
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 2.3, 10]} />
          <meshStandardMaterial color="#3f7d2f" roughness={0.7} transparent />
        </mesh>
        {leaves.map((l, i) => (
          <mesh key={i} position={[l.side * 0.22, l.y, 0]} rotation={[0, 0, l.side * -0.7]} scale={[l.s * 1.8, l.s, l.s * 0.3]}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial color={i % 2 ? '#4caf50' : '#66bb6a'} roughness={0.6} transparent />
          </mesh>
        ))}
      </group>
      <Label semi size={0.18} color={COLORS.honest} position={[0, -2.25, 0]}>ETHEREUM’S MERGE (2022): ~99.95% LESS ENERGY</Label>
    </group>
  );
}

function Scene({ step }: { step: number }) {
  const zones = useRef<(THREE.Group | null)[]>([]);
  const rig = useRef<THREE.Group | null>(null);
  const plant = useRef<THREE.Group | null>(null);
  useStepTimeline(step, (tl, next) => {
    const z = zones.current;
    const only = (k: number, at: number, d?: number) => z.forEach((g, i) => fadeTo(tl, g, i === k ? 1 : 0, at, d));
    only(0, 0, 0);
    if (plant.current) tl.set(plant.current.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
    next((at) => only(1, at));
    next((at) => only(2, at));
    next((at) => {
      only(3, at);
      fadeTo(tl, rig.current, 0.25, at + 0.6, 0.6);
      if (plant.current) tl.to(plant.current.scale, { x: 1, y: 1, z: 1, ease: 'back.out(1.3)', duration: 0.9 }, at + 0.6);
    });
  });
  const zone = (i: number, title: string, color: string, el: ReactNode) => (
    <group ref={(g) => { zones.current[i] = g; }} position={[ZX[i], 0, 0]}>
      <Label semi size={0.3} color={color} position={[0, 2.9, 0]}>{title}</Label>
      {el}
    </group>
  );
  return (
    <group>
      {ZX.map((x, i) => <FrameBox key={i} name={`z${i}`} size={[9, 6.4, 1]} position={[x, 0.3, 0]} />)}
      {zone(0, 'HYBRID METHODS', COLORS.stake, <Hybrid />)}
      {zone(1, 'SHARDING', COLORS.vote, <Sharding />)}
      {zone(2, 'LAYER 2', COLORS.signal, <Layer2 />)}
      {zone(3, 'GREENER CHAINS', COLORS.honest, <Green rig={rig} plant={plant} />)}
    </group>
  );
}

const ITEMS = [
  { title: 'Hybrid methods', body: 'Mix two methods to get the best of both: e.g. Ethereum’s Gasper = PoS fork-choice plus Casper voting for quick finality.' },
  { title: 'Sharding', body: 'Split the work into lanes, like opening more billing counters. NEAR uses this.' },
  { title: 'Layer 2', body: 'Do many small payments off the main chain, settle later: like a running tab. Lightning Network, Arbitrum, Optimism.' },
  { title: 'Greener chains', body: 'The industry keeps moving away from energy-hungry mining. Ethereum’s switch to Proof of Stake in 2022 cut its energy use by about 99.95%.' },
];

export const slide20: SlideV2 = {
  Scene,
  steps: ITEMS.map((it, i) => ({
    title: it.title,
    caption: `${it.title}. ${it.body}`,
    camera: { fit: `z${i}`, padding: 0.3 },
    body: <p className="rail-body">{it.body}</p>,
  })),
};
