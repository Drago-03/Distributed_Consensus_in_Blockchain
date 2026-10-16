import { useRef } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { Monitor, HashTicker, Coin } from '../world/props';
import { fadeTo, colorTo } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// Proof of Work, start to finish, on top of the genesis block.

const G: [number, number, number] = [-3.5, 1.5, 0];
const C: [number, number, number] = [0.9, 1.5, 0];
const MINERS = [-4.8, -1.6, 1.6, 4.8].map((x) => new THREE.Vector3(x, -1.3, 0.4));
const WINNER = 2;
const TICKETS = [1, 3, 6, 2];
const TXS = ['tx 9f3a  ->  41c2   0.50', 'tx 7be1  ->  c03d   1.25', 'tx 15aa  ->  9e44   0.10', 'tx 0c6f  ->  5d18   2.00'];
const POOL: [number, number, number][] = [[-6.6, 3.6, 0.2], [-5.2, 4.1, -0.1], [-6.0, 2.9, 0.3], [-4.6, 3.3, 0]];

const edgeOf = (g: THREE.Object3D | null) => {
  const found: (THREE.Material & { color: THREE.Color })[] = [];
  g?.traverse((o) => { if (o.userData.role === 'edge') found.push((o as THREE.Mesh).material as never); });
  return found[0]?.color;
};

