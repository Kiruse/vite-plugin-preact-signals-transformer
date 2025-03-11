import { defineConfig } from "rollup";
import injectSignals from "../dist/index.js";
import babel from "@rollup/plugin-babel";

export default defineConfig({
  input: './test01.jsx',
  output: {
    dir: './dist',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    babel({
      babelHelpers: 'bundled',
      plugins: [['@babel/plugin-transform-react-jsx', {
        runtime: 'automatic',
        importSource: 'react',
      }]],
      extensions: ['.jsx', '.js'],
    }),
    injectSignals(),
  ],
});
