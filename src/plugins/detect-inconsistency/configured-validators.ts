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
  ValidationConfig,
} from '@manuscripts/transform'
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils'

import type { FileAttachment } from '../../lib/files'
import { getVisibleText } from '../../lib/track-changes-utils'
import {
  getChildOfTypeWithPos,
  getMatchingDescendant,
  getTextOfType,
} from '../../lib/utils'
import { createInconsistencyIfConfigured } from './inconsistency'
import { inconsistencyDefinitions } from './inconsistency-definitions'
import { hasImageSource } from './static-validators'
import type { Inconsistency, NodeValidator } from './types'

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
    return createInconsistencyIfConfigured(definition, context, node, pos)
  }

export const missingAltText: NodeValidator = (node, pos, context) => {
  if (
    !context.enabledValidations.has('missing-alt-text') ||
    getTextOfType(node, schema.nodes.alt_text)
  ) {
    return []
  }
  return createInconsistencyIfConfigured('missing-alt-text', context, node, pos)
}

const findSupplementsSection = (doc: ManuscriptNode, pos: number) =>
  findParentNodeOfTypeClosestToPos(doc.resolve(pos), schema.nodes.supplements)

export const missingSupplementCaption: NodeValidator = (node, pos, context) => {
  if (
    !context.enabledValidations.has('missing-supplement-caption') ||
    getTextOfType(node, schema.nodes.caption_title) ||
    getTextOfType(node, schema.nodes.caption)
  ) {
    return []
  }
  const section = findSupplementsSection(context.doc, pos) ?? { node, pos }
  return createInconsistencyIfConfigured(
    'missing-supplement-caption',
    context,
    section.node,
    section.pos
  )
}

const hasBackmatterSection = (
  backmatter: ManuscriptNode,
  category: SectionCategory
) =>
  !!getMatchingDescendant(backmatter, (child) => {
    if (child.type !== schema.nodes.section || isDeleted(child)) {
      return false
    }
    return !!findMatchingCategory(
      [category],
      child.attrs.category,
      getTextOfType(child, schema.nodes.section_title)
    )
  })

export const getValidationCategory = (
  validations: Map<string, ValidationConfig> | undefined,
  sectionCategories: Map<string, SectionCategory> | undefined,
  definition: string
) => {
  const categoryId = validations?.get(definition)?.sectionCategory
  return categoryId ? sectionCategories?.get(categoryId) : undefined
}

const isAbstract = (child: ManuscriptNode) =>
  child.type === schema.nodes.abstract && !isDeleted(child)

const isAward = (child: ManuscriptNode) =>
  child.type === schema.nodes.award && !isDeleted(child)

const isNonEmptyKeyword = (child: ManuscriptNode) =>
  child.type === schema.nodes.keyword &&
  !isDeleted(child) &&
  !!child.textContent.trim()

const isContributorWithAffiliation = (child: ManuscriptNode) => {
  if (child.type !== schema.nodes.contributor || isDeleted(child)) {
    return false
  }
  const ids: unknown = child.attrs.affiliationIDs
  return (
    Array.isArray(ids) && ids.some((id) => typeof id === 'string' && id.trim())
  )
}

const isUploadedAttachment = (files: FileAttachment[]) => {
  const ids = new Set(files.map((file) => file.id))
  return (child: ManuscriptNode) =>
    child.type === schema.nodes.attachment &&
    !isDeleted(child) &&
    ids.has(child.attrs.href)
}

const validateManuscript: NodeValidator = (node, pos, context) => {
  const inconsistencies: Inconsistency[] = []
  const target = (type: ManuscriptNodeType) =>
    getChildOfTypeWithPos(node, pos, type, context.doc)
  const report = (
    definition: keyof typeof inconsistencyDefinitions,
    type: ManuscriptNodeType
  ) => {
    const located = target(type)
    inconsistencies.push(
      ...createInconsistencyIfConfigured(
        definition,
        context,
        located?.node ?? node,
        located?.pos ?? pos
      )
    )
  }

  if (!getMatchingDescendant(node, isAbstract)) {
    report('missing-abstract', schema.nodes.abstracts)
  }

  const body = target(schema.nodes.body)
  const hasBodyText = !!body && !!getVisibleText(body.node)
  if (
    !hasBodyText &&
    !getMatchingDescendant(node, isUploadedAttachment(context.props.getFiles()))
  ) {
    report('missing-main-document', schema.nodes.body)
  }

  if (!getMatchingDescendant(node, isContributorWithAffiliation)) {
    report('no-affiliations', schema.nodes.contributors)
  }

  if (!getMatchingDescendant(node, isNonEmptyKeyword)) {
    report('missing-keywords', schema.nodes.keywords)
  }

  if (!getMatchingDescendant(node, isAward)) {
    report('missing-funder', schema.nodes.awards)
  }

  const backmatter = target(schema.nodes.backmatter)
  const reportBackmatter = (
    definition: keyof typeof inconsistencyDefinitions
  ) => {
    if (!backmatter) {
      return
    }
    const category = getValidationCategory(
      context.enabledValidations,
      context.props.sectionCategories,
      definition
    )
    if (!category || hasBackmatterSection(backmatter.node, category)) {
      return
    }
    inconsistencies.push(
      ...createInconsistencyIfConfigured(
        definition,
        context,
        backmatter.node,
        backmatter.pos
      )
    )
  }

  reportBackmatter('missing-conflict-of-interest')
  reportBackmatter('missing-data-availability')
  reportBackmatter('missing-ethics-statement')

  return inconsistencies
}

export const configuredValidators: Record<string, NodeValidator[]> = {
  [schema.nodes.manuscript.name]: [validateManuscript],
  [schema.nodes.table_element.name]: [missingAltText],
  [schema.nodes.figure_element.name]: [missingAltText],
  [schema.nodes.embed.name]: [missingAltText],
  [schema.nodes.image_element.name]: [
    configuredEmptyImage('empty-image', schema.nodes.figure),
  ],
  [schema.nodes.hero_image.name]: [
    configuredEmptyImage('empty-hero-image', schema.nodes.figure),
  ],
  [schema.nodes.headshot_element.name]: [
    configuredEmptyImage(
      'empty-contributor-headshot',
      schema.nodes.headshot_image
    ),
  ],
  [schema.nodes.supplement.name]: [missingSupplementCaption],
}
