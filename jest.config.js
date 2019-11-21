module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  moduleNameMapper: {
    '^.+\\.css$': '<rootDir>/src/__mocks__/styleMock.ts',
    // https://react-dnd.github.io/react-dnd/docs/testing#setup
    "^dnd-core$": "dnd-core/dist/cjs",
    "^react-dnd$": "react-dnd/dist/cjs",
    // map react-dnd-html5-backend to react-dnd-test-backend
    "^react-dnd-html5-backend$": "react-dnd-test-backend/dist/cjs",
    "^react-dnd-test-utils$": "react-dnd-test-utils/dist/cjs"
  },
  setupFilesAfterEnv: ['./src/tests.ts'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/dist/'],
  testRegex: '__tests__.*\\.test\\.tsx?$',
  transform: {
    '^.+\\.(j|t)sx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(lodash-es|@manuscripts)/)'],
}
