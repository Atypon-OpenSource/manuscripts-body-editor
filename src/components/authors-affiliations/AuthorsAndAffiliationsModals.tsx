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

/**
 * Coordinates the authors and affiliations modals, including opening one from
 * the other via an overlay (e.g. affiliations from the authors modal and vice versa).
 */
import {
  ManuscriptEditorView,
  ManuscriptNodeType,
  schema,
} from '@manuscripts/transform'
import { Attrs } from 'prosemirror-model'
import { Selection } from 'prosemirror-state'
import React, { useState } from 'react'

import { AffiliationAttrs, ContributorAttrs } from '../../lib/authors'
import {
  deleteNode,
  findChildByType,
  findChildrenAttrsByType,
  updateNodeAttrs,
} from '../../lib/view'
import {
  AffiliationsModal,
  AffiliationsModalProps,
} from '../affiliations/AffiliationsModal'
import { AuthorsModal, AuthorsModalProps } from '../authors/AuthorsModal'

export interface AuthorsAndAffiliationsModalsProps {
  initialModal: 'authors' | 'affiliations'
  view: ManuscriptEditorView
  author?: ContributorAttrs
  affiliation?: AffiliationAttrs
  addNewAuthor?: boolean
  addNewAffiliation?: boolean
}

function insertNode(
  parentType: ManuscriptNodeType,
  childType: ManuscriptNodeType
) {
  return (view: ManuscriptEditorView, attrs: Attrs) => {
    const parent = findChildByType(view, parentType)
    if (parent) {
      view.dispatch(
        view.state.tr.insert(parent.pos + 1, childType.create(attrs))
      )
    }
  }
}

function upsertNode<T extends Attrs>(
  nodeType: ManuscriptNodeType,
  insertFn: (view: ManuscriptEditorView, attrs: T) => void
) {
  return (view: ManuscriptEditorView, attrs: T) => {
    if (!updateNodeAttrs(view, nodeType, attrs)) {
      insertFn(view, attrs)
    }
  }
}

const insertAuthorNode = insertNode(
  schema.nodes.contributors,
  schema.nodes.contributor
)
const insertAffiliationNode = insertNode(
  schema.nodes.affiliations,
  schema.nodes.affiliation
)
const upsertAuthor = upsertNode<ContributorAttrs>(
  schema.nodes.contributor,
  insertAuthorNode
)
const upsertAffiliation = upsertNode<AffiliationAttrs>(
  schema.nodes.affiliation,
  insertAffiliationNode
)

export const AuthorsAndAffiliationsModals: React.FC<
  AuthorsAndAffiliationsModalsProps
> = ({
  initialModal,
  view,
  author,
  affiliation,
  addNewAuthor,
  addNewAffiliation,
}) => {
  const [showOverlay, setShowOverlay] = useState(false)
  const [authors, setAuthors] = useState(() =>
    findChildrenAttrsByType<ContributorAttrs>(view, schema.nodes.contributor)
  )
  const [affiliations, setAffiliations] = useState(() =>
    findChildrenAttrsByType<AffiliationAttrs>(view, schema.nodes.affiliation)
  )

  const handleOpenOverlay = () => setShowOverlay(true)

  const handleOverlayClose = () => {
    setShowOverlay(false)
    setAuthors(
      findChildrenAttrsByType<ContributorAttrs>(view, schema.nodes.contributor)
    )
    setAffiliations(
      findChildrenAttrsByType<AffiliationAttrs>(view, schema.nodes.affiliation)
    )
  }

  const authorsProps: AuthorsModalProps = {
    author,
    authors,
    affiliations,
    addNewAuthor,
    onSaveAuthor: (a) => upsertAuthor(view, a),
    onDeleteAuthor: (a) => deleteNode(view, a.id),
  }

  const affiliationsProps: AffiliationsModalProps = {
    affiliation,
    authors,
    affiliations,
    addNewAffiliation,
    onSaveAffiliation: (a) => upsertAffiliation(view, a),
    onDeleteAffiliation: (a) => deleteNode(view, a.id),
    onUpdateAuthors: (updated) =>
      updated.forEach((a) =>
        updateNodeAttrs(view, schema.nodes.contributor, a)
      ),
    clearSelection: () =>
      view.dispatch(
        view.state.tr.setSelection(Selection.atStart(view.state.doc))
      ),
  }

  if (initialModal === 'authors') {
    return (
      <>
        <AuthorsModal
          {...authorsProps}
          onOpenAffiliationsModal={handleOpenOverlay}
        />
        {showOverlay && (
          <AffiliationsModal
            {...affiliationsProps}
            addNewAffiliation
            onClose={handleOverlayClose}
          />
        )}
      </>
    )
  }

  return (
    <>
      <AffiliationsModal
        {...affiliationsProps}
        onOpenAuthorsModal={handleOpenOverlay}
      />
      {showOverlay && (
        <AuthorsModal
          {...authorsProps}
          addNewAuthor
          onClose={handleOverlayClose}
        />
      )}
    </>
  )
}
