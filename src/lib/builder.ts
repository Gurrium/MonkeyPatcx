import { XMLBuilder } from 'fast-xml-parser'

export const builder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
  tagValueProcessor: (name, value) => {
    if (name == 'Time' && value instanceof Date) {
      return value.toISOString().replace('.000Z', 'Z')
    } else {
      return value as string
    }
  },
})
