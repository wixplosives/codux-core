// @ts-check
import { build, context } from 'esbuild';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const watch = process.argv.includes('-w') || process.argv.includes('--watch');
const outPath = new URL(`../dist/client`, import.meta.url);

const entryClientURL = new URL('../src/client/index.tsx', import.meta.url);
/** @type {import('esbuild').BuildOptions} */
const esmClientBuildOptions = {
    entryPoints: [fileURLToPath(entryClientURL)],
    outdir: fileURLToPath(outPath),
    format: 'esm',
    platform: 'browser',
    bundle: true,
    target: 'es2022',
    sourcemap: true,
    packages: 'external',
    logLevel: 'info',
    color: true,
};

await fs.rm(outPath, { recursive: true, force: true });
await fs.mkdir(outPath, { recursive: true });

if (watch) {
    const clientCtx = await context(esmClientBuildOptions);

    await clientCtx.watch();
} else {
    await build(esmClientBuildOptions);
}
