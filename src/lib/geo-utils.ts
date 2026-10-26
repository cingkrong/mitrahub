import * as turf from '@turf/turf';

/**
 * Radius of the Earth in meters (WGS84 mean radius)
 */
const EARTH_RADIUS_METERS = 6371008.8;

/**
 * Calculates geodesic distance between two points in meters using the Great Circle / Haversine formula.
 * Yields identical results to PostgreSQL PostGIS `ST_Distance(geom1::geography, geom2::geography)`.
 */
export function calculateGeodesicDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c * 10) / 10;
}

/**
 * Generates a true geodesic circle GeoJSON polygon around a coordinate with given radius in kilometers.
 * Uses Turf.js to accurately project kilometers over the curved Earth surface (NOT flat/CSS pixel circles).
 */
export function generateGeodesicCircle(
  centerLng: number,
  centerLat: number,
  radiusKm: number,
  steps = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const centerPoint = turf.point([centerLng, centerLat]);
  const circleFeature = turf.circle(centerPoint, radiusKm, {
    steps,
    units: 'kilometers',
  });
  return circleFeature;
}

/**
 * Generates official Google Maps search query link without needing an API key.
 * https://www.google.com/maps/search/?api=1&query=LAT,LNG
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  const encodedLat = encodeURIComponent(lat.toFixed(6));
  const encodedLng = encodeURIComponent(lng.toFixed(6));
  return `https://www.google.com/maps/search/?api=1&query=${encodedLat},${encodedLng}`;
}

/**
 * Formats distance in meters into human readable Indonesian string (km or m)
 */
export function formatDistanceIndonesian(distanceMeters: number | null | undefined): string {
  if (distanceMeters === null || distanceMeters === undefined) return '-';
  if (distanceMeters >= 1000) {
    const km = distanceMeters / 1000;
    return `${km.toFixed(2)} km`;
  }
  return `${Math.round(distanceMeters)} m`;
}
