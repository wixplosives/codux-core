// @ts-check

import { build, context } from 'esbuild';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const watch = process.argv.includes('-w') || process.argv.includes('--watch');
const outPath = new URL(`../dist/`, import.meta.url);
const entryClientURL = new URL('../src/client.tsx', import.meta.url);
const entryPluginURL = new URL('../src/index.ts', import.meta.url);
/** @type {import('esbuild').BuildOptions} */
const esmClientBuildOptions = {
    entryPoints: [fileURLToPath(entryClientURL), fileURLToPath(entryPluginURL)],
    outdir: fileURLToPath(outPath),
    format: 'esm',
    bundle: true,
    target: 'es2022',
    sourcemap: true,
    packages: 'external',
    logLevel: 'info',
    color: true,
};

await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir(outPath, { recursive: true });

if (watch) {
    const esmCtx = await context(esmClientBuildOptions);
    await esmCtx.watch();
} else {
    await Promise.all([build(esmClientBuildOptions)]);
}
