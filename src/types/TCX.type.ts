export type TCX = {
  '?xml': string
  TrainingCenterDatabase: TrainingCenterDatabase
}

export type TrainingCenterDatabase = { Folders?: Folders; Courses?: CourseList }

type Folders = { Courses?: Courses }

type Courses = { CourseFolder: CourseFolder }

type CourseFolder = { CourseNameRef?: [NameKeyReference] }

type NameKeyReference = { Id: string }

type CourseList = { Course: Course[] }

export type Course = { Name: string; Lap?: Lap[]; Track?: Track[]; CoursePoint?: CoursePoint[] }

type Lap = {
  TotalTimeSeconds: number
  DistanceMeters: number
  BeginPosition?: Position
  EndPosition?: Position
}

type Position = {
  LatitudeDegrees: number
  LongitudeDegrees: number
}

type Track = { Trackpoint: TrackPoint[] }

export type TrackPoint = {
  Time: Date
  Position: Position
  AltitudeMeters?: number
  DistanceMeters?: number
}

export type CoursePoint = {
  Name: string
  Time: Date
  Position: Position
  PointType: CoursePointType
}

export enum CoursePointType {
  Generic = 'Generic',
  FirstAid = 'First Aid',
  Left = 'Left',
  Right = 'Right',
  Straight = 'Straight',
  // TODO: 他のも追加する
}
