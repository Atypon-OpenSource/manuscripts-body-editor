/*!
 * © 2019 Atypon Systems LLC
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
  generateNodeID,
  isElementNode,
  isListNode,
  isSectionNode,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
  nodeNames,
  SectionNode,
  SectionTitleNode,
} from '@manuscripts/manuscript-transform'
import { Fragment, ResolvedPos } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'
import React, { CSSProperties } from 'react'
import Select from 'react-select'
import styled from 'styled-components'
import { nodeTypeIcon } from '../../node-type-icons'

const optionName = (nodeType: ManuscriptNodeType, depth: number) => {
  switch (nodeType) {
    case nodeType.schema.nodes.section:
      return 'sub'.repeat(depth - 1) + 'section heading'

    default:
      return nodeNames.get(nodeType) || nodeType.name
  }
}

const titleCase = (text: string) =>
  text.replace(/\b([a-z])/g, match => match.toUpperCase())

interface Option {
  action?: () => void
  depth: number
  icon: JSX.Element | null
  isDisabled: boolean
  isSelected: boolean
  label: string
  nodeType: ManuscriptNodeType
  value: number
}

interface OptionProps {
  action?: () => void
  depth: number
  isDisabled?: boolean
  isSelected?: boolean
  nodeType: ManuscriptNodeType
  value: number
}

const findListParent = ($from: ResolvedPos): ManuscriptNode | undefined => {
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth)

    if (isListNode(node)) {
      return node
    }
  }
}

const findClosestParentElement = (
  $from: ResolvedPos
): ManuscriptNode | undefined => {
  const listParent = findListParent($from)

  if (listParent) {
    return listParent
  }

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth)

    if (isSectionNode(node) || isElementNode(node)) {
      return node
    }
  }
}

const buildOption = (props: OptionProps): Option => ({
  ...props,
  icon: nodeTypeIcon(props.nodeType),
  label: titleCase(optionName(props.nodeType, props.value)),
  isDisabled: Boolean(props.isDisabled),
  isSelected: Boolean(props.isSelected),
})

type GroupedOptions = Array<{ options: Option[] }>
type Options = GroupedOptions | Option[]

// tslint:disable:cyclomatic-complexity
const buildOptions = (view: ManuscriptEditorView): Options => {
  const {
    state: {
      doc,
      selection: { $from, $to },
      schema,
      tr,
    },
  } = view

  const { nodes } = schema

  if (!$from.sameParent($to)) {
    return []
  }

  const parentElement = findClosestParentElement($from)

  if (!parentElement) {
    return []
  }

  // move paragraph to title of new subsection, along with subsequent content
  const moveParagraphToNewSubsection = () => {
    const paragraph = $from.node($from.depth)
    const beforeParagraph = $from.before($from.depth)
    const afterParagraph = $from.after($from.depth)
    const $afterParagraph = doc.resolve(afterParagraph)
    const afterParagraphOffset = $afterParagraph.parentOffset

    const sectionDepth = $from.depth - 1
    const parentSection = $from.node(sectionDepth)
    const endIndex = $from.indexAfter(sectionDepth)
    const sectionEnd = $from.end(sectionDepth)

    const textContent = paragraph.textContent

    const sectionTitle: SectionTitleNode = textContent
      ? nodes.section_title.create({}, schema.text(textContent))
      : nodes.section_title.create()

    let sectionContent = Fragment.from(sectionTitle)

    if (endIndex < parentSection.childCount) {
      sectionContent = sectionContent.append(
        parentSection.content.cut(afterParagraphOffset)
      )
    }

    const newSection = nodes.section.create(
      {
        id: generateNodeID(nodes.section),
      },
      sectionContent
    )

    tr.replaceWith(beforeParagraph, sectionEnd, newSection)

    const anchor = beforeParagraph + 2

    tr.setSelection(
      TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size)
    )

    view.focus()

    view.dispatch(tr.scrollIntoView())
  }

  // append the section to the preceding section as a subsection
  const moveSectionToSubsection = () => {
    const sectionTitle = $from.node()

    const sectionDepth = $from.depth - 1
    const section = $from.node(sectionDepth)
    const beforeSection = $from.before(sectionDepth)
    const afterSection = $from.after(sectionDepth)

    const parentSectionDepth = $from.depth - 2
    const parentSection = $from.node(parentSectionDepth)
    const startIndex = $from.index(parentSectionDepth)

    const previousSection = parentSection.child(startIndex - 1)

    const beforePreviousSection = beforeSection - previousSection.nodeSize

    tr.replaceWith(
      beforePreviousSection,
      afterSection,
      previousSection.content.append(Fragment.from(section))
    )

    const anchor = beforeSection + 1

    tr.setSelection(
      TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size)
    )

    view.focus()

    view.dispatch(tr.scrollIntoView())
  }

  // move the section up the tree
  // TODO: target depth
  const promoteSection = (target: number) => () => {
    const sectionDepth = $from.depth - 1
    const section = $from.node(sectionDepth)
    const beforeSection = $from.before(sectionDepth)
    const sectionTitle = $from.node($from.depth)

    const $beforeSection = doc.resolve(beforeSection)
    const beforeSectionOffset = $beforeSection.parentOffset
    const afterSectionOffset = beforeSectionOffset + section.nodeSize

    const parentSectionDepth = $from.depth - 2
    const parentSection = $from.node(parentSectionDepth)
    const startIndex = $from.index(parentSectionDepth)
    const endIndex = $from.indexAfter(parentSectionDepth)
    const beforeParentSection = $from.before(parentSectionDepth)
    const afterParentSection = $from.after(parentSectionDepth)

    const items = []

    let offset = 0

    if (startIndex > 0) {
      const precedingSection = parentSection.cut(0, beforeSectionOffset)
      items.push(precedingSection)
      offset += precedingSection.nodeSize
    }

    items.push(section)

    if (endIndex < parentSection.childCount) {
      const fragment = Fragment.from(nodes.section_title.create()).append(
        parentSection.content.cut(afterSectionOffset)
      )

      items.push(parentSection.copy(fragment))
    }

    tr.replaceWith(beforeParentSection, afterParentSection, items)

    const anchor = beforeParentSection + offset + 2

    tr.setSelection(
      TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size)
    )

    view.focus()

    view.dispatch(tr.scrollIntoView())
  }

  // move paragraph to title of new section at this position, along with the rest of the section
  // TODO: target depth
  const promoteParagraphToSection = (target: number) => () => {
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

    const items = []
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

    items.push(parentSection.copy(sectionContent))

    tr.replaceWith(beforeParentSection, afterParentSection, items)

    const anchor = beforeParentSection + offset + 2

    tr.setSelection(
      TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size)
    )

    view.focus()

    view.dispatch(tr.scrollIntoView())
  }

  const demoteSectionToParagraph = () => {
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

    if (previousNode && isSectionNode(previousNode)) {
      tr.replaceWith(
        beforeSection - previousNode.nodeSize,
        afterSection,
        previousNode.copy(
          Fragment.from(previousNode.content)
            .append(Fragment.from(paragraph))
            .append(section.content.cut(afterSectionTitleOffset))
        )
      )

      anchor = beforeSection
    } else {
      tr.replaceWith(
        beforeSection,
        afterSection,
        Fragment.from(paragraph).append(
          section.content.cut(afterSectionTitleOffset)
        )
      )

      anchor = beforeSection + 1
    }

    tr.setSelection(
      TextSelection.create(tr.doc, anchor, anchor + paragraph.content.size)
    )

    view.focus()

    view.dispatch(tr.scrollIntoView())
  }

  const convertParagraphToList = (nodeType: ManuscriptNodeType) => () => {
    const paragraph = $from.node($from.depth)
    const beforeParagraph = $from.before($from.depth)
    const afterParagraph = $from.after($from.depth)

    const list = nodeType.create(
      {
        id: generateNodeID(nodeType),
      },
      nodes.list_item.create(
        {},
        schema.nodes.paragraph.create({}, paragraph.content)
      )
    )

    tr.replaceWith(beforeParagraph, afterParagraph, list)

    const anchor = beforeParagraph + 3

    tr.setSelection(
      TextSelection.create(tr.doc, anchor, anchor + paragraph.content.size)
    )

    view.focus()

    view.dispatch(tr.scrollIntoView())
  }

  switch (parentElement.type) {
    case nodes.section: {
      const sectionDepth = $from.depth - 1
      const parentSectionDepth = sectionDepth - 1
      const minimumDepth = Math.max(1, parentSectionDepth)

      const beforeSection = $from.before(sectionDepth)
      const $beforeSection = doc.resolve(beforeSection)
      const sectionOffset = $beforeSection.parentOffset

      const typeOptions: Option[] = [
        buildOption({
          nodeType: nodes.paragraph,
          value: -4,
          depth: 1,
          action: demoteSectionToParagraph,
          isDisabled: sectionDepth <= 1 && sectionOffset <= 1,
        }),
        buildOption({
          nodeType: nodes.ordered_list,
          value: -3,
          depth: 1,
          isDisabled: true,
        }),
        buildOption({
          nodeType: nodes.bullet_list,
          value: -2,
          depth: 1,
          isDisabled: true,
        }),
      ]

      const sectionOptions: Option[] = []

      for (let depth = 1; depth < sectionDepth; depth++) {
        const node = $from.node(depth)

        if (isSectionNode(node)) {
          sectionOptions.push(
            buildOption({
              nodeType: nodes.section,
              value: depth,
              depth,
              action: promoteSection(depth),
              isDisabled: depth < minimumDepth,
            })
          )
        }
      }

      sectionOptions.push(
        buildOption({
          nodeType: nodes.section,
          value: parentSectionDepth + 1,
          depth: parentSectionDepth + 1,
          isDisabled: true,
          isSelected: true,
        })
      )

      const parentSection = $from.node(parentSectionDepth)

      const beforeSectionPos = $from.before(parentSectionDepth + 1)
      const $beforeSectionPos = doc.resolve(beforeSectionPos)

      const precedingSections: SectionNode[] = []

      parentSection.nodesBetween(0, $beforeSectionPos.parentOffset, node => {
        if (isSectionNode(node)) {
          precedingSections.push(node)
        }
        return false
      })

      if (precedingSections.length > 0) {
        sectionOptions.push(
          buildOption({
            nodeType: nodes.section,
            value: parentSectionDepth + 2,
            depth: parentSectionDepth + 2,
            action: moveSectionToSubsection,
          })
        )
      }

      return [{ options: typeOptions }, { options: sectionOptions }]
    }

    case nodes.paragraph: {
      const sectionDepth = $from.depth - 1
      const minimumDepth = Math.max(1, sectionDepth)

      let parentSectionDepth = 0

      const typeOptions: Option[] = [
        buildOption({
          nodeType: nodes.paragraph,
          value: -4,
          depth: 1,
          isDisabled: true,
          isSelected: true,
        }),
        buildOption({
          nodeType: nodes.ordered_list,
          value: -3,
          depth: 1,
          action: convertParagraphToList(nodes.ordered_list),
        }),
        buildOption({
          nodeType: nodes.bullet_list,
          value: -2,
          depth: 1,
          action: convertParagraphToList(nodes.bullet_list),
        }),
      ]

      const sectionOptions: Option[] = []

      for (let depth = 1; depth <= sectionDepth; depth++) {
        const node = $from.node(depth)

        if (isSectionNode(node)) {
          sectionOptions.push(
            buildOption({
              nodeType: nodes.section,
              value: depth,
              depth,
              action: promoteParagraphToSection(depth),
              isDisabled: depth < minimumDepth,
            })
          )

          parentSectionDepth = depth
        }
      }

      sectionOptions.push(
        buildOption({
          nodeType: nodes.section,
          value: parentSectionDepth + 1,
          depth: parentSectionDepth + 1,
          action: moveParagraphToNewSubsection,
        })
      )

      return [{ options: typeOptions }, { options: sectionOptions }]
    }

    default: {
      return [
        buildOption({
          nodeType: parentElement.type,
          value: -3,
          depth: 1,
          isDisabled: true,
          isSelected: true,
        }),
      ]
    }
  }
}

const OptionContainer = styled.div<{ isSelected: boolean }>`
  display: flex;
  align-items: center;

  & svg path {
    fill: ${props => (props.isSelected ? '#fff' : '#7fb5d5')};
  }
`

const OptionIcon = styled.span`
  display: inline-flex;
  width: 16px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  flex-shrink: 0;
`

const OptionLabel = styled.span`
  flex: 1;
`

const Group = styled.div`
  &:not(:last-child) {
    border-bottom: 1px solid #ddd;
  }
`

const StyledSelect = styled(Select)`
  z-index: 3;

  & > div:hover {
    border-color: #7fb5d5;
  }
`

const findSelectedOption = (options: GroupedOptions): Option | undefined => {
  for (const group of options) {
    for (const option of group.options) {
      if (option.isSelected) {
        return option
      }
    }
  }
}

interface Props {
  view: ManuscriptEditorView
}

export const LevelSelector: React.FunctionComponent<Props> = ({ view }) => {
  const {
    state: {
      schema: { nodes },
    },
  } = view

  const options = buildOptions(view)

  return (
    <StyledSelect
      isDisabled={options.length <= 1}
      isSearchable={false}
      options={options}
      value={
        options.length === 1
          ? options[0]
          : findSelectedOption(options as GroupedOptions)
      }
      components={{
        // tslint:disable-next-line:no-any
        Group: (props: any) => (
          <Group ref={props.innerRef} {...props.innerProps}>
            {props.children}
          </Group>
        ),
        GroupHeading: () => null,
        // tslint:disable-next-line:no-any
        Option: (props: any) => {
          const data = props.data as Option

          const style = props.getStyles('option', props)

          style.display = 'flex'
          style.fontSize = 15
          style.cursor = 'pointer'
          style.paddingLeft = 8 + (data.depth - 1) * 16

          if (data.nodeType === nodes.section) {
            style.fontSize = Math.max(14, 23 - 3 * (data.value - 1))
            style.fontWeight = 600
          }

          if (props.isSelected) {
            style.backgroundColor = '#7fb5d5'
            style.color = '#fff'
          } else {
            style.color = '#333'
          }

          if (props.isDisabled && !props.isSelected) {
            style.opacity = 0.4
          }

          return (
            <OptionContainer
              ref={props.innerRef}
              {...props.innerProps}
              style={style}
              depth={data.value}
              isSelected={props.isSelected}
            >
              <OptionIcon>{nodeTypeIcon(data.nodeType)}</OptionIcon>
              <OptionLabel>{data.label}</OptionLabel>
            </OptionContainer>
          )
        },
      }}
      // @ts-ignore (styled-components)
      onChange={(value: Option | null) => {
        if (value && value.action) {
          value.action()
        }
      }}
      styles={{
        control: (styles: CSSProperties): CSSProperties => ({
          ...styles,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: '#d6d6d6',
          boxShadow: 'none',
          fontSize: '14px',
          minHeight: 0,
          padding: 0,
          width: 200,
          overflowX: 'hidden',
          textOverflow: 'ellipsis',
        }),
        indicatorSeparator: (): CSSProperties => ({
          display: 'none',
        }),
        dropdownIndicator: (styles: CSSProperties): CSSProperties => ({
          ...styles,
          padding: '0 4px',
        }),
        menu: (styles: CSSProperties): CSSProperties => ({
          ...styles,
          width: 'auto',
        }),
        singleValue: (styles: CSSProperties): CSSProperties => ({
          ...styles,
          padding: 0,
        }),
        valueContainer: (styles: CSSProperties): CSSProperties => ({
          ...styles,
          padding: '1px 8px',
        }),
        container: (styles: CSSProperties): CSSProperties => ({
          ...styles,
          border: 'none',
        }),
      }}
    />
  )
}
