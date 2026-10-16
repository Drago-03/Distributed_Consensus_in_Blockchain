import { useRef } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { Monitor, Coin, CoinStack } from '../world/props';
import { fadeTo, colorTo } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// Proof of Stake on Ethereum: lock ETH, get picked, propose, attest to 2/3, reward or slash.

const VX = [-4.8, -1.6, 1.6, 4.8];
const VY = -0.9;
const STAKE = [2, 4, 6, 3]; // stacks of 16 ETH
const PROPOSER = 2;
const CHEATER = 3;
const CHAIN_Y = 2.5;
const NEW_BLOCK: [number, number, number] = [1.2, CHAIN_Y, 0];
const TICKS = 24;

function Padlock(props: { position: [number, number, number] }) {
  return (
    <group {...props}>
      <mesh>
        <boxGeometry args={[0.32, 0.26, 0.12]} />
        <meshPhysicalMaterial color="#C9A227" metalness={1} roughness={0.25} transparent />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <torusGeometry args={[0.1, 0.025, 12, 32, Math.PI]} />
        <meshPhysicalMaterial color="#d9dce2" metalness={1} roughness={0.2} transparent />
      </mesh>
    </group>
  );
}

const edgeOf = (g: THREE.Object3D | null) => {
  const found: (THREE.Material & { color: THREE.Color })[] = [];
  g?.traverse((o) => { if (o.userData.role === 'edge') found.push((o as THREE.Mesh).material as never); });
  return found[0]?.color;
};

