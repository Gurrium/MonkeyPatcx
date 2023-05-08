import { XMLParser } from 'fast-xml-parser'

export const parser = new XMLParser({
  ignoreAttributes: false,
  isArray: (name, jpath) => {
    return (
      ['CourseNameRef', 'Course', 'Track', 'CoursePoint'].includes(name) ||
      ['Course.Lap'].some((candidate: string) => jpath.endsWith(candidate))
    )
  },
  tagValueProcessor: (tagName, tagValue) => {
    if (tagName == 'Time') {
      return new Date(tagValue)
    } else {
      return null
    }
  },
})
