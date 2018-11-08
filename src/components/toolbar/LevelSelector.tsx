import { Fragment } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'
import React, { CSSProperties } from 'react'
import Select from 'react-select'
import styled from 'styled-components'
import { generateNodeID } from '../..'
import { findParentNodeWithIdValue } from '../../lib/utils'
import { isSectionNode, SectionNode } from '../../schema/nodes/section'
import { SectionTitleNode } from '../../schema/nodes/section_title'
import { ManuscriptEditorView, ManuscriptNodeType } from '../../schema/types'
import { nodeNames } from '../../transformer/node-names'
import { nodeTypeIcon } from '../../transformer/node-type-icons'

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

const buildOption = (
  nodeType: ManuscriptNodeType,
  value: number,
  depth: number,
  action?: () => void,
  isDisabled: boolean = false
): Option => ({
  value,
  depth,
  icon: nodeTypeIcon(nodeType),
  label: titleCase(optionName(nodeType, value)),
  nodeType,
  action,
  isDisabled,
})

const buildOptions = (view: ManuscriptEditorView): Option[] => {
  const {
    state: {
      doc,
      selection: { $from, $to },
      schema,
      tr,
    },
  } = view

  const { nodes } = schema

  const options: Option[] = []

  if (!$from.sameParent($to)) {
    return options
  }

  const parentNodeWithIdValue = findParentNodeWithIdValue(view.state.selection)

  if (!parentNodeWithIdValue) {
    return options
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

    view.dispatch(tr)
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

    view.dispatch(tr)
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
    const parentSectionStart = $from.start(parentSectionDepth)

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

    view.dispatch(tr)
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

    view.dispatch(tr)
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

    view.dispatch(tr)
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

    view.dispatch(tr)
  }

  switch (parentNodeWithIdValue.node.type) {
    case nodes.section: {
      const sectionDepth = $from.depth - 1
      const parentSectionDepth = sectionDepth - 1
      const minimumDepth = Math.max(1, parentSectionDepth)

      const beforeSection = $from.before(sectionDepth)
      const $beforeSection = doc.resolve(beforeSection)
      const sectionOffset = $beforeSection.parentOffset

      if (sectionDepth > 1 || sectionOffset > 1) {
        options.push(
          buildOption(nodes.paragraph, -1, 1, demoteSectionToParagraph)
        )
      }

      for (let depth = 1; depth < sectionDepth; depth++) {
        const node = $from.node(depth)

        if (isSectionNode(node)) {
          options.push(
            buildOption(
              nodes.section,
              depth,
              depth,
              promoteSection(depth),
              depth < minimumDepth
            )
          )
        }
      }

      options.push(
        buildOption(
          nodes.section,
          parentSectionDepth + 1,
          parentSectionDepth + 1
        )
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
        options.push(
          buildOption(
            nodes.section,
            parentSectionDepth + 2,
            parentSectionDepth + 2,
            moveSectionToSubsection
          )
        )
      }

      return options
    }

    case nodes.paragraph: {
      const sectionDepth = $from.depth - 1
      const minimumDepth = Math.max(1, sectionDepth)

      let parentSectionDepth = 0

      options.push(
        buildOption(
          nodes.ordered_list,
          -3,
          1,
          convertParagraphToList(nodes.ordered_list)
        )
      )

      options.push(
        buildOption(
          nodes.bullet_list,
          -2,
          1,
          convertParagraphToList(nodes.bullet_list)
        )
      )

      for (let depth = 1; depth <= sectionDepth; depth++) {
        const node = $from.node(depth)

        if (isSectionNode(node)) {
          options.push(
            buildOption(
              nodes.section,
              depth,
              depth,
              promoteParagraphToSection(depth),
              depth < minimumDepth
            )
          )

          parentSectionDepth = depth
        }
      }

      options.push(buildOption(nodes.paragraph, -1, parentSectionDepth + 1))

      options.push(
        buildOption(
          nodes.section,
          parentSectionDepth + 1,
          parentSectionDepth + 1,
          moveParagraphToNewSubsection
        )
      )

      return options
    }

    default: {
      options.push(
        buildOption(
          parentNodeWithIdValue.node.type,
          -1,
          parentNodeWithIdValue.depth
        )
      )

      return options
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

const StyledSelect = styled(Select)`
  & > div:hover {
    border-color: #7fb5d5;
  }
`

interface Option {
  nodeType: ManuscriptNodeType
  icon: JSX.Element | null
  value: number
  depth: number
  label: string
  action?: () => void
  isDisabled: boolean
}

interface Props {
  view: ManuscriptEditorView
}

export const LevelSelector: React.SFC<Props> = ({ view }) => {
  const {
    state: {
      schema: { nodes },
    },
  } = view

  const options = buildOptions(view)
  const selected = options.find(option => !option.action)

  return (
    <StyledSelect
      isDisabled={options.length <= 1}
      isSearchable={false}
      options={options}
      value={selected}
      components={{
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
          }

          if (props.isDisabled) {
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
      onChange={value => {
        if (!value) return

        const selectedValue = value as Option

        if (selectedValue.action) {
          selectedValue.action()
        }
      }}
      styles={{
        control: (styles): CSSProperties => ({
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
        dropdownIndicator: (styles): CSSProperties => ({
          ...styles,
          padding: '0 4px',
        }),
        menu: (styles): CSSProperties => ({
          ...styles,
          width: 'auto',
        }),
        singleValue: (styles): CSSProperties => ({
          ...styles,
          padding: 0,
        }),
        valueContainer: (styles): CSSProperties => ({
          ...styles,
          padding: '1px 8px',
        }),
        container: (styles): CSSProperties => ({
          ...styles,
          border: 'none',
        }),
      }}
    />
  )
}
