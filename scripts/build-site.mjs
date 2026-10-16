#!/usr/bin/env node
// Builds the GitHub Pages site into _site/: the hub at the root and every deck under
// decks/<Topic>/<Deck>/. A deck is any PPTs/<Topic>/<Deck>/ folder that has a deck.json,
// so adding a folder is all it takes to put a new presentation in the hub.
//
// Usage: bun scripts/build-site.mjs        (or: node scripts/build-site.mjs)

import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const OUT = resolve('_site');
const sh = (cmd, cwd = '.') => execSync(cmd, { cwd, stdio: 'inherit' });
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
const dirs = (p) =>
  readdirSync(p, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort();

// owner/repo: from Actions, else from the origin remote.
const repo =
  process.env.GITHUB_REPOSITORY ||
  out('git remote get-url origin').replace(/^.*github\.com[:/]/, '').replace(/\.git$/, '');

rmSync(OUT, { recursive: true, force: true });
cpSync('hub', OUT, { recursive: true });
writeFileSync(join(OUT, '.nojekyll'), '');

const decks = [];
for (const topic of dirs('PPTs')) {
  for (const name of dirs(join('PPTs', topic))) {
    const src = join('PPTs', topic, name);
    const manifest = join(src, 'deck.json');
    if (!existsSync(manifest)) continue;

    const meta = JSON.parse(readFileSync(manifest, 'utf8'));
    const url = `decks/${topic}/${name}/`;
    const dest = join(OUT, url);
    console.log(`\n▶ ${meta.title}  →  ${url}`);

    sh('bun install --frozen-lockfile', src);
    sh('bunx tsc -b', src);
    // Relative base: the deck runs from any sub-path (GitHub Pages, forks, local preview).
    sh(`bunx vite build --base ./ --outDir "${dest}" --emptyOutDir`, src);
    if (meta.thumbnail && existsSync(join(src, meta.thumbnail))) cpSync(join(src, meta.thumbnail), join(dest, meta.thumbnail));

    decks.push({
      ...meta,
      id: `${topic}/${name}`,
      path: src.split('\\').join('/'),
      url,
      thumbnail: meta.thumbnail ? url + meta.thumbnail : null,
      source: `https://github.com/${repo}/tree/main/${src.split('\\').join('/')}`,
      updated: out(`git log -1 --format=%cI -- "${src}"`) || new Date().toISOString(),
    });
  }
}

writeFileSync(join(OUT, 'decks.json'), JSON.stringify({ repo, generated: new Date().toISOString(), decks }, null, 2));
console.log(`\n✓ Hub + ${decks.length} deck(s) written to _site/`);
