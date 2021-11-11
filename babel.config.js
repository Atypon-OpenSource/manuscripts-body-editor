/*!
 * © 2021 Atypon Systems LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
module.exports = {
  env: {
    development: {
      plugins: ['react-hot-loader/babel'],
      presets: [
        ['@babel/env', { targets: { browsers: 'last 2 years' } }],
        '@babel/react',
        '@babel/typescript',
      ],
    },
    test: {
      plugins: ['dynamic-import-node', 'transform-es2015-modules-commonjs'],
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
  ],
}
