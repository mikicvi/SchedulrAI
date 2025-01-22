import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['src/server.ts'],
    bundle: true,
    platform: 'node',
    outfile: 'dist/server.js',
    format: 'esm',
    packages: 'external',
    sourcemap: true,
    target: ['node20'],
    banner: {
        js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
    }
})