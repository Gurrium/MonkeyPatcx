<script lang="ts">
  import { XMLParser, XMLBuilder } from 'fast-xml-parser'
  import CoursePoint from './CoursePoint.svelte'
  import type { TrainingCenterDatabase } from './types/TCX.type'
  import { CoursePointType } from './types/TCX.type'

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

  let files: FileList | null
  let course: any
  let typedCourse: { '?xml': string; TrainingCenterDatabase: TrainingCenterDatabase } | null

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
      ?.item(0)
      ?.text()
      .then((text) => {
        course = parser.parse(text)
        typedCourse = parser.parse(text) as {
          '?xml': string
          TrainingCenterDatabase: TrainingCenterDatabase
        }
      })
  }

  let newCoursePointInput: {
    name: string | null
    type: CoursePointType | null
    distanceKiloMeters: number | null
  } = { name: null, type: null, distanceKiloMeters: null }
  function handleAddingCoursePoint() {
    if (
      !(
        newCoursePointInput.name &&
        newCoursePointInput.type &&
        newCoursePointInput.distanceKiloMeters
      )
    ) {
      return
    }

    const trackPoint = nearestTrackPoint(newCoursePointInput.distanceKiloMeters * 1000)

    if (!trackPoint) {
      return
    }

    if (!typedCourse?.TrainingCenterDatabase.Courses?.Course[0].CoursePoint) {
      return
    }

    typedCourse.TrainingCenterDatabase.Courses.Course[0].CoursePoint = [
      ...typedCourse.TrainingCenterDatabase.Courses.Course[0].CoursePoint,
      {
        Name: newCoursePointInput.name,
        Time: trackPoint.Time,
        Position: trackPoint.Position,
        PointType: newCoursePointInput.type,
      },
    ].sort((lhs, rhs) => {
      return lhs.Time.getTime() - rhs.Time.getTime()
    })

    newCoursePointInput = { name: null, type: null, distanceKiloMeters: null }
  }

  function nearestTrackPoint(distanceMeters: number): TrackPoint | null {
    if (!typedCourse?.TrainingCenterDatabase.Courses?.Course[0].Track) {
      return null
    }

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
    if (!typedCourse?.TrainingCenterDatabase.Courses?.Course[0].Track) {
      return null
    }

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

  let downloadButton: HTMLAnchorElement
  function download() {
    if (!typedCourse?.TrainingCenterDatabase.Folders?.Courses?.CourseFolder.CourseNameRef) {
      return
    }

    const builder = new XMLBuilder({
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

    const xmlData = encodeURIComponent(builder.build(typedCourse) as string)

    downloadButton.href = `data:text/xml;charset=utf-8,${xmlData}`
    downloadButton.download = `${
      typedCourse.TrainingCenterDatabase.Folders.Courses.CourseFolder.CourseNameRef[0].Id
    }-${Date.now()}.tcx`
    downloadButton.click()
  }

  function clear() {
    if (
      confirm(
        '編集内容は復元できません。先にダウンロードすることをおすすめします。\n本当にすべて削除しますか？'
      )
    ) {
      typedCourse = null
    }
  }

  function removeCoursePointAt(index: number, name: string): void {
    if (!typedCourse?.TrainingCenterDatabase?.Courses?.Course[0].CoursePoint) {
      return
    }

    if (confirm(`"${name}"を本当に削除しますか？`)) {
      typedCourse.TrainingCenterDatabase.Courses.Course[0].CoursePoint?.splice(index, 1)
      typedCourse = typedCourse
    }
  }
</script>

<main>
  <div id="file-operations">
    {#if typedCourse}
      <div>
        <button on:click|preventDefault={download}>Download</button>
        <a bind:this={downloadButton} hidden aria-hidden="true" />

        <button on:click|preventDefault={clear}> Clear </button>
      </div>
    {:else}
      <div>
        <form>
          <label>
            tcxファイル
            <input bind:files on:change={handleFileInput} type="file" accept=".tcx" required />
          </label>
        </form>
      </div>
    {/if}
  </div>

  {#if typedCourse?.TrainingCenterDatabase.Courses?.Course[0].CoursePoint}
    <div id="tcx-content">
      <form on:submit|preventDefault={handleAddingCoursePoint}>
        <div>
          <label>
            種別
            <select bind:value={newCoursePointInput.type} required class="course-point-type">
              <option value="" hidden disabled selected />
              {#each Object.values(CoursePointType) as pointType}
                <option value={pointType}>{emoji(pointType)}</option>
              {/each}
            </select>
          </label>
        </div>
        <div>
          <label>
            名前
            <input
              bind:value={newCoursePointInput.name}
              type="text"
              placeholder="スタート"
              maxlength="10"
              required
            />
          </label>
        </div>
        <div>
          <label>
            距離
            <input
              bind:value={newCoursePointInput.distanceKiloMeters}
              type="number"
              placeholder="25.6"
              min="0"
              step="0.1"
              required
            />
            [km]
          </label>
        </div>

        <button id="add-new-point"> 追加する </button>
      </form>

      <table id="course-point-table">
        <tbody>
          {#each typedCourse.TrainingCenterDatabase.Courses.Course[0].CoursePoint as coursePoint, index}
            {@const trackPoint = timeEquivalentTrackPoint(coursePoint.Time)}

            {#if trackPoint?.DistanceMeters}
              <tr class="course-point">
                <td>
                  <select class="course-point-type" bind:value={coursePoint.PointType}>
                    {#each Object.values(CoursePointType) as pointType}
                      <option value={pointType}>{emoji(pointType)}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <input
                    class="course-point-name"
                    bind:value={coursePoint.Name}
                    type="string"
                    maxlength="10"
                  />
                </td>
                <td>
                  {Intl.NumberFormat(undefined, {
                    style: 'unit',
                    unit: 'kilometer',
                    maximumFractionDigits: 1,
                    minimumFractionDigits: 1,
                  }).format(trackPoint.DistanceMeters / 1000)}
                </td>
                <td>
                  <a
                    class="google-map-anchor"
                    href={`https://google.com/maps/place/${coursePoint.Position.LatitudeDegrees},${coursePoint.Position.LongitudeDegrees}`}
                    target="_blank">🗺️</a
                  >
                </td>
                <td>
                  <button
                    on:click|preventDefault={(_) => removeCoursePointAt(index, coursePoint.Name)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</main>

<style>
  button#add-new-point {
    margin-top: 8px;
  }

  div#file-operations + div#tcx-content {
    margin-top: 20px;
  }

  table#course-point-table {
    margin-top: 20px;
  }

  table#course-point-table tr.course-point select.course-point-type {
    border: none;
    border-radius: 2px;
    padding: 0.2em 0.3em;
  }

  table#course-point-table tr.course-point select.course-point-type:hover {
    animation: course-point-type-animation 0.5s 1 normal forwards;
  }

  table#course-point-table tr.course-point select.course-point-type:focus-visible {
    background-color: #dadadaee;
    outline: unset;
  }

  @keyframes course-point-type-animation {
    from {
      background-color: unset;
    }
    to {
      background-color: #dadadaee;
    }
  }

  table#course-point-table tr.course-point input.course-point-name:not(:hover) {
    border: unset;
    padding: 1px 4px;
  }

  table#course-point-table tr.course-point input.course-point-name:hover {
    cursor: text;
  }

  table#course-point-table tr.course-point a.google-map-anchor {
    text-decoration: unset;
  }

  table#course-point-table tr.course-point button {
    background: unset;
    border: unset;
  }

  table#course-point-table tr.course-point button:hover {
    cursor: pointer;
  }
</style>
