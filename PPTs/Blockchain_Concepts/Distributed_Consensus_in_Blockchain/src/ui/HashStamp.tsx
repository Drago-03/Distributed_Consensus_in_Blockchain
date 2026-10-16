import { useEffect, useState, useRef } from 'react';
import { sha256Short } from '../utils/sha256';

interface Props {
  seed: string;
}

const CHARS = '0123456789ABCDEF';

function scramble(len = 4) {
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

export function HashStamp({ seed }: Props) {
  const [display, setDisplay] = useState('----');
  const [animating, setAnimating] = useState(true);
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Caller remounts this component via `key={seed}` on every seed change, so a fresh
  // mount (not a `seed` dependency) is what restarts the scramble — avoids setState-on-mount lint noise.
  useEffect(() => {
    let count = 0;
    const frames = 8;
    frameRef.current = setInterval(() => {
      setDisplay(scramble());
      count++;
      if (count >= frames) {
        clearInterval(frameRef.current!);
        sha256Short(seed).then((h) => {
          setDisplay(h);
          setAnimating(false);
        });
      }
    }, 40);
    return () => { if (frameRef.current) clearInterval(frameRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      className="font-mono text-[13px] tracking-widest px-2 py-0.5 rounded"
      style={{
        color: animating ? 'var(--signal)' : 'var(--ash)',
        background: 'rgba(255,181,71,0.08)',
        border: '1px solid var(--slate-line)',
        transition: 'color 0.3s',
        display: 'inline-block',
        minWidth: '4.5rem',
        textAlign: 'center',
      }}
      aria-label={`Hash: ${display}`}
    >
      #{display}
    </span>
  );
}
