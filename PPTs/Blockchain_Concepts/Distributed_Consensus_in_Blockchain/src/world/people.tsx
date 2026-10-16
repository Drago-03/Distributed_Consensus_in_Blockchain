import { forwardRef, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { easing } from 'maath';
import { FONTS } from '../config/world';
import { reducedMotion } from '../engine/StepEngine';

type GroupProps = ThreeElements['group'];

// Classroom props: seated students (seen from behind, facing the board at -Z), desks, a blackboard.

export const SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#d4a373'];
export const SHIRTS = ['#3a6ea5', '#c0504d', '#4f8a5b', '#7b5ea7', '#d9a441', '#2f4858', '#b5651d', '#5c7aa6'];
export const HAIR = ['#141414', '#3b2214', '#5a3820', '#22160e'];

export interface StudentLook {
  female: boolean;
  skin: string;
  shirt: string;
  hair: string;
}

/**
 * A student seated at a desk, origin on the floor under the chair, facing -Z.
 * `writing` makes the head nod over the paper. Children render just above the head
 * (answer bubbles). Tween handle: userData.role 'paper'.
 */
export const Student = forwardRef<THREE.Group, GroupProps & { look: StudentLook; writing?: boolean; children?: ReactNode }>(
  function Student({ look, writing = false, children, ...props }, ref) {
    const head = useRef<THREE.Group>(null);
    const seed = useRef(Math.random() * 6);
    useFrame((state, delta) => {
      if (!head.current) return;
      const nod = writing && !reducedMotion() ? Math.sin(state.clock.elapsedTime * 3 + seed.current) * 0.08 + 0.18 : 0.05;
      easing.damp(head.current.rotation, 'x', -nod, 0.12, delta);
    });
    const skin = <meshStandardMaterial color={look.skin} roughness={0.6} transparent />;
    const hairMat = <meshStandardMaterial color={look.hair} roughness={0.55} transparent />;
    return (
      <group ref={ref} {...props}>
        {/* stool */}
        <mesh position={[0, 0.44, 0.05]}>
          <boxGeometry args={[0.44, 0.05, 0.4]} />
          <meshStandardMaterial color="#3b3f46" roughness={0.6} metalness={0.3} transparent />
        </mesh>
        <mesh position={[0, 0.21, 0.05]}>
          <cylinderGeometry args={[0.03, 0.05, 0.42, 12]} />
          <meshStandardMaterial color="#2a2d33" metalness={0.6} roughness={0.4} transparent />
        </mesh>
        {/* body */}
        <mesh position={[0, 0.82, 0.04]} rotation={[-0.15, 0, 0]}>
          <capsuleGeometry args={[0.17, 0.32, 8, 20]} />
          <meshStandardMaterial color={look.shirt} roughness={0.75} transparent />
        </mesh>
        {/* arms reaching to the desk */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.21, 0.86, -0.1]} rotation={[-1.05, 0, side * 0.12]}>
            <capsuleGeometry args={[0.055, 0.3, 6, 12]} />
            <meshStandardMaterial color={look.shirt} roughness={0.75} transparent />
          </mesh>
        ))}
        <group ref={head} position={[0, 1.12, -0.02]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.1, 12]} />
            {skin}
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.13, 32, 24]} />
            {skin}
          </mesh>
          {/* hair cap: covers the crown and the back of the head (what the camera sees) */}
          <mesh position={[0, 0.17, 0.012]} rotation={[0.5, 0, 0]}>
            <sphereGeometry args={[0.138, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            {hairMat}
          </mesh>
          {look.female && (
            <>
              {/* long hair down the back + ponytail band */}
              <mesh position={[0, 0.02, 0.1]} rotation={[0.18, 0, 0]}>
                <capsuleGeometry args={[0.11, 0.24, 8, 16]} />
                {hairMat}
              </mesh>
              <mesh position={[0, 0.17, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.04, 0.012, 8, 20]} />
                <meshStandardMaterial color="#d94f70" roughness={0.5} transparent />
              </mesh>
            </>
          )}
        </group>
        {/* desk */}
        <RoundedBox args={[0.82, 0.05, 0.5]} radius={0.015} smoothness={3} position={[0, 0.76, -0.42]}>
          <meshStandardMaterial color="#8a6a4a" roughness={0.6} transparent />
        </RoundedBox>
        <mesh position={[0, 0.38, -0.66]}>
          <boxGeometry args={[0.78, 0.72, 0.03]} />
          <meshStandardMaterial color="#2c3036" roughness={0.6} metalness={0.3} transparent />
        </mesh>
        <mesh position={[0.05, 0.79, -0.42]} rotation={[-Math.PI / 2, 0, 0.08]} userData={{ role: 'paper' }}>
          <planeGeometry args={[0.3, 0.38]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.9} transparent />
        </mesh>
        <group position={[0, 1.62, 0]}>{children}</group>
      </group>
    );
  },
);

/** A classroom blackboard: black slate, white frame, chalk tray. Children are written in chalk. */
export const Blackboard = forwardRef<THREE.Group, GroupProps & { width?: number; height?: number; children?: ReactNode }>(
  function Blackboard({ width = 4.4, height = 2.1, children, ...props }, ref) {
    const t = 0.06;
    return (
      <group ref={ref} {...props}>
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color="#0b0c0c" roughness={0.95} transparent />
        </mesh>
        {[
          { p: [0, height / 2 + t / 2, 0.02], s: [width + 2 * t, t, 0.05] },
          { p: [0, -height / 2 - t / 2, 0.02], s: [width + 2 * t, t, 0.05] },
          { p: [width / 2 + t / 2, 0, 0.02], s: [t, height, 0.05] },
          { p: [-width / 2 - t / 2, 0, 0.02], s: [t, height, 0.05] },
        ].map((f, i) => (
          <mesh key={i} position={f.p as [number, number, number]}>
            <boxGeometry args={f.s as [number, number, number]} />
            <meshStandardMaterial color="#f2f2ee" roughness={0.5} transparent />
          </mesh>
        ))}
        <mesh position={[0, -height / 2 - t - 0.04, 0.09]}>
          <boxGeometry args={[width * 0.9, 0.04, 0.14]} />
          <meshStandardMaterial color="#e9e9e4" roughness={0.6} transparent />
        </mesh>
        {/* chalk sticks on the tray */}
        {[-0.9, -0.75, 1.1].map((x) => (
          <mesh key={x} position={[x, -height / 2 - t - 0.005, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 0.16, 10]} />
            <meshStandardMaterial color="#fafaf5" roughness={0.9} transparent />
          </mesh>
        ))}
        <group position={[0, 0, 0.01]}>{children}</group>
      </group>
    );
  },
);

/** Chalk handwriting on a board. */
export function Chalk({ children, size = 0.9, ...props }: GroupProps & { children: string; size?: number }) {
  return (
    <group {...props}>
      <Text font={FONTS.chalk} fontSize={size} color="#f3f3ee" fillOpacity={0.92} anchorX="center" anchorY="middle" sdfGlyphSize={64}>
        {children}
      </Text>
    </group>
  );
}
