/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AirQualitySnapshot, HourlyHistoricalRecord, RegionKey, RegionReadings } from '../types/psi';

const SERVERLESS_PSI_ENDPOINT = '/api/psi';
const FALLBACK_DIRECT_V2_URL = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

interface DataGovV2Payload {
  code?: number;
  data?: {
    regionMetadata?: Array<{ name: string; labelLocation: { latitude: number; longitude: number } }>;
    items?: Array<{
      date?: string;
      updatedTimestamp?: string;
      update_timestamp?: string;
      timestamp?: string;
      readings: Record<string, Record<string, number>>;
    }>;
  };
  items?: Array<{
    timestamp?: string;
    updatedTimestamp?: string;
    update_timestamp?: string;
    readings: Record<string, Record<string, number>>;
  }>;
}

export type SimulationScenario = 'live' | 'moderate' | 'unhealthy_spike' | 'severe_crisis' | 'pristine';

export async function fetchLiveAirQuality(scenario: SimulationScenario = 'live'): Promise<{
  snapshot: AirQualitySnapshot;
  isSimulated: boolean;
  history: HourlyHistoricalRecord[];
}> {
  if (scenario !== 'live') {
    return {
      snapshot: generateScenarioSnapshot(scenario),
      isSimulated: true,
      history: generate24HourHistory(scenario)
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    // Attempt to fetch from local serverless endpoint /api/psi, fallback to direct v2 endpoint
    let res = await fetch(SERVERLESS_PSI_ENDPOINT, { signal: controller.signal }).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(FALLBACK_DIRECT_V2_URL, { signal: controller.signal });
    }

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`PSI endpoint responded with status ${res.status}`);
    }

    const payload: DataGovV2Payload = await res.json();

    // Extract item from v2 format (payload.data.items) or v1 format (payload.items)
    const latestItem = payload.data?.items?.[payload.data.items.length - 1] || payload.items?.[payload.items.length - 1];
    if (!latestItem || !latestItem.readings) {
      throw new Error('Invalid items payload in PSI API');
    }

    const readings = latestItem.readings;
    const regionKeys: RegionKey[] = ['north', 'south', 'east', 'west', 'central'];
    const parsedReadings: Partial<Record<RegionKey, RegionReadings>> = {};

    let maxPsi = 0;
    let maxPm25 = 0;
    let maxPm10 = 0;
    let maxO3 = 0;
    let maxNo2 = 0;
    let maxSo2 = 0;
    let maxCo = 0;

    for (const key of regionKeys) {
      const psi24 = readings.psi_twenty_four_hourly?.[key] ?? 45;
      const pm25_24 = readings.pm25_twenty_four_hourly?.[key] ?? Math.round(psi24 * 0.75);
      const pm25_1h = readings.pm25_one_hourly?.[key] ?? Math.round(pm25_24 * 1.05);
      const pm10_24 = readings.pm10_twenty_four_hourly?.[key] ?? 28;
      const o3 = readings.o3_eight_hour_max?.[key] ?? 20;
      const no2 = readings.no2_one_hour_max?.[key] ?? 22;
      const so2 = readings.so2_twenty_four_hourly?.[key] ?? 6;
      const co = readings.co_eight_hour_max?.[key] ?? 1;

      if (psi24 > maxPsi) maxPsi = psi24;
      if (pm25_1h > maxPm25) maxPm25 = pm25_1h;
      if (pm10_24 > maxPm10) maxPm10 = pm10_24;
      if (o3 > maxO3) maxO3 = o3;
      if (no2 > maxNo2) maxNo2 = no2;
      if (so2 > maxSo2) maxSo2 = so2;
      if (co > maxCo) maxCo = co;

      parsedReadings[key] = {
        psi24h: psi24,
        pm25OneHourly: pm25_1h,
        pm25_24h: pm25_24,
        pm10_24h: pm10_24,
        o3_8h: o3,
        no2_1h: no2,
        so2_24h: so2,
        co_8h: co
      };
    }

    // Set island-wide national reading as maximum across regions (or explicit national reading if provided)
    parsedReadings.national = {
      psi24h: readings.psi_twenty_four_hourly?.national ?? maxPsi,
      pm25OneHourly: readings.pm25_one_hourly?.national ?? maxPm25,
      pm25_24h: readings.pm25_twenty_four_hourly?.national ?? maxPm25,
      pm10_24h: readings.pm10_twenty_four_hourly?.national ?? maxPm10,
      o3_8h: readings.o3_eight_hour_max?.national ?? maxO3,
      no2_1h: readings.no2_one_hour_max?.national ?? maxNo2,
      so2_24h: readings.so2_twenty_four_hourly?.national ?? maxSo2,
      co_8h: readings.co_eight_hour_max?.national ?? maxCo
    };

    const snapshot: AirQualitySnapshot = {
      timestamp: latestItem.timestamp || latestItem.updatedTimestamp || new Date().toISOString(),
      updateTimestamp: latestItem.updatedTimestamp || latestItem.timestamp || new Date().toISOString(),
      readings: parsedReadings as Record<RegionKey, RegionReadings>,
      wind: {
        direction: 'SSW',
        speedKnots: 11,
        degrees: 205
      }
    };

    return {
      snapshot,
      isSimulated: false,
      history: generate24HourHistory('live', snapshot)
    };
  } catch (error) {
    console.warn('Live API fetch failed, falling back to simulated baseline:', error);
    return {
      snapshot: generateScenarioSnapshot('moderate'),
      isSimulated: true,
      history: generate24HourHistory('moderate')
    };
  }
}

