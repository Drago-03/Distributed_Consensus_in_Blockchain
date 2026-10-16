import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useStepTimeline } from '../engine/useStepTimeline';
import { ChainBlock, GlassNode, Label, Link, FrameBox } from '../world/primitives';
import { fadeTo, focusOn } from '../world/anim';
import { COLORS, FONTS } from '../config/world';
import type { SlideV2 } from './registry';

// The blockchain trilemma: security, decentralization, speed. Pick any two.

const SEC = new THREE.Vector3(0, 2.3, 0);
const DEC = new THREE.Vector3(-3.2, -1.7, 0);
const SPD = new THREE.Vector3(3.2, -1.7, 0);
const mid = (a: THREE.Vector3, b: THREE.Vector3) => a.clone().add(b).multiplyScalar(0.5);

function useExtruded(shape: THREE.Shape, depth = 0.18) {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 4, curveSegments: 24 });
    g.center();
    return g;
  }, [shape, depth]);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

const shieldShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.62);
  s.quadraticCurveTo(0.32, 0.5, 0.5, 0.52);
  s.lineTo(0.5, 0.05);
  s.quadraticCurveTo(0.45, -0.45, 0, -0.68);
  s.quadraticCurveTo(-0.45, -0.45, -0.5, 0.05);
  s.lineTo(-0.5, 0.52);
  s.quadraticCurveTo(-0.32, 0.5, 0, 0.62);
  return s;
})();
const boltShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0.12, 0.7);
  s.lineTo(-0.38, -0.05);
  s.lineTo(-0.02, -0.05);
  s.lineTo(-0.14, -0.7);
  s.lineTo(0.38, 0.08);
  s.lineTo(0.02, 0.08);
  s.closePath();
  return s;
})();

function Emblem({ shape, color }: { shape: THREE.Shape; color: string }) {
  const geo = useExtruded(shape);
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial color={color} metalness={0.7} roughness={0.25} clearcoat={1} emissive={color} emissiveIntensity={0.25} transparent />
    </mesh>
  );
}

function MiniNetwork() {
  const pts = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
    return new THREE.Vector3(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0);
  }), []);
  return (
    <>
      {pts.map((p, i) => <GlassNode key={i} position={p} radius={0.17} color={COLORS.stake} />)}
      {pts.map((p, i) => pts.slice(i + 1).map((q, j) => <Link key={`${i}-${j}`} points={[p, q]} color={COLORS.stake} opacity={0.5} />))}
    </>
  );
}

/** A chain marker sitting on an edge of the triangle. */
function Marker({ glyph, title, sub, color }: { glyph: string; title: string; sub: string; color: string }) {
  return (
    <ChainBlock size={[2.3, 0.95, 0.22]} edge={color}>
      <Text font={glyph === "\u20BF" ? FONTS.rupee : FONTS.mono} fontSize={0.36} color={color} anchorX="center" anchorY="middle" position={[-0.78, 0, 0]}>{glyph}</Text>
      <Label semi size={0.17} color={COLORS.bone} anchorX="left" position={[-0.45, 0.14, 0]}>{title}</Label>
      <Label size={0.11} color={COLORS.ash} anchorX="left" position={[-0.45, -0.14, 0]}>{sub}</Label>
    </ChainBlock>
  );
}

