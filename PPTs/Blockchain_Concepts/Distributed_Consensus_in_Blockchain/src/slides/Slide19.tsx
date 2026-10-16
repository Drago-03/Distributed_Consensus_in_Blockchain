import { useRef } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { Coin, type CoinKind } from '../world/props';
import { fadeTo } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// Who uses what: each project's coin, wired to the consensus method it runs.

const PROJECTS: { name: string; coin: CoinKind | 'hlf'; method: string; color: string; time: string }[] = [
  { name: 'Bitcoin', coin: 'btc', method: 'Proof of Work', color: COLORS.signal, time: '~10 min / block' },
  { name: 'Ethereum', coin: 'eth', method: 'Proof of Stake', color: COLORS.stake, time: '12 s / slot' },
  { name: 'Cardano', coin: 'ada', method: 'PoS (Ouroboros)', color: COLORS.stake, time: '~20 s / block' },
  { name: 'Solana', coin: 'sol', method: 'PoS + Proof of History', color: COLORS.vote, time: '~0.4 s / slot' },
  { name: 'Hyperledger Fabric', coin: 'hlf', method: 'Raft', color: COLORS.trust, time: '~1 s / block' },
];
const Y = (i: number) => 2.4 - i * 1.2;
const COIN_X = -3.4;
const METHOD_X = 2.2;

function HyperledgerBadge() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.46, 0.46, 0.12, 6]} />
        <meshPhysicalMaterial color="#1e2a38" metalness={0.7} roughness={0.3} clearcoat={0.6} transparent />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 6]} position={[0, 0, 0.065]}>
        <ringGeometry args={[0.36, 0.42, 6]} />
        <meshStandardMaterial color={COLORS.trust} metalness={0.9} roughness={0.3} transparent />
      </mesh>
      <Label semi size={0.17} color={COLORS.trust} position={[0, 0, 0.08]}>HLF</Label>
    </group>
  );
}

function Scene({ step }: { step: number }) {
  const rows = useRef<(THREE.Group | null)[]>([]);
  const times = useRef<THREE.Group>(null);

  useStepTimeline(step, (tl, next) => {
    rows.current.forEach((r, i) => {
      if (!r) return;
      tl.set(r.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
      fadeTo(tl, r, 0, 0, 0);
      tl.to(r.scale, { x: 1, y: 1, z: 1, duration: 0.5 }, 0.15 + i * 0.15);
      fadeTo(tl, r, 1, 0.15 + i * 0.15, 0.3);
    });
    fadeTo(tl, times.current, 0, 0, 0);
    next((at) => fadeTo(tl, times.current, 1, at, 0.5));
  });

  return (
    <group>
      <FrameBox name="rows" size={[10, 6.6, 1]} position={[-0.2, 0, 0]} />
      <FrameBox name="all" size={[13, 6.6, 1]} position={[1.3, 0, 0]} />
      {PROJECTS.map((p, i) => (
        <group key={p.name} ref={(g) => { rows.current[i] = g; }} position={[0, Y(i), 0]}>
          <group position={[COIN_X, 0, 0]}>
            {p.coin === 'hlf' ? <HyperledgerBadge /> : <Coin kind={p.coin} radius={0.46} spin={0.8} />}
          </group>
          <Label semi size={0.2} color={COLORS.bone} anchorX="left" position={[COIN_X + 0.75, 0, 0]}>{p.name}</Label>
          <Link flowing color={p.color} points={[[COIN_X + 3.0, 0, 0], [METHOD_X - 1.25, 0, 0]]} />
          <ChainBlock position={[METHOD_X, 0, 0]} size={[2.5, 0.62, 0.12]} edge={p.color}>
            <Label semi size={0.16} color={p.color}>{p.method}</Label>
          </ChainBlock>
        </group>
      ))}
      <group ref={times}>
        <Label mono size={0.12} color={COLORS.ash} position={[METHOD_X + 2.65, Y(0) + 0.62, 0]}>BLOCK TIME</Label>
        {PROJECTS.map((p, i) => (
          <Label key={p.name} mono size={0.14} color={COLORS.bone} anchorX="left" position={[METHOD_X + 1.5, Y(i), 0]}>{p.time}</Label>
        ))}
      </group>
    </group>
  );
}

export const slide19: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'Who uses what',
      caption: 'Bitcoin uses Proof of Work. Ethereum and Cardano use Proof of Stake. Solana combines Proof of Stake with Proof of History. Hyperledger Fabric uses Raft.',
      camera: { fit: 'rows', padding: 0.3 },
      body: (
        <dl className="rail-defs">
          {PROJECTS.map((p) => <div key={p.name}><dt style={{ color: 'var(--bone)' }}>{p.name}</dt><dd>{p.method}</dd></div>)}
        </dl>
      ),
    },
    {
      title: 'Block time per method',
      caption: 'Bitcoin about 10 minutes per block, Ethereum 12 seconds, Cardano about 20 seconds, Solana about 0.4 seconds, Hyperledger Fabric about 1 second.',
      camera: { fit: 'all', padding: 0.3 },
      body: <p className="rail-body">Faster isn’t automatically better: speed is bought with fewer, more powerful validators or a permissioned membership. The trilemma again.</p>,
    },
  ],
};
