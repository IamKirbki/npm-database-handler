import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.esm.js',
      format: 'esm',
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      clean: true
    }),
    resolve({
      extensions: ['.ts', '.js']
    }),
    commonjs()
  ],
  external: ['better-sqlite3']
};