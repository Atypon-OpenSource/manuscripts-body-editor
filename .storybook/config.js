const { addDecorator, configure } = require('@storybook/react')
const React = require('react')

addDecorator(story => (
  <React.Fragment>
    <div>{story()}</div>
  </React.Fragment>
))

const req = require.context('../stories', true, /\.tsx/)

configure(() => {
  req.keys().forEach(filename => req(filename))
}, module)
