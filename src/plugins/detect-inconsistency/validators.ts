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

import {
  BibliographyItemAttrs,
  ManuscriptNode,
  nodeNames,
  schema,
  Target,
} from '@manuscripts/transform'
import { Decoration } from 'prosemirror-view'

import { createDecoration, Warning } from './detect-inconsistency-utils'

export type ValidatorContext = {
  pluginStates: {
    bibliography: Map<string, BibliographyItemAttrs> | undefined
    objects: Map<string, Target> | undefined
    footnotes: Map<string, string> | undefined
  }
  showDecorations: boolean
  selectedPos: number | null
  decorations: Decoration[]
}

export type NodeValidator = (
  node: ManuscriptNode,
  pos: number,
  context: ValidatorContext
) => Warning[]

const getNodeDescription = (node: ManuscriptNode): string => {
  return nodeNames.get(node.type) || node.type?.name || 'node'
}

const createWarning = (
  node: ManuscriptNode,
  pos: number,
  category: Warning['category'],
  severity: Warning['severity']
): Warning => {
  const nodeDescription = getNodeDescription(node)
  const message =
    category === 'empty-content'
      ? `${nodeDescription} is empty`
      : `${nodeDescription} has no linked reference`

  return {
    type: 'warning',
    category,
    severity,
    message,
    node,
    pos,
  }
}

const validateTitle: NodeValidator = (node, pos, context) => {
  const warnings: Warning[] = []
  const isEmpty = node.content.size === 0

  if (isEmpty) {
    const warning = createWarning(node, pos, 'empty-content', 'warning')
    warnings.push(warning)

    if (context.showDecorations) {
      context.decorations.push(createDecoration(node, pos, context.selectedPos))
    }
  }

  return warnings
}

const validateCrossReference: NodeValidator = (node, pos, context) => {
  const warnings: Warning[] = []
  const figures = Array.from(context.pluginStates.objects?.keys() ?? [])

  const isInFigures = node.attrs.rids.every((rid: string) =>
    figures.includes(rid)
  )

  if (!isInFigures) {
    const warning = createWarning(node, pos, 'missing-reference', 'warning')
    warnings.push(warning)

    if (context.showDecorations) {
      context.decorations.push(createDecoration(node, pos, context.selectedPos))
    }
  }

  return warnings
}

const validateCitation: NodeValidator = (node, pos, context) => {
  const warnings: Warning[] = []

  if (context.pluginStates.bibliography) {
    const isInBibliography = node.attrs.rids.every((rid: string) =>
      context.pluginStates.bibliography?.get(rid)
    )

    if (!isInBibliography) {
      const warning = createWarning(node, pos, 'missing-reference', 'warning')
      warnings.push(warning)

      if (context.showDecorations) {
        context.decorations.push(
          createDecoration(node, pos, context.selectedPos)
        )
      }
    }
  }

  return warnings
}

const validateInlineFootnote: NodeValidator = (node, pos, context) => {
  const warnings: Warning[] = []

  if (context.pluginStates.footnotes) {
    const isInFootnote = node.attrs.rids.every((rid: string) =>
      context.pluginStates.footnotes?.get(rid)
    )

    if (!isInFootnote) {
      const warning = createWarning(node, pos, 'missing-reference', 'warning')
      warnings.push(warning)

      if (context.showDecorations) {
        context.decorations.push(
          createDecoration(node, pos, context.selectedPos)
        )
      }
    }
  }

  return warnings
}

export const validators: Record<string, NodeValidator> = {
  [schema.nodes.title.name]: validateTitle,
  [schema.nodes.cross_reference.name]: validateCrossReference,
  [schema.nodes.citation.name]: validateCitation,
  [schema.nodes.inline_footnote.name]: validateInlineFootnote,
}
