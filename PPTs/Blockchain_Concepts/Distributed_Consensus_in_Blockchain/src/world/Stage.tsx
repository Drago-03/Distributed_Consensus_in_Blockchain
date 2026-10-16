import { lazy, Suspense, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import {
  AdaptiveDpr,
  ContactShadows,
  Environment,
  Grid,
  Lightformer,
  PerformanceMonitor,
} from '@react-three/drei';
import {
  Bloom,
  EffectComposer,
  Noise,
  Outline,
  Selection,
  SMAA,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useStore } from '../store/useStore';
import { getSlideEntry } from '../slides/registry';
import { COLORS, station } from '../config/world';
import { CameraRig } from './CameraRig';

// Dev-only frame meter (`?perf`). The DEV check is static, so prod builds drop the import.
const Perf = import.meta.env.DEV ? lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf }))) : null;
const showPerf = import.meta.env.DEV && new URLSearchParams(location.search).has('perf');

/** Soft studio: one big softbox key, two thin strip rims. Rendered once into the env map. */
function StudioLights() {
  return (
    <>
      <Environment resolution={512} frames={1} environmentIntensity={1.25}>
        <color attach="background" args={['#0d0f13']} />
        <Lightformer form="rect" intensity={5} position={[0, 5, 6]} scale={[14, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={8} position={[-8, 1.5, -2]} scale={[0.6, 10, 1]} target={[0, 0, 0]} color="#cfe9ff" />
        <Lightformer form="rect" intensity={8} position={[8, 1.5, -2]} scale={[0.6, 10, 1]} target={[0, 0, 0]} color="#ffe6c4" />
        <Lightformer form="rect" intensity={1.2} position={[0, -5, 2]} scale={[12, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={2} position={[0, 2, -8]} scale={5} target={[0, 0, 0]} color="#3ED6C5" />
      </Environment>
      {/* soft key so matte surfaces read even where the env map is dark */}
      <directionalLight position={[4, 6, 8]} intensity={1.1} />
      <hemisphereLight args={['#c9d6e8', '#0a0b0e', 0.35]} />
    </>
  );
}

/** One slide's world, placed at its station on the path and grounded by a contact shadow. */
function Station({ index, step }: { index: number; step: number }) {
  const { Scene } = getSlideEntry(index);
  const p = station(index);
  return (
    <group name={`station-${index}`} position={p}>
      <Suspense fallback={null}>
        <Scene step={step} />
      </Suspense>
      <ContactShadows position={[0, -2.4, 0]} scale={16} blur={2.6} far={5} opacity={0.55} resolution={512} color="#000000" />
    </group>
  );
}

/**
 * The ONE persistent canvas. Never unmounts; slides are stations along a path inside it.
 * Only the current station (plus the one the camera is leaving) is mounted.
 */
export function Stage() {
  const slideIndex = useStore((s) => s.slideIndex);
  const stepIndex = useStore((s) => s.stepIndex);
  const from = useStore((s) => s.from);
  const transitioning = useStore((s) => s.transitioning);
  const [maxDpr, setMaxDpr] = useState(2);

  const keepFrom = transitioning && from.slide !== slideIndex;

  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
      dpr={[1, maxDpr]}
      flat={false}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 38, near: 0.1, far: 200, position: [0, 0.6, 12], manual: true } as never}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <color attach="background" args={[COLORS.bg]} />
      <fog attach="fog" args={[COLORS.bg, 18, 60]} />

      {/* Drop to DPR 1 when fps < 50, restore when it recovers. */}
      <PerformanceMonitor onDecline={() => setMaxDpr(1)} onIncline={() => setMaxDpr(2)} />
      <AdaptiveDpr pixelated={false} />

      <StudioLights />
      <CameraRig />

      <Grid
        position={[0, -3.2, 0]}
        infiniteGrid
        followCamera
        cellSize={1}
        sectionSize={5}
        cellThickness={0.6}
        sectionThickness={0.9}
        cellColor={COLORS.gridCell}
        sectionColor={COLORS.gridSection}
        fadeDistance={40}
        fadeStrength={1.5}
      />

      <Selection>
        {keepFrom && <Station key={from.slide} index={from.slide} step={from.step} />}
        <Station key={slideIndex} index={slideIndex} step={stepIndex} />

        <EffectComposer multisampling={8} enableNormalPass={false} autoClear={false}>
          <Outline visibleEdgeColor={0xffb547} hiddenEdgeColor={0x553b16} edgeStrength={2.5} blur xRay={false} />
          <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.6} mipmapBlur />
          <Vignette offset={0.3} darkness={0.45} />
          <Noise opacity={0.025} premultiply />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <SMAA />
        </EffectComposer>
      </Selection>

      {showPerf && Perf && (
        <Suspense fallback={null}>
          <Perf position="bottom-right" />
        </Suspense>
      )}
    </Canvas>
  );
}
