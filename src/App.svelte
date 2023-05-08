<script lang="ts">
  import { parser } from './lib/parser'
  import { builder } from './lib/builder'
  import { findTimeEquivalentTrackPoint, findNearestTrackPoint } from './lib/TrackPoint+find'
  import { CoursePointType } from './types/TCX.type'
  import type { TCX, Course } from './types/TCX.type'
  import CoursePoint from './components/CoursePoint.svelte'
  import Emoji from './components/Emoji.svelte'

  let tcx: TCX | null = null
  let course: Course | null

  $: if (!tcx?.TrainingCenterDatabase.Courses || !tcx.TrainingCenterDatabase.Courses.Course[0]) {
    course = null
  } else {
    course = tcx.TrainingCenterDatabase.Courses.Course[0]
  }

  let files: FileList | null
  $: if (files) {
    parse(files[0])
  }
  function parse(file: File) {
    file.text().then((text) => {
      tcx = parser.parse(text) as TCX
      console.log('parsed')
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
        newCoursePointInput.distanceKiloMeters !== null
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
    if (!tcx?.TrainingCenterDatabase.Folders?.Courses?.CourseFolder.CourseNameRef) {
      return
    }

    const xmlData = encodeURIComponent(builder.build(tcx) as string)

    downloadButton.href = `data:text/xml;charset=utf-8,${xmlData}`
    downloadButton.download = `${
      tcx.TrainingCenterDatabase.Folders.Courses.CourseFolder.CourseNameRef[0].Id
    }-${Date.now()}.tcx`
    downloadButton.click()
  }

  function clear() {
    if (
      confirm(
        '編集内容は復元できません。先にダウンロードすることをおすすめします。\n本当にすべて削除しますか？'
      )
    ) {
      tcx = null
    }
  }

  function removeCoursePointAt(index: number, name: string): void {
    if (!(course?.CoursePoint && tcx?.TrainingCenterDatabase.Courses?.Course)) {
      return
    }

    if (confirm(`"${name}"を本当に削除しますか？`)) {
      course?.CoursePoint?.splice(index, 1)
      tcx.TrainingCenterDatabase.Courses.Course[0] = course
    }
  }
</script>

<main>
  <div id="file-operations">
    {#if tcx}
      <div>
        <button on:click|preventDefault={download}>Download</button>
        <a bind:this={downloadButton} hidden aria-hidden="true" />

        <button on:click|preventDefault={clear}> Clear </button>
      </div>
    {:else}
      <label>
        tcxファイル
        <input bind:files type="file" accept=".tcx" />
      </label>
    {/if}
  </div>

  {#if course?.CoursePoint}
    <div id="tcx-content">
      <form on:submit|preventDefault={handleAddingCoursePoint}>
        <div>
          <label>
            種別
            <select bind:value={newCoursePointInput.type} required>
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
