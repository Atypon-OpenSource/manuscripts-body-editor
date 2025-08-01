/*!
 * © 2020 Atypon Systems LLC
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
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '^.+\\.css$': '<rootDir>/src/__mocks__/styleMock.ts',
  },
  setupFilesAfterEnv: ['./src/tests.ts', 'jest-prosemirror/environment'],
  snapshotSerializers: ['jest-prosemirror/serializer'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/dist/'],
  testRegex: '__tests__.*\\.test\\.tsx?$',
  transform: {
    '^.+\\.(j|t)sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/.pnpm/(?!(lodash-es|@manuscripts|dnd-core|react-dnd|@react-dnd|react-dnd-html5-backend).+/)',
  ],
  snapshotFormat: {
    printBasicPrototype: true,
    escapeString: true,
  },
}
