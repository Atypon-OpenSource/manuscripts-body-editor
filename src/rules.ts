import {
  ellipsis,
  emDash,
  InputRule,
  inputRules,
  smartQuotes,
  textblockTypeInputRule,
  wrappingInputRule,
} from 'prosemirror-inputrules'

import { schema } from './schema'

export default inputRules({
  rules: [
    ...smartQuotes,
    ellipsis,
    emDash,

    // > blockquote
    wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote),

    // 1. ordered list
    wrappingInputRule(
      /^(\d+)\.\s$/,
      schema.nodes.ordered_list,
      match => ({ order: +match[1] }),
      (match, node) => node.childCount + node.attrs.order === +match[1]
    ),

    // * bullet list
    wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list),

    // ``` listing
    textblockTypeInputRule(/^```$/, schema.nodes.listing_element),

    // # heading
    textblockTypeInputRule(
      new RegExp('^(#{1,6})\\s$'),
      schema.nodes.heading,
      match => ({ level: match[1].length })
    ),

    // uniprot
    new InputRule(
      /\b([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})\b/,
      (state, match, start, end) =>
        state.tr.replaceWith(
          start - 1,
          end,
          schema.nodes.uniprot.create({
            accession: match[0],
          })
        )
    ),
  ],
})
