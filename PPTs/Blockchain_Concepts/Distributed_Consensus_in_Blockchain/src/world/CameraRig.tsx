import { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import CameraControlsImpl from 'camera-controls';
import { useStore } from '../store/useStore';
import { useStage } from '../store/useStage';
import { CAMERA_SMOOTH, ORBIT_LIMIT, station } from '../config/world';
import { reducedMotion } from '../engine/StepEngine';
import { getSlideEntry, type CameraSpec } from '../slides/registry';

type Pose = Extract<CameraSpec, { pos: unknown }>;
const DEFAULT_SPEC: Pose = { pos: [0, 0.6, 12], target: [0, 0, 0] };
const { ACTION } = CameraControlsImpl;
/** Stage aspect the step poses were authored at (desktop stage column). */
const POSE_ASPECT = 1.45;

/** Spherical angles the spec will end at, so orbit limits are centred on the step's pose. */
function endAngles(spec: CameraSpec) {
  if ('fit' in spec) return { az: 0, polar: Math.PI / 2 }; // fitToBox snaps to the front view
  const d = new THREE.Vector3(...spec.pos).sub(new THREE.Vector3(...spec.target));
  return { az: Math.atan2(d.x, d.z), polar: Math.acos(THREE.MathUtils.clamp(d.y / d.length(), -1, 1)) };
}

function unlimit(c: CameraControlsImpl) {
  c.minAzimuthAngle = -Infinity;
  c.maxAzimuthAngle = Infinity;
  c.minPolarAngle = 0;
  c.maxPolarAngle = Math.PI;
}

/**
 * Drives the one camera from the engine's position: every step has a pose or a fitToBox
 * target, every slide change is one smooth setLookAt along the station path.
 * Also frames the scene into the stage column (not the full canvas) via setViewOffset.
 */
export function CameraRig() {
  const controls = useRef<CameraControls>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const rect = useStage((s) => s.rect);
  const slideIndex = useStore((s) => s.slideIndex);
  const stepIndex = useStore((s) => s.stepIndex);
  const resetToken = useStore((s) => s.resetToken);
  const transitioning = useStore((s) => s.transitioning);

  // The virtual camera frame is the stage rect; the canvas renders a larger window around it,
  // so the stage centre is the optical centre and fitToBox fits the stage, never the rail.
  useLayoutEffect(() => {
    const r = rect ?? { left: 0, top: 0, width: size.width, height: size.height };
    if (r.width < 1 || r.height < 1) return;
    camera.aspect = r.width / r.height;
    camera.setViewOffset(r.width, r.height, -r.left, -r.top, size.width, size.height);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, rect, size.width, size.height, invalidate]);

  // Step / slide → camera target.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const spec = getSlideEntry(slideIndex).steps?.[stepIndex]?.camera ?? DEFAULT_SPEC;
    const base = station(slideIndex);
    const smooth = !reducedMotion();
    unlimit(c);
    // Poses are authored for a landscape stage; on narrower stages back the camera off so
    // the horizontal field of view still covers the same width.
    const aspect = rect && rect.height > 0 ? rect.width / rect.height : POSE_ASPECT;
    const back = Math.max(1, POSE_ASPECT / aspect);
    const lookAt = (s: Pose) =>
      void c.setLookAt(
        base.x + s.target[0] + (s.pos[0] - s.target[0]) * back,
        base.y + s.target[1] + (s.pos[1] - s.target[1]) * back,
        base.z + s.target[2] + (s.pos[2] - s.target[2]) * back,
        base.x + s.target[0], base.y + s.target[1], base.z + s.target[2],
        smooth,
      );
    if (!('fit' in spec)) {
      lookAt(spec);
      return;
    }
    // The frame box may not exist yet: <Text> suspends while its font loads, delaying the
    // slide's mount. Wait for it (up to ~1s), then fit; fall back to the default pose.
    let raf = 0;
    let tries = 0;
    const tryFit = () => {
      const target = scene.getObjectByName(`station-${slideIndex}`)?.getObjectByName(spec.fit);
      if (target) {
        // A station mounted this frame hasn't rendered yet, so its matrixWorld is still identity;
        // without this the box is measured at the world origin and the camera flies to the wrong place.
        target.updateWorldMatrix(true, false);
        const p = spec.padding ?? 0.4;
        void c.fitToBox(target, smooth, { paddingTop: p, paddingBottom: p, paddingLeft: p, paddingRight: p });
      } else if (++tries < 60) raf = requestAnimationFrame(tryFit);
      else lookAt(DEFAULT_SPEC);
    };
    tryFit();
    return () => cancelAnimationFrame(raf);
    // rect: re-fit when the stage resizes
  }, [slideIndex, stepIndex, resetToken, rect, scene]);

  // Gentle ±20° orbit, only once the transition has landed.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const free = !transitioning && !reducedMotion();
    c.enabled = free;
    if (!free) return;
    const spec = getSlideEntry(slideIndex).steps?.[stepIndex]?.camera ?? DEFAULT_SPEC;
    const { az, polar } = endAngles(spec);
    c.minAzimuthAngle = az - ORBIT_LIMIT;
    c.maxAzimuthAngle = az + ORBIT_LIMIT;
    c.minPolarAngle = polar - ORBIT_LIMIT;
    c.maxPolarAngle = polar + ORBIT_LIMIT;
  }, [transitioning, slideIndex, stepIndex]);


  // dev-only handle for automated checks (camera / controls state)
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __rig: unknown }).__rig = { camera, scene, controls, gl };
  }, [camera, scene, gl]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={CAMERA_SMOOTH}
      draggingSmoothTime={0.2}
      // wheel + touch belong to step navigation; only a left-drag orbits
      mouseButtons={{ left: ACTION.ROTATE, middle: ACTION.NONE, right: ACTION.NONE, wheel: ACTION.NONE }}
      touches={{ one: ACTION.NONE, two: ACTION.NONE, three: ACTION.NONE }}
    />
  );
}
