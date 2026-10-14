export type Coordinates = {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_M = 6_371_000
const toRadians = (deg: number) => (deg * Math.PI) / 180

/** Straight-line (great-circle) distance; road distance is usually longer. */
export function distanceInMeters(a: Coordinates, b: Coordinates) {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLng = toRadians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export function hasCoordinates<T extends Partial<Coordinates>>(value: T): value is T & Coordinates {
  return typeof value.latitude === 'number' && typeof value.longitude === 'number'
}

const toQuery = (place: string | Coordinates) =>
  encodeURIComponent(typeof place === 'string' ? place : `${place.latitude},${place.longitude}`)

/** Universal Maps URLs: they open the Google Maps app on phones and tablets, the website on desktop. */
export const googleMaps = {
  directions: (destination: string | Coordinates) =>
    `https://www.google.com/maps/dir/?api=1&destination=${toQuery(destination)}`,
  place: (place: string | Coordinates) => `https://www.google.com/maps/search/?api=1&query=${toQuery(place)}`,
}
