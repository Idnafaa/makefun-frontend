// Hand-in program (Node 22, standard library only): copies this repo's app/ and
// screenshots/ into the grader's output directory and writes dossier.json — the
// summary the judge reads (screenshots, first-load files and bytes, source
// outline) — using the kit's vendored library. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
const shots = join(root, 'screenshots');
if (existsSync(shots)) {
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 3, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
console.log(`handed in app/ + screenshots/ to ${outDir}`);
