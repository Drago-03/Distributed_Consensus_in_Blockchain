import { useStore } from '../store/useStore';
import { SLIDE_META } from '../slides/meta';
import { StepEngine } from '../engine/StepEngine';

const PART_COLORS: Record<string, string> = { intro: 'var(--ash)', A: 'var(--honest)', B: 'var(--stake)', C: 'var(--signal)' };

// One numbered tile per slide, part colour on the bottom edge. Unvisited slides are dimmed.
export function ChainNavigator() {
  const slideIndex = useStore((s) => s.slideIndex);
  const visitedSlides = useStore((s) => s.visitedSlides);

  return (
    <div className="chain-nav">
      {SLIDE_META.map((meta, si) => (
        <button
          key={si}
          type="button"
          className="chain-tile"
          title={`${si + 1}. ${meta.title}`}
          aria-label={`Slide ${si + 1}: ${meta.title}`}
          aria-current={si === slideIndex ? 'true' : undefined}
          data-visited={visitedSlides.has(si) || undefined}
          style={{ ['--part' as string]: PART_COLORS[meta.part] }}
          onClick={() => StepEngine.goTo(si)}
        >
          {si + 1}
        </button>
      ))}
    </div>
  );
}
