import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { ChainBlock, GlassNode, Label, Link, FrameBox } from '../world/primitives';
import { focusOn, fadeTo } from '../world/anim';
import { COLORS } from '../config/world';
import { GlowNode, HashTicker } from '../world/props';
import { sha256 } from '../utils/sha256';
import type { SlideV2 } from './registry';

// Six words, six emblems on a shallow arc. Each emblem is the real object the word names.
const WORDS = [
  { word: 'Node', def: 'One computer in the network', color: COLORS.honest, css: 'var(--honest)' },
  { word: 'Block', def: 'A box that holds a list of transactions', color: COLORS.vote, css: 'var(--vote)' },
  { word: 'Ledger', def: 'The shared record book everyone keeps', color: COLORS.stake, css: 'var(--stake)' },
  { word: 'Hash', def: 'A unique fingerprint of some data', color: COLORS.signal, css: 'var(--signal)' },
  { word: 'Validator', def: 'The one who checks and adds new blocks', color: COLORS.trust, css: 'var(--trust)' },
  { word: 'Consensus', def: 'Everyone agreeing on one single truth', color: COLORS.honest, css: 'var(--honest)' },
];
const TXS = ['tx(0x9f3a, 0x41c2, 2.50)', 'tx(0x7be1, 0xc03d, 0.75)', 'tx(0x15aa, 0x9e44, 1.20)', 'tx(0x0c6f, 0x5d18, 4.00)'];
const X = (i: number) => (i - 2.5) * 2.25;
const Z = (i: number) => -Math.abs(i - 2.5) * 0.35;

function Emblem({ i }: { i: number }) {
  const c = WORDS[i].color;
  switch (i) {
    case 0:
      // a node as people picture one: a black dot glowing green
      return <GlowNode radius={0.42} color="#2BFF88" />;
    case 1:
      // a block is a box of transactions: shown as the code that records them
      return (
        <ChainBlock size={[1.6, 1.1, 0.28]} edge={c}>
          <Label mono size={0.085} color={c} anchorX="left" position={[-0.68, 0.36, 0]}>BLOCK #128</Label>
          {TXS.map((tx, k) => (
            <Label key={k} mono size={0.072} color={k % 2 ? COLORS.ash : COLORS.bone} anchorX="left" position={[-0.68, 0.14 - k * 0.17, 0]}>
              {tx}
            </Label>
          ))}
        </ChainBlock>
      );
    case 2:
      // a ledger: three stacked records whose hashes keep being written
      return (
        <>
          {[0, 1, 2].map((k) => (
            <ChainBlock key={k} position={[0, (1 - k) * 0.44, 0]} size={[1.45, 0.38, 0.5]} edge={c}>
              <HashTicker length={10} size={0.09} color={k === 0 ? COLORS.bone : c} every={0.28 + k * 0.09} />
            </ChainBlock>
          ))}
        </>
      );
    case 3:
      return (
        <ChainBlock size={[1.3, 0.55, 0.12]} edge={c}>
          <Label mono size={0.15} color={c}>#9B2C4E8D</Label>
        </ChainBlock>
      );
    case 4:
      return (
        <>
          <GlassNode radius={0.36} color={c} />
          <mesh rotation={[Math.PI / 2.4, 0, 0]}>
            <torusGeometry args={[0.62, 0.025, 24, 96]} />
            <meshPhysicalMaterial color={c} emissive={c} emissiveIntensity={0.4} metalness={0.8} roughness={0.25} transparent />
          </mesh>
        </>
      );
    default: {
      const pts: [number, number, number][] = [[-0.45, -0.25, 0], [0.45, -0.25, 0], [0, 0.45, 0]];
      return (
        <>
          {pts.map((p, k) => <GlassNode key={k} position={p} radius={0.2} color={c} />)}
          {pts.map((p, k) => <Link key={`l${k}`} points={[p, pts[(k + 1) % 3]]} color={c} />)}
        </>
      );
    }
  }
}

function Scene({ step }: { step: number }) {
  const items = useRef<(THREE.Group | null)[]>([]);

  useStepTimeline(step, (tl, next) => {
    const all = items.current;
    const later = all.slice(3);
    // step 0: first three present, last three not yet introduced
    later.forEach((g) => g && tl.set(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0));
    later.forEach((g) => fadeTo(tl, g, 0, 0, 0));
    next((at) => {
      later.forEach((g, k) => {
        if (!g) return;
        tl.to(g.scale, { x: 1, y: 1, z: 1, ease: 'power3.out' }, at + k * 0.08);
        fadeTo(tl, g, 1, at + k * 0.08);
      });
      focusOn(tl, at, all.slice(0, 3), []);
    });
  });

  return (
    <group>
      <FrameBox name="first" size={[7.2, 3.2, 2]} position={[X(1), -0.3, 0]} />
      <FrameBox name="all" size={[14.2, 3.4, 2]} position={[0, -0.3, 0]} />
      {WORDS.map((w, i) => (
        <group key={w.word} position={[X(i), 0, Z(i)]} ref={(g) => { items.current[i] = g; }}>
          <Emblem i={i} />
          <Label semi size={0.2} color={w.color} position={[0, -1.05, 0]}>{w.word.toUpperCase()}</Label>
        </group>
      ))}
    </group>
  );
}

function LiveHashInput() {
  const [input, setInput] = useState('Hello, blockchain!');
  const [hash, setHash] = useState('');
  useEffect(() => {
    let live = true;
    sha256(input).then((h) => live && setHash(h));
    return () => { live = false; };
  }, [input]);

  return (
    <div className="rail-inset">
      <label className="rail-kicker" style={{ color: 'var(--signal)' }} htmlFor="hash-demo">
        Live SHA-256 demo: type anything
      </label>
      <input id="hash-demo" value={input} onChange={(e) => setInput(e.target.value)} className="rail-input" />
      <p className="rail-hash">{hash}</p>
      <p className="rail-meta">Change one character and the entire fingerprint changes.</p>
    </div>
  );
}

function WordList({ from, to }: { from: number; to: number }) {
  return (
    <dl className="rail-defs">
      {WORDS.slice(from, to).map((w) => (
        <div key={w.word}>
          <dt style={{ color: w.css }}>{w.word}</dt>
          <dd>{w.def}</dd>
          {w.word === 'Hash' && <LiveHashInput />}
        </div>
      ))}
    </dl>
  );
}

export const slide03: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'Words you’ll hear today',
      caption: 'Node: one computer. Block: a box of transactions. Ledger: the shared record book.',
      camera: { fit: 'first', padding: 0.3 },
      body: <WordList from={0} to={3} />,
    },
    {
      title: 'Three more',
      caption: 'Hash: a data fingerprint. Validator: checks and adds blocks. Consensus: everyone agreeing on one truth.',
      camera: { fit: 'all', padding: 0.2 },
      body: <WordList from={3} to={6} />,
    },
  ],
};
