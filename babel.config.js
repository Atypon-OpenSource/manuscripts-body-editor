module.exports = {
  env: {
    development: {
      plugins: [
        'react-hot-loader/babel',
      ],
      presets: [
        ['@babel/env', { targets: { browsers: 'last 2 years' } }],
        '@babel/react',
        '@babel/typescript',
      ],
    },
    test: {
      plugins: [
        'dynamic-import-node',
        'transform-es2015-modules-commonjs',
      ],
      presets: [
        ['@babel/env', { targets: { node: 'current' } }],
        '@babel/react',
        '@babel/typescript',
      ],
    },
  },
  plugins: [
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
    '@babel/proposal-unicode-property-regex',
    '@babel/syntax-dynamic-import',
  ]
}
