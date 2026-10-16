import { forwardRef, useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { COLORS, FONTS } from '../config/world';
import { reducedMotion } from '../engine/StepEngine';

type GroupProps = ThreeElements['group'];

// Reusable scene props shared across slides: computers, glowing nodes, live hash text.

/**
 * A desktop monitor: rounded satin bezel, a softly lit screen tinted `color`, neck and foot.
 * Children render on the screen surface (origin = screen centre). Tween handle: userData.role 'screen'.
 */
export const Monitor = forwardRef<THREE.Group, GroupProps & { color?: string; width?: number; dark?: boolean; children?: ReactNode }>(
  function Monitor({ color = COLORS.honest, width = 1.2, dark = false, children, ...props }, ref) {
    const h = width * 0.62;
    return (
      <group ref={ref} {...props}>
        <RoundedBox args={[width, h, 0.07]} radius={0.03} smoothness={4}>
          <meshPhysicalMaterial color="#0e1014" metalness={0.55} roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.2} transparent />
        </RoundedBox>
        <mesh position={[0, 0, 0.036]} userData={{ role: 'screen' }}>
          <planeGeometry args={[width - 0.08, h - 0.08]} />
          <meshStandardMaterial color="#05080d" emissive={color} emissiveIntensity={dark ? 0 : 0.045} roughness={0.15} metalness={0.1} transparent />
        </mesh>
        {/* thin lit accent along the bottom bezel: reads as the power strip */}
        <mesh position={[0, -h / 2 + 0.012, 0.037]}>
          <planeGeometry args={[width * 0.18, 0.008]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent />
        </mesh>
        <mesh position={[0, -h / 2 - h * 0.2, -0.03]}>
          <boxGeometry args={[width * 0.07, h * 0.42, 0.04]} />
          <meshPhysicalMaterial color="#15181e" metalness={0.8} roughness={0.3} transparent />
        </mesh>
        <RoundedBox args={[width * 0.42, 0.035, width * 0.24]} radius={0.015} smoothness={3} position={[0, -h / 2 - h * 0.42, 0]}>
          <meshPhysicalMaterial color="#15181e" metalness={0.8} roughness={0.3} transparent />
        </RoundedBox>
        <group position={[0, 0, 0.04]}>{children}</group>
      </group>
    );
  },
);

const glowVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const glowFrag = /* glsl */ `
  uniform vec3 color;
  uniform float intensity;
  uniform float opacity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    // clamp: interpolated normals can make the base slightly negative, and pow() of that is NaN,
    // which bloom then smears across the whole frame
    float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.2);
    gl_FragColor = vec4(color * f * intensity, f * opacity);
  }
`;

/** Additive fresnel halo: bright at the silhouette, clear in the middle. `intensity` > 1 blooms. */
export function useGlowMaterial(color: string, intensity = 2) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(color) }, intensity: { value: intensity }, opacity: { value: 1 } },
        vertexShader: glowVert,
        fragmentShader: glowFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [color, intensity],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  return mat;
}

/**
 * A network node as people picture one: a glossy black dot with a green glow that breathes.
 * `opacity` on the group's halo is exposed as userData.halo (ShaderMaterial uniforms).
 */
export const GlowNode = forwardRef<THREE.Group, GroupProps & { radius?: number; color?: string; pulse?: boolean }>(
  function GlowNode({ radius = 0.4, color = '#2BFF88', pulse = true, ...props }, ref) {
    const halo = useGlowMaterial(color, 2.4);
    const t0 = useRef(Math.random() * 10);
    useFrame((state) => {
      // timelines fade materials via .opacity; the shader reads a uniform, so mirror it
      halo.uniforms.opacity.value = halo.opacity;
      const breathe = !pulse || reducedMotion() ? 1 : 1 + Math.sin((state.clock.elapsedTime + t0.current) * 2.2) * 0.4;
      halo.uniforms.intensity.value = 2 * breathe * halo.opacity;
    });
    return (
      <group ref={ref} {...props} userData={{ halo }}>
        <mesh>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshPhysicalMaterial color="#020303" roughness={0.18} metalness={0.2} clearcoat={1} clearcoatRoughness={0.05} transparent />
        </mesh>
        <mesh scale={1.35} material={halo}>
          <sphereGeometry args={[radius, 48, 48]} />
        </mesh>
        <pointLight color={color} intensity={2.5} distance={radius * 6} />
      </group>
    );
  },
);

