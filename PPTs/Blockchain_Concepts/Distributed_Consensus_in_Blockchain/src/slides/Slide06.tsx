import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { Label, Link } from '../world/primitives';
import { Monitor } from '../world/props';
import { Banner, BANNERS, ClashingSwords, Palace, Shield } from '../world/medieval';
import { fadeTo, focusOn } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// The Byzantine Generals Problem, told with Viking kingdoms besieging England.
// Allies' banners ring the White Tower; when they move together their swords clash at the walls.

const FLOOR = -2.4;
const GENERALS = [
  { name: 'DENMARK', art: BANNERS.denmark, shield: ['#C8102E', '#ffffff'], pos: new THREE.Vector3(-5.6, FLOOR, 1.2) },
  { name: 'NORWAY', art: BANNERS.norway, shield: ['#BA0C2F', '#00205B'], pos: new THREE.Vector3(5.6, FLOOR, 1.2) },
  { name: 'SWEDEN', art: BANNERS.sweden, shield: ['#006AA7', '#FECC00'], pos: new THREE.Vector3(-4.4, FLOOR, -3.0) },
  { name: 'RAVEN BANNER', art: BANNERS.raven, shield: ['#EFE7D2', '#111111'], pos: new THREE.Vector3(4.4, FLOOR, -3.0) },
] as const;
const TRAITOR = 1;
// where each army meets the walls
const front = (i: number) => GENERALS[i].pos.clone().multiplyScalar(0.6).setY(FLOOR + 1.05);
// computers float above each army once the story is translated
const screenAt = (i: number) => GENERALS[i].pos.clone().add(new THREE.Vector3(0.6, 4.6, 0));

