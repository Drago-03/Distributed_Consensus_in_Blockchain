import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStepTimeline } from '../engine/useStepTimeline';
import { Label } from '../world/primitives';
import { Blackboard, Chalk, Student, SKIN, SHIRTS, HAIR, type StudentLook } from '../world/people';
import { fadeTo, colorTo } from '../world/anim';
import { COLORS } from '../config/world';
import type { SlideV2 } from './registry';

// Consensus as a classroom: 30 students solve the same sum on their own, most get 42,
// and 42 goes up on the board.

const COLS = 6;
const ROWS = 5;
const FLOOR = -2.4;
const WRONG: Record<number, string> = { 3: '41', 11: '24', 19: '43', 24: '14' };
const BOARD_Y = 1.0;
const BOARD_Z = -4.6;

// deterministic mix of boys and girls, skin tones, shirts and hair
const LOOKS: StudentLook[] = Array.from({ length: COLS * ROWS }, (_, i) => ({
  female: (i * 7 + 3) % 5 < 2 || i % 4 === 1,
  skin: SKIN[(i * 5 + 1) % SKIN.length],
  shirt: SHIRTS[(i * 3 + 2) % SHIRTS.length],
  hair: HAIR[(i * 2 + 1) % HAIR.length],
}));
const seat = (i: number) =>
  new THREE.Vector3(((i % COLS) - (COLS - 1) / 2) * 1.08, FLOOR, (Math.floor(i / COLS) - (ROWS - 1) / 2) * 1.2 + 0.4);

function Scene({ step }: { step: number }) {
  const papers = useRef<THREE.Object3D[]>([]);
  const answers = useRef<(THREE.Group | null)[]>([]);
  const board = useRef<THREE.Group>(null);
  // stable Color instances: troika re-reads them each frame, the timeline tweens them
  const answerColors = useMemo(() => LOOKS.map(() => new THREE.Color(COLORS.bone)), []);

  useStepTimeline(step, (tl, next) => {
    const hide = (g: THREE.Object3D | null | undefined) => {
      if (!g) return;
      tl.set(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0);
      fadeTo(tl, g, 0, 0, 0);
    };
    papers.current.forEach(hide);
    answers.current.forEach(hide);
    hide(board.current);
    if (board.current) tl.set(board.current.position, { y: BOARD_Y - 0.6 }, 0);

    // 2. everyone gets the same question
    next((at) =>
      papers.current.forEach((p, i) => {
        tl.to(p.scale, { x: 1, y: 1, z: 1 }, at + (i % COLS) * 0.03 + Math.floor(i / COLS) * 0.05);
        fadeTo(tl, p, 1, at + (i % COLS) * 0.03, 0.3);
      }),
    );
    // 3. each solves it alone: answers pop up over every head
    next((at) =>
      answers.current.forEach((a, i) => {
        if (!a) return;
        tl.to(a.scale, { x: 1, y: 1, z: 1, ease: 'back.out(1.6)', duration: 0.5 }, at + ((i * 7) % 30) * 0.015);
        fadeTo(tl, a, 1, at + ((i * 7) % 30) * 0.015, 0.3);
      }),
    );
    // 4. the few mistakes stand out, the majority agrees
    next((at) =>
      answers.current.forEach((a, i) => {
        colorTo(tl, answerColors[i], WRONG[i] ? COLORS.fault : COLORS.honest, at);
        if (a && WRONG[i]) fadeTo(tl, a, 0.55, at + 0.3, 0.4);
      }),
    );
    // 5. 42 goes on the board
    next((at) => {
      if (!board.current) return;
      tl.to(board.current.scale, { x: 1, y: 1, z: 1, duration: 0.01 }, at);
      tl.to(board.current.position, { y: BOARD_Y, ease: 'power3.out' }, at);
      fadeTo(tl, board.current, 1, at, 0.5);
    });
  });

  return (
    <group>
      {LOOKS.map((look, i) => (
        <Student
          key={i}
          look={look}
          position={seat(i)}
          writing={step === 2}
          ref={(g) => {
            const paper = g?.children.find((c) => c.userData.role === 'paper');
            if (paper) papers.current[i] = paper;
          }}
        >
          <group ref={(g) => { answers.current[i] = g; }}>
            <Label semi size={0.2} color={answerColors[i]}>{WRONG[i] ?? '42'}</Label>
          </group>
        </Student>
      ))}
      <Blackboard ref={board} position={[0, BOARD_Y, BOARD_Z]} width={4.8} height={2.3}>
        <Chalk size={1.25} position={[0, 0.05, 0]}>42</Chalk>
      </Blackboard>
    </group>
  );
}

/** Order matters too: the same two payments, two orders. */
function OrderDemo() {
  const [order, setOrder] = useState<'valid' | 'invalid'>('valid');
  return (
    <div className="rail-inset">
      <p className="rail-kicker" style={{ color: 'var(--signal)' }}>Order matters too: with ₹100 in hand</p>
      <div className="flex gap-static-sm" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="rail-chip" data-on={order === 'valid' || undefined} onClick={() => setOrder('valid')}>
          receive 50, then spend 150
        </button>
        <button type="button" className="rail-chip" data-bad data-on={order === 'invalid' || undefined} onClick={() => setOrder('invalid')}>
          spend 150, then receive 50
        </button>
      </div>
      <p className="rail-body" style={{ color: order === 'valid' ? 'var(--honest)' : 'var(--fault)' }}>
        {order === 'valid' ? 'Valid: you had the money at that moment.' : 'Rejected: you didn’t have ₹150 yet.'}
      </p>
    </div>
  );
}

const CLASS_VIEW = { pos: [0, 4.6, 9.4] as [number, number, number], target: [0, -0.4, -1.6] as [number, number, number] };

export const slide07: SlideV2 = {
  Scene,
  steps: [
    {
      title: 'What is consensus?',
      caption: 'All honest computers agree on the same record, in the same order.',
      camera: CLASS_VIEW,
      body: <p className="rail-body">All honest computers agree on the <b>same record</b>, in the <b>same order</b>.</p>,
    },
    {
      title: 'Same question for everyone',
      caption: '30 students in a class are given the same maths question.',
      camera: { pos: [0, 3.8, 8.2], target: [0, -0.8, -0.6] },
      body: <p className="rail-body">30 students in a class are given the same maths question.</p>,
    },
    {
      title: 'Everyone solves it alone',
      caption: 'Each one solves it and checks their own answer. Nobody copies.',
      camera: { pos: [0, 3.8, 8.2], target: [0, -0.6, -0.6] },
      body: <p className="rail-body">Each one solves it and checks their own answer. Nobody copies.</p>,
    },
    {
      title: 'Most of them get 42',
      caption: 'A few make silly mistakes, but most of them get 42.',
      camera: CLASS_VIEW,
      body: <p className="rail-body">A few make silly mistakes (in red), but most of them get <b style={{ color: 'var(--honest)' }}>42</b>.</p>,
    },
    {
      title: '42 goes on the board',
      caption: '42 goes on the board: from now on, everybody uses 42.',
      camera: { pos: [0, 3.4, 9.6], target: [0, 0.2, -2.6] },
      body: (
        <div className="flex flex-col gap-static-md">
          <p className="rail-body">42 goes on the board: from now on, everybody uses 42. No teacher told them the answer; the group reached it on its own.</p>
          <OrderDemo />
        </div>
      ),
    },
  ],
};
