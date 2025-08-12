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

import { EditorProps } from '../../configs/ManuscriptsEditor'
import { allowedHref } from '../../lib/url'
import { createDecoration, Inconsistency } from './detect-inconsistency-utils'

export type ValidatorContext = {
  pluginStates: {
    bibliography: Map<string, BibliographyItemAttrs> | undefined
    objects: Map<string, Target> | undefined
    footnotes: Map<string, string> | undefined
  }
  showDecorations: boolean
  selectedPos: number | null
  decorations: Decoration[]
  props: EditorProps
}

export type NodeValidator = (
  node: ManuscriptNode,
  pos: number,
  context: ValidatorContext
) => Inconsistency[]

const getNodeDescription = (node: ManuscriptNode): string => {
  return nodeNames.get(node.type) || node.type?.name || 'node'
}

const createWarning = (
  node: ManuscriptNode,
  pos: number,
  category: Inconsistency['category'],
  severity: Inconsistency['severity']
): Inconsistency => {
  const nodeDescription = getNodeDescription(node)
  const message = (() => {
    switch (node.type) {
      case schema.nodes.figure_element:
      case schema.nodes.image_element:
        return 'Has no uploaded file'
      case schema.nodes.embed:
        return 'Has no link or uploaded file'
      case schema.nodes.link:
        return 'Url is empty'
      default:
        return category === 'empty-content' ? `Is empty` : `Has no linked reference`
    }
  })()

  return {
    type: 'warning',
    category,
    severity,
    message,
    nodeDescription,
    node,
    pos,
  }
}

const validateTitle: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []
  const isEmpty = node.content.size === 0

  if (isEmpty) {
    const inconsistency = createWarning(node, pos, 'empty-content', 'warning')
    inconsistencies.push(inconsistency)

    if (context.showDecorations) {
      context.decorations.push(createDecoration(node, pos, context.selectedPos))
    }
  }

  return inconsistencies
}

const validateCrossReference: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []
  const figures = Array.from(context.pluginStates.objects?.keys() ?? [])

  const isInFigures = node.attrs.rids.every((rid: string) =>
    figures.includes(rid)
  )

  if (!isInFigures) {
    const inconsistency = createWarning(
      node,
      pos,
      'missing-reference',
      'warning'
    )
    inconsistencies.push(inconsistency)

    if (context.showDecorations) {
      context.decorations.push(createDecoration(node, pos, context.selectedPos))
    }
  }

  return inconsistencies
}

const validateCitation: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []

  if (context.pluginStates.bibliography) {
    const isInBibliography = node.attrs.rids.every((rid: string) =>
      context.pluginStates.bibliography?.get(rid)
    )

    if (!isInBibliography || node.attrs.rids.length === 0) {
      const inconsistency = createWarning(
        node,
        pos,
        'missing-reference',
        'warning'
      )
      inconsistencies.push(inconsistency)

      if (context.showDecorations) {
        context.decorations.push(
          createDecoration(node, pos, context.selectedPos)
        )
      }
    }
  }

  return inconsistencies
}

const validateInlineFootnote: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []

  if (context.pluginStates.footnotes) {
    const isInFootnote = node.attrs.rids.every((rid: string) =>
      context.pluginStates.footnotes?.get(rid)
    )

    if (!isInFootnote) {
      const inconsistency = createWarning(
        node,
        pos,
        'missing-reference',
        'warning'
      )
      inconsistencies.push(inconsistency)

      if (context.showDecorations) {
        context.decorations.push(
          createDecoration(node, pos, context.selectedPos)
        )
      }
    }
  }

  return inconsistencies
}

const validateFigureElement: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []
  const files = new Set(context.props.getFiles().map((f) => f.id))

  node.forEach((child) => {
    if (child.type === schema.nodes.figure) {
      if (!files.has(child.attrs.src)) {
        const inconsistency = createWarning(
          node,
          pos,
          'missing-reference',
          'error'
        )
        inconsistencies.push(inconsistency)
      }
    }
  })

  return inconsistencies
}

const validateMedia: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []
  const files = new Set(context.props.getFiles().map((f) => f.id))

  if (!(files.has(node.attrs.href) || allowedHref(node.attrs.href))) {
    const inconsistency = createWarning(node, pos, 'missing-reference', 'error')
    inconsistencies.push(inconsistency)
  }

  return inconsistencies
}

const validateLink: NodeValidator = (node, pos) => {
  const inconsistencies: Inconsistency[] = []

  if (!allowedHref(node.attrs.href)) {
    const inconsistency = createWarning(node, pos, 'missing-reference', 'error')
    inconsistencies.push(inconsistency)
  }

  return inconsistencies
}

export const validators: Record<string, NodeValidator> = {
  [schema.nodes.title.name]: validateTitle,
  [schema.nodes.cross_reference.name]: validateCrossReference,
  [schema.nodes.citation.name]: validateCitation,
  [schema.nodes.inline_footnote.name]: validateInlineFootnote,
  [schema.nodes.figure_element.name]: validateFigureElement,
  [schema.nodes.image_element.name]: validateFigureElement,
  [schema.nodes.embed.name]: validateMedia,
  [schema.nodes.link.name]: validateLink,
}
