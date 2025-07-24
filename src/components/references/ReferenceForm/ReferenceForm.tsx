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
  FormField,
  FormFields,
  Label,
  LabelContainer,
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
              <FormField>
                <LabelContainer>
                  <Label htmlFor={'citation-item-type'}>Type</Label>
                </LabelContainer>

                <Field
                  id={'citation-item-type'}
                  name={'type'}
                  component={SelectField}
                  options={bibliographyItemTypeOptions}
                />
              </FormField>

              {shouldRenderField(
                'title',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label>Title</Label>
                  </LabelContainer>

                  <Field name={'title'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea id={'title'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'literal',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label>Text</Label>
                  </LabelContainer>

                  <Field name={'literal'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea id={'literal'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}
              {shouldRenderField(
                'std',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'std'}>Standard</Label>
                  </LabelContainer>
                  <Field name={'std'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea id={'std'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'author',
                formik.values.type as BibliographyItemType
              ) && (
                <FieldArray
                  name={'author'}
                  render={({ push, remove }) => (
                    <FormField>
                      <LabelContainer>
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
                      </LabelContainer>

                      <div>
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
                    </FormField>
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
                    <FormField>
                      <LabelContainer>
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
                      </LabelContainer>

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
                    </FormField>
                  )}
                />
              )}

              {shouldRenderField(
                'issued',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={"issued['date-parts'][0][0]"}>
                      Issued (Year)
                    </Label>
                  </LabelContainer>

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
                </FormField>
              )}

              {shouldRenderField(
                'container-title',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'container-title'}>Container Title</Label>
                  </LabelContainer>

                  <Field name={'container-title'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea
                        id={'container-title'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormField>
              )}
              {shouldRenderField(
                'collection-title',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'collection-title'}>Collection Title</Label>
                  </LabelContainer>

                  <Field name={'collection-title'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea
                        id={'collection-title'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'volume',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'volume'}>Volume</Label>
                  </LabelContainer>

                  <Field name={'volume'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'volume'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'issue',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'issue'}>Issue</Label>
                  </LabelContainer>

                  <Field name={'issue'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'issue'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'supplement',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'supplement'}>Supplement</Label>
                  </LabelContainer>

                  <Field name={'supplement'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField
                        type={'supplement'}
                        id={'supplement'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'edition',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'edition'}>Edition</Label>
                  </LabelContainer>

                  <Field name={'edition'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'edition'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'publisher-place',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'publisher-place'}>
                      Publisher Location
                    </Label>
                  </LabelContainer>

                  <Field name={'publisher-place'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField
                        id={'publisher-place'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'publisher',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'publisher'}>Publisher</Label>
                  </LabelContainer>

                  <Field name={'publisher'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id="publisher" {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}
              {shouldRenderField(
                'event',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'event'}>Event</Label>
                  </LabelContainer>

                  <Field name={'event'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'event'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'event-place',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'event-place'}>Event Place</Label>
                  </LabelContainer>

                  <Field name={'event-place'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'event-place'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'event-date',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={"event-date['date-parts'][0][0]"}>
                      Event date (Year)
                    </Label>
                  </LabelContainer>

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
                </FormField>
              )}

              {shouldRenderField(
                'institution',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'institution'}>Institution</Label>
                  </LabelContainer>

                  <Field name={'institution'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'institution'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'page',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'page'}>Page</Label>
                  </LabelContainer>

                  <Field name={'page'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'page'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'number-of-pages',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'number-of-pages'}>Number of pages</Label>
                  </LabelContainer>
                  <Field name={'umber-of-pages'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField
                        id={'number-of-pages'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'locator',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'locator'}>Locator</Label>
                  </LabelContainer>
                  <Field name={'locator'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'locator'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'DOI',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'DOI'}>DOI</Label>
                  </LabelContainer>
                  <Field name={'DOI'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField
                        id={'DOI'}
                        pattern={'(https://doi.org/)?10..+'}
                        {...props.field}
                      />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'URL',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={'URL'}>URL</Label>
                  </LabelContainer>
                  <Field name={'URL'}>
                    {(props: FieldProps) => (
                      <ReferenceTextField id={'URL'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}

              {shouldRenderField(
                'accessed',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label htmlFor={"accessed['date-parts'][0][0]"}>
                      Accessed (Year)
                    </Label>
                  </LabelContainer>
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
                </FormField>
              )}
              {shouldRenderField(
                'comment',
                formik.values.type as BibliographyItemType
              ) && (
                <FormField>
                  <LabelContainer>
                    <Label>Comment</Label>
                  </LabelContainer>

                  <Field name={'comment'}>
                    {(props: FieldProps) => (
                      <ReferenceTextArea id={'comment'} {...props.field} />
                    )}
                  </Field>
                </FormField>
              )}
            </FormFields>
          </ChangeHandlingForm>
        )
      }}
    </Formik>
  )
}
