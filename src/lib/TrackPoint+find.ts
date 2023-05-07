import type { TrackPoint } from '../types/TCX.type'

export function findNearestTrackPoint(
  trackPoints: TrackPoint[],
  distanceMeters: number
): TrackPoint {
  const minIndexOverDistanceMeters = trackPoints.findIndex((trackPoint) => {
    if (trackPoint.DistanceMeters) {
      return trackPoint.DistanceMeters > distanceMeters
    } else {
      return false
    }
  })

  // FIXME: 見つからなかったら最後の要素を返す
  return trackPoints[Math.max(0, minIndexOverDistanceMeters - 1)]
}

export function findTimeEquivalentTrackPoint(
  trackPoints: TrackPoint[],
  time: Date
): TrackPoint | null {
  let minIndexEquivalentTime = trackPoints.findIndex((trackPoint) => {
    return trackPoint.Time.getTime() === time.getTime()
  })

  if (minIndexEquivalentTime == -1) {
    return null
  } else {
    return trackPoints[Math.max(0, minIndexEquivalentTime - 1)]
  }
}