function generateScenarioSnapshot(scenario: SimulationScenario): AirQualitySnapshot {
  const now = new Date().toISOString();

  let basePsi = 48;
  let pm25Mult = 0.35;
  let windDir = 'SSW';
  let windDeg = 210;
  let windSpeed = 12;

  switch (scenario) {
    case 'pristine':
      basePsi = 24;
      pm25Mult = 0.28;
      windDir = 'NE';
      windDeg = 45;
      windSpeed = 15;
      break;
    case 'moderate':
      basePsi = 68;
      pm25Mult = 0.42;
      windDir = 'SW';
      windDeg = 225;
      windSpeed = 10;
      break;
    case 'unhealthy_spike':
      basePsi = 138;
      pm25Mult = 0.68;
      windDir = 'SSW';
      windDeg = 200;
      windSpeed = 16;
      break;
    case 'severe_crisis':
      basePsi = 245;
      pm25Mult = 0.85;
      windDir = 'SW';
      windDeg = 215;
      windSpeed = 22;
      break;
    case 'live':
    default:
      basePsi = 52;
      pm25Mult = 0.38;
      break;
  }

  // Realistic regional variations (West is often highest during SW monsoon haze plumes)
  const westPsi = Math.round(basePsi * (scenario === 'unhealthy_spike' ? 1.25 : 1.15));
  const southPsi = Math.round(basePsi * 1.08);
  const centralPsi = Math.round(basePsi * 0.98);
  const northPsi = Math.round(basePsi * 0.92);
  const eastPsi = Math.round(basePsi * 0.88);
  const nationalPsi = Math.max(westPsi, southPsi, centralPsi, northPsi, eastPsi);

  const makeReading = (psi: number): RegionReadings => ({
    psi24h: psi,
    pm25OneHourly: Math.round(psi * pm25Mult),
    pm25_24h: Math.round(psi * pm25Mult * 0.9),
    pm10_24h: Math.round(psi * 0.65),
    o3_8h: Math.round(20 + Math.random() * 15),
    no2_1h: Math.round(22 + Math.random() * 12),
    so2_24h: Math.round(5 + Math.random() * 4),
    co_8h: Number((0.5 + (psi / 200)).toFixed(1))
  });

  return {
    timestamp: now,
    updateTimestamp: now,
    readings: {
      west: makeReading(westPsi),
      south: makeReading(southPsi),
      central: makeReading(centralPsi),
      north: makeReading(northPsi),
      east: makeReading(eastPsi),
      national: makeReading(nationalPsi)
    },
    wind: {
      direction: windDir,
      speedKnots: windSpeed,
      degrees: windDeg
    }
  };
}

export function generate24HourHistory(
  scenario: SimulationScenario,
  currentSnapshot?: AirQualitySnapshot
): HourlyHistoricalRecord[] {
  const records: HourlyHistoricalRecord[] = [];
  const now = new Date();

  const currentNationalPsi = currentSnapshot?.readings.national.psi24h ?? (
    scenario === 'severe_crisis' ? 245 :
    scenario === 'unhealthy_spike' ? 138 :
    scenario === 'moderate' ? 68 :
    scenario === 'pristine' ? 24 : 52
  );

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const hour = time.getHours();
    const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

    // Realistic diurnal curve: morning traffic rise (08:00 - 10:00), midday sunshine peak, evening calm
    const diurnalFactor = 0.85 + 0.3 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);
    const noise = 0.95 + (Math.sin(i * 1.7) * 0.08);
    const hourPsi = Math.max(15, Math.round(currentNationalPsi * diurnalFactor * noise));

    records.push({
      timestamp: time.toISOString(),
      hourLabel,
      readings: {
        national: { psi: hourPsi, pm25: Math.round(hourPsi * 0.45) },
        west: { psi: Math.round(hourPsi * 1.12), pm25: Math.round(hourPsi * 0.52) },
        south: { psi: Math.round(hourPsi * 1.05), pm25: Math.round(hourPsi * 0.47) },
        central: { psi: Math.round(hourPsi * 0.98), pm25: Math.round(hourPsi * 0.44) },
        north: { psi: Math.round(hourPsi * 0.92), pm25: Math.round(hourPsi * 0.41) },
        east: { psi: Math.round(hourPsi * 0.88), pm25: Math.round(hourPsi * 0.38) }
      }
    });
  }

  return records;
}
