import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStepTimeline } from '../engine/useStepTimeline';
import { reducedMotion } from '../engine/StepEngine';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { Monitor } from '../world/props';
import { fadeTo } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// Crash vs Byzantine faults on a five-computer network.

const N = 5;
const CRASHED = 2;
const LIAR = 4;
const POS = Array.from({ length: N }, (_, i) => {
  const a = Math.PI / 2 + (i / N) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(a) * 3.6, Math.sin(a) * 2.1 + 0.3, 0);
});
const EDGES: [number, number][] = [];
for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) EDGES.push([a, b]);

/** A message label that keeps travelling from `from` to `to` while visible. */
function Courier({ from, to, text, color, offset = 0 }: { from: THREE.Vector3; to: THREE.Vector3; text: string; color: string; offset?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!g.current) return;
    const t = reducedMotion() ? 0.5 : (state.clock.elapsedTime * 0.45 + offset) % 1;
    g.current.position.lerpVectors(from, to, t).add(new THREE.Vector3(0, 0.25, 0.3));
  });
  return (
    <group ref={g}>
      <ChainBlock size={[0.72, 0.3, 0.06]} edge={color}>
        <Label semi size={0.15} color={color}>{text}</Label>
      </ChainBlock>
    </group>
  );
}

function Scene({ step }: { step: number }) {
  const screens = useRef<(THREE.Group | null)[]>([]);
  const crashLinks = useRef<THREE.Group>(null);
  const lies = useRef<THREE.Group>(null);
  const verdict = useRef<THREE.Group>(null);

  useStepTimeline(step, (tl, next) => {
    const screenOf = (i: number) => {
      let m: THREE.MeshStandardMaterial | null = null;
      screens.current[i]?.traverse((o) => { if (o.userData.role === 'screen') m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial; });
      return m as THREE.MeshStandardMaterial | null;
    };
    fadeTo(tl, lies.current, 0, 0, 0);
    fadeTo(tl, verdict.current, 0, 0, 0);
    // 1. crash: one computer simply goes dark and its links go quiet
    const crashed = screenOf(CRASHED);
    if (crashed) tl.to(crashed, { emissiveIntensity: 0 }, 0.2);
    fadeTo(tl, crashLinks.current, 0.08, 0.2, 0.6);
    // 2. byzantine: the crashed one recovers; another starts lying
    next((at) => {
      if (crashed) tl.to(crashed, { emissiveIntensity: 0.045 }, at);
      fadeTo(tl, crashLinks.current, 1, at, 0.4);
      fadeTo(tl, lies.current, 1, at + 0.3, 0.4);
    });
    // 3. which methods handle which
    next((at) => {
      fadeTo(tl, lies.current, 0.35, at, 0.4);
      fadeTo(tl, verdict.current, 1, at + 0.2, 0.5);
    });
  });

  const state = (i: number) =>
    step === 0 && i === CRASHED ? 'crash' : step >= 1 && i === LIAR ? 'liar' : 'ok';

  return (
    <group>
      <FrameBox name="net" size={[9.8, 6.4, 1]} position={[0, 0.2, 0]} />
      <FrameBox name="all" size={[11.4, 8.2, 1]} position={[0, -0.6, 0]} />
      {EDGES.map(([a, b]) =>
        a === CRASHED || b === CRASHED ? null : (
          <Link key={`${a}-${b}`} color={a === LIAR || b === LIAR ? (step >= 1 ? COLORS.fault : COLORS.honest) : COLORS.honest} opacity={0.4} flowing points={[POS[a], POS[b]]} />
        ),
      )}
      <group ref={crashLinks}>
        {EDGES.filter(([a, b]) => a === CRASHED || b === CRASHED).map(([a, b]) => (
          <Link key={`${a}-${b}`} color={COLORS.honest} opacity={0.4} flowing points={[POS[a], POS[b]]} />
        ))}
      </group>
      {POS.map((p, i) => {
        const s = state(i);
        const c = s === 'liar' ? COLORS.fault : s === 'crash' ? COLORS.ash : COLORS.honest;
        return (
          <Monitor key={i} ref={(g) => { screens.current[i] = g; }} position={p} color={c} width={1.7}>
            <Label mono size={0.12} color={c} position={[0, 0.14, 0]}>{`NODE ${i + 1}`}</Label>
            <Label mono size={0.1} color={COLORS.ash} position={[0, -0.12, 0]}>
              {s === 'crash' ? 'OFFLINE · SILENT' : s === 'liar' ? 'BYZANTINE · LYING' : 'HONEST'}
            </Label>
          </Monitor>
        );
      })}
      <group ref={lies}>
        <Courier from={POS[LIAR]} to={POS[0]} text="YES" color={COLORS.honest} />
        <Courier from={POS[LIAR]} to={POS[2]} text="NO" color={COLORS.fault} offset={0.5} />
      </group>
      <group ref={verdict} position={[0, -3.3, 0.4]}>
        <ChainBlock position={[-2.6, 0, 0]} size={[4.6, 0.9, 0.2]} edge={COLORS.ash}>
          <Label mono size={0.1} color={COLORS.ash} position={[0, 0.2, 0]}>CRASHES ONLY (EASIER)</Label>
          <Label semi size={0.2} color={COLORS.bone} position={[0, -0.12, 0]}>Raft  ·  Paxos</Label>
        </ChainBlock>
        <ChainBlock position={[2.6, 0, 0]} size={[4.6, 0.9, 0.2]} edge={COLORS.fault}>
          <Label mono size={0.1} color={COLORS.fault} position={[0, 0.2, 0]}>LIARS TOO (HARDER)</Label>
          <Label semi size={0.2} color={COLORS.bone} position={[0, -0.12, 0]}>PBFT  ·  PoW  ·  PoS</Label>
        </ChainBlock>
      </group>
    </group>
  );
}

export const slide10: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'Crash fault',
      caption: 'Crash fault: the computer just stops and goes silent. The others notice and carry on.',
      camera: { fit: 'net', padding: 0.3 },
      body: <p className="rail-body">The computer just stops: it goes silent. Like a friend whose phone dies mid-call. The others simply notice and carry on.</p>,
    },
    {
      title: 'Byzantine fault',
      caption: 'Byzantine fault: the computer lies, telling different people different things.',
      camera: { fit: 'net', padding: 0.3 },
      body: (
        <p className="rail-body">
          The computer lies, or tells different people different things: <b style={{ color: 'var(--honest)' }}>“yes”</b> to one, <b style={{ color: 'var(--fault)' }}>“no”</b> to another. Far more dangerous: the lie looks like a normal message.
        </p>
      ),
    },
    {
      title: 'Which methods handle which?',
      caption: 'Crashes only: Raft and Paxos. Liars too: PBFT, Proof of Work, Proof of Stake.',
      camera: { fit: 'all', padding: 0.3 },
      body: <p className="rail-body">Easier to handle (crashes only): <b>Raft, Paxos</b>. Harder to handle (liars too): <b>PBFT, PoW, PoS</b>.</p>,
    },
  ],
};
