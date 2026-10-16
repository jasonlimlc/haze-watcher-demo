/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AirQualitySnapshot, HourlyHistoricalRecord, RegionKey, RegionReadings } from '../types/psi';

const PSI_API_URL = 'https://api.data.gov.sg/v1/environment/psi';
const PM25_API_URL = 'https://api.data.gov.sg/v1/environment/pm25';

interface DataGovPsiItem {
  timestamp: string;
  update_timestamp: string;
  readings: {
    psi_twenty_four_hourly?: Record<string, number>;
    pm25_twenty_four_hourly?: Record<string, number>;
    pm25_sub_index?: Record<string, number>;
    pm10_twenty_four_hourly?: Record<string, number>;
    pm10_sub_index?: Record<string, number>;
    o3_eight_hour_max?: Record<string, number>;
    o3_sub_index?: Record<string, number>;
    no2_one_hour_max?: Record<string, number>;
    so2_twenty_four_hourly?: Record<string, number>;
    so2_sub_index?: Record<string, number>;
    co_eight_hour_max?: Record<string, number>;
    co_sub_index?: Record<string, number>;
  };
}

interface DataGovPm25Item {
  timestamp: string;
  update_timestamp: string;
  readings: {
    pm25_one_hourly?: Record<string, number>;
  };
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
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const [psiRes, pm25Res] = await Promise.all([
      fetch(PSI_API_URL, { signal: controller.signal }),
      fetch(PM25_API_URL, { signal: controller.signal }).catch(() => null)
    ]);

    clearTimeout(timeoutId);

    if (!psiRes.ok) {
      throw new Error(`Data.gov.sg PSI responded with status ${psiRes.status}`);
    }

    const psiData = await psiRes.json();
    let pm25OneHourlyData: Record<string, number> = {};

    if (pm25Res && pm25Res.ok) {
      try {
        const pm25Json = await pm25Res.json();
        const latestPm25Item: DataGovPm25Item = pm25Json.items?.[pm25Json.items.length - 1];
        if (latestPm25Item?.readings?.pm25_one_hourly) {
          pm25OneHourlyData = latestPm25Item.readings.pm25_one_hourly;
        }
      } catch {
        // Fallback silently if PM25 endpoint structure differs
      }
    }

    const latestPsiItem: DataGovPsiItem = psiData.items?.[psiData.items.length - 1];
    if (!latestPsiItem || !latestPsiItem.readings) {
      throw new Error('Invalid items payload in PSI API');
    }

    const readings = latestPsiItem.readings;
    const regionKeys: RegionKey[] = ['north', 'south', 'east', 'west', 'central', 'national'];
    const parsedReadings: Partial<Record<RegionKey, RegionReadings>> = {};

    for (const key of regionKeys) {
      const psi24 = readings.psi_twenty_four_hourly?.[key] ?? 45;
      const pm25_24 = readings.pm25_twenty_four_hourly?.[key] ?? 14;
      const pm25_1h = pm25OneHourlyData[key] ?? Math.round(pm25_24 * 1.1) ?? 16;
      const pm10_24 = readings.pm10_twenty_four_hourly?.[key] ?? 28;
      const o3 = readings.o3_eight_hour_max?.[key] ?? 24;
      const no2 = readings.no2_one_hour_max?.[key] ?? 22;
      const so2 = readings.so2_twenty_four_hourly?.[key] ?? 6;
      const co = readings.co_eight_hour_max?.[key] ?? 0.6;

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

    const snapshot: AirQualitySnapshot = {
      timestamp: latestPsiItem.timestamp || new Date().toISOString(),
      updateTimestamp: latestPsiItem.update_timestamp || new Date().toISOString(),
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
