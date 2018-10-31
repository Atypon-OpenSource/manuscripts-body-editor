import { MarkSpec } from 'prosemirror-model'

export const bold: MarkSpec = {
  parseDOM: [
    {
      // Google Docs can produce content wrapped in <b style="fontWeight:normal">, which isn't actually bold. This workaround is copied from prosemirror-schema-basic.
      getAttrs: dom =>
        (dom as HTMLElement).style.fontWeight !== 'normal' && null,
      tag: 'b',
    },
    { tag: 'strong' },
    {
      // This regex, copied from prosemirror-schema-basic, matches all the possible "font-weight" values that can mean "bold".
      getAttrs: value =>
        /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
      style: 'font-weight',
    },
  ],
  toDOM: () => ['b'],
}

export const code: MarkSpec = {
  parseDOM: [{ tag: 'code' }],
  toDOM: () => ['code'],
}

export const italic: MarkSpec = {
  parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
  toDOM: () => ['i'],
}

export const link: MarkSpec = {
  attrs: {
    href: {},
    title: { default: null },
  },
  inclusive: false,
  parseDOM: [
    {
      getAttrs: dom => ({
        href: (dom as HTMLAnchorElement).getAttribute('href'),
        title: (dom as HTMLAnchorElement).getAttribute('title'),
      }),
      tag: 'a[href]',
    },
  ],
  toDOM: node => ['a', node.attrs],
}

export const smallcaps: MarkSpec = {
  parseDOM: [
    { style: 'font-variant=small-caps' },
    { style: 'font-variant-caps=small-caps' }, // TODO: all the other font-variant-caps options?
  ],
  toDOM: () => [
    'span',
    {
      style: 'font-variant:small-caps',
    },
  ],
}

export const strikethrough: MarkSpec = {
  parseDOM: [
    { tag: 'strike' },
    { style: 'text-decoration=line-through' },
    { style: 'text-decoration-line=line-through' },
  ],
  toDOM: () => [
    'span',
    {
      style: 'text-decoration-line:line-through',
    },
  ],
}

export const subscript: MarkSpec = {
  excludes: 'superscript',
  group: 'position',
  parseDOM: [{ tag: 'sub' }, { style: 'vertical-align=sub' }],
  toDOM: () => ['sub'],
}

export const superscript: MarkSpec = {
  excludes: 'subscript',
  group: 'position',
  parseDOM: [{ tag: 'sup' }, { style: 'vertical-align=super' }],
  toDOM: () => ['sup'],
}

export const underline: MarkSpec = {
  parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }],
  toDOM: () => ['u'],
}
