import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { Line } from '@react-three/drei';
import type { Line2 } from 'three-stdlib';
import { ChainBlock, GlassNode, Label, Link, Amount, FrameBox } from '../world/primitives';
import { fadeTo, colorTo, coreOf } from '../world/anim';
import { COLORS, GLOW, STEP_S } from '../config/world';
import { sha256 } from '../utils/sha256';
import type { SlideV2 } from './registry';

const BLOCKS = [
  { label: 'GENESIS BLOCK', from: 'Ravi', to: 'Simran', amount: '100', prev: '0000', hash: 'A7F3' },
  { label: 'BLOCK 2', from: 'Simran', to: 'Aman', amount: '40', prev: 'A7F3', hash: '9B2C' },
  { label: 'BLOCK 3', from: 'Aman', to: 'Neha', amount: '25', prev: '9B2C', hash: '4E8D' },
];
const TAMPERED_AMOUNT = '1000';
const BX = [-2.9, 0, 2.9];
const SIZE: [number, number, number] = [2.2, 1.5, 0.3];
const COPIES: [number, number, number][] = [[-6.2, 2.5, -2.2], [6.2, 2.5, -2.2], [-6.2, -1.6, -2.2], [6.2, -1.6, -2.2]];
const TAMPER_STEP = 5;
// The frame drawn around the whole chain at the notebook step.
const LEDGER_W = 9.4;
const LEDGER_H = 2.3;
const LEDGER_RECT: [number, number, number][] = [
  [-LEDGER_W / 2, -LEDGER_H / 2, 0.3], [LEDGER_W / 2, -LEDGER_H / 2, 0.3], [LEDGER_W / 2, LEDGER_H / 2, 0.3],
  [-LEDGER_W / 2, LEDGER_H / 2, 0.3], [-LEDGER_W / 2, -LEDGER_H / 2, 0.3],
];
const LEDGER_PERIMETER = 2 * (LEDGER_W + LEDGER_H);

/** The real SHA-256 of the tampered record, shortened like the others. */
function useTamperedHash() {
  const [h, setH] = useState('····');
  useEffect(() => {
    let live = true;
    sha256(`Ravi → Simran ₹${TAMPERED_AMOUNT}`).then((x) => live && setH(x.slice(0, 4).toUpperCase()));
    return () => { live = false; };
  }, []);
  return h;
}

function Face({ i, tampered, newHash, hashColor, prevColor }: { i: number; tampered: boolean; newHash: string; hashColor: THREE.Color; prevColor: THREE.Color }) {
  const b = BLOCKS[i];
  const left = -SIZE[0] / 2 + 0.16;
  const amount = tampered && i === 0 ? TAMPERED_AMOUNT : b.amount;
  const hash = tampered && i === 0 ? newHash : b.hash;
  return (
    <>
      <Label mono size={0.1} color={COLORS.signal} anchorX="left" position={[left, 0.55, 0]}>{b.label}</Label>
      <Label size={0.15} anchorX="left" position={[left, 0.27, 0]}>{`${b.from} pays ${b.to}`}</Label>
      <Amount value={amount} size={0.22} position={[left, 0.0, 0]} color={tampered && i === 0 ? COLORS.fault : COLORS.bone} />
      <Label mono size={0.115} color={prevColor} anchorX="left" position={[left, -0.33, 0]}>{`prev  ${b.prev}`}</Label>
      <Label mono size={0.115} color={hashColor} anchorX="left" position={[left, -0.53, 0]}>{`hash  ${hash}`}</Label>
    </>
  );
}

