/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegionKey, REGIONS } from '../types/psi';

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestSingaporeRegion(lat: number, lon: number): {
  region: RegionKey;
  distanceKm: number;
} {
  const regions: (Exclude<RegionKey, 'national'>)[] = ['north', 'south', 'east', 'west', 'central'];
  let minDistance = Infinity;
  let closestRegion: RegionKey = 'central';

  for (const rKey of regions) {
    const loc = REGIONS[rKey].labelLocation;
    const dist = calculateDistanceKm(lat, lon, loc.latitude, loc.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closestRegion = rKey;
    }
  }

  return {
    region: closestRegion,
    distanceKm: Number(minDistance.toFixed(1))
  };
}
