import typescript from 'rollup-plugin-typescript2'
import builtins from 'rollup-plugin-node-builtins'
import resolve from 'rollup-plugin-node-resolve'
import css from 'rollup-plugin-css-only'

import pkg from './package.json'

const externals = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
]

export default {
  input: './src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    }
  ],
  external: id => {
    if (/\.css$/.test(id)) {
      return false
    }

    return externals.includes(id)
      || /@manuscripts/.test(id)
      || /mathjax/.test(id)
      || /rxdb/.test(id)
  },
  plugins: [
    resolve(),
    builtins(),
    typescript({
      abortOnError: true,
      check: true,
    }),
    css({
      output: 'dist/style.css'
    })
  ],
}
