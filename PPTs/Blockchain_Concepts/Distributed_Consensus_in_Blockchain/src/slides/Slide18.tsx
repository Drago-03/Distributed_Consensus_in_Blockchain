import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStepTimeline } from '../engine/useStepTimeline';
import { reducedMotion } from '../engine/StepEngine';
import { ChainBlock, Label, Link, FrameBox } from '../world/primitives';
import { Monitor, GlowNode, Coin, CoinStack, Figure } from '../world/props';
import { fadeTo } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// Common attacks, one small world each. The camera visits them in turn; the last step
// replaces the 3D with a full-screen list of risks.

const FLOOR = -2.4;
const ZX = [-26, -13, 0, 13, 26];
type V = [number, number, number];

// ── 51% attack ──
function FiftyOne() {
  const ring = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * 1.5, Math.sin(a) * 1.5 + 0.9, 0);
  }), []);
  return (
    <group>
      {/* the network in the middle */}
      {ring.map((p, i) => <GlowNode key={i} position={p} radius={0.18} color={i < 4 ? '#2BFF88' : '#FF4A3D'} pulse={false} />)}
      {ring.map((p, i) => <Link key={`l${i}`} color={COLORS.ash} opacity={0.35} points={[p, ring[(i + 3) % 8]]} />)}
      {/* hash-power gauge: exactly 51 / 49 */}
      <group position={[0, 0.9, -0.1]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[2.25, 0.09, 16, 128, Math.PI * 2 * 0.51]} />
          <meshBasicMaterial color={[2.2, 0.35, 0.3]} toneMapped={false} transparent />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2 + Math.PI * 2 * 0.51]}>
          <torusGeometry args={[2.25, 0.09, 16, 128, Math.PI * 2 * 0.49]} />
          <meshBasicMaterial color={[0.3, 1.6, 1.4]} toneMapped={false} transparent />
        </mesh>
        <Label semi size={0.42} color={COLORS.fault} position={[-2.95, 1.2, 0]}>51%</Label>
        <Label semi size={0.3} color={COLORS.honest} position={[2.9, -1.1, 0]}>49%</Label>
      </group>
      {/* users and hackers */}
      {[-1, 0, 1].map((k) => <Figure key={`u${k}`} shirt={['#3ED6C5', '#6FB7FF', '#5BE38A'][k + 1]} skin={['#e0ac69', '#8d5524', '#f1c27d'][k + 1]} position={[-4.6 + k * 0.6, FLOOR, 0.6 - Math.abs(k) * 0.4]} />)}
      {[-1, 0, 1].map((k) => <Figure key={`h${k}`} hacker position={[4.6 + k * 0.6, FLOOR, 0.6 - Math.abs(k) * 0.4]} />)}
      <Label semi size={0.17} color={COLORS.honest} position={[-4.6, -0.3, 0.6]}>HONEST USERS</Label>
      <Label semi size={0.17} color={COLORS.fault} position={[4.6, -0.3, 0.6]}>ATTACKERS</Label>
      {/* public chain vs the secret, longer chain */}
      <group position={[0, -1.85, 0.6]}>
        {[0, 1, 2].map((i) => <ChainBlock key={i} position={[-2.6 + i * 0.95, 0.32, 0]} size={[0.8, 0.42, 0.12]} edge={COLORS.honest} />)}
        {[0, 1, 2, 3, 4].map((i) => <ChainBlock key={`s${i}`} position={[-2.6 + i * 0.95, -0.32, 0]} size={[0.8, 0.42, 0.12]} edge={COLORS.fault} />)}
        <Label mono size={0.1} color={COLORS.honest} position={[-0.7, 0.68, 0]}>PUBLIC CHAIN</Label>
        <Label mono size={0.1} color={COLORS.fault} position={[2.85, -0.32, 0]}>SECRET CHAIN, LONGER: REPLACES IT</Label>
      </group>
    </group>
  );
}

