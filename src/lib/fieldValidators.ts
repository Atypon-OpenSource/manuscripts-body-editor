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

// Email field
const EMAIL_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

const emailRegex = new RegExp(EMAIL_REGEX)

// Error messages for field validations
export const FIELD_ERRORS = {
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
  },
  name: {
    required: 'Given name and family name are required',
  },
} as const

export interface ValidationResult {
  isValid: boolean
  error?: string
  field?: string
}

// Email validation function
export const validateEmail = (
  email: string,
  isRequired = false
): ValidationResult => {
  if (isRequired && !email) {
    return {
      isValid: false,
      error: FIELD_ERRORS.email.required,
      field: 'email',
    }
  }
  if (email && !emailRegex.test(email)) {
    return { isValid: false, error: FIELD_ERRORS.email.invalid, field: 'email' }
  }
  return { isValid: true, field: 'email' }
}

// Name validation function for given-name and family-name
export const validateName = (
  given: string,
  family: string
): ValidationResult => {
  if (!given || !family) {
    return {
      isValid: false,
      error: FIELD_ERRORS.name.required,
      field: 'name',
    }
  }
  return { isValid: true, field: 'name' }
}
