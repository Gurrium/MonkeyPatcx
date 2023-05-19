<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { CoursePointT, TrackPointT } from '../types/TCX.type'
  import CoursePointTypeOptions from './CoursePointTypeOptions.svelte'

  export let coursePoint: CoursePointT
  export let trackPoint: TrackPointT

  const dispatch = createEventDispatcher()
</script>

<tr id="course-point">
  <td>
    <select id="course-point-type" bind:value={coursePoint.PointType}>
      <CoursePointTypeOptions />
    </select>
  </td>
  <td>
    <input id="course-point-name" bind:value={coursePoint.Name} type="string" maxlength="10" />
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
      id="google-map-anchor"
      href={`https://google.com/maps/place/${coursePoint.Position.LatitudeDegrees},${coursePoint.Position.LongitudeDegrees}`}
      target="_blank">🗺️</a
    >
  </td>
  <td>
    <button on:click|preventDefault={() => dispatch('remove')}> 🗑️ </button>
  </td>
</tr>

<style>
  tr#course-point select#course-point-type:not(:hover) {
    border: unset;
    padding: 1px;
  }

  tr#course-point input#course-point-name:not(:hover) {
    border: unset;
    padding: 1px 4px;
  }

  tr#course-point input#course-point-name:hover {
    cursor: text;
  }

  tr#course-point a#google-map-anchor {
    text-decoration: unset;
  }

  tr#course-point button {
    font-size: 0.2em;
    margin-left: 12px;
    padding: 1px 3px;
  }
</style>
