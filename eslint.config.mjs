/*!
 * © 2025 Atypon Systems LLC
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
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import config from '@manuscripts/eslint-config'
import { defineConfig, globalIgnores } from 'eslint/config'
import header from 'eslint-plugin-header'

header.rules.header.meta.schema = false

const compat = new FlatCompat({
  recommendedConfig: js.configs.recommended,
})

export default defineConfig([
  globalIgnores(['src/versions.ts']),
  ...compat.config(config),
  {
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'jsx-a11y/no-onchange': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
])