// ── Sybil ──
// fake identities fan out in a wide arc behind the one real attacker
const CLONES = Array.from({ length: 8 }, (_, i) => {
  const k = i < 4 ? -(i + 1) : i - 3;
  return [k * 1.05, FLOOR, -0.4 - Math.abs(k) * 0.25] as V;
});
function Sybil({ clones, wall }: { clones: React.RefObject<(THREE.Group | null)[]>; wall: React.RefObject<THREE.Group | null> }) {
  return (
    <group>
      <Figure hacker position={[0, FLOOR, 0.8]} scale={1.25} />
      <Label semi size={0.2} color={COLORS.fault} position={[0, -2.75, 1.2]}>ONE ATTACKER, MANY FAKE IDS</Label>
      {CLONES.map((p, i) => (
        <group key={i} ref={(g) => { clones.current[i] = g; }} position={p}>
          <Figure shirt="#9b2a22" skin="#c68642" scale={1.15} />
          <Label mono size={0.12} color={COLORS.fault} position={[0, 2.3, 0]}>FAKE ID</Label>
        </group>
      ))}
      <group ref={wall} position={[0, 1.55, 1.9]}>
        {/* solid panel: fades always restore opacity to 1, so no see-through materials here */}
        <ChainBlock size={[6.8, 1.0, 0.06]} edge={COLORS.honest}>
          <Label semi size={0.17} color={COLORS.bone} position={[0, 0.16, 0]}>VOTING POWER COSTS REAL WORK (PoW) OR LOCKED COINS (PoS)</Label>
          <Label mono size={0.12} color={COLORS.honest} position={[0, -0.18, 0]}>FAKE IDENTITIES BUY ZERO EXTRA POWER</Label>
        </ChainBlock>
      </group>
    </group>
  );
}

// ── Smart contract exploit (reentrancy) ──
function CoinStream({ from, to, count = 6, color = 'gold' as const }: { from: V; to: V; count?: number; color?: 'gold' }) {
  const coins = useRef<(THREE.Group | null)[]>([]);
  const a = useMemo(() => new THREE.Vector3(...from), [from]);
  const b = useMemo(() => new THREE.Vector3(...to), [to]);
  useFrame((state) => {
    coins.current.forEach((c, i) => {
      if (!c) return;
      const t = reducedMotion() ? i / count : (state.clock.elapsedTime * 0.5 + i / count) % 1;
      c.position.lerpVectors(a, b, t);
      c.position.y += Math.sin(t * Math.PI) * 0.9;
    });
  });
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} ref={(g) => { coins.current[i] = g; }}>
          <Coin kind={color} radius={0.16} />
        </group>
      ))}
    </>
  );
}
const CODE = ['function withdraw() {', '  send(msg.sender, balance);', '  balance = 0;   // too late!', '}'];
function Exploit({ vault }: { vault: React.RefObject<THREE.Group | null> }) {
  return (
    <group>
      <ChainBlock position={[-1.9, 0.6, 0]} size={[4.4, 3.0, 0.4]} edge={COLORS.stake}>
        <Label mono size={0.13} color={COLORS.stake} anchorX="left" position={[-2.0, 1.2, 0]}>SMART CONTRACT  ·  VAULT</Label>
        {CODE.map((l, i) => (
          <Label key={i} mono size={0.15} color={i === 2 ? COLORS.fault : COLORS.bone} anchorX="left" position={[-2.0, 0.8 - i * 0.28, 0]}>{l}</Label>
        ))}
        <group ref={vault} position={[1.3, -1.35, 0.35]}>
          <CoinStack count={12} kind="gold" radius={0.34} />
        </group>
        <Label mono size={0.11} color={COLORS.signal} anchorX="left" position={[-2.0, -1.15, 0]}>FUNDS LOCKED IN THE CONTRACT</Label>
      </ChainBlock>
      <Figure hacker position={[2.6, FLOOR, 0.4]} />
      <CoinStream from={[-0.6, -0.4, 0.6]} to={[2.6, -0.5, 0.6]} />
      {/* the re-entry loop */}
      <mesh position={[0.9, 1.75, 0.2]} rotation={[0, 0, 0.3]}>
        <torusGeometry args={[0.55, 0.03, 12, 64, Math.PI * 1.6]} />
        <meshBasicMaterial color={[2.2, 0.35, 0.3]} toneMapped={false} transparent />
      </mesh>
      <Label mono size={0.12} color={COLORS.fault} position={[0.9, 2.55, 0.2]}>{'withdraw() -> withdraw() -> withdraw() ...'}</Label>
    </group>
  );
}

