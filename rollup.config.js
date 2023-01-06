import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

const suite = (input, output, dev = false) => ({
  input,
  plugins: [
    commonjs(),
    nodeResolve(),
    typescript({
      include: 'src/**',
    }),
  ],
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
    file: './dist/albio.min.js',
    format: 'iife',
    minify: true,
  }),
]);

export default [devSuite, prodSuite];
