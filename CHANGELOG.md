# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-10-16

### Added

- **Presentation hub** at the site root, modelled on the Google Slides home screen in dark mode. It has search, a topic filter, sorting, grid and list views, per-deck menus and a template gallery with a one-line `degit` command.
- `deck.json` manifest per deck, and `scripts/build-site.mjs`, which builds the hub and every deck into one site. New deck folders appear in the hub automatically.
- GitHub Pages deployment on every push to `main`.
- CI job that builds the full site on every pull request.

### Fixed

- Slide 04 illustrations now load when the deck is served from a sub-path.

## [1.0.0] - 2026-10-16

### Added

- **Distributed Consensus in Blockchain** deck: 22 interactive 3D slides in three parts
  (Foundations, Mechanisms, Real World).
- Step engine with keyboard, wheel, trackpad and touch input, deep links and resume.
- Presenter window with synced speaker notes and scene preview.
- Live SHA-256 hashing demo.
- Reduced-motion support and `aria-live` step captions.
- Open-source scaffolding: license, contributing guide, code of conduct, security policy,
  issue and PR templates, and CI.

[1.1.0]: https://github.com/Drago-03/Distributed_Consensus_in_Blockchain/releases/tag/v1.1.0
[1.0.0]: https://github.com/Drago-03/Distributed_Consensus_in_Blockchain/releases/tag/v1.0.0
