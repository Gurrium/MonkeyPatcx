import { Chain } from 'fp-ts/Either'
import * as t from 'io-ts'

const DateFromString = new t.Type<Date, string, unknown>(
  'DateFromString',
  (u): u is Date => u instanceof Date,
  (u, c) =>
    Chain.chain(t.string.validate(u, c), (s) => {
      const d = new Date(s)
      return isNaN(d.getTime()) ? t.failure(u, c) : t.success(d)
    }),
  (a) => a.toISOString()
)

export const coursePointTypes = [
  'Generic',
  'Summit',
  'Valley',
  'Water',
  'Food',
  'Danger',
  'Left',
  'Right',
  'Straight',
  'First Aid',
  '4th Category',
  '3rd Category',
  '2nd Category',
  '1st Category',
  'Hors Category',
  'Sprint',
]

export const CoursePointType = t.union([
  t.literal('Generic'),
  t.literal('Summit'),
  t.literal('Valley'),
  t.literal('Water'),
  t.literal('Food'),
  t.literal('Danger'),
  t.literal('Left'),
  t.literal('Right'),
  t.literal('Straight'),
  t.literal('First Aid'),
  t.literal('4th Category'),
  t.literal('3rd Category'),
  t.literal('2nd Category'),
  t.literal('1st Category'),
  t.literal('Hors Category'),
  t.literal('Sprint'),
])

export type CoursePointTypeT = t.TypeOf<typeof CoursePointType>

const Position = t.type({
  LatitudeDegrees: t.number,
  LongitudeDegrees: t.number,
})

const TrackPoint = t.type({
  Time: DateFromString,
  Position: Position,
  AltitudeMeters: t.number,
  DistanceMeters: t.number,
})

export type TrackPointT = t.TypeOf<typeof TrackPoint>

const Track = t.type({ Trackpoint: t.array(TrackPoint) })

const Lap = t.type({
  TotalTimeSeconds: t.number,
  DistanceMeters: t.number,
  BeginPosition: Position,
  EndPosition: Position,
})

const CoursePoint = t.type({
  Name: t.string,
  Time: DateFromString,
  Position: Position,
  PointType: CoursePointType,
})

export type CoursePointT = t.TypeOf<typeof CoursePoint>

const Course = t.type({
  Name: t.string,
  Lap: t.array(Lap),
  Track: t.array(Track),
  CoursePoint: t.union([t.array(CoursePoint), t.undefined]),
})

const NameKeyReference = t.type({ Id: t.string })

const CourseFolder = t.type({ CourseNameRef: t.array(NameKeyReference) })

const Courses = t.type({ CourseFolder: CourseFolder })

const Folders = t.type({ Courses: Courses })

const CourseList = t.type({ Course: t.array(Course) })

const TrainingCenterDatabase = t.type({
  Folders: Folders,
  Courses: CourseList,
})

export const TCX = t.type({
  '?xml': t.type({
    '@_version': t.number,
    '@_encoding': t.string,
  }),
  TrainingCenterDatabase: TrainingCenterDatabase,
})

export type TCXT = t.TypeOf<typeof TCX>
