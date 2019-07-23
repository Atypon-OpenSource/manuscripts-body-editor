module.exports = {
  env: {
    development: {
      plugins: [
        'react-hot-loader/babel',
      ],
    },
    test: {
      plugins: [
        'dynamic-import-node',
        'transform-es2015-modules-commonjs',
      ],
    },
  },
  plugins: [
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
    '@babel/proposal-unicode-property-regex',
    '@babel/syntax-dynamic-import',
  ],
  presets: [
    '@babel/env',
    '@babel/react',
    '@babel/typescript',
  ],
}
