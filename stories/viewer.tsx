import { action } from '@storybook/addon-actions'
import { storiesOf } from '@storybook/react'
import React from 'react'

storiesOf('button', module).add('basic', () => (
  <button type="button" onClick={action('click')}>
    Click me
  </button>
))
