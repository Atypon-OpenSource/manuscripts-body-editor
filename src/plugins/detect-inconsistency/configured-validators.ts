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
  findMatchingCategory,
  ManuscriptNode,
  ManuscriptNodeType,
  schema,
  SectionCategory,
} from '@manuscripts/transform'

import { whenConfigured } from './issue'
import { issueDefinitions } from './issue-definitions'
import { hasImageSource } from './static-validators'
import type { Inconsistency, NodeValidator } from './types'

const textOf = (node: ManuscriptNode, type: ManuscriptNodeType) => {
  let text = ''
  node.descendants((child) => {
    if (child.type === type) {
      text = child.textContent.trim()
    }
  })
  return text
}

export const configuredEmptyImage =
  (
    definition:
      | 'empty-image'
      | 'empty-hero-image'
      | 'empty-contributor-headshot',
    imageType: ManuscriptNodeType
  ): NodeValidator =>
  (node, pos, context) => {
    if (
      !context.enabledValidations.has(definition) ||
      hasImageSource(node, imageType)
    ) {
      return []
    }
    return whenConfigured(definition, context, node, pos)
  }

export const missingAltText: NodeValidator = (node, pos, context) => {
  if (
    !context.enabledValidations.has('missing-alt-text') ||
    textOf(node, schema.nodes.alt_text)
  ) {
    return []
  }
  return whenConfigured('missing-alt-text', context, node, pos)
}

const supplementsSection = (doc: ManuscriptNode, pos: number) => {
  const $pos = doc.resolve(pos)
  for (let depth = $pos.depth; depth > 0; depth--) {
    const parent = $pos.node(depth)
    if (parent.type === schema.nodes.supplements) {
      return { node: parent, pos: $pos.before(depth) }
    }
  }
}

export const missingSupplementCaption: NodeValidator = (node, pos, context) => {
  if (
    !context.enabledValidations.has('missing-supplement-caption') ||
    (textOf(node, schema.nodes.caption_title) &&
      textOf(node, schema.nodes.caption))
  ) {
    return []
  }
  const section = supplementsSection(context.doc, pos) ?? { node, pos }
  return whenConfigured(
    'missing-supplement-caption',
    context,
    section.node,
    section.pos
  )
}

const directChild = (
  node: ManuscriptNode,
  pos: number,
  type: ManuscriptNodeType,
  doc: ManuscriptNode
) => {
  const origin = node === doc ? pos : pos + 1
  let found: { node: ManuscriptNode; pos: number } | undefined
  node.forEach((child, offset) => {
    if (!found && child.type === type) {
      found = { node: child, pos: origin + offset }
    }
  })
  return found
}

const visibleText = (node: ManuscriptNode) => {
  let text = ''
  node.descendants((child) => {
    if (isDeleted(child)) {
      return false
    }
    if (child.isText) {
      text += child.text
    }
  })
  return text.trim()
}

const hasDescendant = (
  node: ManuscriptNode,
  matches: (child: ManuscriptNode) => boolean
) => {
  let found = false
  node.descendants((child) => {
    if (!found && matches(child)) {
      found = true
    }
  })
  return found
}

export const backmatterCategories = {
  'missing-conflict-of-interest': {
    id: 'coi-statement',
    synonyms: [
      'coi-statement',
      'competing-interests',
      'conflict',
      'conflict of interest',
      'competing interests',
    ],
    titles: ['Conflict of Interest Statement'],
    group: 'backmatter',
    isUnique: true,
  },
  'missing-data-availability': {
    id: 'availability',
    synonyms: ['availability', 'data-availability', 'data availability'],
    titles: ['Availability'],
    group: 'backmatter',
    isUnique: true,
  },
  'missing-ethics-statement': {
    id: 'ethics-statement',
    synonyms: ['ethics-statement', 'ethics statement'],
    titles: ['Ethics Statement'],
    group: 'backmatter',
    isUnique: true,
  },
} satisfies Record<string, SectionCategory>

