<script lang="ts">
  import { isLeft } from 'fp-ts/Either'
  import type { CoursePointTypeT } from '../types/TCX.type'
  import { CoursePointType, coursePointTypes } from '../types/TCX.type'

  function decode(u: string): CoursePointTypeT | null {
    const decoded = CoursePointType.decode(u)

    if (isLeft(decoded)) {
      return null
    }

    return decoded.right
  }

  function emoji(
    type: CoursePointTypeT | null
  ):
    | '📍'
    | '🏔'
    | '⾕'
    | '🧃'
    | '🍱'
    | '⚠️'
    | '⬅'
    | '➡'
    | '⬆'
    | '🍙'
    | '4️⃣'
    | '🥉'
    | '🥈'
    | '🥇'
    | '🏆'
    | '🚴'
    | null {
    if (type === null) {
      return null
    }
    switch (type) {
      case 'Generic':
        return '📍'
      case 'Summit':
        return '🏔'
      case 'Valley':
        return '⾕'
      case 'Water':
        return '🧃'
      case 'Food':
        return '🍱'
      case 'Danger':
        return '⚠️'
      case 'Left':
        return '⬅'
      case 'Right':
        return '➡'
      case 'Straight':
        return '⬆'
      case 'First Aid':
        return '🍙'
      case '4th Category':
        return '4️⃣'
      case '3rd Category':
        return '🥉'
      case '2nd Category':
        return '🥈'
      case '1st Category':
        return '🥇'
      case 'Hors Category':
        return '🏆'
      case 'Sprint':
        return '🚴'
    }
  }
</script>

{#each coursePointTypes as pointType}
  {@const type = decode(pointType)}
  {#if type}
    <option value={type}>{emoji(type)}</option>
  {/if}
{/each}
