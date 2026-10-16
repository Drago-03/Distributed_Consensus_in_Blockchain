# QUORUM: Distributed Consensus in Blockchain

> An interactive 3D presentation, roughly 80 minutes long, that walks an audience from "what is a block?" to Proof of Stake, forks and 51% attacks.

**[▶ Play it live](https://drago-03.github.io/Distributed_Consensus_in_Blockchain/decks/Blockchain_Concepts/Distributed_Consensus_in_Blockchain/)** · [Presentation hub](https://drago-03.github.io/Distributed_Consensus_in_Blockchain/)

Each slide is a live **React Three Fiber** scene. The camera flies between slide "stations" along a path through one shared 3D world. Every click reveals one step, and each step has its own camera shot, caption and speaker script.

---

## Contents

- [Getting started](#getting-started)
- [Presenting](#presenting)
- [Slide index](#slide-index)
- [Architecture](#architecture)
- [Creating your own deck](#creating-your-own-deck)
- [Scripts](#scripts)
- [Third-party notices](#third-party-notices)

## Getting started

```bash
bun install      # or: npm install
bun run dev      # starts Vite on http://localhost:5173
```

| Requirement | Version |
| ----------- | ------- |
| Bun | ≥ 1.3 (or Node ≥ 20 with npm) |
| Browser | Recent Chrome, Edge, Firefox or Safari with WebGL 2 |

## Presenting

### Controls

| Action | Input |
| ------ | ----- |
| Next step | `→` `↓` `Space` `PageDown`, scroll down, swipe left/up |
| Previous step | `←` `↑` `PageUp`, scroll up, swipe right/down |
| Restart current slide | `R` |
| Restart whole deck | `Shift` + `R` |
| Open presenter window | `N` |

### Presenter window

Press **`N`** to open a separate notes window and drag it to your laptop screen while the main window is on the projector. The two windows stay in sync through `BroadcastChannel`. The presenter view shows the current step's speaker script, the slide outline and a live preview of the scene.

### Deep links and resume

The URL always reflects your position (`#/slide/7/step/3`), so you can bookmark or share any step. Progress is also saved locally, and on reload the deck offers to continue where you stopped.

### Accessibility

- Honors `prefers-reduced-motion`: camera flights become short crossfades.
- Each step's caption is announced through an `aria-live` region.
- All navigation works from the keyboard alone.

## Slide index

| # | Title | Part | Steps | ~Min |
|:-:|-------|:----:|:-----:|:----:|
| 1 | Distributed Consensus in Blockchain | Intro | 1 | 1 |
| 2 | What We'll Cover | A | 3 | 2 |
| 3 | Words You'll Hear Today | A | 2 | 3 |
| 4 | What Is a Blockchain? | A | 6 | 6 |
| 5 | Three Kinds of Networks | A | 3 | 3 |
| 6 | How Do Strangers Agree? | A | 4 | 4 |
| 7 | What Is Consensus? | A | 5 | 4 |
| 8 | Why Do We Need It? | A | 4 | 3 |
| 9 | What Makes It Good? | A | 4 | 4 |
| 10 | Two Kinds of Failure | A | 3 | 3 |
| 11 | The Blockchain Trilemma | A | 4 | 4 |
| 12 | The Consensus Family Tree | B | 4 | 3 |
| 13 | Proof of Work | B | 6 | 6 |
| 14 | PoW in Real Life: Bitcoin | B | 4 | 3 |
| 15 | Proof of Stake | B | 6 | 5 |
| 16 | More Methods, Quick Look | B | 3 | 3 |
| 17 | Forks: When the Chain Splits | C | 4 | 4 |
| 18 | Common Attacks | C | 6 | 7 |
| 19 | Who Uses What | C | 2 | 3 |
| 20 | What's Coming Next | C | 4 | 4 |
| 21 | Everything in One Picture | C | 5 | 4 |
| 22 | Thank You | C | 1 | 1 |

**Total:** 22 slides, 84 steps, about 80 minutes.

## Architecture

```text
src/
├── main.tsx              Entry: routes to <App/> or <PresenterView/> by URL hash
├── App.tsx               Projected window: stage, rail, top bar, control dock
├── engine/
│   ├── StepEngine.ts     Single source of step changes; input lock and queue; URL sync
│   ├── useStepTimeline.ts  GSAP timeline bound to the current step
│   └── presenterSync.ts  BroadcastChannel protocol for the notes window
├── store/                Zustand stores (position, stage rect)
├── config/world.ts       Every motion, camera and path tunable in one place
├── world/                Shared 3D world: Stage, CameraRig, primitives, props, people
├── ui/                   TopBar, StepRail, ControlDock, ChainNavigator, QuorumRing, HashStamp
├── presenter/            Presenter (speaker notes) window
├── utils/sha256.ts       Real SHA-256 used by the live hashing demos
└── slides/
    ├── meta.ts           Titles, parts, step counts, timings
    ├── notes.ts          Speaker script, one entry per step
    ├── registry.ts       Slide index → { Scene, steps } (shared by App and PresenterView)
    └── SlideNN.tsx       One file per slide
```

**Design rule:** `StepEngine` is the only code that changes position. The 3D timeline, camera, rail, captions and URL all subscribe to the same store value, so they cannot drift out of sync.

## Creating your own deck

1. **Copy** this folder to `PPTs/<Topic>/<Deck_Name>/`.
2. **Describe** your slides in `src/slides/meta.ts`. `stepCount` must match the `steps` array length of each slide.
3. **Write** a slide. Each `SlideNN.tsx` exports a `SlideV2`:

   ```tsx
   export const slide01: SlideV2 = {
     Scene: ({ step }) => <MyScene step={step} />,
     steps: [
       { title: 'Hello', caption: 'Welcome to the talk', camera: { fit: 'hero' } },
     ],
   };
   ```

4. **Register** it in `src/slides/registry.ts`.
5. **Script** it: add one note per step to `src/slides/notes.ts`.
6. **List** it: update `deck.json` (title, topic, counts, thumbnail) so it appears in the hub.

## Scripts

| Command | Purpose |
| ------- | ------- |
| `bun run dev` | Start the dev server with HMR |
| `bun run build` | Type-check (`tsc -b`) and build to `dist/` |
| `bun run preview` | Serve the production build locally |
| `bun run lint` | Run ESLint |

## Third-party notices

This project depends on open-source libraries including React, Three.js, React Three Fiber/Drei, GSAP, Framer Motion, Zustand, Tailwind CSS and Fontsource fonts. Each one keeps its own license.

> **Porsche Design System:** the component code is Apache-2.0, but Porsche's fonts, icons and other design assets fall under the separate *Porsche Design System Assets License Agreement*, which restricts their use outside Porsche applications. Read that agreement before you reuse or redistribute this deck, or swap those components for a neutral UI kit.