function Scene({ step }: { step: number }) {
  const corners = useRef<(THREE.Group | null)[]>([]);
  const bitcoin = useRef<THREE.Group>(null);
  const privateChain = useRef<THREE.Group>(null);
  const centre = useRef<THREE.Group>(null);

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
    [bitcoin.current, privateChain.current, centre.current].forEach(hide);
    const [sec, dec, spd] = corners.current;
    // Bitcoin: secure + decentralized, but slow
    next((at) => {
      show(bitcoin.current, at);
      focusOn(tl, at, [sec, dec, spd], [sec, dec]);
    });
    // Private chains: secure + fast, but few members
    next((at) => {
      fadeTo(tl, bitcoin.current, 0.35, at, 0.4);
      show(privateChain.current, at + 0.1);
      focusOn(tl, at, [sec, dec, spd], [sec, spd]);
    });
    // Pick any two
    next((at) => {
      fadeTo(tl, privateChain.current, 0.35, at, 0.4);
      focusOn(tl, at, [sec, dec, spd], [sec, dec, spd]);
      show(centre.current, at + 0.2);
    });
  });

  return (
    <group>
      <FrameBox name="tri" size={[10.4, 6.4, 1]} position={[0, 0.1, 0]} />
      <Link points={[SEC, DEC, SPD, SEC]} color={COLORS.ash} opacity={0.5} />
      {[
        { p: SEC, label: 'SECURITY', color: COLORS.honest, el: <Emblem shape={shieldShape} color={COLORS.honest} />, lp: [0, 0.95, 0] },
        { p: DEC, label: 'DECENTRALIZATION', color: COLORS.stake, el: <MiniNetwork />, lp: [0, -1.0, 0] },
        { p: SPD, label: 'SPEED', color: COLORS.signal, el: <Emblem shape={boltShape} color={COLORS.signal} />, lp: [0, -1.0, 0] },
      ].map((c, i) => (
        <group key={c.label} position={c.p} ref={(g) => { corners.current[i] = g; }}>
          {c.el}
          <Label semi size={0.2} color={c.color} position={c.lp as [number, number, number]}>{c.label}</Label>
        </group>
      ))}
      <group ref={bitcoin} position={mid(SEC, DEC).add(new THREE.Vector3(-1.1, 0.2, 0.3))}>
        <Marker glyph={'₿'} title="Bitcoin" sub="secure + open, ~7 tx/s" color={COLORS.signal} />
      </group>
      <group ref={privateChain} position={mid(SEC, SPD).add(new THREE.Vector3(1.1, 0.2, 0.3))}>
        <Marker glyph="#" title="Private chain" sub="secure + fast, few members" color={COLORS.vote} />
      </group>
      <group ref={centre} position={[0, -0.2, 0.3]}>
        <Label semi size={0.5} color={COLORS.bone} position={[0, 0.2, 0]}>?</Label>
        <Label mono size={0.12} color={COLORS.ash} position={[0, -0.32, 0]}>ALL THREE AT ONCE: VERY HARD</Label>
      </group>
    </group>
  );
}

const VERTICES = (
  <dl className="rail-defs">
    <div><dt style={{ color: 'var(--honest)' }}>Security</dt><dd>It’s very hard to cheat or attack the network.</dd></div>
    <div><dt style={{ color: 'var(--stake)' }}>Decentralization</dt><dd>Anyone can join: no single person or company controls it.</dd></div>
    <div><dt style={{ color: 'var(--signal)' }}>Speed</dt><dd>It can handle lots of transactions quickly (scalability).</dd></div>
  </dl>
);

export const slide11: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'Three things everyone wants',
      caption: 'Security, decentralization and speed: the blockchain trilemma.',
      camera: { fit: 'tri', padding: 0.3 },
      body: VERTICES,
    },
    {
      title: 'Bitcoin',
      caption: 'Bitcoin is very secure and open to all, but slow: about 7 transactions per second versus UPI’s thousands.',
      camera: { fit: 'tri', padding: 0.3 },
      body: <p className="rail-body">Very secure and open to all, but slow (~7 tx/s vs UPI’s thousands/s).</p>,
    },
    {
      title: 'Private chains',
      caption: 'Private chains are fast and secure, but only a few members can join.',
      camera: { fit: 'tri', padding: 0.3 },
      body: <p className="rail-body">Fast and secure, but only a few members.</p>,
    },
    {
      title: 'Pick any two',
      caption: 'Pick any two: all three at once is very hard.',
      camera: { fit: 'tri', padding: 0.3 },
      body: <p className="rail-lead" style={{ color: 'var(--bone)' }}>Pick any two: all three at once is very hard.</p>,
    },
  ],
};
