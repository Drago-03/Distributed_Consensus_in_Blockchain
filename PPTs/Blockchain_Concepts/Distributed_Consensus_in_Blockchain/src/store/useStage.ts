import { create } from 'zustand';

/** The on-screen rectangle of the stage column (CSS px). The camera frames into this, not the full canvas. */
export interface StageRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const useStage = create<{ rect: StageRect | null; setRect: (r: StageRect) => void }>((set) => ({
  rect: null,
  setRect: (rect) => set({ rect }),
}));
