import { useStore } from '../store/useStore';
import { SLIDE_META } from '../slides/meta';
import { motion, AnimatePresence } from 'framer-motion';

export function QuorumRing() {
  const slideIndex = useStore((s) => s.slideIndex);
  const stepIndex = useStore((s) => s.stepIndex);
  const meta = SLIDE_META[slideIndex];
  const total = meta?.stepCount ?? 1;
  const filled = stepIndex + 1;
  const isComplete = filled >= total;

  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${filled} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.6, opacity: 0.3 }}
          animate={{
            scale: i === stepIndex ? 1.3 : i < filled ? 1 : 0.7,
            opacity: i < filled ? 1 : 0.3,
            backgroundColor:
              i === stepIndex
                ? 'var(--signal)'
                : i < stepIndex
                ? 'var(--honest)'
                : 'var(--slate-line)',
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'var(--slate-line)',
          }}
        />
      ))}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="ml-1 text-[11px] font-mono"
            style={{ color: 'var(--honest)' }}
          >
            ✓
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
