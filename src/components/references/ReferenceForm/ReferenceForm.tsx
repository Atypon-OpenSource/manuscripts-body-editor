/*!
 * © 2023 Atypon Systems LLC
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
  AddAuthorIcon,
  ButtonGroup,
  Category,
  DeleteIcon,
  Dialog,
  IconButton,
  LinkIcon,
  OptionType,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  Tooltip,
  Label,
  FormRow,
} from '@manuscripts/style-guide'
import {
  BibliographyItemAttrs,
  BibliographyItemType,
} from '@manuscripts/transform'
import { Field, FieldArray, FieldProps, Formik, FormikProps } from 'formik'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'

import { bibliographyItemTypes } from '../../../lib/references'
import { shouldRenderField } from '../../../lib/utils'
import { ChangeHandlingForm } from '../../ChangeHandlingForm'
import { PersonDropDown } from './PersonDropDown'
import {
  Actions,
  Button,
  DeleteButton,
  FormFields,
  ReferenceTextArea,
  ReferenceTextField,
  YearField,
} from './styled-components'

const bibliographyItemTypeOptions: OptionType[] = bibliographyItemTypes.map(
  (i) => ({
    label: i[1],
    value: i[0],
  })
)
export interface ReferenceFormActions {
  reset: () => void
}

export const ReferenceForm: React.FC<{
  values: BibliographyItemAttrs
  showDelete: boolean
  onChange: (values: BibliographyItemAttrs) => void
  onCancel: () => void
  onDelete: () => void
  onSave: (values: BibliographyItemAttrs) => void
  actionsRef?: MutableRefObject<ReferenceFormActions | undefined>
}> = ({
  values,
  showDelete,
  onChange,
  onDelete,
  onCancel,
  onSave,
  actionsRef,
}) => {
  const fieldsRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<FormikProps<BibliographyItemAttrs>>(null)
  const [newAuthorIndex, setNewAuthorIndex] = useState<number>()
  const [newEditorIndex, setNewEditorIndex] = useState<number>()

  useEffect(() => {
    if (fieldsRef.current) {
      fieldsRef.current.scrollTop = 0
    }
  }, [values])

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const validateReference = (values: BibliographyItemAttrs) => {
    const errors: Partial<BibliographyItemAttrs> = {}

    if (values.type === 'literal') {
      if (!values.literal?.trim()) {
        errors.literal = 'Literal is required for unstructured references'
      }
    } else {
      if (!values.title?.trim()) {
        errors.title = 'Title is required'
      }
    }
    return errors
  }

  if (actionsRef && !actionsRef.current) {
    actionsRef.current = {
      reset: () => {
        formRef.current?.resetForm()
      },
    }
  }

  return (
    <Formik<BibliographyItemAttrs>
      initialValues={values}
      onSubmit={onSave}
      enableReinitialize={true}
      innerRef={formRef}
      validate={validateReference}
    >
      {(formik) => {
        return (
          <ChangeHandlingForm onChange={onChange}>
            <Dialog
              isOpen={showDeleteDialog}
              category={Category.confirmation}
              header="Delete Reference"
              message="Are you sure you want to delete this reference from the list?"
              actions={{
                secondary: {
                  action: () => {
                    onDelete()
                    setShowDeleteDialog(false)
                  },
                  title: 'Delete',
                },
                primary: {
                  action: () => setShowDeleteDialog(false),
                  title: 'Cancel',
                },
              }}
            />
            <Actions>
              <ButtonGroup>
                <IconButton
                  as="a"
                  href={`https://doi.org/${formik.values.DOI}`}
                  target={'_blank'}
                >
                  <LinkIcon />
                </IconButton>
                <DeleteButton
                  defaultColor
                  disabled={!showDelete}
                  data-tooltip-id={showDelete ? '' : 'delete-button-tooltip'}
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <DeleteIcon />
                </DeleteButton>
                <Tooltip id="delete-button-tooltip" place="bottom">
                  Unable to delete because the item is used in the document
                </Tooltip>
              </ButtonGroup>
              <ButtonGroup>
                <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
                <PrimaryButton
                  type="submit"
                  disabled={!formik.isValid || !formik.dirty}
                >
                  Save
                </PrimaryButton>
              </ButtonGroup>
            </Actions>

            <FormFields ref={fieldsRef}>
              <FormRow>
                  <Label htmlFor={'citation-item-type'}>Type</Label>

                <Field
                  id={'citation-item-type'}
                  name={'type'}
                  component={SelectField}
                  options={bibliographyItemTypeOptions}
                />
              </FormRow>

              {shouldRenderField(
                'title',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label>Title</Label>

                  <Field name={'title'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea id={'title'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'literal',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label>Text</Label>

                  <Field name={'literal'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea id={'literal'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}
              {shouldRenderField(
                'std',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'std'}>Standard</Label>
                  <Field name={'std'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea id={'std'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'author',
                formik.values.type as BibliographyItemType
              ) && (
                <FieldArray
                  name={'author'}
                  render={({ push, remove }) => (
                    <FormRow
                      direction="row"
                      justify="space-between"
                      align="center"
                    >
                      <Label>Authors</Label>

                      <Button
                        onClick={() => {
                          setNewAuthorIndex(formik.values.author?.length)
                          push({
                            given: '',
                            family: '',
                          })
                        }}
                      >
                        <AddAuthorIcon height={17} width={17} />
                      </Button>

                      <div style={{ width: '100%' }}>
                        {formik.values.author?.map((author, index) => (
                          <PersonDropDown
                            key={index}
                            index={index}
                            person={author}
                            isNew={newAuthorIndex === index}
                            remove={remove}
                            onChange={formik.handleChange}
                            type="author"
                          />
                        ))}
                      </div>
                    </FormRow>
                  )}
                />
              )}

              {shouldRenderField(
                'editor',
                formik.values.type as BibliographyItemType
              ) && (
                <FieldArray
                  name={'editor'}
                  render={({ push, remove }) => (
                    <FormRow>
                      <Label>Editors</Label>

                        <Button
                          onClick={() => {
                            setNewEditorIndex(formik.values.editor?.length)
                            push({
                              given: '',
                              family: '',
                            })
                          }}
                        >
                          <AddAuthorIcon height={17} width={17} />
                        </Button>

                      <div>
                        {formik.values.editor?.map((editor, index) => (
                          <PersonDropDown
                            key={index}
                            index={index}
                            person={editor}
                            isNew={newEditorIndex === index}
                            remove={remove}
                            onChange={formik.handleChange}
                            type="editor"
                          />
                        ))}
                      </div>
                    </FormRow>
                  )}
                />
              )}

              {shouldRenderField(
                'issued',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={"issued['date-parts'][0][0]"}>
                      Issued (Year)
                    </Label>
               

                  <YearField
                    name={"issued['date-parts'][0][0]"}
                    type={'number'}
                    step={1}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const { value } = event.target
                      if (value) {
                        if (formik.values.issued) {
                          // NOTE: this assumes that "issued" is already a complete object
                          formik.setFieldValue(
                            "issued['date-parts'][0][0]",
                            Number(value)
                          )
                        } else {
                          formik.setFieldValue('issued', {
                            'date-parts': [[Number(value)]],
                          })
                        }
                      } else {
                        // NOTE: not undefined due to https://github.com/jaredpalmer/formik/issues/2180
                        formik.setFieldValue('issued', '')
                      }
                    }}
                  />
                </FormRow>
              )}

              {shouldRenderField(
                'container-title',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'container-title'}>Container Title</Label>

                  <Field name={'container-title'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea
                        id={'container-title'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormRow>
              )}
              {shouldRenderField(
                'collection-title',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'collection-title'}>Collection Title</Label>

                  <Field name={'collection-title'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea
                        id={'collection-title'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'volume',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'volume'}>Volume</Label>

                  <Field name={'volume'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'volume'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'issue',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'issue'}>Issue</Label>

                  <Field name={'issue'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'issue'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'supplement',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'supplement'}>Supplement</Label>

                  <Field name={'supplement'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField
                        type={'supplement'}
                        id={'supplement'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'edition',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'edition'}>Edition</Label>

                  <Field name={'edition'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'edition'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'publisher-place',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'publisher-place'}>Publisher Location</Label>

                  <Field name={'publisher-place'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField
                        id={'publisher-place'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'publisher',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'publisher'}>Publisher</Label>

                  <Field name={'publisher'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id="publisher" {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}
              {shouldRenderField(
                'event',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'event'}>Event</Label>

                  <Field name={'event'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'event'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'event-place',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'event-place'}>Event Place</Label>

                  <Field name={'event-place'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'event-place'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'event-date',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={"event-date['date-parts'][0][0]"}>
                      Event date (Year)
                    </Label>
                 

                  <YearField
                    name={"event-date['date-parts'][0][0]"}
                    type={'number'}
                    step={1}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const { value } = event.target

                      if (value) {
                        if (formik.values['event-date']) {
                          // NOTE: this assumes that "event-date" is already a complete object
                          formik.setFieldValue(
                            "event-date['date-parts'][0][0]",
                            Number(value)
                          )
                        } else {
                          formik.setFieldValue('event-date', {
                            'date-parts': [[Number(value)]],
                          })
                        }
                      } else {
                        // NOTE: not undefined due to https://github.com/jaredpalmer/formik/issues/2180
                        formik.setFieldValue('event-date', '')
                      }
                    }}
                  />
                </FormRow>
              )}

              {shouldRenderField(
                'institution',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'institution'}>Institution</Label>

                  <Field name={'institution'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'institution'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'page',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'page'}>Page</Label>

                  <Field name={'page'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'page'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'number-of-pages',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'number-of-pages'}>Number of pages</Label>

                  <Field name={'umber-of-pages'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField
                        id={'number-of-pages'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'locator',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'locator'}>Locator</Label>

                  <Field name={'locator'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'locator'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'DOI',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'DOI'}>DOI</Label>

                  <Field name={'DOI'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField
                        id={'DOI'}
                        pattern={'(https://doi.org/)?10..+'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'URL',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={'URL'}>URL</Label>

                  <Field name={'URL'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'URL'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}

              {shouldRenderField(
                'accessed',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label htmlFor={"accessed['date-parts'][0][0]"}>
                      Accessed (Year)
                    </Label>

                  <YearField
                    name={"accessed['date-parts'][0][0]"}
                    type={'number'}
                    step={1}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const { value } = event.target

                      if (value) {
                        if (formik.values['event-date']) {
                          // NOTE: this assumes that "accessed" is already a complete object
                          formik.setFieldValue(
                            "accessed['date-parts'][0][0]",
                            Number(value)
                          )
                        } else {
                          formik.setFieldValue('accessed', {
                            'date-parts': [[Number(value)]],
                          })
                        }
                      } else {
                        // NOTE: not undefined due to https://github.com/jaredpalmer/formik/issues/2180
                        formik.setFieldValue('accessed', '')
                      }
                    }}
                  />
                </FormRow>
              )}
              {shouldRenderField(
                'comment',
                formik.values.type as BibliographyItemType
              ) && (
                <FormRow>
                  <Label>Comment</Label>

                  <Field name={'comment'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea id={'comment'} {...props.field} />
                    )}
                  </Field>
                </FormRow>
              )}
            </FormFields>
          </ChangeHandlingForm>
        )
      }}
    </Formik>
  )
}