const HEX = '0123456789abcdef';
const randHex = (n: number) => Array.from({ length: n }, () => HEX[(Math.random() * 16) | 0]).join('');

/**
 * Monospace hash that keeps changing (a ledger being written). Updates troika text directly
 * every `every` seconds: no React re-render.
 */
export function HashTicker({
  length = 16,
  prefix = '0x',
  every = 0.35,
  size = 0.12,
  color = COLORS.honest,
  ...props
}: GroupProps & { length?: number; prefix?: string; every?: number; size?: number; color?: string }) {
  const ref = useRef<THREE.Mesh & { text: string; sync: () => void }>(null);
  const acc = useRef(Math.random() * every);
  const initial = useMemo(() => prefix + randHex(length), [prefix, length]);
  useFrame((_, delta) => {
    const t = ref.current;
    if (!t || reducedMotion()) return;
    acc.current += delta;
    if (acc.current < every) return;
    acc.current = 0;
    t.text = prefix + randHex(length);
    t.sync();
  });
  return (
    <group {...props}>
      <Text ref={ref} font={FONTS.mono} fontSize={size} color={color} anchorX="center" anchorY="middle" sdfGlyphSize={64}>
        {initial}
      </Text>
    </group>
  );
}

// ── Crypto coins ──

export type CoinKind = 'btc' | 'eth' | 'ada' | 'sol' | 'gold';
const COIN_STYLE: Record<CoinKind, { face: string; rim: string; mark: string }> = {
  btc: { face: '#F7931A', rim: '#C2700F', mark: '#FFF4E0' },
  eth: { face: '#3C3C5A', rim: '#C9CBD6', mark: '#9EA4F5' },
  ada: { face: '#0D2E8C', rim: '#C9CBD6', mark: '#E8EEFF' },
  sol: { face: '#121218', rim: '#9945FF', mark: '#14F195' },
  gold: { face: '#D4A72C', rim: '#A57E17', mark: '#FFF2C2' },
};

function CoinMark({ kind, r }: { kind: CoinKind; r: number }) {
  const c = COIN_STYLE[kind].mark;
  if (kind === 'btc' || kind === 'ada')
    return (
      <Text font={FONTS.rupee} fontSize={r * 1.15} color={c} anchorX="center" anchorY="middle" sdfGlyphSize={64}>
        {kind === 'btc' ? '₿' : '₳'}
      </Text>
    );
  if (kind === 'eth')
    return (
      <mesh scale={[r * 0.38, r * 0.62, r * 0.12]}>
        <octahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial color={c} metalness={0.6} roughness={0.2} flatShading transparent />
      </mesh>
    );
  if (kind === 'sol')
    return (
      <>
        {[0.32, 0, -0.32].map((y, i) => (
          <mesh key={i} position={[0, y * r, 0]} rotation={[0, 0, 0.18]}>
            <boxGeometry args={[r * 1.0, r * 0.16, r * 0.04]} />
            <meshStandardMaterial color={['#14F195', '#5C9BE6', '#9945FF'][i]} emissive={['#14F195', '#5C9BE6', '#9945FF'][i]} emissiveIntensity={0.3} transparent />
          </mesh>
        ))}
      </>
    );
  return (
    <mesh>
      <ringGeometry args={[r * 0.3, r * 0.42, 6]} />
      <meshStandardMaterial color={c} transparent />
    </mesh>
  );
}