// ── DDoS ──
const BOTS = 14;
function Flood() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const lanes = useMemo(() => Array.from({ length: 120 }, (_, i) => {
    const a = (i % BOTS) / BOTS * Math.PI * 2;
    return { from: new THREE.Vector3(Math.cos(a) * 4.2, Math.sin(a) * 2.3 + 0.6, -0.4), speed: 0.5 + ((i * 13) % 7) * 0.08, phase: (i * 0.37) % 1 };
  }), []);
  const target = useMemo(() => new THREE.Vector3(0, 0.6, 0.2), []);
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    lanes.forEach((l, i) => {
      const t = reducedMotion() ? l.phase : (state.clock.elapsedTime * l.speed + l.phase) % 1;
      tmp.position.lerpVectors(l.from, target, t);
      tmp.scale.setScalar(0.07);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <Monitor position={[0, 0.6, 0.2]} color={COLORS.fault} width={2.2}>
        <Label mono size={0.13} color={COLORS.fault} position={[0, 0.25, 0]}>EXCHANGE API</Label>
        <Label semi size={0.22} color={COLORS.fault} position={[0, -0.05, 0]}>503 OVERLOADED</Label>
      </Monitor>
      {Array.from({ length: BOTS }, (_, i) => {
        const a = (i / BOTS) * Math.PI * 2;
        return <Monitor key={i} position={[Math.cos(a) * 4.2, Math.sin(a) * 2.3 + 0.6, -0.4]} color={COLORS.fault} width={0.6} />;
      })}
      <instancedMesh ref={mesh} args={[undefined, undefined, lanes.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={[2.4, 0.4, 0.3]} toneMapped={false} transparent />
      </instancedMesh>
      <Figure shirt={COLORS.honest} position={[-5.2, FLOOR, 1.2]} />
      <group position={[-3.6, -0.6, 1.2]}>
        <ChainBlock size={[1.5, 0.4, 0.08]} edge={COLORS.honest}>
          <Label mono size={0.1} color={COLORS.honest}>YOUR TX: WAITING</Label>
        </ChainBlock>
      </group>
    </group>
  );
}

// ── ...and more ──
const MORE = ['ECLIPSE', 'FLASH LOAN', 'RUG PULL', 'PHISHING', 'DUSTING', 'TIME-JACKING'];
function More() {
  const nodes = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    return new THREE.Vector3(Math.cos(a) * 2.6, Math.sin(a) * 1.7 + 0.6, 0);
  }), []);
  return (
    <group>
      {nodes.map((p, i) => <Monitor key={i} position={p} color={COLORS.honest} width={1.2} />)}
      {nodes.map((p, i) => <Link key={`l${i}`} color={COLORS.ash} opacity={0.3} points={[p, nodes[(i + 1) % 6]]} />)}
      {nodes.map((p, i) => (
        <group key={`b${i}`} position={[p.x * 1.5, p.y * 1.25 - 0.1, 0.4]}>
          <ChainBlock size={[1.7, 0.42, 0.08]} edge={COLORS.fault}>
            <Label semi size={0.13} color={COLORS.fault}>{MORE[i]}</Label>
          </ChainBlock>
        </group>
      ))}
    </group>
  );
}

