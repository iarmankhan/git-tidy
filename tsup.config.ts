import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  target: 'node22',
  external: ['react'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
