import { XMLParser } from 'fast-xml-parser'

export const parser = new XMLParser({
  ignoreAttributes: false,
  isArray: (name, jpath) => {
    return (
      ['CourseNameRef', 'Course', 'Track', 'Trackpoint', 'CoursePoint'].includes(name) ||
      ['Course.Lap'].some((candidate: string) => jpath.endsWith(candidate))
    )
  },
  numberParseOptions: {
    leadingZeros: true,
    hex: false,
    eNotation: true,
  },
  tagValueProcessor: (tagName, tagValue) => {
    if (tagName === 'Name') {
      return null
    } else {
      return tagValue
    }
  },
  attributeValueProcessor: (attrName, attrValue) => {
    if (attrName === 'version') {
      return null
    } else {
      return attrValue
    }
  },
  parseTagValue: true,
  parseAttributeValue: true,
})
