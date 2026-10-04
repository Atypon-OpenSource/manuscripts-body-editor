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

import { isDeleted } from '@manuscripts/track-changes-plugin'
import {
  ManuscriptNode,
  ManuscriptNodeType,
  schema,
} from '@manuscripts/transform'

import { allowedHref } from '../../lib/url'
import { isChildOfNodeTypes } from '../../lib/utils'
import { createDecoration, createIssue } from './issue'
import { issueDefinitions } from './issue-definitions'
import type { Inconsistency, NodeValidator, ValidatorContext } from './types'

const highlight = (
  issues: Inconsistency[],
  node: ManuscriptNode,
  pos: number,
  definition: keyof typeof issueDefinitions,
  context: ValidatorContext
) => {
  issues.push(createIssue(node, pos, definition))
  if (context.showDecorations) {
    context.decorations.push(createDecoration(node, pos, context.selectedPos))
  }
}

const validateTitle: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []
  if (node.textContent.trim().length === 0) {
    highlight(inconsistencies, node, pos, 'missing-title', context)
  }
  return inconsistencies
}

const validateCrossReference: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []
  const rids: string[] = node.attrs.rids ?? []
  const isInFigures = rids.every((rid) =>
    context.pluginStates.objects?.has(rid)
  )

  if (!isInFigures || rids.length === 0) {
    highlight(
      inconsistencies,
      node,
      pos,
      'missing-cross-reference-target',
      context
    )
  }

  return inconsistencies
}

const validateCitation: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []
  const rids: string[] = node.attrs.rids ?? []
  if (context.pluginStates.bibliography || rids.length === 0) {
    const isInBibliography = rids.every((rid) =>
      context.pluginStates.bibliography?.has(rid)
    )

    if (!isInBibliography || rids.length === 0) {
      highlight(inconsistencies, node, pos, 'broken-citation', context)
    }
  }

  return inconsistencies
}

const validateInlineFootnote: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []
  const rids: string[] = node.attrs.rids ?? []
  if (context.pluginStates.footnotes) {
    const isInFootnote = rids.every((rid) =>
      context.pluginStates.footnotes?.has(rid)
    )

    if (!isInFootnote || rids.length === 0) {
      highlight(inconsistencies, node, pos, 'missing-footnote-target', context)
    }
  }

  return inconsistencies
}

const validateFigure: NodeValidator = (node, pos, context) => {
  const files = new Set(context.props.getFiles().map((file) => file.id))
  // An empty panel is reported on its container, not as a missing file too.
  if (node.attrs.src && !files.has(node.attrs.src)) {
    return [createIssue(node, pos, 'missing-figure-file')]
  }
  return []
}

const validateMedia: NodeValidator = (node, pos, context) => {
  const files = new Set(context.props.getFiles().map((file) => file.id))
  if (!(files.has(node.attrs.href) || allowedHref(node.attrs.href))) {
    return [createIssue(node, pos, 'missing-embedded-media')]
  }
  return []
}

const validateLink: NodeValidator = (node, pos) => {
  if (!allowedHref(node.attrs.href)) {
    return [createIssue(node, pos, 'invalid-link')]
  }
  return []
}

const validateFootnote: NodeValidator = (node, pos, context) => {
  const id = context.pluginStates.footnotes?.get(node.attrs.id)
  const footnoteState = id
    ? context.pluginStates.footnotesElements?.get(id)
    : undefined

  if (!footnoteState?.unusedFootnoteIDs?.has(node.attrs.id)) {
    return []
  }

  const isTableFootnote = isChildOfNodeTypes(context.doc, pos, [
    schema.nodes.table_element,
  ])

  return [
    createIssue(
      node,
      pos,
      'orphaned-footnote',
      isTableFootnote ? 'table_footnote' : undefined
    ),
  ]
}

const validateAffiliation: NodeValidator = (node, pos, context) => {
  const unused = !context.pluginStates.affiliations?.has(node.attrs.id)
  if (unused && !isDeleted(node)) {
    return [createIssue(node, pos, 'orphaned-affiliation')]
  }
  return []
}

export const hasImageSource = (
  node: ManuscriptNode,
  imageType: ManuscriptNodeType
) => {
  let found = false
  node.descendants((child) => {
    if (child.type === imageType && child.attrs.src) {
      found = true
    }
  })
  return found
}

const validateFigurePanel: NodeValidator = (node, pos) =>
  hasImageSource(node, schema.nodes.figure)
    ? []
    : [createIssue(node, pos, 'empty-figure-panel')]

const normalizeIdentity = (value: unknown): string =>
  typeof value === 'string'
    ? value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
    : ''

const duplicateAuthorValidator: NodeValidator = (node, pos) => {
  const seen = new Set<string>()
  const reported = new Set<string>()
  const inconsistencies: Inconsistency[] = []

  node.forEach((child, offset) => {
    if (child.type !== schema.nodes.contributor || isDeleted(child)) {
      return
    }

    const identity = ['given', 'family'].map((field) =>
      normalizeIdentity(child.attrs[field])
    )
    if (!identity[0] && !identity[1]) {
      return
    }

    const key = JSON.stringify(identity)
    if (seen.has(key) && !reported.has(key)) {
      reported.add(key)
      inconsistencies.push(createIssue(child, pos + 1 + offset, 'duplicate-author'))
    }

    seen.add(key)
  })

  return inconsistencies
}

const duplicateAffiliationValidator: NodeValidator = (node, pos) => {
  const seen = new Set<string>()
  const reported = new Set<string>()
  const inconsistencies: Inconsistency[] = []

  node.forEach((child, offset) => {
    if (child.type !== schema.nodes.affiliation || isDeleted(child)) {
      return
    }

    const identity = ['institution'].map((field) =>
      normalizeIdentity(child.attrs[field])
    )
    if (!identity[0]) {
      return
    }

    const key = JSON.stringify(identity)
    if (seen.has(key) && !reported.has(key)) {
      reported.add(key)
      inconsistencies.push(
        createIssue(child, pos + 1 + offset, 'duplicate-affiliation')
      )
    }

    seen.add(key)
  })

  return inconsistencies
}

export const staticValidators: Record<string, NodeValidator> = {
  [schema.nodes.title.name]: validateTitle,
  [schema.nodes.cross_reference.name]: validateCrossReference,
  [schema.nodes.citation.name]: validateCitation,
  [schema.nodes.inline_footnote.name]: validateInlineFootnote,
  [schema.nodes.figure.name]: validateFigure,
  [schema.nodes.figure_element.name]: validateFigurePanel,
  [schema.nodes.embed.name]: validateMedia,
  [schema.nodes.link.name]: validateLink,
  [schema.nodes.footnote.name]: validateFootnote,
  [schema.nodes.affiliation.name]: validateAffiliation,
  [schema.nodes.contributors.name]: duplicateAuthorValidator,
  [schema.nodes.affiliations.name]: duplicateAffiliationValidator,
}