function Scene({ step }: { step: number }) {
  const stakes = useRef<(THREE.Group | null)[]>([]);
  const dropping = useRef<(THREE.Group | null)[]>([]);
  const locks = useRef<THREE.Group>(null);
  const selector = useRef<THREE.Group>(null);
  const proposed = useRef<THREE.Group>(null);
  const newLink = useRef<THREE.Group>(null);
  const votes = useRef<(THREE.Group | null)[]>([]);
  const ticks = useRef<(THREE.Mesh | null)[]>([]);
  const finalTag = useRef<THREE.Group>(null);
  const rewards = useRef<(THREE.Group | null)[]>([]);
  const slashed = useRef<THREE.Group>(null);
  const moral = useRef<THREE.Group>(null);

  useStepTimeline(step, (tl, next) => {
    const hide = (g: THREE.Object3D | null) => {
      if (!g) return;
      tl.set(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
      fadeTo(tl, g, 0, 0, 0);
    };
    const show = (g: THREE.Object3D | null, at: number, d = 0.5) => {
      if (!g) return;
      tl.to(g.scale, { x: 1, y: 1, z: 1, duration: d }, at);
      fadeTo(tl, g, 1, at, 0.3);
    };
    [...stakes.current, selector.current, proposed.current, newLink.current, ...votes.current, finalTag.current, ...rewards.current, slashed.current, moral.current].forEach(hide);
    ticks.current.forEach((t) => t && fadeTo(tl, t, 0.12, 0, 0));
    fadeTo(tl, locks.current, 0, 0, 0);

    // 1. lock coins: ETH drops into each validator's deposit
    dropping.current.forEach((g, i) => {
      if (!g) return;
      tl.set(g.position, { y: 2.4 }, 0);
      tl.to(g.position, { y: 0.3, ease: 'power2.in', duration: 0.6 }, 0.1 + i * 0.12);
      fadeTo(tl, g, 0, 0.65 + i * 0.12, 0.15);
      show(stakes.current[i], 0.65 + i * 0.12, 0.3);
    });
    fadeTo(tl, locks.current, 1, 1.2, 0.3);

    // 2. get picked: the selector hops between validators, weighted by stake, and lands
    next((at) => {
      const sel = selector.current;
      if (!sel) return;
      tl.set(sel.position, { x: VX[0] }, at);
      show(sel, at, 0.2);
      [1, 2, 3, 2, 1, 2].forEach((v, k) => tl.to(sel.position, { x: VX[v], ease: 'power1.inOut', duration: 0.16 }, at + 0.2 + k * 0.16));
    });
    // 3. the proposer builds the next block
    next((at) => {
      if (proposed.current) {
        tl.set(proposed.current.position, { x: VX[PROPOSER], y: VY }, at);
        show(proposed.current, at, 0.4);
        tl.to(proposed.current.position, { x: NEW_BLOCK[0], y: NEW_BLOCK[1], ease: 'power3.out' }, at + 0.2);
      }
      show(newLink.current, at + 0.8, 0.3);
    });
    // 4. the others vote; at 2/3 of the stake it is final
    next((at) => {
      votes.current.forEach((g, k) => {
        if (!g) return;
        const v = [0, 1, 3][k];
        tl.set(g.position, { x: VX[v], y: VY + 0.6 }, at);
        show(g, at + k * 0.1, 0.25);
        tl.to(g.position, { x: NEW_BLOCK[0] + (k - 1) * 0.5, y: NEW_BLOCK[1] - 1.05, ease: 'power2.inOut', duration: 0.6 }, at + 0.15 + k * 0.1);
      });
      ticks.current.slice(0, (TICKS * 2) / 3).forEach((t, k) => t && fadeTo(tl, t, 1, at + 0.5 + k * 0.03, 0.08));
      colorTo(tl, edgeOf(proposed.current), COLORS.honest, at + 1.0);
      show(finalTag.current, at + 1.0, 0.3);
    });
    // 5. reward the honest, slash the cheater
    next((at) => {
      rewards.current.forEach((g, i) => {
        if (!g) return;
        tl.set(g.position, { y: 1.6 }, at);
        show(g, at + i * 0.08, 0.2);
        tl.to(g.position, { y: STAKE[i] * 0.105 + 0.15, ease: 'bounce.out', duration: 0.7 }, at + i * 0.08);
      });
      const bad = stakes.current[CHEATER];
      if (bad) tl.to(bad.scale, { y: 0.25, ease: 'power2.in', duration: 0.5 }, at + 0.3);
      bad?.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined;
        if (m?.color) colorTo(tl, m.color, COLORS.fault, at + 0.3);
      });
      show(slashed.current, at + 0.4);
    });
    // 6. like a rent deposit
    next((at) => show(moral.current, at));
  });

  const v = (i: number) => (i === CHEATER && step >= 4 ? 'cheat' : i === PROPOSER && step >= 1 ? 'proposer' : 'ok');

  return (
    <group>
      <FrameBox name="validators" size={[12.4, 4.2, 1]} position={[0, -0.6, 0]} />
      <FrameBox name="all" size={[12.6, 7.4, 1]} position={[0, 0.6, 0]} />

      {/* existing chain */}
      {[-4.0, -1.4].map((x, i) => (
        <ChainBlock key={x} position={[x, CHAIN_Y, 0]} size={[2.0, 1.1, 0.25]} edge={COLORS.honest}>
          <Label mono size={0.1} color={COLORS.ash} position={[0, 0.25, 0]}>{`SLOT ${9341 + i}`}</Label>
          <Label mono size={0.1} color={COLORS.honest} position={[0, -0.05, 0]}>{['hash 3b7e', 'hash a1c9'][i]}</Label>
        </ChainBlock>
      ))}
      <Link flowing points={[[-3.0, CHAIN_Y, 0], [-2.4, CHAIN_Y, 0]]} />
      <group ref={newLink}>
        <Link flowing points={[[-0.4, CHAIN_Y, 0], [0.2, CHAIN_Y, 0]]} />
      </group>
      <ChainBlock ref={proposed} position={NEW_BLOCK} size={[2.0, 1.1, 0.25]} edge={COLORS.stake} selected={step === 2}>
        <Label mono size={0.1} color={COLORS.stake} position={[0, 0.25, 0]}>SLOT 9343</Label>
        <Label mono size={0.1} color={COLORS.bone} position={[0, -0.05, 0]}>{`by VALIDATOR ${PROPOSER + 1}`}</Label>
      </ChainBlock>
      {/* attestation gauge: 24 ticks, 2/3 lit means final */}
      <group position={[NEW_BLOCK[0], NEW_BLOCK[1], -0.1]}>
        {Array.from({ length: TICKS }, (_, k) => {
          const a = Math.PI / 2 - (k / TICKS) * Math.PI * 2;
          return (
            <mesh key={k} ref={(m) => { ticks.current[k] = m; }} position={[Math.cos(a) * 1.35, Math.sin(a) * 1.35 * 0.72, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.16, 0.05, 0.03]} />
              <meshBasicMaterial color={COLORS.vote} toneMapped={false} transparent />
            </mesh>
          );
        })}
      </group>
      <group ref={finalTag} position={[NEW_BLOCK[0] + 2.4, NEW_BLOCK[1], 0]}>
        <Label semi size={0.2} color={COLORS.honest}>FINAL</Label>
        <Label mono size={0.1} color={COLORS.ash} position={[0, -0.26, 0]}>{'> 2/3 OF STAKE VOTED'}</Label>
      </group>

      {VX.map((x, i) => {
        const s = v(i);
        const c = s === 'cheat' ? COLORS.fault : s === 'proposer' ? COLORS.stake : COLORS.vote;
        return (
          <group key={i} position={[x, VY, 0]}>
            <Monitor position={[0, 0.55, 0]} color={c} width={1.75}>
              <Label mono size={0.11} color={c} position={[0, 0.2, 0]}>{`VALIDATOR ${i + 1}`}</Label>
              <Label mono size={0.09} color={COLORS.ash} position={[0, -0.04, 0]}>
                {s === 'cheat' ? 'SIGNED TWO BLOCKS' : s === 'proposer' ? 'PROPOSER' : 'ATTESTER'}
              </Label>
            </Monitor>
            <group position={[0, -1.25, 0.7]}>
              <group ref={(g) => { stakes.current[i] = g; }}>
                <CoinStack count={STAKE[i]} kind="eth" radius={0.34} />
              </group>
              <group ref={(g) => { dropping.current[i] = g; }}>
                <Coin kind="eth" radius={0.32} spin={2} />
              </group>
              <group ref={(g) => { rewards.current[i] = g; }}>
                {i !== CHEATER && <CoinStack count={1} kind="gold" radius={0.3} />}
              </group>
              <Label mono size={0.11} color={COLORS.bone} position={[0, -0.25, 0.3]}>{`${STAKE[i] * 16} ETH`}</Label>
            </group>
          </group>
        );
      })}
      <group ref={locks}>
        {VX.map((x) => <Padlock key={x} position={[x + 0.55, VY - 1.0, 0.75]} />)}
      </group>
      <group ref={selector} position={[VX[0], VY - 1.28, 0.7]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.58, 64]} />
          <meshBasicMaterial color={[1.6, 1.2, 3]} toneMapped={false} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>
      {[0, 1, 2].map((k) => (
        <group key={k} ref={(g) => { votes.current[k] = g; }}>
          <ChainBlock size={[0.6, 0.26, 0.05]} edge={COLORS.vote}>
            <Label semi size={0.11} color={COLORS.vote}>VOTE</Label>
          </ChainBlock>
        </group>
      ))}
      <group ref={slashed} position={[VX[CHEATER], VY - 2.05, 0.7]}>
        <Label semi size={0.2} color={COLORS.fault}>SLASHED</Label>
      </group>
      <group ref={moral} position={[0, VY - 2.55, 0.6]}>
        <Label semi size={0.22} color={COLORS.bone}>LIKE A RENT DEPOSIT: BEHAVE AND EARN, BREAK THE RULES AND LOSE IT</Label>
      </group>
    </group>
  );
}

const STEPS = [
  { title: 'Lock coins', body: 'Validators put coins down as a deposit (Ethereum: 32 ETH).' },
  { title: 'Get picked', body: 'More coins = more chance. A new proposer every 12 seconds on Ethereum (a “slot”).' },
  { title: 'Propose a block', body: 'The chosen validator makes the next page.' },
  { title: 'Others vote', body: 'Validators check and attest. Final after more than 2/3 of stake votes, across two rounds (~13 min).' },
  { title: 'Reward or penalty', body: 'Honest validators earn. A cheater (e.g. signing two blocks for one slot) is slashed: loses part of their deposit.' },
  { title: 'Like a rent deposit', body: 'Behave and earn. Break the rules and lose it.' },
];

export const slide15: SlideV2 = {
  Scene,
  steps: STEPS.map((s, i) => ({
    title: s.title,
    caption: `${s.title}. ${s.body}`,
    camera: i <= 1 ? { fit: 'validators', padding: 0.3 } : { fit: 'all', padding: 0.3 },
    body: <p className="rail-body">{s.body}</p>,
  })),
};