const sectionTitle = (section: ManuscriptNode) => {
  let title = ''
  section.forEach((child) => {
    if (child.type === schema.nodes.section_title) {
      title = child.textContent
    }
  })
  return title
}

const hasBackmatterSection = (
  backmatter: ManuscriptNode,
  category: SectionCategory
) =>
  hasDescendant(
    backmatter,
    (child) =>
      child.type === schema.nodes.section &&
      !isDeleted(child) &&
      !!findMatchingCategory(
        [category],
        child.attrs.category,
        sectionTitle(child)
      )
  )

const validateManuscript: NodeValidator = (node, pos, context) => {
  const issues: Inconsistency[] = []
  const target = (type: ManuscriptNodeType) =>
    directChild(node, pos, type, context.doc)
  const report = (
    definition: keyof typeof issueDefinitions,
    type: ManuscriptNodeType
  ) => {
    const located = target(type)
    issues.push(
      ...whenConfigured(
        definition,
        context,
        located?.node ?? node,
        located?.pos ?? pos
      )
    )
  }

  if (
    !hasDescendant(
      node,
      (child) => child.type === schema.nodes.abstract && !isDeleted(child)
    )
  ) {
    report('missing-abstract', schema.nodes.abstracts)
  }

  const body = target(schema.nodes.body)
  if (
    !(body && visibleText(body.node)) &&
    !hasDescendant(node, (child) => {
      if (child.type !== schema.nodes.attachment || isDeleted(child)) {
        return false
      }
      const files = new Set(context.props.getFiles().map((file) => file.id))
      return files.has(child.attrs.href)
    })
  ) {
    report('missing-main-document', schema.nodes.body)
  }

  if (
    !hasDescendant(node, (child) => {
      if (child.type !== schema.nodes.contributor || isDeleted(child)) {
        return false
      }
      const ids: unknown = child.attrs.affiliationIDs
      return (
        Array.isArray(ids) &&
        ids.some((id) => typeof id === 'string' && id.trim())
      )
    })
  ) {
    report('no-affiliations', schema.nodes.contributors)
  }

  if (
    !hasDescendant(
      node,
      (child) =>
        child.type === schema.nodes.keyword &&
        !isDeleted(child) &&
        !!child.textContent.trim()
    )
  ) {
    report('missing-keywords', schema.nodes.keywords)
  }

  if (
    !hasDescendant(
      node,
      (child) => child.type === schema.nodes.award && !isDeleted(child)
    )
  ) {
    report('missing-funder', schema.nodes.awards)
  }

  const backmatter = target(schema.nodes.backmatter)
  const reportBackmatter = (definition: keyof typeof backmatterCategories) => {
    if (!backmatter) {
      return
    }
    const fallback = backmatterCategories[definition]
    const fromTemplate = context.props.sectionCategories?.get(fallback.id)
    if (hasBackmatterSection(backmatter.node, fromTemplate ?? fallback)) {
      return
    }
    issues.push(
      ...whenConfigured(definition, context, backmatter.node, backmatter.pos)
    )
  }

  reportBackmatter('missing-conflict-of-interest')
  reportBackmatter('missing-data-availability')
  reportBackmatter('missing-ethics-statement')

  return issues
}

export const configuredValidators: Record<string, NodeValidator> = {
  [schema.nodes.manuscript.name]: validateManuscript,
  [schema.nodes.table_element.name]: missingAltText,
  [schema.nodes.image_element.name]: configuredEmptyImage(
    'empty-image',
    schema.nodes.figure
  ),
  [schema.nodes.hero_image.name]: configuredEmptyImage(
    'empty-hero-image',
    schema.nodes.figure
  ),
  [schema.nodes.headshot_element.name]: configuredEmptyImage(
    'empty-contributor-headshot',
    schema.nodes.headshot_image
  ),
  [schema.nodes.supplement.name]: missingSupplementCaption,
}

export const layeredValidators: Record<string, NodeValidator[]> = {
  [schema.nodes.figure_element.name]: [missingAltText],
  [schema.nodes.embed.name]: [missingAltText],
}
