import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const OutlineItemIcon = styled.span`
  display: inline-flex;
  width: 1.2em;
  height: 1.3em;
  justify-content: center;
  align-items: center;
  padding: 2px;
  flex-shrink: 0;
`

export const OutlineItem = styled.div<{
  isSelected: boolean
  depth: number
}>`
  display: flex;
  align-items: center;
  white-space: nowrap;
  box-sizing: border-box;
  overflow-x: hidden;
  cursor: pointer;
  color: #444;
  background: ${props => (props.isSelected ? '#E4EEF7' : 'transparent')};
  padding-right: 20px;
  padding-left: ${props => 20 + props.depth * 20}px;
  margin-left: -20px;
  margin-right: -20px;
`

export const Outline = styled.div`
  font-size: 16px;
  position: relative;

  & .outline-text-doc {
    font-size: 18px;
  }
`

export const OutlineItemArrow = styled.button`
  display: inline-block;
  color: #ccc;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0 6px;
  flex-shrink: 0;
  font-size: 14px;

  &:hover {
    color: #666;
  }

  &:focus {
    outline: none;
  }
`

export const OutlineItemNoArrow = styled.span`
  display: inline-block;
  width: 24px;
  flex-shrink: 0;
`

export const OutlineDropPreview = styled.div<{ depth: number }>`
  width: 100%;
  background: #65a3ff;
  height: 1px;
  position: absolute;
  margin-left: ${props => 30 + props.depth * 20}px;
  z-index: 2;

  &:before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border: 1px solid #65a3ff;
    border-radius: 6px;
    position: absolute;
    top: -3px;
    left: -6px;
  }
`

export const OutlineItemLink = styled(Link)`
  flex: 1;
  display: inline-flex;
  align-items: center;
  overflow-x: hidden;
  color: inherit;
  text-decoration: none;
  height: 100%;

  &:focus,
  &:active {
    outline: none;
  }
`

export const OutlineItemLinkText = styled.span`
  flex: 1;
  display: inline-block;
  overflow-x: hidden;
  text-overflow: ellipsis;
  margin-left: 4px;
`

export const OutlineItemPlaceholder = styled.span`
  color: #aaa;
`
