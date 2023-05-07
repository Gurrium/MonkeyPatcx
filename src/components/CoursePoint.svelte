<script lang="ts">
  import type { CoursePoint, TrackPoint } from '../types/TCX.type'
  import { CoursePointType } from '../types/TCX.type'
  import Emoji from './Emoji.svelte'
  import { createEventDispatcher } from 'svelte'

  export let coursePoint: CoursePoint
  export let trackPoint: TrackPoint

  const dispatch = createEventDispatcher()
</script>

<tr class="course-point">
  <td>
    <select class="course-point-type" bind:value={coursePoint.PointType}>
      {#each Object.values(CoursePointType) as pointType}
        <option value={pointType}><Emoji coursePointType={pointType} /></option>
      {/each}
    </select>
  </td>
  <td>
    <input class="course-point-name" bind:value={coursePoint.Name} type="string" maxlength="10" />
  </td>
  <td>
    {#if trackPoint.DistanceMeters}
      {Intl.NumberFormat(undefined, {
        style: 'unit',
        unit: 'kilometer',
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }).format(trackPoint.DistanceMeters / 1000)}
    {/if}
  </td>
  <td>
    <a
      class="google-map-anchor"
      href={`https://google.com/maps/place/${coursePoint.Position.LatitudeDegrees},${coursePoint.Position.LongitudeDegrees}`}
      target="_blank">🗺️</a
    >
  </td>
  <td>
    <button on:click|preventDefault={() => dispatch('remove')}> 🗑️ </button>
  </td>
</tr>

<style>
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
