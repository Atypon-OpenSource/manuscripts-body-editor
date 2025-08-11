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
import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  generateNodeID,
  isSectionNodeType,
  ManuscriptEditorView,
  ManuscriptNodeType,
  nodeNames,
  schema,
  SectionTitleNode,
} from '@manuscripts/transform'
import { Fragment, Node } from 'prosemirror-model'
import { EditorState, TextSelection, Transaction } from 'prosemirror-state'
import { hasParentNodeOfType } from 'prosemirror-utils'
import { EditorView } from 'prosemirror-view'

import { Dispatch } from '../../commands'
import { isDeleted, isMoved } from '../../lib/track-changes-utils'
import { Option } from './type-selector/TypeSelector'

export const shouldSkipNode = (node: Node): boolean => {
  return isMoved(node) || isDeleted(node)
}

export const optionName = (nodeType: ManuscriptNodeType) => {
  switch (nodeType) {
    case nodeType.schema.nodes.section:
      return 'Heading'

    default:
      return nodeNames.get(nodeType) || nodeType.name
  }
}

export const titleCase = (text: string) =>
  text.replace(/\b([a-z])/g, (match) => match.toUpperCase())

export const findSelectedOption = (options: Option[]): Option | undefined => {
  for (const option of options) {
    if (option.isSelected) {
      return option
    }
  }
}

// Helper function to find the deepest subsection (the last subsection that doesn't have subsections itself)
const getDeepestSubsection = (subsection: Node) => {
  while (subsection.lastChild && isSectionNodeType(subsection.lastChild.type)) {
    subsection = subsection.lastChild
  }
  return subsection
}

// Helper function to replace the deepest subsection with a new subsection
const replaceDeepestSubsection = (
  parentNode: Node,
  newSubsection: Node
): Node => {
  if (!parentNode.lastChild || !isSectionNodeType(parentNode.lastChild.type)) {
    return newSubsection // Replace the deepest subsection when found
  }

  const lastSubsectionIndex = parentNode.content.childCount - 1
  const lastSubsection = parentNode.content.child(lastSubsectionIndex)

  // Recursively replace the deepest subsection
  const updatedSubsection = replaceDeepestSubsection(
    lastSubsection,
    newSubsection
  )

  // Replace the last subsection in the parent with the updated version
  return parentNode.copy(
    parentNode.content.replaceChild(lastSubsectionIndex, updatedSubsection)
  )
}

export const demoteSectionToParagraph = (
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  view?: ManuscriptEditorView
) => {
  const {
    doc,
    selection: { $from },
    schema,
    tr,
  } = state
  const { nodes } = schema

  const sectionTitle = $from.node($from.depth)
  const afterSectionTitle = $from.after($from.depth)
  const $afterSectionTitle = doc.resolve(afterSectionTitle)
  const afterSectionTitleOffset = $afterSectionTitle.parentOffset

  const sectionDepth = $from.depth - 1
  const section = $from.node(sectionDepth)
  const beforeSection = $from.before(sectionDepth)
  const afterSection = $from.after(sectionDepth)

  const $beforeSection = doc.resolve(beforeSection)
  const previousNode = $beforeSection.nodeBefore
  const paragraph = nodes.paragraph.create(
    {
      id: generateNodeID(nodes.paragraph),
    },
    sectionTitle.content
  )

  let anchor
  let fragment

  const sectionContent = section.content.cut(afterSectionTitleOffset)

  if (previousNode && isSectionNodeType(previousNode.type)) {
    const hasSubsections =
      previousNode.lastChild && isSectionNodeType(previousNode.lastChild.type)

    if (hasSubsections) {
      const deepestSubsection = getDeepestSubsection(previousNode.lastChild)

      const updatedDeepestSubsection = deepestSubsection.copy(
        deepestSubsection.content
          .append(Fragment.from(paragraph)) // Append the paragraph
          .append(sectionContent) // Append the remaining content
      )

      const updatedPreviousNode = replaceDeepestSubsection(
        previousNode,
        updatedDeepestSubsection
      )
      fragment = updatedPreviousNode.content
    } else {
      // If no subsections exist, just append to the main section
      fragment = Fragment.from(previousNode.content)
        .append(Fragment.from(paragraph))
        .append(sectionContent)
    }

    tr.replaceWith(
      beforeSection - previousNode.nodeSize,
      afterSection,
      previousNode.copy(fragment)
    )

    anchor = beforeSection
  } else {
    tr.replaceWith(
      beforeSection,
      afterSection,
      Fragment.from(paragraph).append(sectionContent)
    )

    anchor = beforeSection + 1
  }

  tr.setSelection(
    TextSelection.create(tr.doc, anchor, anchor + paragraph.content.size)
  )

  dispatch(skipTracking(tr))
  view && view.focus()
}

