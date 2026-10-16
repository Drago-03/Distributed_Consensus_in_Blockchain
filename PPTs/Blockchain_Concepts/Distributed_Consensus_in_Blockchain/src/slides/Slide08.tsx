import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { ChainBlock, Label, Link, Amount, FrameBox } from '../world/primitives';
import { fadeTo, colorTo } from '../world/anim';
import { COLORS } from '../config/world';
import { sha256 } from '../utils/sha256';
import type { SlideV2 } from './registry';

// Double spending, told with the same blocks as "What is a blockchain?".

const SIZE: [number, number, number] = [2.2, 1.5, 0.3];
const LEFT = -3.3;
const RIGHT = 3.3;
const ROW = -0.3;

function TxFace({ label, to, hash, labelColor = COLORS.signal }: { label: string; to: string; hash: string; labelColor?: string }) {
  const left = -SIZE[0] / 2 + 0.16;
  return (
    <>
      <Label mono size={0.1} color={labelColor} anchorX="left" position={[left, 0.55, 0]}>{label}</Label>
      <Label size={0.15} anchorX="left" position={[left, 0.27, 0]}>{`Ravi pays ${to}`}</Label>
      <Amount value="100" size={0.22} position={[left, 0.0, 0]} />
      <Label mono size={0.115} color={COLORS.ash} anchorX="left" position={[left, -0.33, 0]}>prev  9B2C</Label>
      <Label mono size={0.115} color={COLORS.honest} anchorX="left" position={[left, -0.53, 0]}>{`hash  ${hash}`}</Label>
    </>
  );
}

function PriorFace({ n }: { n: number }) {
  const left = -SIZE[0] / 2 + 0.16;
  return (
    <>
      <Label mono size={0.1} color={COLORS.ash} anchorX="left" position={[left, 0.55, 0]}>{`BLOCK ${n}`}</Label>
      <Label size={0.15} anchorX="left" position={[left, 0.27, 0]}>Aman pays Neha</Label>
      <Amount value="25" size={0.22} position={[left, 0.0, 0]} />
      <Label mono size={0.115} color={COLORS.honest} anchorX="left" position={[left, -0.53, 0]}>hash  9B2C</Label>
    </>
  );
}

const edgeOf = (g: THREE.Object3D | null) => {
  const found: (THREE.Material & { color: THREE.Color })[] = [];
  g?.traverse((o) => { if (o.userData.role === 'edge') found.push((o as THREE.Mesh).material as never); });
  return found[0]?.color;
};

