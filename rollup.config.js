import fs from 'fs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import sucrase from '@rollup/plugin-sucrase';
import pkg from './package.json';

const external = (id) => id.startsWith('albio/');

// const ts_plugin = typescript({
//   include: 'src/**',
//   typescript: require('typescript'),
// });

const ts_plugin = sucrase({
  transforms: ['typescript'],
});

fs.writeFileSync(`./compiler.d.ts`, `export * from './types/compiler/index';`);

export default [
  {
    input: `src/runtime/index.ts`,
    output: [
      {
        file: `index.mjs`,
        format: 'esm',
        paths: (id) => id.startsWith('albio/') && `${id.replace('albio', '.')}/index.mjs`,
      },
      {
        file: `index.js`,
        format: 'cjs',
        paths: (id) => id.startsWith('albio/') && `${id.replace('albio', '.')}/index.js`,
      },
    ],
    external,
    plugins: [ts_plugin],
  },

  ...fs
    .readdirSync('src/runtime')
    .filter((dir) => fs.statSync(`src/runtime/${dir}`).isDirectory())
    .map((dir) => ({
      input: `src/runtime/${dir}/index.ts`,
      output: [
        {
          file: `${dir}/index.mjs`,
          format: 'esm',
          paths: (id) => id.startsWith('albio/') && `${id.replace('albio', '..')}/index.mjs`,
        },
        {
          file: `${dir}/index.js`,
          format: 'cjs',
          paths: (id) => id.startsWith('albio/') && `${id.replace('albio', '..')}/index.js`,
        },
      ],
      external,
      plugins: [
        replace({
          __VERSION__: pkg.version,
        }),
        ts_plugin,
        {
          writeBundle() {
            fs.writeFileSync(
              `${dir}/package.json`,
              JSON.stringify(
                {
                  main: './index',
                  module: './index.mjs',
                  types: './index.d.ts',
                },
                null,
                '  ',
              ),
            );
            fs.writeFileSync(`${dir}/index.d.ts`, `export * from '../types/runtime/${dir}/index';`);
          },
        },
      ],
    })),

  {
    input: 'src/compiler/index.ts',
    plugins: [
      replace({
        __VERSION__: pkg.version,
      }),
      resolve(),
      commonjs({
        include: ['node_modules/**'],
      }),
      json(),
      ts_plugin,
    ],
    output: [
      {
        file: 'compiler.js',
        format: 'cjs',
        name: 'albio',
        sourcemap: true,
      },
      {
        file: 'compiler.mjs',
        format: 'esm',
        name: 'albio',
        sourcemap: true,
      },
    ],
  },
];
