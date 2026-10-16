import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useStepTimeline } from '../engine/useStepTimeline';
import { reducedMotion } from '../engine/StepEngine';
import { GlassNode, FrameBox, Label } from '../world/primitives';
import { fadeTo, colorTo, coreOf } from '../world/anim';
import { COLORS, GLOW } from '../config/world';
import type { SlideV2 } from './registry';

type Topology = 'centralized' | 'decentralized' | 'distributed';
const TOPOLOGIES: Topology[] = ['centralized', 'decentralized', 'distributed'];
const N = 12;

// Same 12 nodes, three position sets: the timeline morphs between them, the scene never swaps.
function layout(t: Topology): THREE.Vector3[] {
  if (t === 'centralized') {
    return [
      new THREE.Vector3(0, 0, 0),
      ...Array.from({ length: N - 1 }, (_, k) => {
        const a = (k / (N - 1)) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * 3.4, Math.sin(a) * 2.2, Math.sin(a) * 1.2);
      }),
    ];
  }
  if (t === 'decentralized') {
    const hubs = [new THREE.Vector3(-3.2, 1.2, 0), new THREE.Vector3(3.2, 1.2, 0), new THREE.Vector3(0, -1.5, 0.8)];
    return [
      ...hubs,
      ...Array.from({ length: N - 3 }, (_, k) => {
        const hub = hubs[k % 3];
        const a = (Math.floor(k / 3) / 3) * Math.PI * 2 + k;
        return new THREE.Vector3(hub.x + Math.cos(a) * 1.4, hub.y + Math.sin(a) * 1.1, hub.z + Math.sin(a) * 0.6);
      }),
    ];
  }
  // distributed: an even shell, everyone equal
  return Array.from({ length: N }, (_, k) => {
    const phi = Math.acos(-1 + (2 * k + 1) / N);
    const theta = Math.sqrt(N * Math.PI) * phi;
    return new THREE.Vector3(3.4 * Math.cos(theta) * Math.sin(phi), 2.3 * Math.sin(theta) * Math.sin(phi), 1.4 * Math.cos(phi));
  });
}

function edges(t: Topology, pos: THREE.Vector3[]): [number, number][] {
  const out: [number, number][] = [];
  if (t === 'centralized') for (let k = 1; k < N; k++) out.push([0, k]);
  else if (t === 'decentralized') {
    for (let k = 3; k < N; k++) out.push([(k - 3) % 3, k]);
    out.push([0, 1], [1, 2], [0, 2]);
  } else {
    for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) if (pos[a].distanceTo(pos[b]) < 2.9) out.push([a, b]);
  }
  return out;
}

const NET = TOPOLOGIES.map((t) => {
  const pos = layout(t);
  return { pos, pairs: edges(t, pos) };
});

const ROLE_COLOR = (t: number, k: number) =>
  t === 0 && k === 0 ? COLORS.signal : t === 1 && k < 3 ? COLORS.vote : COLORS.honest;

/** Messages travelling along the active topology's links: one InstancedMesh, additive glow.
 *  Reads the nodes' live positions, so packets ride along while the network morphs. */