function Scene({ step }: { step: number }) {
  const blocks = useRef<(THREE.Group | null)[]>([]);
  const copies = useRef<THREE.Group>(null);
  const ledger = useRef<THREE.Group>(null);
  const ledgerLine = useRef<Line2>(null);
  const root = useRef<THREE.Group>(null);
  const newHash = useTamperedHash();
  const tampered = step >= TAMPER_STEP;

  // Text colours are THREE.Color instances troika re-reads every frame, so the timeline can tween them.
  const colors = useMemo(
    () => BLOCKS.map(() => ({ hash: new THREE.Color(COLORS.honest), prev: new THREE.Color(COLORS.honest) })),
    [],
  );

  useStepTimeline(step, (tl, next) => {
    const [b0, b1, b2] = blocks.current;
    const link = (k: number) => root.current?.getObjectByName(`link-${k}`) ?? null;
    type Tinted = THREE.Material & { color: THREE.Color };
    const edgeOf = (g: THREE.Object3D | null) => {
      const found: Tinted[] = [];
      g?.traverse((o) => { if (o.userData.role === 'edge') found.push((o as THREE.Mesh).material as Tinted); });
      return found[0] ?? null;
    };
    const hidden = (g: THREE.Object3D | null) => {
      if (!g) return;
      tl.set(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
      fadeTo(tl, g, 0, 0, 0);
    };
    const reveal = (g: THREE.Object3D | null, at: number) => {
      if (!g) return;
      tl.to(g.scale, { x: 1, y: 1, z: 1 }, at);
      fadeTo(tl, g, 1, at);
    };
    [b1, b2, link(0), link(1), copies.current].forEach(hidden);
    fadeTo(tl, ledger.current, 0, 0, 0);
    const outline = ledgerLine.current?.material;
    if (outline) tl.set(outline, { dashOffset: LEDGER_PERIMETER }, 0);

    next((at) => { reveal(b1, at); reveal(link(0), at + 0.2); });
    next((at) => { reveal(b2, at); reveal(link(1), at + 0.2); });
    next((at) => {
      // the whole chain is one notebook: draw a frame around it, then name it
      fadeTo(tl, ledger.current, 1, at, 0.2);
      if (outline) tl.to(outline, { dashOffset: 0, duration: STEP_S, ease: 'power2.inOut' }, at);
    });
    next((at) => {
      reveal(copies.current, at);
      copies.current?.children.forEach((c, k) => {
        const core = coreOf(c);
        if (core) tl.to(core, { emissiveIntensity: GLOW.active, yoyo: true, repeat: 1, duration: 0.4 }, at + 0.3 + k * 0.08);
      });
    });
    next((at) => {
      // Block 1 is edited: its hash changes, and the prev link held by Block 2 no longer matches.
      colorTo(tl, edgeOf(b0)?.color, COLORS.fault, at);
      colorTo(tl, colors[0].hash, COLORS.fault, at);
      colorTo(tl, colors[1].prev, COLORS.fault, at + 0.25);
      [1, 2].forEach((k) => {
        colorTo(tl, edgeOf(blocks.current[k])?.color, COLORS.fault, at + 0.25 + k * 0.12);
        colorTo(tl, colors[k].hash, COLORS.fault, at + 0.25 + k * 0.12);
      });
      colorTo(tl, colors[2].prev, COLORS.fault, at + 0.5);
      [0, 1].forEach((k) => {
        const l = link(k) as THREE.Mesh | null;
        colorTo(tl, (l?.material as Tinted | undefined)?.color, COLORS.fault, at + 0.25 + k * 0.12);
      });
      fadeTo(tl, b1, 0.5, at + 0.4);
      fadeTo(tl, b2, 0.5, at + 0.5);
    });
  });

  return (
    <group ref={root}>
      <FrameBox name="b0" size={[3.2, 2.4, 1]} position={[BX[0], 0, 0]} />
      <FrameBox name="b01" size={[6.2, 2.4, 1]} position={[(BX[0] + BX[1]) / 2, 0, 0]} />
      <FrameBox name="chain" size={[9.2, 2.6, 1]} />
      <FrameBox name="ledger" size={[10.2, 3.6, 1]} position={[0, 0.35, 0]} />
      {BLOCKS.map((_, i) => (
        <ChainBlock
          key={i}
          ref={(g) => { blocks.current[i] = g; }}
          position={[BX[i], 0, 0]}
          size={SIZE}
          edge={COLORS.honest}
          selected={step === i || (step === TAMPER_STEP && i === 0)}
        >
          <Face i={i} tampered={tampered} newHash={newHash} hashColor={colors[i].hash} prevColor={colors[i].prev} />
        </ChainBlock>
      ))}
      {[0, 1].map((k) => (
        <Link key={k} name={`link-${k}`} flowing={!tampered} points={[[BX[k] + SIZE[0] / 2, 0, 0], [BX[k + 1] - SIZE[0] / 2, 0, 0]]} />
      ))}
      <group ref={ledger}>
        <Line
          ref={ledgerLine}
          points={LEDGER_RECT}
          color={COLORS.signal}
          lineWidth={1.5}
          dashed
          dashSize={LEDGER_PERIMETER}
          gapSize={LEDGER_PERIMETER}
          transparent
        />
        <Label mono size={0.13} color={COLORS.signal} anchorX="left" position={[-LEDGER_W / 2, LEDGER_H / 2 + 0.42, 0.3]}>
          SHARED LEDGER
        </Label>
        <Label size={0.16} color={COLORS.bone} anchorX="left" position={[-LEDGER_W / 2, LEDGER_H / 2 + 0.18, 0.3]}>
          Append-only notebook: pages are added, never torn out
        </Label>
      </group>
      <group ref={copies}>
        {COPIES.map((p, k) => (
          <group key={k} position={p}>
            <GlassNode radius={0.38} color={COLORS.honest} />
            <Label mono size={0.11} color={COLORS.ash} position={[0, -0.62, 0]}>{`COPY ${k + 1}`}</Label>
          </group>
        ))}
        {COPIES.map((p, k) => (
          <Link key={`c${k}`} opacity={0.35} color={COLORS.ash} points={[p, [BX[p[0] < 0 ? 0 : 2], p[1] > 0 ? 0.75 : -0.75, 0]]} />
        ))}
      </group>
    </group>
  );
}

export const slide04: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'The genesis block',
      caption: 'The genesis block records Ravi paying Simran ₹100. Its hash, its fingerprint, is A7F3.',
      camera: { fit: 'b0', padding: 0.5 },
      body: (
        <p className="rail-body">
          Our first block records <b>Ravi paying Simran ₹100</b>. Every block carries its own hash, a fingerprint: here{' '}
          <code>A7F3</code>. <span className="rail-meta">Real hashes are 64 characters; shortened here.</span>
        </p>
      ),
    },
    {
      title: 'Block 2 links back',
      caption: 'Block 2: Simran pays Aman ₹40. Its prev field matches Block 1’s hash, A7F3.',
      camera: { fit: 'b01', padding: 0.4 },
      body: (
        <p className="rail-body">
          Simran pays Aman ₹40. Its <code>prev</code> field matches Block 1’s hash exactly: <code>A7F3</code>. That is the link
          that chains one block to the next.
        </p>
      ),
    },
    {
      title: 'A full chain',
      caption: 'Block 3: Aman pays Neha ₹25, prev 9B2C. Three blocks linked through their hashes.',
      camera: { fit: 'chain', padding: 0.3 },
      body: <p className="rail-body">Aman pays Neha ₹25, <code>prev 9B2C</code>. Three blocks, linked through their hashes.</p>,
    },
    {
      title: 'A notebook everyone has a copy of',
      caption: 'You can add pages, but never tear one out. Change one page and its fingerprint changes; everyone notices.',
      camera: { fit: 'ledger', padding: 0.3 },
      body: (
        <p className="rail-body">
          You can add pages, but never tear one out. Change one page, its fingerprint changes, and everyone notices.
        </p>
      ),
    },
    {
      title: 'Shared digital logbook',
      caption: 'Once validated, a transaction becomes a permanent part of the chain, copied to every node.',
      camera: { pos: [0, 2.4, 17.5], target: [0, 0.3, -0.8] },
      body: (
        <div className="flex flex-col gap-static-md">
          <p className="rail-body">
            After validation, a transaction becomes a permanent part of the blockchain’s chronological sequence, with each block
            referencing the preceding block so that the record is highly resistant to tampering and independently verifiable.
          </p>
          <img
            className="rail-figure"
            src={`${import.meta.env.BASE_URL}resources/images/shared%20digital%20logbook.png`}
            width={1317}
            height={737}
            alt="Diagram: a transaction is verified by the network, added once to a chain of blocks, copied to every node, and becomes a permanent record."
          />
        </div>
      ),
    },
    {
      title: 'Why tampering is hard',
      caption: 'Block 1 is tampered: ₹100 becomes ₹1000, its hash changes, and Blocks 2 and 3 are now invalid.',
      camera: { fit: 'chain', padding: 0.3 },
      body: (
        <div className="flex flex-col gap-static-md">
          <img
            className="rail-figure"
            src={`${import.meta.env.BASE_URL}resources/images/why%20tampering%20is%20hard.png`}
            width={1319}
            height={735}
            alt="Diagram: blocks A1, B2, C3 link correctly by hash reference; altering block C3 breaks the connection to D4 and E5, making the tampering visible across the chain."
          />
          <p className="rail-body">
            Each block stores a reference to the one before it, and that reference <i>is</i> the previous block’s hash. Alter any
            field in a block and its own hash changes, which instantly breaks the reference the next block is holding. To hide the
            change, an attacker would have to recompute every block after it, on a majority of the thousands of independent copies
            in the network, before anyone notices. That is not “difficult” in the sense of fiddly: it is computationally and
            economically unworkable.
          </p>
          <p className="rail-alert">Block 1 hash changed: Blocks 2 and 3 are now invalid.</p>
        </div>
      ),
    },
  ],
};