function Scene({ step }: { step: number }) {
  const zones = useRef<(THREE.Group | null)[]>([]);
  const clones = useRef<(THREE.Group | null)[]>([]);
  const wall = useRef<THREE.Group | null>(null);
  const vault = useRef<THREE.Group | null>(null);

  useStepTimeline(step, (tl, next) => {
    const z = zones.current;
    const only = (k: number, at: number, d?: number) => z.forEach((g, i) => fadeTo(tl, g, i === k ? 1 : 0, at, d));
    only(0, 0, 0);
    // sybil starts as one person; the clones and the cost wall arrive on its step
    clones.current.forEach((c) => c && tl.set(c.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0));
    if (wall.current) tl.set(wall.current.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
    next((at) => {
      only(1, at);
      clones.current.forEach((c, i) => c && tl.to(c.scale, { x: 1, y: 1, z: 1, ease: 'back.out(1.6)', duration: 0.4 }, at + 0.3 + i * 0.08));
      if (wall.current) tl.to(wall.current.scale, { x: 1, y: 1, z: 1, ease: 'power3.out', duration: 0.5 }, at + 1.2);
      clones.current.forEach((c) => fadeTo(tl, c, 0.25, at + 1.5, 0.4));
    });
    next((at) => {
      only(2, at);
      if (vault.current) tl.fromTo(vault.current.scale, { y: 1 }, { y: 0.15, ease: 'power1.in', duration: 1.4 }, at + 0.3);
    });
    next((at) => only(3, at));
    next((at) => only(4, at));
    next((at) => only(-1, at, 0.3)); // risks: the 3D steps aside for the full-screen list
  });

  const zone = (i: number, el: React.ReactNode, title: string) => (
    <group ref={(g) => { zones.current[i] = g; }} position={[ZX[i], 0, 0]}>
      <Label semi size={0.3} color={COLORS.fault} position={[0, 3.6, 0]}>{title}</Label>
      {el}
    </group>
  );

  return (
    <group>
      {ZX.map((x, i) => <FrameBox key={i} name={`z${i}`} size={[11, 7.2, 1]} position={[x, 0.6, 0]} />)}
      {zone(0, <FiftyOne />, '51% ATTACK')}
      {zone(1, <Sybil clones={clones} wall={wall} />, 'SYBIL ATTACK')}
      {zone(2, <Exploit vault={vault} />, 'SMART CONTRACT EXPLOIT')}
      {zone(3, <Flood />, 'DDoS ATTACK')}
      {zone(4, <More />, '...AND MANY MORE')}
    </group>
  );
}

/** All four attacks at once, 2 x 2, each in its finished state (used by the summary montage). */
export function AttackGrid() {
  const clones = useRef<(THREE.Group | null)[]>([]);
  const wall = useRef<THREE.Group | null>(null);
  const vault = useRef<THREE.Group | null>(null);
  const cells: [string, React.ReactNode][] = [
    ['51% ATTACK', <FiftyOne />],
    ['SYBIL', <Sybil clones={clones} wall={wall} />],
    ['SMART CONTRACT BUG', <Exploit vault={vault} />],
    ['DDoS', <Flood />],
  ];
  return (
    <group>
      {cells.map(([title, el], i) => (
        <group key={title} position={[(i % 2 ? 1 : -1) * 6, i < 2 ? 4.2 : -4.4, 0]}>
          <Label semi size={0.7} color={COLORS.fault} position={[0, 3.3, 0]}>{title}</Label>
          <group scale={0.82} position={[0, -0.4, 0]}>{el}</group>
        </group>
      ))}
    </group>
  );
}

// ── rail content ──

interface Example { name: string; detail: string; url: string }
function Incidents({ list }: { list: Example[] }) {
  return (
    <div className="flex flex-col gap-static-sm">
      <p className="rail-kicker" style={{ color: 'var(--signal)' }}>Real incidents</p>
      {list.map((ex) => (
        <p key={ex.name} className="rail-meta">
          <a href={ex.url} target="_blank" rel="noreferrer" style={{ color: 'var(--bone)' }}>{ex.name}</a>: {ex.detail}
        </p>
      ))}
    </div>
  );
}

const ATTACKS = [
  {
    title: '51% Attack',
    summary: 'One group controls most of the network’s mining or staking power and secretly builds a longer chain, then reveals it to rewrite recent history and double-spend. Like 16 of 30 students teaming up to fake a class vote. They can’t steal coins from your wallet (that needs your private key), but they can reverse their own recent payments.',
    examples: [
      { name: 'Bitcoin Gold', detail: 'May 2018: ~388,000 BTG (~$18M) double-spent via a 51% attack.', url: 'https://en.wikipedia.org/wiki/Bitcoin_Gold' },
      { name: 'Ethereum Classic', detail: 'Jan 2019 (~$1.1M) and Aug 2020 (~$5.6M + $1.68M): two separate 51% reorg attacks.', url: 'https://en.wikipedia.org/wiki/Ethereum_Classic' },
    ],
  },
  {
    title: 'Sybil Attack',
    summary: 'One attacker creates many fake identities to gain disproportionate influence: like one person voting 50 times with fake accounts. The term comes from John Douceur’s 2002 paper. Blockchains defeat this by making influence cost something real: computing power in PoW, locked coins in PoS.',
    examples: [{ name: 'Sybil attack (concept)', detail: 'Formalized by John R. Douceur, 2002, “The Sybil Attack”.', url: 'https://en.wikipedia.org/wiki/Sybil_attack' }],
  },
  {
    title: 'Smart Contract Exploit',
    summary: 'A bug in a smart contract’s code (not in consensus itself) lets an attacker drain funds. The contract does exactly what its code says; the code just didn’t say what the authors intended. Here, withdraw() pays out before zeroing the balance, so the attacker calls it again and again.',
    examples: [
      { name: 'The DAO', detail: 'June 17, 2016: a reentrancy bug let an attacker siphon 3.6M ETH (~$50M). Led to the Ethereum / Ethereum Classic split.', url: 'https://en.wikipedia.org/wiki/The_DAO' },
      { name: 'Ronin Network bridge', detail: 'March 23, 2022: ~$620M stolen. Attributed to the Lazarus Group.', url: 'https://en.wikipedia.org/wiki/Ronin_Network' },
    ],
  },
  {
    title: 'DDoS Attack',
    summary: 'Flood nodes, exchanges or RPC endpoints with junk traffic or spam transactions so the network slows or stalls: like 1,000 fake calls jamming a helpline. Transaction fees make spamming the chain itself expensive; most DDoS damage lands on exchanges and websites.',
    examples: [{ name: 'Denial-of-service attack (concept)', detail: 'Background on the attack class and standard mitigations.', url: 'https://en.wikipedia.org/wiki/Denial-of-service_attack' }],
  },
];
const MORE_ATTACKS = [
  { name: 'Eclipse / Routing attack', body: 'Surround one node with attacker-controlled peers, feeding it a false picture of the network.' },
  { name: 'Flash loan attack', body: 'Borrow a huge sum for one transaction to manipulate a price or vote, then repay it before it ends.' },
  { name: 'Rug pull', body: 'Creators abandon a project after draining the liquidity investors put in.' },
  { name: 'Phishing / private-key theft', body: 'Trick a user into signing a malicious transaction or revealing their key: the most common way individuals lose funds.' },
  { name: 'Dusting attack', body: 'Send tiny amounts to many wallets to de-anonymize owners by tracing the “dust”.' },
  { name: 'Time-jacking', body: 'Feed a node a false network time to distort which chain it considers valid.' },
];
const RISKS = [
  { title: 'Irreversibility', body: 'No central undo button: a confirmed transaction, or an exploited one, is final.', css: 'var(--fault)' },
  { title: 'Custody risk', body: 'Lose your private key and the funds are gone. There is no “forgot password” link.', css: 'var(--signal)' },
  { title: 'Code is the law', body: 'Smart contract bugs are exploited exactly as written, not as intended, and run automatically.', css: 'var(--stake)' },
  { title: 'Environmental cost', body: 'PoW mining consumes real-world energy at national-grid scale.', css: 'var(--work)' },
  { title: 'Regulatory uncertainty', body: 'Rules differ by country and change quickly: what’s legal can shift overnight.', css: 'var(--vote)' },
  { title: 'Concentration creep', body: 'Mining pools and large staking providers can quietly re-centralize a “decentralized” system.', css: 'var(--ash)' },
];

export const slide18: SlideV2 = {
  Scene,
  steps: [
    ...ATTACKS.map((a, i) => ({
      title: a.title,
      caption: `${a.title}. ${a.summary}`,
      camera: { fit: `z${i}`, padding: 0.2 },
      body: (
        <div className="flex flex-col gap-static-md">
          <p className="rail-body">{a.summary}</p>
          <Incidents list={a.examples} />
        </div>
      ),
    })),
    {
      title: '...and many more',
      caption: 'Eclipse, flash loan, rug pull, phishing, dusting and time-jacking attacks.',
      camera: { fit: 'z4', padding: 0.2 },
      body: (
        <dl className="rail-defs">
          {MORE_ATTACKS.map((m) => <div key={m.name}><dt style={{ color: 'var(--bone)' }}>{m.name}</dt><dd>{m.body}</dd></div>)}
        </dl>
      ),
    },
    {
      title: 'Risks of blockchain',
      caption: 'Risks: irreversibility, custody risk, code is the law, environmental cost, regulatory uncertainty, concentration creep.',
      camera: { fit: 'z4', padding: 0.2 },
      overlay: true,
      body: (
        <div className="risk-board">
          <p className="rail-kicker" style={{ color: 'var(--fault)' }}>Risks of blockchain</p>
          <div className="risk-grid">
            {RISKS.map((r) => (
              <div key={r.title} className="risk-card" style={{ borderTopColor: r.css }}>
                <h3 style={{ color: r.css }}>{r.title}</h3>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ],
};