export const promoteParagraphToSection = (
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  view?: ManuscriptEditorView
) => {
  const {
    doc,
    selection: { $from },
    schema,
    tr,
  } = state
  const { nodes } = schema
  const paragraph = $from.node($from.depth)
  const beforeParagraph = $from.before($from.depth)
  const $beforeParagraph = doc.resolve(beforeParagraph)
  const beforeParagraphOffset = $beforeParagraph.parentOffset
  const afterParagraphOffset = beforeParagraphOffset + paragraph.nodeSize

  const sectionDepth = $from.depth - 1
  const parentSection = $from.node(sectionDepth)
  const startIndex = $from.index(sectionDepth)
  const endIndex = $from.indexAfter(sectionDepth)
  const beforeParentSection = $from.before(sectionDepth)
  const afterParentSection = $from.after(sectionDepth)

  const items: Node[] = []
  let offset = 0

  if (startIndex > 0) {
    // add the original section with content up to the paragraph
    const precedingSection = parentSection.cut(0, beforeParagraphOffset)
    items.push(precedingSection)
    offset += precedingSection.nodeSize
  }

  const textContent = paragraph.textContent

  const sectionTitle: SectionTitleNode = textContent
    ? nodes.section_title.create({}, schema.text(textContent))
    : nodes.section_title.create()

  let sectionContent = Fragment.from(sectionTitle)
  if (endIndex < parentSection.childCount) {
    sectionContent = sectionContent.append(
      parentSection.content.cut(afterParagraphOffset)
    )
  } else {
    sectionContent = sectionContent.append(Fragment.from(paragraph.copy()))
  }

  if (parentSection.type.name === 'body') {
    const newSection = nodes.section.create({}, sectionContent)
    items[0] = nodes.body.create(
      {},
      items[0]
        ? items[0].content.append(Fragment.from(newSection))
        : Fragment.from(newSection)
    )
  } else {
    items.push(parentSection.copy(sectionContent))
  }

  tr.replaceWith(beforeParentSection, afterParentSection, items)
  const anchor = beforeParentSection + offset + 2

  tr.setSelection(
    TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size)
  )

  dispatch(skipTracking(tr))
  view && view.focus()
}

export const isIndentationAllowed =
  (action: string) => (state: EditorState) => {
    const { $from } = state.selection
    const nodeType = $from.node().type

    const allowedNodeTypes = [
      schema.nodes.section_title,
      schema.nodes.paragraph,
    ]
    if (!allowedNodeTypes.includes(nodeType)) {
      return false
    }

    const isInBody = hasParentNodeOfType(schema.nodes.body)(state.selection)
    const isDeletedNode = isDeleted($from.node($from.depth))
    if (!isInBody || isDeletedNode) {
      return false
    }

    // It is not allowed to unindent the top level parent sections, headers and paragraphs
    if (action === 'unindent') {
      const grandparentNode = $from.node($from.depth - 2)
      if (grandparentNode?.type === schema.nodes.body) {
        return false
      }
    }

    if (nodeType === schema.nodes.paragraph) {
      const parentNode = $from.node($from.depth - 1)

      const isIndentNotAllowed = ![
        schema.nodes.section,
        schema.nodes.body,
      ].includes(parentNode?.type)

      const isUnindentNotAllowed = parentNode?.type !== schema.nodes.section

      if (action === 'indent' && isIndentNotAllowed) {
        return false
      }

      if (action === 'unindent' && isUnindentNotAllowed) {
        return false
      }
    }

    return true
  }

export const indentSection =
  () => (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const {
      selection: { $from },
      schema,
      tr,
    } = state
    const { nodes } = schema

    const sectionDepth = $from.depth - 1
    const section = $from.node(sectionDepth)
    const beforeSection = $from.before(sectionDepth)
    const afterSection = $from.after(sectionDepth)

    const parentSectionDepth = sectionDepth - 1
    const parentSection = $from.node(parentSectionDepth)
    const startIndex = $from.index(parentSectionDepth)

    // Check if there's a valid previous section to indent into
    // Look backwards through siblings to find a valid (non-deleted, non-moved) section
    let previousSection: Node | null = null
    for (let i = startIndex - 1; i >= 0; i--) {
      const candidate = parentSection.child(i)
      if (candidate.type === nodes.section && !shouldSkipNode(candidate)) {
        previousSection = candidate
        break
      }
    }

    let anchor
    if (!previousSection) {
      // No valid previous section, creating new parent section
      const emptyTitle = nodes.section_title.create()
      const newParentSectionContent = Fragment.fromArray([emptyTitle, section])
      const newParentSection = nodes.section.create({}, newParentSectionContent)

      tr.insert(beforeSection, newParentSection)

      // Delete the original section (now at shifted position)
      const newBeforeSection = beforeSection + newParentSection.nodeSize
      const newAfterSection = afterSection + newParentSection.nodeSize

      tr.delete(newBeforeSection, newAfterSection)

      anchor = beforeSection + 1
    } else {
      // Moving section into previous section as subsection
      // Find the actual position of the previous section by walking through the document
      let beforePreviousSection: number | null = null

      $from.doc.descendants((node, pos) => {
        if (node === previousSection) {
          beforePreviousSection = pos
          return false // stop iteration
        }
      })

      if (beforePreviousSection === null) {
        return false
      }

      const insertPos = beforePreviousSection + previousSection.nodeSize - 1
      tr.insert(insertPos, section)

      // Delete the original section (positions have shifted due to insert)
      const newBeforeSection = beforeSection + section.nodeSize
      const newAfterSection = afterSection + section.nodeSize
      tr.delete(newBeforeSection, newAfterSection)

      anchor = insertPos + 1
    }

    tr.setSelection(TextSelection.create(tr.doc, anchor))

    tr.setMeta('action', 'indent')

    dispatch(tr)
    view && view.focus()
  }