function Scene({ step }: { step: number }) {
  const candidate = useRef<THREE.Group>(null);
  const txCards = useRef<(THREE.Group | null)[]>([]);
  const txLines = useRef<THREE.Group>(null);
  const miners = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const checks = useRef<THREE.Group>(null);
  const chainLink = useRef<THREE.Group>(null);
  const reward = useRef<THREE.Group>(null);
  const tickets = useRef<THREE.Group>(null);

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
    [miners.current, checks.current, chainLink.current, reward.current, tickets.current].forEach(hide);
    fadeTo(tl, txLines.current, 0, 0, 0);
    if (ring.current) tl.set(ring.current.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);

    // 1. transactions fly from the waiting pool into the candidate block
    txCards.current.forEach((g, i) => {
      if (!g) return;
      tl.set(g.position, { x: POOL[i][0], y: POOL[i][1], z: POOL[i][2] }, 0);
      tl.to(g.position, { x: C[0], y: C[1] + 0.3, z: C[2] + 0.2, ease: 'power2.in', duration: 0.7 }, 0.15 + i * 0.12);
      tl.to(g.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.15 }, 0.75 + i * 0.12);
    });
    fadeTo(tl, txLines.current, 1, 0.9, 0.4);

    // 2. every miner races to find a nonce whose hash starts with zeros
    next((at) => show(miners.current, at));
    // 3. one finds it first and shouts "done!"
    next((at) => {
      if (!ring.current) return;
      tl.fromTo(ring.current.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 9, y: 9, z: 9, ease: 'power1.out', duration: 0.9, immediateRender: false }, at);
      tl.fromTo(ring.current.material as THREE.Material, { opacity: 1 }, { opacity: 0, ease: 'power1.in', duration: 0.9, immediateRender: false }, at);
      tl.set(ring.current.scale, { x: 0.001, y: 0.001, z: 0.001 }, at + 0.92); // gone once the flash ends
    });
    // 4. the others check it in one hash
    next((at) => show(checks.current, at));
    // 5. the block joins the chain; the winner is paid
    next((at) => {
      show(chainLink.current, at);
      colorTo(tl, edgeOf(candidate.current), COLORS.honest, at);
      if (reward.current) {
        tl.set(reward.current.position, { x: C[0], y: C[1], z: 0.6 }, at);
        show(reward.current, at + 0.1);
        tl.to(reward.current.position, { x: MINERS[WINNER].x, y: MINERS[WINNER].y + 1.3, ease: 'power2.inOut', duration: 0.9 }, at + 0.3);
      }
    });
    // 6. like a lottery: more power, more tickets
    next((at) => {
      fadeTo(tl, checks.current, 0, at, 0.3);
      show(tickets.current, at + 0.1);
    });
  });

  const mining = step === 1 || step === 2;
  const found = step >= 2;
  const left = -1.15;

  return (
    <group>
      <FrameBox name="blocks" size={[9.4, 3.2, 1]} position={[-1.3, 1.6, 0]} />
      <FrameBox name="all" size={[12.6, 6.6, 1]} position={[0, 0.5, 0]} />

      <ChainBlock position={G} size={[2.5, 1.6, 0.3]} edge={COLORS.honest}>
        <Label mono size={0.1} color={COLORS.signal} anchorX="left" position={[left, 0.6, 0]}>GENESIS BLOCK</Label>
        <Label size={0.14} anchorX="left" position={[left, 0.3, 0]}>Coinbase: 50 BTC</Label>
        <Label mono size={0.11} color={COLORS.ash} anchorX="left" position={[left, -0.2, 0]}>prev   0000000000</Label>
        <Label mono size={0.11} color={COLORS.honest} anchorX="left" position={[left, -0.42, 0]}>hash   000000a7f3</Label>
      </ChainBlock>
      <group ref={chainLink}>
        <Link flowing points={[[G[0] + 1.25, G[1], 0], [C[0] - 1.4, C[1], 0]]} />
      </group>

      <ChainBlock ref={candidate} position={C} size={[2.8, 2.0, 0.3]} edge={COLORS.signal} selected={step === 0 || step === 4}>
        <Label mono size={0.1} color={COLORS.signal} anchorX="left" position={[-1.27, 0.8, 0]}>{step >= 4 ? 'BLOCK 1' : 'BLOCK 1  ·  CANDIDATE'}</Label>
        <group ref={txLines}>
          {TXS.map((t, i) => (
            <Label key={t} mono size={0.085} color={i % 2 ? COLORS.ash : COLORS.bone} anchorX="left" position={[-1.27, 0.52 - i * 0.17, 0]}>{t}</Label>
          ))}
        </group>
        <Label mono size={0.1} color={COLORS.ash} anchorX="left" position={[-1.27, -0.38, 0]}>{found ? 'nonce  2083236' : 'nonce  ?'}</Label>
        {mining && !found ? (
          <HashTicker prefix="hash  " length={12} size={0.1} color={COLORS.fault} every={0.06} position={[-0.39, -0.6, 0]} />
        ) : (
          <Label mono size={0.1} color={found ? COLORS.honest : COLORS.ash} anchorX="left" position={[-1.27, -0.6, 0]}>
            {found ? 'hash   0000c3e19b7d' : 'hash   ?'}
          </Label>
        )}
        <Label mono size={0.08} color={COLORS.signal} anchorX="left" position={[-1.27, -0.83, 0]}>target: hash must start with 0000</Label>
      </ChainBlock>

      {TXS.map((t, i) => (
        <group key={t} ref={(g) => { txCards.current[i] = g; }}>
          <ChainBlock size={[1.5, 0.36, 0.08]} edge={COLORS.vote}>
            <Label mono size={0.075} color={COLORS.bone}>{t}</Label>
          </ChainBlock>
        </group>
      ))}

      <group ref={miners}>
        {MINERS.map((p, i) => {
          const winner = i === WINNER && found;
          const c = winner ? COLORS.honest : COLORS.signal;
          return (
            <Monitor key={i} position={p} color={c} width={2.0}>
              <Label mono size={0.11} color={c} position={[0, 0.36, 0]}>{`MINER ${i + 1}`}</Label>
              {winner ? (
                <>
                  <Label semi size={0.22} color={COLORS.honest} position={[0, 0.06, 0]}>DONE!</Label>
                  <Label mono size={0.09} color={COLORS.ash} position={[0, -0.22, 0]}>0000c3e19b7d</Label>
                </>
              ) : (
                <>
                  <HashTicker length={12} size={0.1} color={COLORS.bone} every={mining ? 0.05 + i * 0.01 : 0.6} position={[0, 0.06, 0]} />
                  <HashTicker length={12} size={0.1} color={COLORS.ash} every={mining ? 0.07 + i * 0.01 : 0.8} position={[0, -0.16, 0]} />
                </>
              )}
            </Monitor>
          );
        })}
      </group>

      <mesh ref={ring} position={[MINERS[WINNER].x, MINERS[WINNER].y, 0.5]}>
        <torusGeometry args={[0.5, 0.012, 8, 96]} />
        <meshBasicMaterial color={[0.4, 2.2, 1.9]} toneMapped={false} transparent />
      </mesh>

      <group ref={checks}>
        {MINERS.map((p, i) =>
          i === WINNER ? null : (
            <group key={i}>
              <Link flowing color={COLORS.honest} opacity={0.6} points={[MINERS[WINNER], p]} />
              <group position={[p.x, p.y - 1.05, p.z + 0.2]}>
                <ChainBlock size={[1.5, 0.36, 0.08]} edge={COLORS.honest}>
                  <Label mono size={0.1} color={COLORS.honest}>CHECKED: VALID</Label>
                </ChainBlock>
              </group>
            </group>
          ),
        )}
      </group>

      <group ref={reward}>
        <Coin kind="btc" radius={0.42} spin={1.6} />
        <Label semi size={0.14} color={COLORS.signal} position={[0, -0.62, 0]}>+3.125 BTC + fees</Label>
      </group>

      <group ref={tickets}>
        {MINERS.map((p, i) => (
          <group key={i} position={[p.x + 1.25, p.y - 0.75, p.z]}>
            {Array.from({ length: TICKETS[i] }, (_, k) => (
              <mesh key={k} position={[0, k * 0.13, 0]} rotation={[0, 0.3, 0.06 * (k % 2 ? 1 : -1)]}>
                <boxGeometry args={[0.5, 0.09, 0.28]} />
                <meshStandardMaterial color={COLORS.signal} roughness={0.6} transparent />
              </mesh>
            ))}
            <Label mono size={0.1} color={COLORS.signal} position={[0, TICKETS[i] * 0.13 + 0.18, 0]}>{`x${TICKETS[i]}`}</Label>
          </group>
        ))}
        <Label semi size={0.2} color={COLORS.bone} position={[0, -2.75, 0.4]}>MORE COMPUTING POWER = MORE LOTTERY TICKETS</Label>
      </group>
    </group>
  );
}

const STEPS = [
  { title: 'Collect new transactions', body: 'Miners pull waiting transactions into a candidate block, which points back to the genesis block.' },
  { title: 'Solve a very hard puzzle', body: 'block data + nonce → hash, and the hash must start with a certain number of zeros. Miners try billions of nonces.' },
  { title: 'First to solve shouts “Done!”', body: 'Whoever finds a valid nonce first broadcasts it to everyone.' },
  { title: 'Others quickly check it', body: 'One hash calculation, under a millisecond: nobody can fake it.' },
  { title: 'Block added, winner gets a reward', body: 'The block joins the chain. New bitcoins plus transaction fees go to the winning miner.' },
  { title: 'Like a lottery', body: 'More computing power = more tickets. Very hard to win, very easy to check the winning ticket.' },
];

export const slide13: SlideV2 = {
  Scene,
  steps: STEPS.map((s, i) => ({
    title: s.title,
    caption: `${s.title}. ${s.body}`,
    camera: i === 0 ? { fit: 'blocks', padding: 0.4 } : { fit: 'all', padding: 0.3 },
    body: <p className="rail-body">{s.body}</p>,
  })),
};
