<script lang="ts">
  import { isLeft } from 'fp-ts/Either'
  import CoursePointRow from './components/CoursePointRow.svelte'
  import CoursePointTypeOptions from './components/CoursePointTypeOptions.svelte'
  import { findNearestTrackPoint, findTimeEquivalentTrackPoint } from './lib/TrackPoint+find'
  import { builder } from './lib/builder'
  import { parser } from './lib/parser'
  import type { CoursePointT, CoursePointTypeT, TCXT } from './types/TCX.type'
  import { TCX } from './types/TCX.type'

  let tcx: TCXT | null = null
  let didFailToParse = false

  let fileInput: HTMLInputElement | null = null
  let files: FileList | null
  $: if (files != null) {
    parse(files[0])
  }
  function parse(file: File) {
    file.text().then((text) => {
      const parsed = parser.parse(text)
      const decoded = TCX.decode(parsed)

      if (
        isLeft(decoded) ||
        decoded.right.TrainingCenterDatabase.Courses.Course.length > 1 ||
        decoded.right.TrainingCenterDatabase.Courses.Course[0].Track.length > 1
      ) {
        didFailToParse = true
        fileInput!.value = ''
        alert('tcxファイルの解析に失敗しました。')
        return
      }

      didFailToParse = false
      didDownload = false

      tcx = decoded.right
    })
  }

  let newCoursePointInput: {
    name: string | null
    type: CoursePointTypeT | null
    distanceKiloMeters: number | null
  } = { name: null, type: null, distanceKiloMeters: null }
  function handleAddingCoursePoint() {
    if (
      newCoursePointInput.name == null ||
      newCoursePointInput.type == null ||
      newCoursePointInput.distanceKiloMeters == null
    ) {
      return
    }

    if (tcx?.TrainingCenterDatabase.Courses.Course[0] == null) {
      return
    }

    const course = tcx.TrainingCenterDatabase.Courses.Course[0]

    const trackPoint = findNearestTrackPoint(
      course.Track[0].Trackpoint,
      newCoursePointInput.distanceKiloMeters * 1000
    )

    if (course.CoursePoint == null) {
      return
    }

    const newCoursePoint: CoursePointT = {
      Name: newCoursePointInput.name,
      Time: trackPoint.Time,
      Position: trackPoint.Position,
      PointType: newCoursePointInput.type,
    }

    course.CoursePoint = [...course.CoursePoint, newCoursePoint].sort((lhs, rhs) => {
      return lhs.Time.getTime() - rhs.Time.getTime()
    })

    tcx.TrainingCenterDatabase.Courses.Course[0] = course

    newCoursePointInput = { name: null, type: null, distanceKiloMeters: null }
  }

  let didDownload = false
  let downloadButton: HTMLAnchorElement
  function download() {
    if (tcx?.TrainingCenterDatabase.Folders.Courses.CourseFolder.CourseNameRef == null) {
      return
    }

    const xmlData = encodeURIComponent(builder.build(tcx) as string)

    downloadButton.href = `data:text/xml;charset=utf-8,${xmlData}`
    downloadButton.download = `${
      tcx.TrainingCenterDatabase.Folders.Courses.CourseFolder.CourseNameRef[0].Id
    }-${Date.now()}.tcx`
    downloadButton.click()
    didDownload = true
  }

  function clear() {
    if (
      confirm(
        '編集内容は復元できません。先にダウンロードすることをおすすめします。\n本当にすべて削除しますか？'
      )
    ) {
      tcx = null
      didDownload = false
    }
  }

  function removeCoursePointAt(index: number, name: string): void {
    if (tcx?.TrainingCenterDatabase.Courses.Course[0] == null) {
      return
    }

    const course = tcx.TrainingCenterDatabase.Courses.Course[0]

    if (course.CoursePoint == null) {
      return
    }

    if (confirm(`"${name}"を本当に削除しますか？`)) {
      course.CoursePoint.splice(index, 1)
      tcx.TrainingCenterDatabase.Courses.Course[0] = course
    }
  }
</script>

<svelte:window
  on:beforeunload={(event) => {
    event.preventDefault()

    return (event.returnValue = '')
  }}
/>

<main>
  <div id="file-operations">
    {#if tcx != null}
      <div>
        <!-- TODO: 日本語にする -->
        <button on:click|preventDefault={download}>Download</button>
        <a bind:this={downloadButton} hidden aria-hidden="true" />

        <button on:click|preventDefault={clear}> Clear </button>
      </div>
    {:else}
      <label>
        tcxファイル
        <input bind:this={fileInput} bind:files type="file" accept=".tcx" />
      </label>
    {/if}
  </div>

  {#if didFailToParse}
    <div id="bug-report-form">
      <a href="https://forms.gle/zHJd6sMSskHa8UgU8" target="_blank">不具合報告フォーム</a>
    </div>
  {/if}

  {#if tcx?.TrainingCenterDatabase.Courses.Course[0].CoursePoint != null}
    <div id="tcx-content">
      <form on:submit|preventDefault={handleAddingCoursePoint}>
        <div>
          <label>
            種別
            <select bind:value={newCoursePointInput.type} required>
              <CoursePointTypeOptions />
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
          {#if tcx?.TrainingCenterDatabase.Courses.Course[0].Track != null}
            {#each tcx.TrainingCenterDatabase.Courses.Course[0].CoursePoint as coursePoint, index}
              {@const trackPoint = findTimeEquivalentTrackPoint(
                tcx.TrainingCenterDatabase.Courses.Course[0].Track[0].Trackpoint,
                coursePoint.Time
              )}

              {#if trackPoint?.DistanceMeters != null}
                <CoursePointRow
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

  {#if didDownload}
    <div id="wish-list">
      <a href="https://www.amazon.jp/hz/wishlist/ls/WUEQ18VE6LAE?ref_=wl_share">欲しい物リスト</a>
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

  div#bug-report-form {
    margin-top: 12px;
  }

  div#wish-list {
    margin-top: 30px;
  }

  div#wish-list a {
    text-decoration: none;
    color: #dddddd;
  }
</style>
