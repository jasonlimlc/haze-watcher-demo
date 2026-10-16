/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RegionKey = 'north' | 'south' | 'east' | 'west' | 'central' | 'national';

export interface RegionMetadata {
  key: RegionKey;
  name: string;
  labelLocation: {
    latitude: number;
    longitude: number;
  };
  towns: string[];
}

export type AirQualityBandLevel = 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface AirQualityBand {
  level: AirQualityBandLevel;
  label: string;
  rangeText: string;
  min: number;
  max: number;
  textColor: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  accentHex: string;
  summary: string;
}

export type PM25BandLevel = 'normal' | 'elevated' | 'high' | 'very_high';

export interface PM25Band {
  level: PM25BandLevel;
  label: string;
  bandName: string;
  rangeText: string;
  min: number;
  max: number;
  textColor: string;
  bgColor: string;
  accentHex: string;
  actionAdvice: string;
}

export interface RegionReadings {
  psi24h: number;
  pm25OneHourly: number;
  pm25_24h: number;
  pm10_24h: number;
  o3_8h: number;
  no2_1h: number;
  so2_24h: number;
  co_8h: number;
}

export interface AirQualitySnapshot {
  timestamp: string;
  updateTimestamp: string;
  readings: Record<RegionKey, RegionReadings>;
  wind: {
    direction: string;
    speedKnots: number;
    degrees: number;
  };
}

export interface HourlyHistoricalRecord {
  timestamp: string;
  hourLabel: string;
  readings: Record<RegionKey, { psi: number; pm25: number }>;
}

export interface HealthAdvisoryItem {
  targetGroup: 'general' | 'vulnerable';
  title: string;
  advice: string;
  outdoorStrenuous: string;
  maskRecommendation: string;
}

export interface AlertSettings {
  browserNotificationsEnabled: boolean;
  psiThreshold: number; // e.g. 100 for Unhealthy
  pm25Threshold: number; // e.g. 55 for Elevated
  monitoredRegion: RegionKey | 'all';
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  notifyOnEveryUpdate: boolean;
  lastNotifiedTime?: string;
  lastNotifiedPsi?: number;
}

export interface NotificationLogItem {
  id: string;
  timestamp: string;
  region: RegionKey;
  regionName: string;
  psi: number;
  pm25: number;
  band: AirQualityBandLevel;
  title: string;
  body: string;
  isSimulated?: boolean;
}

export const REGIONS: Record<RegionKey, RegionMetadata> = {
  national: {
    key: 'national',
    name: 'Island-wide (National)',
    labelLocation: { latitude: 1.3521, longitude: 103.8198 },
    towns: ['All 5 Singapore Meteorological Zones']
  },
  central: {
    key: 'central',
    name: 'Central Singapore',
    labelLocation: { latitude: 1.35735, longitude: 103.82 },
    towns: ['Bishan', 'Toa Payoh', 'Ang Mo Kio', 'Novena', 'Marina South']
  },
  north: {
    key: 'north',
    name: 'North Region',
    labelLocation: { latitude: 1.41803, longitude: 103.82 },
    towns: ['Woodlands', 'Yishun', 'Sembawang', 'Mandai', 'Simpang']
  },
  south: {
    key: 'south',
    name: 'South Region',
    labelLocation: { latitude: 1.29587, longitude: 103.82 },
    towns: ['Bukit Merah', 'Harbourfront', 'Sentosa', 'Tanjong Pagar', 'Telok Blangah']
  },
  east: {
    key: 'east',
    name: 'East Region',
    labelLocation: { latitude: 1.35735, longitude: 103.94 },
    towns: ['Tampines', 'Bedok', 'Pasir Ris', 'Changi', 'Paya Lebar']
  },
  west: {
    key: 'west',
    name: 'West Region',
    labelLocation: { latitude: 1.35735, longitude: 103.7 },
    towns: ['Jurong West', 'Jurong East', 'Clementi', 'Tuas', 'Bukit Batok', 'Boon Lay']
  }
};
