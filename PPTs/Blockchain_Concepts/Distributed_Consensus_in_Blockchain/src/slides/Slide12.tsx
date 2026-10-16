import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStepTimeline } from '../engine/useStepTimeline';
import { reducedMotion } from '../engine/StepEngine';
import { ChainBlock, Label, FrameBox } from '../world/primitives';
import { fadeTo } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// The consensus family tree as an actual tree: roots + trunk = consensus methods,
// two main branches = proof-based / voting-based, outer branches = the methods themselves.

const FLOOR = -2.4;
const BARK = '#5a3b24';
const BARK_DARK = '#3f2716';
const GREENS = ['#2f7d32', '#3f9142', '#56a04a', '#2a6b2e', '#4c8c3a'];
type V = [number, number, number];

function Branch({ points, radius, color = BARK }: { points: V[]; radius: number; color?: string }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, 32, radius, 14, false);
  }, [points, radius]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.9} transparent />
    </mesh>
  );
}

/** A leafy canopy: overlapping spheres in a few greens, swaying gently. */
function Canopy({ size = 0.75, seed = 0 }: { size?: number; seed?: number }) {
  const g = useRef<THREE.Group>(null);
  const blobs = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = i * 2.4 + seed;
        const r = i === 0 ? 0 : size * 0.55;
        return { p: [Math.cos(a) * r, Math.sin(a * 1.3) * r * 0.55 + (i === 0 ? 0.1 : 0), Math.sin(a) * r * 0.6] as V, s: size * (i === 0 ? 0.75 : 0.5 + ((i * 7) % 4) * 0.06), c: GREENS[(i + seed) % GREENS.length] };
      }),
    [size, seed],
  );
  useFrame((state) => {
    if (g.current && !reducedMotion()) g.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + seed) * 0.04;
  });
  return (
    <group ref={g}>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} scale={b.s}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color={b.c} roughness={0.85} transparent />
        </mesh>
      ))}
    </group>
  );
}

function Tag({ title, sub, color, position }: { title: string; sub: string; color: string; position: V }) {
  return (
    <ChainBlock position={position} size={[1.55, 0.62, 0.08]} edge={color}>
      <Label semi size={0.2} color={COLORS.bone} position={[0, 0.09, 0]}>{title}</Label>
      <Label size={0.11} color={color} position={[0, -0.16, 0]}>{sub}</Label>
    </ChainBlock>
  );
}

// sub-branches: start at the fork of their main branch, end at a canopy
const PROOF_FORK: V = [-2.6, 1.6, 0];
const VOTE_FORK: V = [2.6, 1.6, 0];
const PROOF = [
  { title: 'PoW', sub: 'Work', color: COLORS.signal, end: [-5.3, 2.0, 0] as V, mid: [-4.0, 1.6, 0.2] as V },
  { title: 'PoS', sub: 'Stake', color: COLORS.stake, end: [-4.6, 3.6, -0.2] as V, mid: [-3.6, 2.4, 0] as V },
  { title: 'DPoS', sub: 'Votes', color: COLORS.vote, end: [-2.9, 4.3, 0] as V, mid: [-2.8, 2.9, 0.1] as V },
  { title: 'PoA', sub: 'Trust', color: COLORS.trust, end: [-1.3, 3.5, 0.2] as V, mid: [-1.9, 2.5, 0.1] as V },
];
const VOTING = [
  { title: 'PBFT', sub: 'Voting rounds', color: COLORS.vote, end: [1.9, 3.7, 0] as V, mid: [2.2, 2.6, 0.1] as V },
  { title: 'Raft / Paxos', sub: 'Follow a leader', color: COLORS.vote, end: [4.8, 3.0, 0] as V, mid: [3.8, 2.1, 0.1] as V },
];

