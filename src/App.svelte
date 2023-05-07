<script lang="ts">
  import { writable } from 'svelte/store'
  import { XMLParser, XMLBuilder } from 'fast-xml-parser'
  import { findTimeEquivalentTrackPoint, findNearestTrackPoint } from './lib/TrackPoint+find'
  import { CoursePointType } from './types/TCX.type'
  import type { TCX, Course } from './types/TCX.type'
  import CoursePoint from './components/CoursePoint.svelte'
  import Emoji from './components/Emoji.svelte'

  const tcx = writable<TCX | null>(null)
  let course: Course | null

  tcx.subscribe((value) => {
    if (!value?.TrainingCenterDatabase.Courses || !value.TrainingCenterDatabase.Courses.Course[0]) {
      course = null
    } else {
      course = value.TrainingCenterDatabase.Courses.Course[0]
    }
  })

  let files: FileList | null
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
        tcx.set(parser.parse(text) as TCX)
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

    if (!course || !course.Track || !course.Track[0]) {
      return
    }

    const trackPoint = findNearestTrackPoint(
      course.Track[0].Trackpoint,
      newCoursePointInput.distanceKiloMeters * 1000
    )

    if (!course.CoursePoint) {
      return
    }

    course.CoursePoint = [
      ...course.CoursePoint,
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

  let downloadButton: HTMLAnchorElement
  function download() {
    if (!$tcx?.TrainingCenterDatabase.Folders?.Courses?.CourseFolder.CourseNameRef) {
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

    const xmlData = encodeURIComponent(builder.build($tcx) as string)

    downloadButton.href = `data:text/xml;charset=utf-8,${xmlData}`
    downloadButton.download = `${
      $tcx.TrainingCenterDatabase.Folders.Courses.CourseFolder.CourseNameRef[0].Id
    }-${Date.now()}.tcx`
    downloadButton.click()
  }

  function clear() {
    if (
      confirm(
        '編集内容は復元できません。先にダウンロードすることをおすすめします。\n本当にすべて削除しますか？'
      )
    ) {
      tcx.set(null)
    }
  }

  function removeCoursePointAt(index: number, name: string): void {
    if (!course?.CoursePoint) {
      return
    }

    if (confirm(`"${name}"を本当に削除しますか？`)) {
      tcx.update((tcx) => {
        course?.CoursePoint?.splice(index, 1)

        return tcx
      })
    }
  }
</script>

<main>
  <div id="file-operations">
    {#if $tcx}
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

  {#if course?.CoursePoint}
    <div id="tcx-content">
      <form on:submit|preventDefault={handleAddingCoursePoint}>
        <div>
          <label>
            種別
            <select bind:value={newCoursePointInput.type} required class="course-point-type">
              <option value="" hidden disabled selected />
              {#each Object.values(CoursePointType) as pointType}
                <option value={pointType}><Emoji coursePointType={pointType} /></option>
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
          {#if course?.Track}
            {#each course?.CoursePoint as coursePoint, index}
              {@const trackPoint = findTimeEquivalentTrackPoint(
                course?.Track[0].Trackpoint,
                coursePoint.Time
              )}

              {#if trackPoint?.DistanceMeters}
                <CoursePoint
                  {coursePoint}
                  {trackPoint}
                  on:remove={() => removeCoursePointAt(index, coursePoint.Name)}
                />
              {/if}
            {/each}
          {/if}
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

  @keyframes course-point-type-animation {
    from {
      background-color: unset;
    }
    to {
      background-color: #dadadaee;
    }
  }
</style>
