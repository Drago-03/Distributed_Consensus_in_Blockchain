import { useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useStepTimeline } from '../engine/useStepTimeline';
import { reducedMotion } from '../engine/StepEngine';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { Monitor, Coin, GlowNode } from '../world/props';
import { fadeTo } from '../world/anim';
import { COLORS, FONTS } from '../config/world';
import type { SlideV2 } from './registry';

// Three more methods, three small worlds side by side; the camera visits each.

const POA_X = -11;
const POH_X = 0;
const POET_X = 11;

/** Proof of Authority: three known signers take turns sealing blocks. */
function Authority() {
  const signers = ['SIGNER A', 'SIGNER B', 'SIGNER C'];
  return (
    <group>
      {signers.map((s, i) => (
        <group key={s} position={[(i - 1) * 2.1, 1.4, 0]}>
          <Monitor color={COLORS.trust} width={1.6}>
            <Label mono size={0.11} color={COLORS.trust} position={[0, 0.16, 0]}>{s}</Label>
            <Label mono size={0.08} color={COLORS.ash} position={[0, -0.06, 0]}>APPROVED · KNOWN ID</Label>
          </Monitor>
          <Coin kind="gold" radius={0.2} position={[0.62, 0.32, 0.12]} />
        </group>
      ))}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[(i - 1) * 2.1, -1.1, 0]}>
          <ChainBlock size={[1.7, 0.95, 0.22]} edge={COLORS.trust}>
            <Label mono size={0.09} color={COLORS.ash} position={[0, 0.22, 0]}>{`BLOCK ${120 + i}`}</Label>
            <Label semi size={0.11} color={COLORS.trust} position={[0, -0.06, 0]}>{`sealed by ${signers[i].split(' ')[1]}`}</Label>
          </ChainBlock>
          <Link flowing color={COLORS.trust} opacity={0.5} points={[[0, 1.85, 0], [0, 0.5, 0]]} />
        </group>
      ))}
      {[0, 1].map((i) => <Link key={i} flowing color={COLORS.trust} points={[[(i - 1) * 2.1 + 0.85, -1.1, 0], [i * 2.1 - 0.85, -1.1, 0]]} />)}
    </group>
  );
}

/** Proof of History: a hash-clock ticking forward; every event gets stamped with its tick. */
function HistoryClock() {
  const tape = useRef<THREE.Group>(null);
  const counter = useRef<THREE.Mesh & { text: string; sync: () => void }>(null);
  const tick = useRef(1048570);
  const acc = useRef(0);
  const W = 1.05;
  useFrame((_, delta) => {
    if (reducedMotion()) return;
    if (tape.current) tape.current.position.x = ((tape.current.position.x - delta * 0.9) % W + W) % W - W;
    acc.current += delta;
    if (acc.current > 0.12 && counter.current) {
      acc.current = 0;
      tick.current += 1;
      counter.current.text = `tick ${tick.current.toLocaleString('en-US')}`;
      counter.current.sync();
    }
  });
  return (
    <group>
      <Text ref={counter} font={FONTS.mono} fontSize={0.24} color={COLORS.stake} position={[0, 1.9, 0]} anchorX="center">
        tick 1,048,570
      </Text>
      <Label mono size={0.1} color={COLORS.ash} position={[0, 1.55, 0]}>EACH TICK = HASH OF THE PREVIOUS TICK</Label>
      {/* the clock tape: a conveyor of hash cells */}
      <group position={[0, 0.4, 0]}>
        <group ref={tape}>
          {Array.from({ length: 8 }, (_, i) => (
            <group key={i} position={[(i - 3.5) * W, 0, 0]}>
              <ChainBlock size={[0.95, 0.5, 0.12]} edge={COLORS.stake}>
                <Label mono size={0.08} color={COLORS.stake}>{['3f9a', '7c21', 'b04e', '19d3', 'e5a7', '62bf', 'a8c0', '0d4e'][i]}</Label>
              </ChainBlock>
            </group>
          ))}
        </group>
      </group>
      {[
        { x: -1.6, t: 'Tx A  @ tick 1,048,541' },
        { x: 0.2, t: 'Tx B  @ tick 1,048,556' },
        { x: 2.0, t: 'Tx C  @ tick 1,048,569' },
      ].map((e) => (
        <group key={e.t} position={[e.x, -0.85, 0.2]}>
          <ChainBlock size={[1.7, 0.42, 0.1]} edge={COLORS.honest}>
            <Label mono size={0.085} color={COLORS.bone}>{e.t}</Label>
          </ChainBlock>
          <Link color={COLORS.honest} opacity={0.5} points={[[0, 0.21, 0], [0, 0.95, -0.2]]} />
        </group>
      ))}
      <Label mono size={0.1} color={COLORS.ash} position={[0, -1.55, 0]}>ORDER IS PROVEN BY THE CLOCK, NOT ARGUED ABOUT</Label>
    </group>
  );
}