function Scene({ step }: { step: number }) {
  const wallet = useRef<THREE.Group>(null);
  const toSimran = useRef<THREE.Group>(null);
  const toAman = useRef<THREE.Group>(null);
  const priorL = useRef<THREE.Group>(null);
  const priorR = useRef<THREE.Group>(null);
  const split = useRef<THREE.Group>(null);
  const verdict = useRef<THREE.Group>(null);
  const sends = useRef<THREE.Group>(null);

  useStepTimeline(step, (tl, next) => {
    const hide = (g: THREE.Object3D | null) => {
      if (!g) return;
      tl.set(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
      fadeTo(tl, g, 0, 0, 0);
    };
    const show = (g: THREE.Object3D | null, at: number) => {
      if (!g) return;
      tl.to(g.scale, { x: 1, y: 1, z: 1 }, at);
      fadeTo(tl, g, 1, at, 0.4);
    };
    [toSimran.current, toAman.current, priorL.current, priorR.current, split.current, verdict.current, sends.current].forEach(hide);
    // payments start inside the wallet and fly out
    for (const g of [toSimran.current, toAman.current]) if (g) tl.set(g.position, { x: 0, y: 1.9 }, 0);

    // 2. the same ₹100 sent twice
    next((at) => {
      show(sends.current, at + 0.3);
      [toSimran.current, toAman.current].forEach((g, k) => {
        if (!g) return;
        show(g, at);
        tl.to(g.position, { x: k ? RIGHT : LEFT, y: ROW, ease: 'power3.out' }, at);
      });
    });
    // 3. without consensus: two halves of the network, two different ledgers, both accept
    next((at) => {
      fadeTo(tl, sends.current, 0, at, 0.3);
      show(priorL.current, at);
      show(priorR.current, at + 0.1);
      colorTo(tl, edgeOf(toSimran.current), COLORS.signal, at + 0.2);
      colorTo(tl, edgeOf(toAman.current), COLORS.signal, at + 0.2);
      show(split.current, at + 0.4);
    });
    // 4. with consensus: one order; Simran's payment stands, Aman's is rejected
    next((at) => {
      fadeTo(tl, split.current, 0, at, 0.3);
      fadeTo(tl, priorR.current, 0, at, 0.4);
      colorTo(tl, edgeOf(toSimran.current), COLORS.honest, at);
      colorTo(tl, edgeOf(toAman.current), COLORS.fault, at);
      if (toAman.current) tl.to(toAman.current.position, { y: ROW - 0.9, ease: 'power2.inOut' }, at + 0.2);
      fadeTo(tl, toAman.current, 0.45, at + 0.3, 0.5);
      show(verdict.current, at + 0.4);
    });
  });

  const [rejected, setRejected] = useState('····');
  useEffect(() => {
    let live = true;
    sha256('Ravi→Aman:100').then((h) => live && setRejected(h.slice(0, 8).toUpperCase()));
    return () => { live = false; };
  }, []);

  return (
    <group>
      <FrameBox name="wallet" size={[5, 2.6, 1]} position={[0, 1.9, 0]} />
      <FrameBox name="pair" size={[9.4, 4.8, 1]} position={[0, 0.8, 0]} />
      <FrameBox name="both" size={[14.4, 5.4, 1]} position={[0, 0.5, 0]} />

      <ChainBlock ref={wallet} position={[0, 1.9, 0]} size={[2.6, 1.1, 0.3]} edge={COLORS.signal} selected={step === 0}>
        <Label mono size={0.1} color={COLORS.signal} anchorX="left" position={[-1.14, 0.34, 0]}>WALLET  ·  RAVI</Label>
        <Label size={0.13} color={COLORS.ash} anchorX="left" position={[-1.14, 0.08, 0]}>Balance</Label>
        <Amount value={step >= 3 ? '0' : '100'} size={0.3} position={[-1.14, -0.24, 0]} />
      </ChainBlock>

      <group ref={sends}>
        <Label semi size={0.17} color={COLORS.signal} position={[0, 0.85, 0]}>THE SAME 100, SENT TWICE AT ONCE</Label>
      </group>

      <ChainBlock ref={toSimran} position={[LEFT, ROW, 0]} size={SIZE} edge={COLORS.honest} selected={step === 3}>
        <TxFace label="PAYMENT A" to="Simran" hash="C41E" />
      </ChainBlock>
      <ChainBlock ref={toAman} position={[RIGHT, ROW, 0]} size={SIZE} edge={COLORS.honest}>
        <TxFace label="PAYMENT B" to="Aman" hash="7D09" />
      </ChainBlock>

      <group ref={priorL}>
        <ChainBlock position={[LEFT - 3.0, ROW, 0]} size={SIZE} edge={COLORS.honest}>
          <PriorFace n={3} />
        </ChainBlock>
        <Link flowing points={[[LEFT - 1.9, ROW, 0], [LEFT - 1.1, ROW, 0]]} />
      </group>
      <group ref={priorR}>
        <ChainBlock position={[RIGHT + 3.0, ROW, 0]} size={SIZE} edge={COLORS.honest}>
          <PriorFace n={3} />
        </ChainBlock>
        <Link flowing points={[[RIGHT + 1.1, ROW, 0], [RIGHT + 1.9, ROW, 0]]} />
      </group>

      <group ref={split}>
        <Label mono size={0.12} color={COLORS.ash} position={[LEFT - 1.5, ROW + 1.1, 0]}>HALF THE NETWORK SAW A FIRST</Label>
        <Label mono size={0.12} color={COLORS.ash} position={[RIGHT + 1.5, ROW + 1.1, 0]}>THE OTHER HALF SAW B FIRST</Label>
        <Label semi size={0.24} color={COLORS.fault} position={[0, ROW - 1.35, 0]}>BOTH ACCEPTED: 200 SPENT FROM A BALANCE OF 100</Label>
      </group>

      <group ref={verdict}>
        <Label mono size={0.12} color={COLORS.honest} position={[LEFT - 1.5, ROW + 1.1, 0]}>ONE AGREED ORDER: A COMES FIRST</Label>
        <Label semi size={0.2} color={COLORS.fault} position={[RIGHT, ROW - 1.95, 0]}>REJECTED  ·  ALREADY SPENT</Label>
        <Label mono size={0.12} color={COLORS.ash} position={[RIGHT, ROW - 2.25, 0]}>{`tx ${rejected}`}</Label>
      </group>
    </group>
  );
}

export const slide08: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'Ravi has ₹100',
      caption: 'Ravi has ₹100: a single wallet, a single balance.',
      camera: { fit: 'wallet', padding: 0.5 },
      body: <p className="rail-body">A single wallet, a single balance: <b>₹100</b>.</p>,
    },
    {
      title: 'Sends ₹100 to Simran… and to Aman',
      caption: 'The exact same ₹100 is sent to two different people at the same moment.',
      camera: { fit: 'pair', padding: 0.3 },
      body: <p className="rail-body">The exact same ₹100, sent to two different people, at the same moment.</p>,
    },
    {
      title: 'Without consensus',
      caption: 'Some nodes see Simran’s payment first, some see Aman’s. Both go through: ₹200 spent from ₹100.',
      camera: { fit: 'both', padding: 0.2 },
      body: (
        <p className="rail-body">
          Messages travel at different speeds: some nodes see the Simran payment first, some see Aman’s. Both go through.{' '}
          <b style={{ color: 'var(--fault)' }}>₹200 spent from ₹100!</b>
        </p>
      ),
    },
    {
      title: 'With consensus',
      caption: 'The network agrees on one order. The first payment is accepted, the other is rejected because the money is already spent.',
      camera: { fit: 'both', padding: 0.2 },
      body: (
        <div className="flex flex-col gap-static-md">
          <p className="rail-body">
            The network agrees on one order. Whichever payment comes first is accepted; the other is <b style={{ color: 'var(--fault)' }}>rejected</b>, because the money is already spent.
          </p>
          <p className="rail-meta">Satoshi Nakamoto solved exactly this in the Bitcoin whitepaper (2008).</p>
        </div>
      ),
    },
  ],
};
