import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { reducedMotion } from '../engine/StepEngine';
import { ChainBlock, Label, Link } from '../world/primitives';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// Closing slide: a real chain drifting by behind the words. Each block carries the previous
// block's hash, and the loop is consistent (block 0 points at the last), so blocks can wrap
// around off-screen forever without breaking the chain.

const N = 11;
const GAP = 2.6;
const SPAN = N * GAP; // wider than the view, so the wrap happens off-screen
const SPEED = 0.35;
const HASH = Array.from({ length: N }, (_, i) => ((0x9b2c4e8d * (i + 3)) >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 6));

function Scene() {
  const blocks = useRef<(THREE.Group | null)[]>([]);
  const t = useRef(0);
  useFrame((_, delta) => {
    if (!reducedMotion()) t.current += delta * SPEED;
    blocks.current.forEach((b, i) => {
      if (b) b.position.x = THREE.MathUtils.euclideanModulo(i * GAP - t.current + SPAN / 2, SPAN) - SPAN / 2;
    });
  });
  return (
    <group position={[0, -2.9, -3]} rotation={[0.18, 0, 0]}>
      {HASH.map((h, i) => (
        <group key={i} ref={(g) => { blocks.current[i] = g; }}>
          <ChainBlock size={[1.9, 1.05, 0.28]} edge={COLORS.honest}>
            <Label mono size={0.11} color={COLORS.ash} position={[0, 0.27, 0]}>{`PREV ${HASH[(i + N - 1) % N]}`}</Label>
            <Label mono size={0.16} color={COLORS.honest} position={[0, -0.02, 0]}>{h}</Label>
            <Label mono size={0.09} color={COLORS.ash} position={[0, -0.28, 0]}>{`${3 + (i % 4)} TX`}</Label>
          </ChainBlock>
          <Link flowing opacity={0.5} points={[[0.95, 0, 0], [GAP - 0.95, 0, 0]]} color={COLORS.honest} />
        </group>
      ))}
      <pointLight position={[0, 1.5, 3]} intensity={2} color={COLORS.honest} distance={9} />
    </group>
  );
}

export const slide22: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'Thank you',
      caption: 'Thank you! Any questions?',
      camera: { pos: [0, 0.6, 12], target: [0, 0, 0] },
      overlay: true,
      body: (
        <div className="thank-you-card">
          <p className="thank-you">Thank you!</p>
          <p className="thank-you-q">Any questions?</p>
        </div>
      ),
    },
  ],
};
