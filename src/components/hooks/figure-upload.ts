/*!
 * © 2022 Atypon Systems LLC
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
  FigureNode,
  ManuscriptEditorView,
  ManuscriptNode,
} from '@manuscripts/transform'
import { SyntheticEvent, useCallback, useMemo, useRef, useState } from 'react'

import { getMatchingChild, setNodeAttrs } from '../../lib/utils'

export const useFileInputRef = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onUploadClick = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    },
    [fileInputRef]
  )

  return { fileInputRef, onUploadClick }
}

/**
 * when selecting a file from the paper clip button list of
 * (Supplements, Other files) if the figure is empty will replace
 * the selected file with it if not will add a new figure with the selected file.
 */
export const useFigureSelection = (viewProps: {
  view: ManuscriptEditorView
  getPos: () => number
  node: ManuscriptNode
}) => {
  const [showAlert, setShowAlert] = useState(false)

  const isEmptyFigure = useMemo(() => {
    const figure = getMatchingChild(
      viewProps.node,
      (node) => node.type === node.type.schema.nodes.figure
    )

    return !!figure?.attrs.src
  }, [viewProps.node])

  const addFigureExFileRef = useCallback(
    (link) => {
      const {
        state: { tr, schema },
        dispatch,
      } = viewProps.view

      if (!isEmptyFigure) {
        const figure = schema.nodes.figure.createAndFill(
          {
            src: link,
          },
          []
        ) as FigureNode

        let node_position = 0
        viewProps.node.forEach((node, pos) => {
          if (node.type === node.type.schema.nodes.figcaption) {
            node_position = pos
          }
        })

        dispatch(tr.insert(viewProps.getPos() + node_position, figure))
      } else {
        const figure = getMatchingChild(
          viewProps.node,
          (node) => node.type === node.type.schema.nodes.figure
        )
        setNodeAttrs(
          figure,
          viewProps,
          dispatch
        )({
          src: link,
        })
      }
    },
    [isEmptyFigure, viewProps]
  )

  return { addFigureExFileRef, showAlert, setShowAlert }
}
