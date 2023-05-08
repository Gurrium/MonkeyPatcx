<script lang="ts">
  import { CoursePointType } from '../types/TCX.type'

  export let coursePointType: CoursePointType

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
</script>

{emoji(coursePointType)}
