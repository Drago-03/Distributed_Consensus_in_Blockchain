import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { PButton } from '@porsche-design-system/components-react';
import { StepEngine, reducedMotion } from '../engine/StepEngine';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { Monitor, HashTicker } from '../world/props';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

const BLOCK_X = [-2.4, 0, 2.4];
const HASHES = ['0000A7F3', 'A7F39B2C', '9B2C4E8D'];

// Eight computers on an ellipse around the chain, each a different colour: the network
// that keeps a copy of the blockchain.
const SCREEN_COLORS = ['#3ED6C5', '#FFB547', '#8C7DFF', '#6FB7FF', '#FF7A6B', '#D9C27A', '#5BE38A', '#F27BC0'];
const CY = 0.5;
const MONITORS = [25, 65, 115, 155, 205, 245, 295, 335].map((deg, i) => {
  const a = THREE.MathUtils.degToRad(deg);
  return { pos: new THREE.Vector3(Math.cos(a) * 6.4, CY + Math.sin(a) * 2.45, -0.9), color: SCREEN_COLORS[i] };
});
const nearestBlock = (x: number) => BLOCK_X.reduce((b, bx) => (Math.abs(bx - x) < Math.abs(b - x) ? bx : b));

function Scene() {
  const chain = useRef<THREE.Group>(null);
  const screens = useRef<(THREE.Group | null)[]>([]);

  // Idle: slow, frame-rate-independent sway toward moving targets (no += per frame).
  useFrame((state, delta) => {
    if (reducedMotion()) return;
    const t = state.clock.elapsedTime;
    if (chain.current) easing.dampE(chain.current.rotation, [0.06, Math.sin(t * 0.25) * 0.14, 0], 0.8, delta);
    screens.current.forEach((m, i) => {
      if (m) easing.damp(m.position, 'y', MONITORS[i].pos.y + Math.sin(t * 0.7 + i) * 0.06, 0.4, delta);
    });
  });

  return (
    <group>
      <FrameBox name="hero" size={[14.6, 7, 2]} position={[0, CY - 0.1, 0]} />
      <group ref={chain} position={[0, CY, 0.4]}>
        {BLOCK_X.map((x, i) => (
          <ChainBlock key={i} position={[x, 0, 0]} size={[1.8, 1.15, 0.32]} edge={COLORS.honest}>
            <Label mono size={0.13} color={COLORS.ash} position={[0, 0.28, 0]}>{`BLOCK #${i}`}</Label>
            <Label mono size={0.15} color={COLORS.honest} position={[0, -0.12, 0]}>{HASHES[i]}</Label>
          </ChainBlock>
        ))}
        {[0, 1].map((i) => (
          <Link key={i} flowing points={[[BLOCK_X[i] + 0.9, 0, 0], [BLOCK_X[i + 1] - 0.9, 0, 0]]} color={COLORS.honest} />
        ))}
      </group>
      {MONITORS.map((m, i) => (
        <group key={i}>
          <Monitor
            ref={(g) => { screens.current[i] = g; }}
            position={m.pos}
            rotation={[0, -m.pos.x * 0.045, 0]}
            color={m.color}
            width={1.7}
          >
            <Label mono size={0.09} color={m.color} position={[0, 0.3, 0]}>{`NODE ${String(i + 1).padStart(2, '0')}`}</Label>
            <HashTicker length={12} size={0.1} color={COLORS.bone} every={0.5 + i * 0.07} position={[0, 0.06, 0]} />
            <HashTicker length={12} size={0.1} color={m.color} every={0.7 + i * 0.05} position={[0, -0.14, 0]} />
            <HashTicker length={12} size={0.1} color={COLORS.ash} every={0.9 + i * 0.05} position={[0, -0.33, 0]} />
          </Monitor>
          <Link
            flowing
            opacity={0.35}
            color={m.color}
            points={[[m.pos.x * 0.86, m.pos.y * 0.9, -0.8], [nearestBlock(m.pos.x), CY, 0.2]]}
          />
        </group>
      ))}
      <pointLight position={[0, 1.8, 3]} intensity={3} color={COLORS.honest} distance={10} />
    </group>
  );
}

export const slide01: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'Welcome',
      caption: 'Distributed Consensus in Blockchain: how thousands of computers agree on one truth, without a boss. Presented by Mantej Singh Arora, B.Tech CSE, 7th Semester.',
      camera: { fit: 'hero', padding: 0.1 },
      body: (
        <div className="title-card">
          <p className="rail-kicker">A Simple Guide to</p>
          <h1 className="title-hero">
            Distributed Consensus <span style={{ color: 'var(--honest)' }}>in Blockchain</span>
          </h1>
          <p className="title-lead">How thousands of computers agree on one truth, without a boss.</p>
          <div className="title-author">
            <p className="title-name">Mantej Singh Arora</p>
            <p className="title-course">B.Tech CSE · 7th Semester</p>
            <p className="title-course">IKGPTU Mohali Campus</p>
          </div>
          <div>
            <PButton variant="primary" icon="arrow-right" onClick={() => StepEngine.next()}>
              Begin
            </PButton>
          </div>
        </div>
      ),
    },
  ],
};
