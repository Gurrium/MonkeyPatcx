<script lang="ts">
  type TrackPoint = {
    time: Date
    position: Position
    altitudeMeters?: number
    distanceMeters?: number
  }

  type CoursePoint = {
    name: string // TODO: 10文字制限
    time: Date
    position: Position
    altitudeMeters?: number
    pointType: CoursePointType
  }

  enum CoursePointType {
    Generic = 'Generic',
    FirstAid = 'First Aid',
    // TODO: 他のも追加する
  }

  type Position = {
    latitudeDegrees: number
    longitudeDegrees: number
  }

  let files: FileList
  let fileName: string
  let distanceMeters: number
  let points: { coursePoint: CoursePoint; trackPoint: TrackPoint }[] = []

  function handleFileInput() {
    fileName = files.item(0).name
  }

  function handleAddingCoursePoint() {
    const trackPoint = nearestTrackPoint(distanceMeters)

    points = [
      ...points,
      {
        coursePoint: {
          name: '',
          time: trackPoint.time,
          position: trackPoint.position,
          altitudeMeters: trackPoint.altitudeMeters,
          pointType: CoursePointType.Generic,
        },
        trackPoint: trackPoint,
      },
    ]
  }

  function nearestTrackPoint(distanceMeters: number): TrackPoint {
    return {
      time: new Date(),
      position: {
        latitudeDegrees: 0,
        longitudeDegrees: 0,
      },
      altitudeMeters: 0,
      distanceMeters: 0,
    }
  }
</script>

<main>
  <form>
    <label>
      tcxファイル
      <input bind:files on:change={handleFileInput} type="file" accept=".tcx" required />
    </label>
  </form>

  {#if fileName}
    <div>
      {fileName}
    </div>
  {/if}

  <form on:submit|preventDefault={handleAddingCoursePoint}>
    <label>
      追加する地点 [km]
      <input
        bind:value={distanceMeters}
        type="number"
        placeholder="25.6"
        min="0"
        step="0.1"
        required
      />
    </label>

    <button> 追加する </button>
  </form>

  <div>
    {#each points as { coursePoint, trackPoint }}
      <div>
        <div>
          {JSON.stringify(coursePoint)}
          <form>
            <label>
              名前
              <input bind:value={coursePoint.name} type="string" maxlength="10" />
            </label>

            <label>
              ポイント種別
              <select bind:value={coursePoint.pointType}>
                {#each Object.values(CoursePointType) as pointType}
                  <option value={pointType}>{pointType}</option>
                {/each}
              </select>
            </label>
          </form>
        </div>
        <div>
          {JSON.stringify(trackPoint)}
        </div>
      </div>
    {/each}
  </div>
</main>

<style>
</style>
