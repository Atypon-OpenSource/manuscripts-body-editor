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

import {
  ManuscriptNode,
  nodeNames,
  ValidationConfig,
} from '@manuscripts/transform'
import { Decoration } from 'prosemirror-view'

import { issueDefinitions } from './issue-definitions'
import type { Inconsistency } from './types'

export const toEnabledValidations = (
  validations: ValidationConfig[] | undefined
): Map<string, Inconsistency['severity']> => {
  const enabled = new Map<string, Inconsistency['severity']>()
  for (const rule of validations ?? []) {
    if (rule.group === 'error' || rule.group === 'warning') {
      enabled.set(rule.id, rule.group)
    }
  }
  return enabled
}

export const validationKey = (validations: ValidationConfig[] | undefined) =>
  (validations ?? []).map((rule) => `${rule.id}:${rule.group}`).join('|')

const nodeDescription = (node: ManuscriptNode, custom?: string) =>
  custom || nodeNames.get(node.type) || node.type?.name || 'node'

export const createIssue = (
  node: ManuscriptNode,
  pos: number,
  definition: keyof typeof issueDefinitions,
  customNodeDescription?: string,
  severity?: Inconsistency['severity']
): Inconsistency => ({
  type: 'warning',
  action: { type: 'navigate-to-node' },
  ...issueDefinitions[definition],
  ...(severity ? { severity } : {}),
  nodeDescription: nodeDescription(node, customNodeDescription),
  node,
  pos,
})

export const createDecoration = (
  node: ManuscriptNode,
  pos: number,
  selectedPos: number | null
) => {
  const classNames = ['inconsistency-highlight']
  if (selectedPos === pos) {
    classNames.push('selected-suggestion')
  }

  return Decoration.node(pos, pos + node.nodeSize, {
    class: classNames.join(' '),
    'data-inconsistency-type': 'warning',
  })
}

export const whenConfigured = (
  definition: keyof typeof issueDefinitions,
  context: { enabledValidations: Map<string, Inconsistency['severity']> },
  node: ManuscriptNode,
  pos: number
): Inconsistency[] => {
  const severity = context.enabledValidations.get(definition)
  return severity
    ? [createIssue(node, pos, definition, undefined, severity)]
    : []
}
