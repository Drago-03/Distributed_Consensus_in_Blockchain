import * as THREE from 'three';
import { DIM_OPACITY } from '../config/world';

// Timeline helpers shared by slide scenes: fades, colour tweens, focus dimming.

/** Dim everything except `active` to DIM_OPACITY; bring `active` back to full. */
export function focusOn(tl: gsap.core.Timeline, at: number | string, all: (THREE.Object3D | null)[], active: (THREE.Object3D | null)[]) {
  for (const o of all) fadeTo(tl, o, active.includes(o) ? 1 : DIM_OPACITY, at);
}

/** Tween a THREE.Color (material colour / emissive) to a hex value. */
export function colorTo(tl: gsap.core.Timeline, c: THREE.Color | undefined, hex: string, at: number | string) {
  if (!c) return;
  const t = new THREE.Color(hex);
  tl.to(c, { r: t.r, g: t.g, b: t.b }, at);
}

/** Collect every fadeable target under an object: materials (opacity) and troika texts (fillOpacity). */
export function fadeTargets(root: THREE.Object3D | null) {
  const mats = new Set<THREE.Material>();
  const texts: THREE.Object3D[] = [];
  root?.traverse((o) => {
    if ('fillOpacity' in o) {
      texts.push(o);
      return;
    }
    const m = (o as THREE.Mesh).material;
    if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach((x) => mats.add(x));
  });
  return { mats: [...mats], texts };
}

/** Add an opacity tween for everything under `root` to a timeline. Glass shells keep their own ratio. */
export function fadeTo(tl: gsap.core.Timeline, root: THREE.Object3D | null, opacity: number, at: number | string, duration?: number) {
  const { mats, texts } = fadeTargets(root);
  // A fully faded material still writes depth and would hide whatever is behind it,
  // so it is switched off while its opacity is ~0 (and back on as it fades in).
  const sync = () => mats.forEach((m) => { m.visible = m.opacity > 0.01; });
  const syncText = () => texts.forEach((t) => { t.visible = (t as unknown as { fillOpacity: number }).fillOpacity > 0.01; });
  if (mats.length) tl.to(mats, { opacity, duration, onUpdate: sync, onComplete: sync, onReverseComplete: sync }, at);
  if (texts.length) tl.to(texts, { fillOpacity: opacity, duration, onUpdate: syncText, onComplete: syncText, onReverseComplete: syncText }, at);
}

/** Core emissive (state) tween for a GlassNode group. */
export function coreOf(node: THREE.Object3D | null): THREE.MeshStandardMaterial | null {
  let m: THREE.MeshStandardMaterial | null = null;
  node?.traverse((o) => {
    if (o.userData.role === 'core') m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
  });
  return m;
}