export const indentParagraph =
  () => (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const { $from } = state.selection
    const { schema, tr } = state

    const beforeParagraph = $from.before($from.depth)
    const sectionDepth = $from.depth - 1
    const parentSection = $from.node(sectionDepth)
    const sectionStart = $from.start(sectionDepth)
    const sectionEnd = $from.end(sectionDepth)

    // Build section content
    const sectionContent = Fragment.from(
      schema.nodes.section_title.create()
    ).append(parentSection.content.cut(beforeParagraph - sectionStart))

    // Create new section
    const newSection = schema.nodes.section.create(
      { id: generateNodeID(schema.nodes.section) },
      sectionContent
    )

    tr.setMeta('action', 'indent')

    tr.delete(beforeParagraph, sectionEnd)
    tr.insert(beforeParagraph, newSection)

    // Set selection inside the title of the new section
    tr.setSelection(
      TextSelection.create(tr.doc, beforeParagraph + newSection.nodeSize - 2)
    )

    dispatch(tr)
    view?.focus()
  }

export const unindentSection =
  () => (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const {
      selection: { $from },
      tr,
    } = state
    const sectionDepth = $from.depth - 1
    const section = $from.node(sectionDepth)
    const beforeSection = $from.before(sectionDepth)
    const sectionTitle = $from.node($from.depth)

    const $beforeSection = tr.doc.resolve(beforeSection)
    const beforeSectionOffset = $beforeSection.parentOffset
    const afterSectionOffset = beforeSectionOffset + section.nodeSize

    const parentSectionDepth = $from.depth - 2
    const parentSection = $from.node(parentSectionDepth)
    const endIndex = $from.indexAfter(parentSectionDepth)
    const afterParentSection = $from.after(parentSectionDepth)

    const hasFollowingSiblings = endIndex < parentSection.childCount

    let extendedSection = section

    if (hasFollowingSiblings) {
      // If there are following siblings, we need to extend the section
      const siblingsContent = parentSection.content.cut(afterSectionOffset)
      extendedSection = section.copy(section.content.append(siblingsContent))
    }

    // Insert the unindented section at the parent level
    tr.insert(afterParentSection, Fragment.from(extendedSection))

    // Delete the original section (positions inside parent haven't changed)
    tr.delete(beforeSection, afterParentSection)

    const anchor = afterParentSection + 2

    tr.setSelection(
      TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size)
    )

    tr.setMeta('action', 'unindent')

    dispatch(tr)
    view && view.focus()
  }

export const unindentParagraph =
  () => (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const {
      selection: { $from },
      schema,
      tr,
    } = state

    const paragraphPos = $from.before($from.depth)

    const sectionDepth = $from.depth - 1
    const section = $from.node(sectionDepth)
    const afterSection = $from.after(sectionDepth)
    const sectionStart = $from.start(sectionDepth)

    const parentSectionDepth = sectionDepth - 1
    const parentSection = $from.node(parentSectionDepth)
    const parentSectionStart = $from.start(parentSectionDepth)
    const parentSectionEnd = $from.end(parentSectionDepth)

    let sectionContent = Fragment.from(schema.nodes.section_title.create())

    sectionContent = sectionContent
      .append(section.content.cut(paragraphPos - sectionStart))
      .append(parentSection.content.cut(afterSection - parentSectionStart))

    const newSection = schema.nodes.section.create(
      { id: generateNodeID(schema.nodes.section) },
      sectionContent
    )

    tr.delete(paragraphPos, parentSectionEnd)
    tr.insert(paragraphPos + 2, newSection)

    tr.setSelection(
      TextSelection.create(tr.doc, paragraphPos + newSection.nodeSize)
    )

    tr.setMeta('action', 'unindent')

    dispatch(tr)
    view?.focus()
  }

const indentationHandlers = {
  section_title: {
    indent: indentSection,
    unindent: unindentSection,
  },
  paragraph: {
    indent: indentParagraph,
    unindent: unindentParagraph,
  },
}

export const changeIndentation =
  (action: 'indent' | 'unindent') =>
  (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const { $from } = state.selection
    const nodeName = $from.node().type.name as 'section_title' | 'paragraph'

    const handler = indentationHandlers[nodeName]?.[action]
    handler()(state, dispatch, view)
  }
