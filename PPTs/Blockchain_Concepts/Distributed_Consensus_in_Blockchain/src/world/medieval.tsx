import { forwardRef, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeElements } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { reducedMotion } from '../engine/StepEngine';

type GroupProps = ThreeElements['group'];

// Props for the Byzantine Generals story: Viking kingdoms' banners around England's palace.

// ── Banner artwork (SVG → texture; vector source, rasterised at 1024px so it stays crisp) ──

const svg = (body: string, w = 1024, h = 640) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  )}`;

/** Stylised raven, wings spread: the Hrafnsmerki of the Viking host. Drawn in a 400×300 box. */
const RAVEN = `
  <g fill="#111">
    <path d="M200 150 C 150 70, 70 40, 10 60 C 70 80, 110 110, 140 150 C 100 150, 60 175, 30 210 C 90 190, 140 185, 170 185 Z"/>
    <path d="M200 150 C 250 70, 330 40, 390 60 C 330 80, 290 110, 260 150 C 300 150, 340 175, 370 210 C 310 190, 260 185, 230 185 Z"/>
    <ellipse cx="200" cy="170" rx="38" ry="62"/>
    <circle cx="200" cy="100" r="26"/>
    <path d="M196 92 L 168 106 L 198 110 Z"/>
    <path d="M178 225 L 200 290 L 222 225 Z"/>
  </g>
  <circle cx="191" cy="96" r="4" fill="#f4efe2"/>`;

export const BANNERS = {
  denmark: svg(`<rect width="1024" height="640" fill="#C8102E"/><rect x="300" width="110" height="640" fill="#fff"/><rect y="265" width="1024" height="110" fill="#fff"/>`),
  norway: svg(`<rect width="1024" height="640" fill="#BA0C2F"/><rect x="280" width="150" height="640" fill="#fff"/><rect y="245" width="1024" height="150" fill="#fff"/><rect x="315" width="80" height="640" fill="#00205B"/><rect y="280" width="1024" height="80" fill="#00205B"/>`),
  sweden: svg(`<rect width="1024" height="640" fill="#006AA7"/><rect x="300" width="110" height="640" fill="#FECC00"/><rect y="265" width="1024" height="110" fill="#FECC00"/>`),
  raven: svg(`<path d="M0 0 L1024 0 L1024 640 L0 640 Z" fill="#B2201F"/><path d="M0 40 L 984 40 L 984 600 L 0 600 Z" fill="#EFE7D2"/><g transform="translate(300 170) scale(1.05)">${RAVEN}</g>`),
  traitor: svg(`<rect width="1024" height="640" fill="#E0281E"/>`),
  stGeorge: svg(`<rect width="1024" height="640" fill="#fff"/><rect x="452" width="120" height="640" fill="#CE1124"/><rect y="260" width="1024" height="120" fill="#CE1124"/>`),
} as const;
export type BannerKey = keyof typeof BANNERS;

function useBanner(url: string) {
  const tex = useTexture(url);
  const gl = useThree((s) => s.gl);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = gl.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;
  }, [tex, gl]);
  return tex;
}

/**
 * A banner on a pole, waving: plane vertices are displaced every frame by a travelling wave
 * that grows from hoist to fly (time-based, so speed is frame-rate independent).
 * Tween handle: the cloth material (userData.role 'cloth').
 */
export const Banner = forwardRef<THREE.Group, GroupProps & { art: string; width?: number; poleHeight?: number; wind?: number }>(
  function Banner({ art, width = 1.5, poleHeight = 3, wind = 1, ...props }, ref) {
    const tex = useBanner(art);
    const h = width * 0.625;
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(width, h, 28, 14);
      g.translate(width / 2, 0, 0); // hoist edge at the pole
      return g;
    }, [width, h]);
    useEffect(() => () => geo.dispose(), [geo]);
    const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
    const seed = useRef(Math.random() * 10);

    useFrame((state) => {
      if (reducedMotion()) return;
      const t = state.clock.elapsedTime * 2.4 * wind + seed.current;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        const k = x / width; // 0 at pole → 1 at fly end
        pos.setZ(i, (Math.sin(x * 3.2 - t) * 0.12 + Math.sin(x * 5.1 - t * 1.3 + y * 2) * 0.04) * k * width);
        pos.setY(i, y - k * k * 0.05 * width);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    });

    return (
      <group ref={ref} {...props}>
        <mesh position={[0, poleHeight / 2, 0]}>
          <cylinderGeometry args={[0.035, 0.045, poleHeight, 16]} />
          <meshStandardMaterial color="#5b3a22" roughness={0.75} transparent />
        </mesh>
        <mesh position={[0, poleHeight + 0.06, 0]}>
          <sphereGeometry args={[0.07, 24, 24]} />
          <meshPhysicalMaterial color="#c9a227" metalness={1} roughness={0.25} transparent />
        </mesh>
        <mesh geometry={geo} position={[0.03, poleHeight - h / 2 - 0.05, 0]} userData={{ role: 'cloth' }}>
          <meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.85} transparent />
        </mesh>
      </group>
    );
  },
);

/** Round Viking shield: painted face in two colours, iron rim and boss. */
export function Shield({ colors, ...props }: GroupProps & { colors: [string, string] }) {
  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 48]} />
        <meshStandardMaterial color={colors[0]} roughness={0.7} transparent />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <ringGeometry args={[0.16, 0.3, 48]} />
        <meshStandardMaterial color={colors[1]} roughness={0.7} transparent />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.025, 12, 64]} />
        <meshPhysicalMaterial color="#6d6f73" metalness={0.9} roughness={0.35} transparent />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <sphereGeometry args={[0.1, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#8a8d92" metalness={1} roughness={0.25} transparent />
      </mesh>
    </group>
  );
}

// ── Sword ──

const bladeShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.045, 0);
  s.lineTo(0.045, 0);
  s.lineTo(0.035, 0.95);
  s.lineTo(0, 1.08);
  s.lineTo(-0.035, 0.95);
  s.closePath();
  return s;
})();

/** A Viking-age sword pointing up its local +Y, pivot at the grip. */
export function Sword(props: GroupProps) {
  const blade = useMemo(
    () => new THREE.ExtrudeGeometry(bladeShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }),
    [],
  );
  useEffect(() => () => blade.dispose(), [blade]);
  return (
    <group {...props}>
      <mesh geometry={blade} position={[0, 0.12, -0.006]}>
        <meshPhysicalMaterial color="#d7dde3" metalness={1} roughness={0.18} clearcoat={0.5} transparent />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.3, 0.035, 0.05]} />
        <meshPhysicalMaterial color="#b08d3c" metalness={1} roughness={0.3} transparent />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.022, 0.025, 0.2, 12]} />
        <meshStandardMaterial color="#3d2516" roughness={0.9} transparent />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshPhysicalMaterial color="#b08d3c" metalness={1} roughness={0.3} transparent />
      </mesh>
    </group>
  );
}

/**
 * Two swords swinging into each other and clashing, with a spark at the moment of contact.
 * Time-based loop: swing in, strike, recoil.
 */
export const ClashingSwords = forwardRef<THREE.Group, GroupProps & { phase?: number }>(function ClashingSwords({ phase = 0, ...props }, ref) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const spark = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const still = reducedMotion();
    const t = still ? 0.45 : (state.clock.elapsedTime * 0.9 + phase) % 1;
    // 0–0.45 swing in (accelerating), 0.45 strike, 0.45–1 recoil and wind up
    const swing = t < 0.45 ? Math.pow(t / 0.45, 2.2) : 1 - THREE.MathUtils.smoothstep(t, 0.5, 1);
    const a = THREE.MathUtils.lerp(1.1, 0.42, swing);
    if (left.current) left.current.rotation.z = -a;
    if (right.current) right.current.rotation.z = a;
    if (spark.current) {
      const flash = still ? 0 : Math.max(0, 1 - Math.abs(t - 0.46) * 14);
      spark.current.scale.setScalar(0.05 + flash * 0.35);
      (spark.current.material as THREE.MeshBasicMaterial).opacity = flash;
    }
  });
  return (
    <group ref={ref} {...props}>
      <group ref={left} position={[-0.45, 0, 0]}>
        <Sword />
      </group>
      <group ref={right} position={[0.45, 0, 0.04]}>
        <Sword />
      </group>
      <mesh ref={spark} position={[0, 0.62, 0.08]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#FFD48A" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
});

// ── The White Tower (Tower of London): the Norman royal palace-fortress, simplified ──

const STONE = '#cfc6b1';
const STONE_DARK = '#b3a98f';
const LEAD = '#5f6b66';

function Crenellations({ w, d, y, size = 0.11 }: { w: number; d: number; y: number; size?: number }) {
  const merlons = useMemo(() => {
    const out: [number, number, number][] = [];
    const nx = Math.round(w / (size * 2));
    const nz = Math.round(d / (size * 2));
    for (let i = 0; i <= nx; i++) {
      const x = -w / 2 + (i * w) / nx;
      out.push([x, y, d / 2], [x, y, -d / 2]);
    }
    for (let i = 1; i < nz; i++) {
      const z = -d / 2 + (i * d) / nz;
      out.push([w / 2, y, z], [-w / 2, y, z]);
    }
    return out;
  }, [w, d, y, size]);
  return (
    <>
      {merlons.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[size, size * 1.2, size]} />
          <meshStandardMaterial color={STONE} roughness={0.92} transparent />
        </mesh>
      ))}
    </>
  );
}

function Cupola({ position, round = false }: { position: [number, number, number]; round?: boolean }) {
  return (
    <group position={position}>
      {round ? (
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.9, 32]} />
          <meshStandardMaterial color={STONE} roughness={0.9} transparent />
        </mesh>
      ) : (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.5, 0.9, 0.5]} />
          <meshStandardMaterial color={STONE} roughness={0.9} transparent />
        </mesh>
      )}
      {/* lead onion cupola and weather-vane spike */}
      <mesh position={[0, 1.02, 0]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[0.27, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color={LEAD} metalness={0.6} roughness={0.4} transparent />
      </mesh>
      <mesh position={[0, 1.42, 0]}>
        <coneGeometry args={[0.04, 0.32, 12]} />
        <meshPhysicalMaterial color="#c9a227" metalness={1} roughness={0.3} transparent />
      </mesh>
    </group>
  );
}

/** The White Tower: square Norman keep, four corner turrets (one round) with lead cupolas, curtain wall. */
export const Palace = forwardRef<THREE.Group, GroupProps>(function Palace(props, ref) {
  const W = 2.2;
  const D = 1.8;
  const H = 1.7;
  const windows = useMemo(() => {
    const out: [number, number, number][] = [];
    for (const y of [0.45, 1.05]) for (const x of [-0.6, 0, 0.6]) out.push([x, y, D / 2 + 0.005]);
    return out;
  }, []);
  return (
    <group ref={ref} {...props}>
      {/* plinth + curtain wall */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[4.2, 0.12, 3.6]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.95} transparent />
      </mesh>
      {[
        { p: [0, 0.3, 1.75], s: [4.1, 0.48, 0.14] },
        { p: [0, 0.3, -1.75], s: [4.1, 0.48, 0.14] },
        { p: [2.05, 0.3, 0], s: [0.14, 0.48, 3.5] },
        { p: [-2.05, 0.3, 0], s: [0.14, 0.48, 3.5] },
      ].map((w, i) => (
        <mesh key={i} position={w.p as [number, number, number]}>
          <boxGeometry args={w.s as [number, number, number]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.95} transparent />
        </mesh>
      ))}
      <Crenellations w={4.1} d={3.5} y={0.6} size={0.1} />
      {/* gatehouse */}
      <mesh position={[0, 0.5, 1.78]}>
        <boxGeometry args={[0.7, 0.9, 0.3]} />
        <meshStandardMaterial color={STONE} roughness={0.9} transparent />
      </mesh>
      <mesh position={[0, 0.32, 1.94]}>
        <planeGeometry args={[0.3, 0.42]} />
        <meshStandardMaterial color="#1a1612" roughness={1} transparent />
      </mesh>

      {/* the keep */}
      <group position={[0, 0.12, -0.15]}>
        <mesh position={[0, H / 2, 0]}>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial color={STONE} roughness={0.9} transparent />
        </mesh>
        {/* pilaster buttresses */}
        {[-0.95, -0.32, 0.32, 0.95].map((x) => (
          <mesh key={x} position={[x, H / 2, D / 2 + 0.03]}>
            <boxGeometry args={[0.08, H, 0.06]} />
            <meshStandardMaterial color={STONE_DARK} roughness={0.9} transparent />
          </mesh>
        ))}
        {/* round-arched Norman windows */}
        {windows.map((p, i) => (
          <group key={i} position={p}>
            <mesh>
              <planeGeometry args={[0.14, 0.26]} />
              <meshStandardMaterial color="#14110e" roughness={1} transparent />
            </mesh>
            <mesh position={[0, 0.13, 0]}>
              <circleGeometry args={[0.07, 20, 0, Math.PI]} />
              <meshStandardMaterial color="#14110e" roughness={1} transparent />
            </mesh>
          </group>
        ))}
        <Crenellations w={W} d={D} y={H + 0.06} />
        <Cupola position={[-W / 2, H, D / 2]} />
        <Cupola position={[W / 2, H, D / 2]} />
        <Cupola position={[-W / 2, H, -D / 2]} />
        <Cupola position={[W / 2, H, -D / 2]} round />
      </group>
    </group>
  );
});