/** Proof of Elapsed Time: everyone waits a random time; the shortest wait wins. */
const WAITS = [3.1, 2.2, 3.6, 1.6, 2.8];
function ElapsedRace() {
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  const crown = useRef<THREE.Group>(null);
  const winner = WAITS.indexOf(Math.min(...WAITS));
  useFrame((state) => {
    const t = reducedMotion() ? Math.min(...WAITS) : state.clock.elapsedTime % 4.5;
    bars.current.forEach((b, i) => {
      if (!b) return;
      const left = Math.max(0, 1 - t / WAITS[i]);
      b.scale.x = Math.max(0.001, left);
      b.position.x = -1 + left; // shrink toward the left edge
    });
    if (crown.current) crown.current.visible = t >= WAITS[winner];
  });
  return (
    <group>
      {WAITS.map((w, i) => {
        const y = 1.6 - i * 0.75;
        return (
          <group key={i} position={[0, y, 0]}>
            <GlowNode radius={0.17} color={i === winner ? '#2BFF88' : '#6FB7FF'} position={[-1.7, 0, 0]} pulse={false} />
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[2, 0.16, 0.04]} />
              <meshStandardMaterial color="#1b1e24" transparent />
            </mesh>
            <mesh ref={(m) => { bars.current[i] = m; }} position={[0, 0, 0.03]}>
              <boxGeometry args={[2, 0.16, 0.04]} />
              <meshBasicMaterial color={i === winner ? [0.3, 2, 1.1] : [0.5, 1, 2]} toneMapped={false} transparent />
            </mesh>
            <Label mono size={0.09} color={COLORS.ash} position={[1.45, 0, 0]}>{`${w.toFixed(1)}s`}</Label>
          </group>
        );
      })}
      <group ref={crown} position={[-1.7, 1.6 - winner * 0.75 + 0.42, 0]}>
        <Label semi size={0.14} color={COLORS.honest}>WINS THE BLOCK</Label>
      </group>
      <Label mono size={0.1} color={COLORS.ash} position={[0, -2.05, 0]}>RANDOM TIMER PER NODE · SHORTEST WAIT WINS</Label>
    </group>
  );
}

function Scene({ step }: { step: number }) {
  const zones = useRef<(THREE.Group | null)[]>([]);
  useStepTimeline(step, (tl, next) => {
    // only the zone being explained is visible; the others fade out entirely
    const z = zones.current;
    const only = (k: number, at: number, d?: number) => z.forEach((g, i) => fadeTo(tl, g, i === k ? 1 : 0, at, d));
    only(0, 0, 0);
    next((at) => only(1, at));
    next((at) => only(2, at));
  });
  const zone = (i: number, x: number, title: string, color: string, el: ReactNode) => (
    <group ref={(g) => { zones.current[i] = g; }} position={[x, 0, 0]}>
      <Label semi size={0.26} color={color} position={[0, 2.75, 0]}>{title}</Label>
      {el}
    </group>
  );
  return (
    <group>
      <FrameBox name="poa" size={[7, 6.4, 1]} position={[POA_X, 0.5, 0]} />
      <FrameBox name="poh" size={[7, 6.4, 1]} position={[POH_X, 0.5, 0]} />
      <FrameBox name="poet" size={[7, 6.4, 1]} position={[POET_X, 0.5, 0]} />
      {zone(0, POA_X, 'PROOF OF AUTHORITY', COLORS.trust, <Authority />)}
      {zone(1, POH_X, 'PROOF OF HISTORY', COLORS.stake, <HistoryClock />)}
      {zone(2, POET_X, 'PROOF OF ELAPSED TIME', COLORS.vote, <ElapsedRace />)}
    </group>
  );
}

const ITEMS = [
  { title: 'Proof of Authority', body: 'A few known, approved people sign blocks: like attendance signed only by approved teachers.', sub: 'VeChain, private chains', css: 'var(--trust)' },
  { title: 'Proof of History', body: 'A built-in clock stamps the order of events: like a timestamp on every photo you take.', sub: 'Solana (with PoS)', css: 'var(--stake)' },
  { title: 'Proof of Elapsed Time', body: 'Everyone waits a random time. Shortest wait wins: like a race where each runner gets a random timer.', sub: 'Hyperledger Sawtooth (Intel)', css: 'var(--vote)' },
];

export const slide16: SlideV2 = {
  Scene,
  steps: ITEMS.map((it, i) => ({
    title: it.title,
    caption: `${it.title}: ${it.body} Used by ${it.sub}.`,
    camera: { fit: ['poa', 'poh', 'poet'][i], padding: 0.3 },
    body: (
      <div className="flex flex-col gap-static-sm">
        <p className="rail-body">{it.body}</p>
        <p className="rail-kicker" style={{ color: it.css }}>{it.sub}</p>
      </div>
    ),
  })),
};
