import { Manuscript, Model } from '@manuscripts/manuscripts-json-schema'
import { Plugin } from 'prosemirror-state'
import { DEFAULT_BUNDLE, ManuscriptSchema } from '..'
// import { Decoration, DecorationSet } from 'prosemirror-view'

interface ManuscriptTemplate extends Model {
  parent?: string
  title: string
  desc?: string
  aim: string
  category: string
  bundle?: string
  publisher?: string
  requirementIDs: string[]
  priority?: number
  requirements: object
  styles: object
}

interface Props {
  getManuscript: () => Manuscript
  modelMap: Map<string, Model>
}

const findTemplate = (modelMap: Map<string, Model>) => {
  for (const model of modelMap.values()) {
    if (model.objectType === 'MPManuscriptTemplate') {
      return model as ManuscriptTemplate
    }
  }
}

const buildTemplate = (
  modelMap: Map<string, Model>
): ManuscriptTemplate | undefined => {
  let template = findTemplate(modelMap)

  if (template) {
    while (template.parent) {
      const parent = modelMap.get(template.parent)

      delete template.parent

      if (parent) {
        template = {
          ...parent,
          ...template,
        }
      }
    }
  }

  return template
}

export default (props: Props) =>
  new Plugin<ManuscriptSchema>({
    state: {
      init() {
        const { modelMap, getManuscript } = props

        const template = buildTemplate(modelMap)

        if (!template) {
          return
        }

        const manuscript = getManuscript()

        const bundle = modelMap.get(
          manuscript.bundle || template.bundle || DEFAULT_BUNDLE
        )

        const requirements = (template.requirementIDs || []).map(id =>
          modelMap.get(id)
        )

        return {
          template,
          bundle,
          requirements,
        }
      },
      apply(tr, value, oldState, newState) {
        return value
      },
    },
  })