/** A minted coin standing face-on to the camera (+Z), with relief on both faces. `spin` = sway speed. */
export const Coin = forwardRef<THREE.Group, GroupProps & { kind?: CoinKind; radius?: number; spin?: number }>(
  function Coin({ kind = 'gold', radius = 0.6, spin = 0, ...props }, ref) {
    const inner = useRef<THREE.Group>(null);
    const st = COIN_STYLE[kind];
    const depth = radius * 0.18;
    // sway rather than spin: a coin seen edge-on reads as a line
    useFrame((state) => {
      if (spin && inner.current && !reducedMotion()) inner.current.rotation.y = Math.sin(state.clock.elapsedTime * spin) * 0.55;
    });
    return (
      <group ref={ref} {...props}>
        <group ref={inner}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[radius, radius, depth, 64]} />
            <meshPhysicalMaterial color={st.face} metalness={0.85} roughness={0.28} clearcoat={0.6} transparent />
          </mesh>
          <mesh>
            <torusGeometry args={[radius, depth * 0.32, 16, 64]} />
            <meshPhysicalMaterial color={st.rim} metalness={1} roughness={0.22} transparent />
          </mesh>
          {[1, -1].map((side) => (
            <group key={side} position={[0, 0, (side * depth) / 2 + side * 0.004]} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
              <mesh>
                <ringGeometry args={[radius * 0.8, radius * 0.84, 64]} />
                <meshStandardMaterial color={st.rim} metalness={1} roughness={0.3} transparent />
              </mesh>
              <CoinMark kind={kind} r={radius} />
            </group>
          ))}
        </group>
      </group>
    );
  },
);

/** A neat stack of `count` gold-edged coins lying flat (for balances, stakes, rewards). */
export function CoinStack({ count, kind = 'gold', radius = 0.32, ...props }: GroupProps & { count: number; kind?: CoinKind; radius?: number }) {
  const st = COIN_STYLE[kind];
  const h = radius * 0.16;
  return (
    <group {...props}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[Math.sin(i * 1.7) * 0.015, h / 2 + i * h * 1.04, Math.cos(i * 1.3) * 0.015]}>
          <cylinderGeometry args={[radius, radius, h, 48]} />
          <meshPhysicalMaterial color={i % 2 ? st.face : st.rim} metalness={0.9} roughness={0.3} transparent />
        </mesh>
      ))}
    </group>
  );
}

// ── Standing figures ──

/**
 * A standing person, origin at the feet, facing +Z (the camera). `hacker` wears a dark hood
 * with a red-lit face; users get a shirt colour and visible face.
 */
export function Figure({ hacker = false, shirt = COLORS.honest, skin = '#e0ac69', ...props }: GroupProps & { hacker?: boolean; shirt?: string; skin?: string }) {
  const body = hacker ? '#16171b' : shirt;
  return (
    <group {...props}>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, 0.42, 0]}>
          <capsuleGeometry args={[0.07, 0.6, 6, 12]} />
          <meshStandardMaterial color={hacker ? '#0d0e11' : '#2c3442'} roughness={0.8} transparent />
        </mesh>
      ))}
      <mesh position={[0, 1.12, 0]}>
        <capsuleGeometry args={[0.2, 0.5, 8, 20]} />
        <meshStandardMaterial color={body} roughness={0.75} transparent />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.28, 1.08, 0]} rotation={[0, 0, s * 0.12]}>
          <capsuleGeometry args={[0.06, 0.5, 6, 12]} />
          <meshStandardMaterial color={body} roughness={0.75} transparent />
        </mesh>
      ))}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.15, 32, 24]} />
        <meshStandardMaterial color={hacker ? '#050506' : skin} roughness={0.6} transparent />
      </mesh>
      {hacker ? (
        <>
          {/* hood */}
          <mesh position={[0, 1.66, -0.02]} scale={[1, 1.12, 1]}>
            <sphereGeometry args={[0.2, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
            <meshStandardMaterial color="#1d1f25" roughness={0.9} side={THREE.DoubleSide} transparent />
          </mesh>
          {/* glowing eyes */}
          {[-0.05, 0.05].map((x) => (
            <mesh key={x} position={[x, 1.64, 0.14]}>
              <sphereGeometry args={[0.022, 12, 12]} />
              <meshBasicMaterial color={[3, 0.4, 0.3]} toneMapped={false} transparent />
            </mesh>
          ))}
        </>
      ) : (
        <mesh position={[0, 1.68, -0.02]} rotation={[-0.4, 0, 0]}>
          <sphereGeometry args={[0.158, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#2a1a10" roughness={0.6} transparent />
        </mesh>
      )}
    </group>
  );
}
