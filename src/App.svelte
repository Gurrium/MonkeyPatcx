<script lang="ts">
  import { XMLParser, XMLBuilder } from 'fast-xml-parser'

  enum CoursePointType {
    Generic = 'Generic',
    FirstAid = 'First Aid',
    Left = 'Left',
    Right = 'Right',
    Straight = 'Straight',
    // TODO: 他のも追加する
  }
  function emoji(type: CoursePointType): '⬆' | '⬅' | '➡' | '🍙' | '📍' {
    switch (type) {
      case CoursePointType.Generic:
        return '📍'
      case CoursePointType.FirstAid:
        return '🍙'
      case CoursePointType.Left:
        return '⬅'
      case CoursePointType.Right:
        return '➡'
      case CoursePointType.Straight:
        return '⬆'
    }
  }

  type Position = {
    LatitudeDegrees: number
    LongitudeDegrees: number
  }

  type TrainingCenterDatabase = { Folders?: Folders; Courses?: CourseList }
  type Folders = { Courses?: Courses }
  type Courses = { CourseFolder: CourseFolder }
  type CourseFolder = { CourseNameRef?: [NameKeyReference] }
  type NameKeyReference = { Id: string }
  type CourseList = { Course: Course[] }
  type Course = { Name: string; Lap?: Lap[]; Track?: Track[]; CoursePoint?: CoursePoint[] }
  type Lap = {
    TotalTimeSeconds: number
    DistanceMeters: number
    BeginPosition?: Position
    EndPosition?: Position
  }
  type Track = { Trackpoint: TrackPoint[] }
  type CoursePoint = {
    Name: string // TODO: 10文字制限
    Time: Date
    Position: Position
    PointType: CoursePointType
  }
  type TrackPoint = {
    Time: Date
    Position: Position
    AltitudeMeters?: number
    DistanceMeters?: number
  }

  let files: FileList
  let course: any
  let typedCourse: { '?xml': string; TrainingCenterDatabase: TrainingCenterDatabase }
  let distanceKiloMeters: number

  function handleFileInput() {
    const parser = new XMLParser({
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
    files
      .item(0)
      .text()
      .then((text) => {
        course = parser.parse(text)
        typedCourse = parser.parse(text) as {
          '?xml': string
          TrainingCenterDatabase: TrainingCenterDatabase
        }
      })
  }

  function handleAddingCoursePoint() {
    const trackPoint = nearestTrackPoint(distanceKiloMeters * 1000)

    typedCourse.TrainingCenterDatabase.Courses.Course[0].CoursePoint = [
      ...typedCourse.TrainingCenterDatabase.Courses.Course[0].CoursePoint,
      {
        Name: '',
        Time: trackPoint.Time,
        Position: trackPoint.Position,
        PointType: CoursePointType.Generic,
      },
    ].sort((lhs, rhs) => {
      return lhs.Time.getTime() - rhs.Time.getTime()
    })
  }

  function nearestTrackPoint(distanceMeters: number): TrackPoint {
    const minIndexOverDistanceMeters =
      typedCourse.TrainingCenterDatabase.Courses.Course[0].Track[0].Trackpoint.findIndex(
        (trackPoint) => {
          if (trackPoint.DistanceMeters) {
            return trackPoint.DistanceMeters > distanceMeters
          } else {
            return false
          }
        }
      )

    return typedCourse.TrainingCenterDatabase.Courses.Course[0].Track[0].Trackpoint[
      Math.max(0, minIndexOverDistanceMeters - 1)
    ]
  }

  function timeEquivalentTrackPoint(time: Date): TrackPoint | null {
    let minIndexEquivalentTime =
      typedCourse.TrainingCenterDatabase.Courses.Course[0].Track[0].Trackpoint.findIndex(
        (trackPoint) => {
          return trackPoint.Time.getTime() === time.getTime()
        }
      )

    if (minIndexEquivalentTime == -1) {
      return null
    } else {
      return typedCourse.TrainingCenterDatabase.Courses.Course[0].Track[0].Trackpoint[
        Math.max(0, minIndexEquivalentTime - 1)
      ]
    }
  }

  let xmlData: string
  function exportTCX() {
    const builder = new XMLBuilder({
      format: true,
      ignoreAttributes: false,
      tagValueProcessor: (name, value) => {
        if (name == 'Time' && value instanceof Date) {
          return value.toISOString()
        } else {
          return value as string
        }
      },
    })

    xmlData = encodeURIComponent(builder.build(typedCourse) as string)
  }
</script>

<main>
  <form>
    <label>
      tcxファイル
      <input bind:files on:change={handleFileInput} type="file" accept=".tcx" required />
    </label>
  </form>

  <button on:click|preventDefault={exportTCX}>encode</button>

  {#if xmlData}
    <a href={`data:text/xml;charset=utf-8,${xmlData}`} download="out.tcx">Download</a>
  {/if}

  <form on:submit|preventDefault={handleAddingCoursePoint}>
    <label>
      追加する地点 [km]
      <input
        bind:value={distanceKiloMeters}
        type="number"
        placeholder="25.6"
        min="0"
        step="0.1"
        required
      />
    </label>

    <button> 追加する </button>
  </form>

  <table>
    <tbody>
      {#if typedCourse}
        <ul>
          {#each typedCourse.TrainingCenterDatabase.Courses.Course[0].CoursePoint as coursePoint}
            {@const trackPoint = timeEquivalentTrackPoint(coursePoint.Time)}

            <tr>
              <td>
                <select bind:value={coursePoint.PointType}>
                  {#each Object.values(CoursePointType) as pointType}
                    <option value={pointType}>{emoji(pointType)}</option>
                  {/each}
                </select>
              </td>
              <td>
                <input bind:value={coursePoint.Name} type="string" maxlength="10" />
              </td>
              <td>
                {Intl.NumberFormat(undefined, {
                  style: 'unit',
                  unit: 'kilometer',
                  maximumFractionDigits: 1,
                }).format(trackPoint.DistanceMeters / 1000)}
              </td>
            </tr>
          {/each}
        </ul>
      {/if}
    </tbody>
  </table>
</main>

<style>
</style>
