import type { TrackPointT } from '../types/TCX.type'

export function findNearestTrackPoint(
  trackPoints: TrackPointT[],
  distanceMeters: number
): TrackPointT {
  const minIndexOverDistanceMeters = trackPoints.findIndex((trackPoint) => {
    return trackPoint.DistanceMeters > distanceMeters
  })

  if (minIndexOverDistanceMeters == -1) {
    return trackPoints[trackPoints.length - 1]
  } else {
    return trackPoints[Math.max(0, minIndexOverDistanceMeters - 1)]
  }
}

export function findTimeEquivalentTrackPoint(
  trackPoints: TrackPointT[],
  time: Date
): TrackPointT | null {
  let minIndexEquivalentTime = trackPoints.findIndex((trackPoint) => {
    return trackPoint.Time.getTime() === time.getTime()
  })

  if (minIndexEquivalentTime == -1) {
    return null
  } else {
    return trackPoints[Math.max(0, minIndexEquivalentTime - 1)]
  }
}
