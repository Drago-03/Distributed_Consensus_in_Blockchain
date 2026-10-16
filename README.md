<div align="center">

# Distributed Consensus in Blockchain

**An interactive, 3D, step-driven presentation that explains how thousands of computers agree on one truth without anyone in charge.**

### [▶ Open the presentation hub](https://drago-03.github.io/Distributed_Consensus_in_Blockchain/)

[![Deploy](https://github.com/Drago-03/Distributed_Consensus_in_Blockchain/actions/workflows/pages.yml/badge.svg)](https://drago-03.github.io/Distributed_Consensus_in_Blockchain/)
[![CI](https://github.com/Drago-03/Distributed_Consensus_in_Blockchain/actions/workflows/ci.yml/badge.svg)](https://github.com/Drago-03/Distributed_Consensus_in_Blockchain/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-3ed6c5.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=white)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black.svg?logo=three.js)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg?logo=vite&logoColor=white)](https://vite.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## Overview

This repository hosts a collection of **code-first presentations**. Each one is a standalone web app, so a deck can contain live demos, real cryptography and 3D scenes instead of static slides.

The first deck, **Distributed Consensus in Blockchain**, covers 22 slides in three parts:

| Part | Theme | Slides |
| :--: | ----- | :----: |
| **A** | Foundations: blockchain, networks, consensus, the trilemma | 1–11 |
| **B** | Mechanisms: Proof of Work, Proof of Stake and other methods | 12–16 |
| **C** | Real world: forks, attacks, adoption, what comes next | 17–22 |

## Live hub

**<https://drago-03.github.io/Distributed_Consensus_in_Blockchain/>**

The site opens on a presentation hub modelled on the Google Slides home screen, in dark mode. Pick a deck to play, search and filter by topic, or start from a template. Every push to `main` rebuilds the hub and all decks and redeploys them to GitHub Pages.

## Repository structure

```text
.
├── PPTs/
│   └── Blockchain_Concepts/
│       └── Distributed_Consensus_in_Blockchain/   ← a deck (Vite + React + Three.js app) + deck.json
├── hub/                                           ← the presentation hub (static HTML/CSS/JS)
├── scripts/build-site.mjs                         ← builds the hub + every deck into _site/
├── .github/                                       ← CI, Pages deploy, issue and PR templates
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
└── LICENSE
```

Decks are grouped as `PPTs/<Topic>/<Deck_Name>/`, which leaves room for future topics and decks.

## Quick start

Requirements: [Bun](https://bun.sh) 1.3 or newer (Node 20+ with npm also works).

```bash
git clone https://github.com/Drago-03/Distributed_Consensus_in_Blockchain.git
cd Distributed_Consensus_in_Blockchain/PPTs/Blockchain_Concepts/Distributed_Consensus_in_Blockchain
bun install
bun run dev
```

Then open the URL Vite prints, usually <http://localhost:5173>.

See the [deck README](PPTs/Blockchain_Concepts/Distributed_Consensus_in_Blockchain/README.md) for controls, presenter mode, architecture, and how to build your own deck from this template.

### Preview the full site locally

```bash
bun scripts/build-site.mjs   # builds the hub and every deck into _site/
bunx serve _site             # open the printed URL
```

## Adding a deck to the hub

Any folder at `PPTs/<Topic>/<Deck_Name>/` that contains a `deck.json` is built and listed automatically:

```json
{
  "title": "Distributed Consensus in Blockchain",
  "topic": "Blockchain Concepts",
  "description": "One or two sentences shown in the hub and the template dialog.",
  "slides": 22,
  "steps": 84,
  "minutes": 80,
  "tags": ["blockchain", "consensus"],
  "accent": "#3ed6c5",
  "thumbnail": "thumbnail.webp",
  "template": true
}
```

| Field | Required | Purpose |
| ----- | :------: | ------- |
| `title`, `topic`, `description` | ✓ | Card title, topic filter, search text |
| `slides`, `steps`, `minutes` | | Badges and list-view length |
| `tags` | | Extra search keywords |
| `accent` | | Card icon colour |
| `thumbnail` | | 16:9 image in the deck folder (1200×675 WebP recommended) |
| `template` | | `true` also lists the deck under **Start a new presentation** |

Decks are built with a relative base (`vite build --base ./`), so load public assets through `import.meta.env.BASE_URL` instead of absolute `/` paths.

## Using this as a template

Every deck shares the same engine: a step timeline, a camera rig that flies between slide "stations", a step rail and a presenter window. To start a new deck:

1. Copy `PPTs/Blockchain_Concepts/Distributed_Consensus_in_Blockchain/` to `PPTs/<Your_Topic>/<Your_Deck>/`, or run `npx degit Drago-03/Distributed_Consensus_in_Blockchain/PPTs/Blockchain_Concepts/Distributed_Consensus_in_Blockchain my-deck`.
2. Update `deck.json` so the deck shows up in the hub.
3. Edit `src/slides/meta.ts` (titles, step counts, timings) and `src/slides/notes.ts` (speaker notes).
4. Replace the `SlideNN.tsx` files with your own scenes and register them in `src/slides/registry.ts`.

## Contributing

Contributions are welcome: content corrections, new slides, accessibility fixes or entirely new decks. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) first.

## License

Source code is released under the [MIT License](LICENSE). Third-party packages keep their own licenses; see [Third-party notices](PPTs/Blockchain_Concepts/Distributed_Consensus_in_Blockchain/README.md#third-party-notices).
