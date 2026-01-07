import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  external: ['react'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
