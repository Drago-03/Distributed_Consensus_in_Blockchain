# Contributing

Thanks for your interest in improving these presentations. This guide explains how to propose changes.

## Ways to contribute

- **Content fixes:** factual errors, unclear wording, typos in slides or speaker notes.
- **Slide improvements:** better visuals, smoother choreography, clearer camera shots.
- **Accessibility:** keyboard flow, reduced-motion behaviour, contrast, screen-reader captions.
- **New decks:** add a deck under `PPTs/<Topic>/<Deck_Name>/`.

## Before you start

1. Search [existing issues](https://github.com/Drago-03/Distributed_Consensus_in_Blockchain/issues) to avoid duplicates.
2. For anything larger than a small fix, open an issue first so we can agree on the approach.
3. Use the matching issue template: **Slide review**, **Bug report** or **Feature request**.

## Development workflow

```bash
# 1. Fork, then clone your fork
git clone https://github.com/<you>/Distributed_Consensus_in_Blockchain.git
cd Distributed_Consensus_in_Blockchain/PPTs/Blockchain_Concepts/Distributed_Consensus_in_Blockchain

# 2. Install and run
bun install
bun run dev

# 3. Create a branch from main
git checkout -b feat/slide-13-difficulty-demo
```

### Branch naming

| Prefix | Use for |
| ------ | ------- |
| `feat/` | New slides, scenes or features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `chore/` | Tooling, config, dependencies |
| `ci/` | CI workflows |

### Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(slide-13): animate nonce search in Proof of Work scene
fix(engine): drop queued step when jumping to a slide
docs: document presenter window shortcut
```

Use the slide scope (`slide-01` … `slide-22`) for single-slide changes.

## Pull request checklist

- [ ] `bun run lint` passes
- [ ] `bun run build` passes (type-check and bundle)
- [ ] Walked through every changed slide in the browser, forward and backward
- [ ] `stepCount` in `meta.ts` matches the slide's `steps` length
- [ ] Speaker notes in `notes.ts` updated if the steps changed
- [ ] Checked with `prefers-reduced-motion` enabled
- [ ] PR links the issue it resolves (`Closes #123`)

CI runs lint and build on every pull request.

## Code style

- TypeScript strict mode, functional React components.
- Every motion and camera tunable lives in `src/config/world.ts`. Do not hard-code durations in slides.
- Only `StepEngine` changes position. Do not set the slide or step from components directly.
- Keep comments short and explain *why*, not *what*.

## Code of Conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
