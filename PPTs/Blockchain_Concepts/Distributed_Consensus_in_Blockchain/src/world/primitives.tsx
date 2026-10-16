import { forwardRef, useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { RoundedBox, Line, Text, Edges } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
import type { Line2 } from 'three-stdlib';
import { COLORS, FONTS, GLOW } from '../config/world';
import { reducedMotion } from '../engine/StepEngine';

// Shared geometry library: built once, reused by every node on every slide, never disposed
// (r3f only auto-disposes objects it created from JSX, not ones passed in by prop).
const GEO = {
  shell: new THREE.SphereGeometry(1, 64, 64),
  core: new THREE.SphereGeometry(1, 32, 32),
};

type GroupProps = ThreeElements['group'];

/**
 * A consensus node: frosted transmissive glass shell around a small emissive core whose
 * colour shows the node's state. Materials are per-instance so a step can dim one node
 * without touching the rest; r3f disposes them on unmount.
 *
 * Tween handles: `userData.core` (emissive core material), `userData.shell`.
 */
export const GlassNode = forwardRef<THREE.Group, GroupProps & { radius?: number; color?: string; selected?: boolean }>(
  function GlassNode({ radius = 0.32, color = COLORS.honest, selected = false, ...props }, ref) {
    return (
      <group ref={ref} {...props}>
        <Select enabled={selected}>
          <mesh geometry={GEO.shell} scale={radius} userData={{ role: 'shell' }}>
            <meshPhysicalMaterial
              transmission={1}
              roughness={0.12}
              thickness={0.8}
              ior={1.45}
              clearcoat={1}
              clearcoatRoughness={0.1}
              color="#ffffff"
              attenuationColor={color}
              attenuationDistance={4}
              envMapIntensity={1.6}
              transparent
            />
          </mesh>
        </Select>
        <mesh geometry={GEO.core} scale={radius * 0.55} userData={{ role: 'core' }}>
          {/* opaque on purpose: three's transmission pass only sees opaque objects, so a
              transparent core would be invisible through the glass. Dim it via emissiveIntensity. */}
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={GLOW.idle} />
        </mesh>
      </group>
    );
  },
);

/** Satin-graphite rounded block with a thin emissive edge line. Children render on its front face. */
export const ChainBlock = forwardRef<
  THREE.Group,
  GroupProps & { size?: [number, number, number]; edge?: string; selected?: boolean; children?: ReactNode }
>(function ChainBlock({ size = [2, 1.4, 0.3], edge = COLORS.honest, selected = false, children, ...props }, ref) {
  const [w, h, d] = size;
  // The rounded box's smoothed normals never pass Edges' angle threshold, so the outline is
  // traced from a plain box of the same size instead.
  const edgeGeo = useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);
  useEffect(() => () => edgeGeo.dispose(), [edgeGeo]);
  return (
    <group ref={ref} {...props}>
      <Select enabled={selected}>
        <RoundedBox args={size} radius={0.06} smoothness={6} userData={{ role: 'body' }}>
          <meshPhysicalMaterial color={COLORS.graphite} roughness={0.35} metalness={0.6} clearcoat={0.6} clearcoatRoughness={0.25} transparent />
        </RoundedBox>
      </Select>
      {/* outside <Select>: the Outline pass would draw Line2's instanced quads as boxes */}
      <Edges geometry={edgeGeo} threshold={15} color={edge} lineWidth={1.25} transparent opacity={0.9} userData={{ role: 'edge' }} />
      <group position={[0, 0, size[2] / 2 + 0.005]}>{children}</group>
    </group>
  );
});

/**
 * Screen-space-width link (Line2), so it stays a crisp 1.5px at any DPR. `flowing` dashes
 * crawl along the link with frame-rate-independent speed to show data moving.
 */
export function Link({
  points,
  color = COLORS.honest,
  flowing = false,
  opacity = 0.7,
  name,
}: {
  points: THREE.Vector3[] | [number, number, number][];
  color?: string;
  flowing?: boolean;
  opacity?: number;
  name?: string;
}) {
  const ref = useRef<Line2>(null);
  useFrame((_, delta) => {
    if (flowing && ref.current && !reducedMotion()) ref.current.material.dashOffset -= delta * 0.6;
  });
  return (
    <Line
      ref={ref}
      name={name}
      points={points}
      color={color}
      lineWidth={1.5}
      dashed={flowing}
      dashSize={0.18}
      gapSize={0.12}
      transparent
      opacity={opacity}
    />
  );
}

/** SDF text (troika) with real font files. Never canvas textures, never TextGeometry. */
export function Label({
  children,
  mono = false,
  semi = false,
  size = 0.16,
  color = COLORS.bone,
  ...props
}: {
  position?: [number, number, number];
  children: string;
  mono?: boolean;
  semi?: boolean;
  size?: number;
  color?: string | THREE.Color;
  anchorX?: 'left' | 'center' | 'right';
  anchorY?: 'top' | 'middle' | 'bottom';
  maxWidth?: number;
}) {
  return (
    <Text
      font={mono ? FONTS.mono : semi ? FONTS.uiSemi : FONTS.ui}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      sdfGlyphSize={64}
      {...props}
    >
      {children}
    </Text>
  );
}

/** "₹100" in 3D: the sign comes from the latin-ext subset, digits from latin. Left-anchored at origin. */
export function Amount({ value, size = 0.2, color = COLORS.bone, ...props }: ThreeElements['group'] & { value: string; size?: number; color?: string }) {
  return (
    <group {...props}>
      <Text font={FONTS.rupee} fontSize={size} color={color} anchorX="left" anchorY="middle" sdfGlyphSize={64}>
        {'\u20B9'}
      </Text>
      <Text font={FONTS.uiSemi} fontSize={size} color={color} anchorX="left" anchorY="middle" position={[size * 0.62, 0, 0]} sdfGlyphSize={64}>
        {value}
      </Text>
    </group>
  );
}



/** Invisible box the camera rig frames with fitToBox: deterministic framing, independent of animation state. */
export function FrameBox({ name, size, position }: { name: string; size: [number, number, number]; position?: [number, number, number] }) {
  return (
    <mesh name={name} position={position} visible={false}>
      <boxGeometry args={size} />
    </mesh>
  );
}