function Scene({ step }: { step: number }) {
  const palace = useRef<THREE.Group>(null);
  const armies = useRef<(THREE.Group | null)[]>([]);
  const swords = useRef<(THREE.Group | null)[]>([]);
  const redFlag = useRef<THREE.Group>(null);
  const traitorTag = useRef<THREE.Group>(null);
  const computers = useRef<THREE.Group>(null);

  useStepTimeline(step, (tl, next) => {
    const hide = (g: THREE.Object3D | null) => {
      if (!g) return;
      tl.set(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
      fadeTo(tl, g, 0, 0, 0);
    };
    const show = (g: THREE.Object3D | null, at: number) => {
      if (!g) return;
      tl.to(g.scale, { x: 1, y: 1, z: 1, ease: 'back.out(1.4)' }, at);
      fadeTo(tl, g, 1, at, 0.4);
    };
    [...swords.current, redFlag.current, traitorTag.current, computers.current].forEach(hide);

    // 2. attack together: every army's swords clash at the walls
    next((at) => swords.current.forEach((g, i) => show(g, at + i * 0.1)));
    // 3. one general betrays: his swords drop, a red flag goes up
    next((at) => {
      const g = swords.current[TRAITOR];
      if (g) {
        tl.to(g.scale, { x: 0.001, y: 0.001, z: 0.001, ease: 'power2.in', duration: 0.4 }, at);
        fadeTo(tl, g, 0, at, 0.4);
      }
      if (redFlag.current) {
        tl.set(redFlag.current.scale, { x: 1, z: 1 }, at + 0.3);
        tl.fromTo(redFlag.current.scale, { y: 0.001 }, { y: 1, ease: 'power3.out' }, at + 0.3);
        fadeTo(tl, redFlag.current, 1, at + 0.3, 0.3);
      }
      show(traitorTag.current, at + 0.5);
    });
    // 4. in blockchain terms: generals become computers
    next((at) => {
      focusOn(tl, at, [palace.current, ...armies.current, ...swords.current, redFlag.current], []);
      show(computers.current, at + 0.2);
    });
  });

  return (
    <group>

      <Palace ref={palace} position={[0, FLOOR, -0.4]} scale={0.82} />
      {/* St George's banner over England */}
      <Banner art={BANNERS.stGeorge} position={[0.78, FLOOR + 2.75, -1.15]} poleHeight={1.1} width={0.8} wind={0.8} />
      <Label semi size={0.22} color={COLORS.bone} position={[0, FLOOR + 0.3, 2.3]}>ENGLAND  ·  THE WHITE TOWER</Label>

      {GENERALS.map((g, i) => (
        <group key={g.name} ref={(el) => { armies.current[i] = el; }} position={g.pos}>
          <Banner art={g.art} poleHeight={2.8} width={1.45} />
          <Shield colors={g.shield as unknown as [string, string]} position={[-0.25, 0.48, 0.32]} rotation={[-0.25, 0.3, 0]} />
          <Label semi size={0.17} color={i === TRAITOR && step >= 2 ? COLORS.fault : COLORS.bone} position={[0.7, 3.25, 0]}>
            {`GENERAL ${i + 1}  ·  ${g.name}`}
          </Label>
        </group>
      ))}

      {GENERALS.map((_, i) => (
        <group key={i} position={front(i)}>
          <ClashingSwords ref={(el) => { swords.current[i] = el; }} phase={i * 0.08} scale={0.85} />
        </group>
      ))}

      <group position={front(TRAITOR).setY(FLOOR)}>
        <group ref={redFlag}>
          <Banner art={BANNERS.traitor} poleHeight={1.9} width={1.0} wind={1.6} />
        </group>
      </group>
      <group ref={traitorTag} position={front(TRAITOR).setY(FLOOR + 2.55)}>
        <Label semi size={0.16} color={COLORS.fault}>{'"ATTACK AT 6"  /  "ATTACK AT 9"'}</Label>
      </group>

      <group ref={computers}>
        {GENERALS.map((g, i) => (
          <Monitor key={g.name} position={screenAt(i)} color={i === TRAITOR ? COLORS.fault : COLORS.honest} width={2}>
            <Label mono size={0.16} color={i === TRAITOR ? COLORS.fault : COLORS.honest} position={[0, 0.16, 0]}>
              {`NODE ${i + 1}`}
            </Label>
            <Label mono size={0.12} color={COLORS.ash} position={[0, -0.16, 0]}>
              {i === TRAITOR ? 'FAULTY / HACKED' : 'HONEST'}
            </Label>
          </Monitor>
        ))}
        {[[0, 1], [0, 2], [1, 3], [2, 3], [0, 3], [1, 2]].map(([a, b]) => (
          <Link key={`${a}-${b}`} flowing color={a === TRAITOR || b === TRAITOR ? COLORS.fault : COLORS.honest} opacity={0.6} points={[screenAt(a), screenAt(b)]} />
        ))}
      </group>
    </group>
  );
}

/** Lamport, Shostak & Pease's bound, as an interactive check. */
function OneThirdRule() {
  const [n, setN] = useState(7);
  const [traitors, setTraitors] = useState(2);
  const t = Math.min(traitors, n - 1);
  const safe = t < n / 3;
  return (
    <div className="rail-inset">
      <p className="rail-kicker" style={{ color: 'var(--signal)' }}>The one-third rule</p>
      <p className="rail-meta">If fewer than 1/3 of the generals are traitors, honest generals can always agree. (Lamport, Shostak &amp; Pease, 1982)</p>
      <label className="rail-meta">
        Generals (N): {n}
        <input type="range" min={4} max={10} value={n} onChange={(e) => setN(Number(e.target.value))} />
      </label>
      <label className="rail-meta">
        Traitors: {t}
        <input type="range" min={0} max={n - 1} value={t} onChange={(e) => setTraitors(Number(e.target.value))} />
      </label>
      <p className="rail-body" style={{ color: safe ? 'var(--honest)' : 'var(--fault)', fontWeight: 600 }}>
        {safe ? 'Agreement guaranteed' : 'Cannot guarantee agreement'}
      </p>
    </div>
  );
}

export const slide06: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'Generals surround a city',
      caption: 'Four Viking armies, each led by its own general, surround England’s palace.',
      camera: { pos: [0, 3.4, 16.5], target: [0, -0.7, -0.6] },
      body: <p className="rail-body">Four armies, each commanded by its own general, have surrounded the same city. Denmark, Norway, Sweden and the Raven Banner host stand around the White Tower.</p>,
    },
    {
      title: 'They win only if they attack together',
      caption: 'If everyone attacks at the same time they win; if only some attack, they are destroyed alone.',
      camera: { pos: [0, 2.4, 15.2], target: [0, -0.9, -0.2] },
      body: <p className="rail-body">If everyone attacks at the same time, they win. If only some attack, those armies are destroyed alone. Messengers are the only way to coordinate.</p>,
    },
    {
      title: 'But a general may lie',
      caption: 'One general raises a red flag: he tells one ally attack at 6 and another attack at 9, on purpose.',
      camera: { pos: [3.0, 2.0, 12.8], target: [2.6, -0.6, -0.2] },
      body: (
        <p className="rail-body">
          One general (red flag) tells one ally <b>“attack at 6”</b> and another <b>“attack at 9”</b>: pure confusion, on purpose. A messenger could be caught or bribed too.
        </p>
      ),
    },
    {
      title: 'In blockchain terms',
      caption: 'Generals are computers, messengers are network messages, and the traitor is a hacked or faulty computer.',
      camera: { pos: [0, 4.4, 17.5], target: [0, 0.9, -0.8] },
      body: (
        <div className="flex flex-col gap-static-md">
          <dl className="rail-defs">
            <div><dt style={{ color: 'var(--honest)' }}>Generals</dt><dd>Computers (nodes)</dd></div>
            <div><dt style={{ color: 'var(--vote)' }}>Messengers</dt><dd>Network messages</dd></div>
            <div><dt style={{ color: 'var(--fault)' }}>The traitor</dt><dd>A hacked or faulty computer</dd></div>
          </dl>
          <OneThirdRule />
        </div>
      ),
    },
  ],
};
