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
import { ManuscriptEditorView, schema } from '@manuscripts/transform'
import { EditorView } from 'prosemirror-view'
import React, { useState } from 'react'

import { AffiliationAttrs, ContributorAttrs } from '../../lib/authors'
import {
  upsertAuthor,
  upsertAffiliation,
} from '../../lib/authors-and-affiliations'
import { getEditorProps } from '../../plugins/editor-props'
import ReactSubView from '../../views/ReactSubView'
import {
  deleteNode,
  findChildrenAttrsByType,
  updateNodeAttrs,
} from '../../lib/view'
import {
  AffiliationsModal,
  AffiliationsModalProps,
} from '../affiliations/AffiliationsModal'
import { CreateAffiliationModal } from '../affiliations/CreateAffiliationModal'
import { AuthorsModal, AuthorsModalProps } from '../authors/AuthorsModal'
import { CreateAuthorModal } from '../authors/CreateAuthorModal'

export interface AuthorsAndAffiliationsModalsProps {
  initialModal: 'authors' | 'affiliations'
  view: ManuscriptEditorView
  author?: ContributorAttrs
  affiliation?: AffiliationAttrs
  addNewAuthor?: boolean
  addNewAffiliation?: boolean
}

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
  }

  if (initialModal === 'authors') {
    return (
      <>
        <AuthorsModal
          {...authorsProps}
          onOpenAffiliationsModal={handleOpenOverlay}
        />
        {showOverlay && (
          <CreateAffiliationModal
            affiliationsCount={affiliations.length}
            onSave={(a) => upsertAffiliation(view, a)}
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
        openAuthorsModal={handleOpenOverlay}
      />
      {showOverlay && (
        <CreateAuthorModal
          authorsCount={authors.length}
          affiliations={affiliations}
          onSave={(a) => upsertAuthor(view, a)}
          onClose={handleOverlayClose}
        />
      )}
    </>
  )
}

export const openAuthorsAndAffiliationsModals = (
  pos: number,
  view: ManuscriptEditorView | EditorView | undefined,
  initialModal: 'authors' | 'affiliations'
) => {
  if (!view) {
    return
  }

  const { state } = view
  const props = getEditorProps(state)
  const componentProps: AuthorsAndAffiliationsModalsProps = {
    initialModal,
    view: view as ManuscriptEditorView,
    addNewAuthor: initialModal === 'authors',
    addNewAffiliation: initialModal === 'affiliations',
  }

  const dialog = ReactSubView(
    props,
    AuthorsAndAffiliationsModals,
    componentProps,
    state.doc,
    () => pos,
    view
  )
  view.focus()
  document.body.appendChild(dialog)
}
