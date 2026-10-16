<div align="center">

# Distributed Consensus in Blockchain

**An interactive, 3D, step-driven presentation that explains how thousands of computers agree on one truth without anyone in charge.**

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

## Repository structure

```text
.
├── PPTs/
│   └── Blockchain_Concepts/
│       └── Distributed_Consensus_in_Blockchain/   ← the deck (Vite + React + Three.js app)
├── .github/                                       ← CI, issue and PR templates
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

## Using this as a template

Every deck shares the same engine: a step timeline, a camera rig that flies between slide "stations", a step rail and a presenter window. To start a new deck:

1. Copy `PPTs/Blockchain_Concepts/Distributed_Consensus_in_Blockchain/` to `PPTs/<Your_Topic>/<Your_Deck>/`.
2. Edit `src/slides/meta.ts` (titles, step counts, timings) and `src/slides/notes.ts` (speaker notes).
3. Replace the `SlideNN.tsx` files with your own scenes and register them in `src/slides/registry.ts`.

## Contributing

Contributions are welcome: content corrections, new slides, accessibility fixes or entirely new decks. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) first.

## License

Source code is released under the [MIT License](LICENSE). Third-party packages keep their own licenses; see [Third-party notices](PPTs/Blockchain_Concepts/Distributed_Consensus_in_Blockchain/README.md#third-party-notices).
