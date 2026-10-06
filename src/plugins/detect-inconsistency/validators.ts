/*!
 * © 2026 Atypon Systems LLC
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

import { configuredValidators } from './configured-validators'
import { staticValidators } from './static-validators'
import type { NodeValidator } from './types'

export type { NodeValidator, ValidatorContext } from './types'
export { toEnabledValidations } from './inconsistency'

export const validators: Record<string, NodeValidator> = {
  ...staticValidators,
}

for (const [name, extras] of Object.entries(configuredValidators)) {
  const base = validators[name]
  validators[name] = (node, pos, context) => [
    ...(base ? base(node, pos, context) : []),
    ...extras.flatMap((extra) => extra(node, pos, context)),
  ]
}