function Packets({ topo, nodes }: { topo: number; nodes: RefObject<(THREE.Group | null)[]> }) {
  const COUNT = 28;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const state = useMemo(() => Array.from({ length: COUNT }, (_, k) => ({ edge: k, t: (k * 0.37) % 1, speed: 0.35 + ((k * 7) % 5) * 0.06 })), []);
  const tmp = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const { pairs } = NET[topo];
    const live = nodes.current;
    const still = reducedMotion();
    state.forEach((p, k) => {
      if (!still) p.t += p.speed * delta;
      if (p.t >= 1) {
        p.t -= 1;
        p.edge = (p.edge * 7 + 3) % pairs.length;
      }
      const [a, b] = pairs[p.edge % pairs.length];
      const pa = live[a]?.position;
      const pb = live[b]?.position;
      if (!pa || !pb) return;
      tmp.position.lerpVectors(pa, pb, p.t);
      tmp.scale.setScalar(Math.sin(p.t * Math.PI) * 0.06 + 0.01);
      tmp.updateMatrix();
      m.setMatrixAt(k, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} name="packets" frustumCulled={false}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color={COLORS.honest} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}

function Scene({ step }: { step: number }) {
  const nodes = useRef<(THREE.Group | null)[]>([]);
  const linkSets = useRef<(THREE.Group | null)[]>([]);
  const packets = useRef<THREE.Group>(null);
  const topo = Math.min(step, 2);

  useStepTimeline(step, (tl, next) => {
    const morph = (to: number, at: number) => {
      nodes.current.forEach((g, k) => {
        if (!g) return;
        const p = NET[to].pos[k];
        tl.to(g.position, { x: p.x, y: p.y, z: p.z, ease: 'power2.inOut' }, at);
        const s = to === 0 && k === 0 ? 1.6 : to === 1 && k < 3 ? 1.3 : 1;
        tl.to(g.scale, { x: s, y: s, z: s, ease: 'power2.inOut' }, at);
        const core = coreOf(g);
        colorTo(tl, core?.color, ROLE_COLOR(to, k), at);
        colorTo(tl, core?.emissive, ROLE_COLOR(to, k), at);
        if (core) tl.to(core, { emissiveIntensity: s > 1 ? GLOW.active : GLOW.idle }, at);
      });
      linkSets.current.forEach((g, j) => fadeTo(tl, g, j === to ? 1 : 0, j === to ? at + 0.45 : at, j === to ? 0.5 : 0.3));
    };
    // step-0 state
    nodes.current.forEach((g, k) => {
      if (!g) return;
      const s = k === 0 ? 1.6 : 1;
      tl.set(g.scale, { x: s, y: s, z: s }, 0);
      const core = coreOf(g);
      if (core && k === 0) tl.set(core, { emissiveIntensity: GLOW.active }, 0);
    });
    linkSets.current.forEach((g, j) => j > 0 && fadeTo(tl, g, 0, 0, 0));
    next((at) => morph(1, at));
    next((at) => morph(2, at));
  });

  return (
    <group>
      <FrameBox name="net" size={[8.4, 5.6, 3]} />
      {NET[0].pos.map((p, k) => (
        <group key={k} position={p} ref={(g) => { nodes.current[k] = g; }}>
          <GlassNode radius={0.26} color={ROLE_COLOR(0, k)} selected={step === 0 ? k === 0 : step === 1 ? k < 3 : false} />
        </group>
      ))}
      {NET.map((n, j) => (
        <group key={j} ref={(g) => { linkSets.current[j] = g; }}>
          <Line
            segments
            points={n.pairs.flatMap(([a, b]) => [n.pos[a], n.pos[b]])}
            color={j === 0 ? COLORS.signal : j === 1 ? COLORS.vote : COLORS.honest}
            lineWidth={1.5}
            transparent
            opacity={0.55}
          />
        </group>
      ))}
      <group ref={packets}>
        <Packets topo={topo} nodes={nodes} />
      </group>
      <Label mono size={0.14} color={COLORS.ash} position={[0, -3.0, 0]}>
        {['ONE CENTRE  ·  SINGLE POINT OF FAILURE', 'A FEW HUBS  ·  POWER STILL CONCENTRATED', 'EVERY NODE EQUAL  ·  FULL COPY EACH'][topo]}
      </Label>
    </group>
  );
}

const INFO = [
  { title: 'Centralized', sub: 'One bank holds all the records.', detail: 'A single point of failure: if the centre goes down, everything stops.', color: 'var(--fault)', badge: null },
  { title: 'Decentralized', sub: 'A few big branches share control.', detail: 'More resilient, but power still concentrates in a few hubs.', color: 'var(--vote)', badge: null },
  { title: 'Distributed', sub: 'Everyone keeps a full copy, like a group chat.', detail: 'Any node can leave; the network keeps working.', color: 'var(--honest)', badge: 'Blockchain lives here' },
];

export const slide05: SlideV2 = {
  Scene,
  steps: INFO.map((info, i) => ({
    title: info.title,
    caption: `${info.title}: ${info.sub} ${info.detail}`,
    camera: [
      { pos: [0, 0.6, 13], target: [0, -0.3, 0] },
      { pos: [2.6, 1.6, 12.6], target: [0, -0.3, 0] },
      { pos: [-2.2, 2.4, 12.4], target: [0, -0.3, 0] },
    ][i] as { pos: [number, number, number]; target: [number, number, number] },
    body: (
      <div className="flex flex-col gap-static-sm">
        {info.badge && <span className="rail-badge">{info.badge}</span>}
        <p className="rail-lead" style={{ color: 'var(--bone)' }}>{info.sub}</p>
        <p className="rail-body">{info.detail}</p>
      </div>
    ),
  })),
};
