import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const suite = (input, output, dev = false) => ({
  input,
  plugins: [resolve({ extensions: ['.ts'] }), typescript(), ],
  output,
  onwarn: () => {},
});

export const unit = ({ file, format }) => ({
  file,
  format,
  name: 'Albio',
  strict: true,
});

const devSuite = suite(
  './src/index.ts',
  [
    unit({
      file: './dist/albio.js',
      format: 'iife',
    }),
  ],
  true,
);

const prodSuite = suite('./src/index.ts', [
  unit({
    file: './dist/albio.esm.js',
    format: 'esm',
  }),
  unit({
    file: './dist/albio.cjs.js',
    format: 'cjs',
  }),
  unit({
    file: './dist/albio.umd.js',
    format: 'umd',
  }),
  unit({
    file: './dist/albio.min.js',
    format: 'iife',
    minify: true,
  }),
]);

export default [devSuite, prodSuite];