function Scene({ step }: { step: number }) {
  const mains = useRef<(THREE.Group | null)[]>([]);
  const proof = useRef<(THREE.Group | null)[]>([]);
  const voting = useRef<(THREE.Group | null)[]>([]);
  const mainTags = useRef<THREE.Group>(null);

  useStepTimeline(step, (tl, next) => {
    const hide = (g: THREE.Object3D | null) => {
      if (!g) return;
      tl.set(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
    };
    const grow = (g: THREE.Object3D | null, at: number) => {
      if (g) tl.to(g.scale, { x: 1, y: 1, z: 1, ease: 'power2.out', duration: 0.9 }, at);
    };
    [...mains.current, ...proof.current, ...voting.current].forEach(hide);
    fadeTo(tl, mainTags.current, 0, 0, 0);
    next((at) => {
      mains.current.forEach((g, i) => grow(g, at + i * 0.1));
      fadeTo(tl, mainTags.current, 1, at + 0.6, 0.4);
    });
    next((at) => proof.current.forEach((g, i) => grow(g, at + i * 0.12)));
    next((at) => voting.current.forEach((g, i) => grow(g, at + i * 0.12)));
  });

  return (
    <group>
      <FrameBox name="trunk" size={[6, 4.4, 2]} position={[0, -0.6, 0]} />
      <FrameBox name="crown" size={[9, 6.4, 2]} position={[0, 0.3, 0]} />
      <FrameBox name="tree" size={[13, 8.2, 2]} position={[0, 0.9, 0]} />

      {/* roots and soil */}
      <mesh position={[0, FLOOR, 0]} scale={[1.6, 0.25, 1.2]}>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3a2a1d" roughness={1} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        return (
          <Branch
            key={i}
            radius={0.07}
            color={BARK_DARK}
            points={[[0, FLOOR + 0.35, 0], [Math.cos(a) * 0.9, FLOOR + 0.12, Math.sin(a) * 0.7], [Math.cos(a) * 2.0, FLOOR + 0.02, Math.sin(a) * 1.4]]}
          />
        );
      })}
      {/* trunk */}
      <mesh position={[0, FLOOR + 1.5, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 3.0, 24]} />
        <meshStandardMaterial color={BARK} roughness={0.92} transparent />
      </mesh>
      <ChainBlock position={[0, FLOOR + 1.2, 0.55]} size={[2.5, 0.62, 0.08]} edge={COLORS.bone}>
        <Label semi size={0.2} color={COLORS.bone}>CONSENSUS METHODS</Label>
      </ChainBlock>

      {/* two main branches */}
      {[
        [[0, 0.3, 0], [-1.0, 1.0, 0.1], PROOF_FORK],
        [[0, 0.3, 0], [1.0, 1.0, 0.1], VOTE_FORK],
      ].map((pts, i) => (
        <group key={i} ref={(g) => { mains.current[i] = g; }} position={[0, 0.3, 0]}>
          <group position={[0, -0.3, 0]}>
            <Branch radius={0.17} points={pts as V[]} />
          </group>
        </group>
      ))}
      <group ref={mainTags}>
        <Tag title="PROOF-BASED" sub="win by work or stake" color={COLORS.signal} position={[-1.6, 0.55, 0.6]} />
        <Tag title="VOTING-BASED" sub="agree by rounds of messages" color={COLORS.vote} position={[1.6, 0.55, 0.6]} />
      </group>

      {[
        { list: PROOF, fork: PROOF_FORK, refs: proof },
        { list: VOTING, fork: VOTE_FORK, refs: voting },
      ].map(({ list, fork, refs }) =>
        list.map((m, i) => (
          <group key={m.title} ref={(g) => { refs.current[i] = g; }} position={fork}>
            <group position={fork.map((v) => -v) as V}>
              <Branch radius={0.08} points={[fork, m.mid, m.end]} />
              <group position={m.end}>
                <Canopy size={0.95} seed={i * 3 + (fork[0] > 0 ? 7 : 0)} />
              </group>
              <Tag title={m.title} sub={m.sub} color={m.color} position={[m.end[0], m.end[1] - 1.05, m.end[2] + 0.55]} />
            </group>
          </group>
        )),
      )}
    </group>
  );
}

export const slide12: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'Consensus methods',
      caption: 'Every method we study belongs to one family tree.',
      camera: { fit: 'trunk', padding: 0.3 },
      body: <p className="rail-body">Every method we study belongs to one family tree. The roots and trunk: <b>consensus methods</b>.</p>,
    },
    {
      title: 'Two branches',
      caption: 'Proof-based: win by doing work or putting up stake. Voting-based: agree through rounds of messages.',
      camera: { fit: 'crown', padding: 0.3 },
      body: (
        <dl className="rail-defs">
          <div><dt style={{ color: 'var(--signal)' }}>Proof-based</dt><dd>Win by doing work or putting up stake.</dd></div>
          <div><dt style={{ color: 'var(--vote)' }}>Voting-based</dt><dd>Agree through rounds of messages.</dd></div>
        </dl>
      ),
    },
    {
      title: 'Proof-based leaves',
      caption: 'Proof of Work, Proof of Stake, Delegated Proof of Stake, Proof of Authority.',
      camera: { fit: 'tree', padding: 0.3 },
      body: <p className="rail-body">PoW (Work), PoS (Stake), DPoS (Votes), PoA (Trust).</p>,
    },
    {
      title: 'Voting-based leaves',
      caption: 'PBFT, voting rounds. Raft and Paxos, follow a leader.',
      camera: { fit: 'tree', padding: 0.3 },
      body: <p className="rail-body">PBFT (Voting rounds), Raft / Paxos (Follow a leader).</p>,
    },
  ],
};
