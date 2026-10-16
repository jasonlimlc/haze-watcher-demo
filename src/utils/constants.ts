/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AirQualityBand, AirQualityBandLevel, HealthAdvisoryItem, PM25Band, PM25BandLevel } from '../types/psi';

export const PSI_BANDS: Record<AirQualityBandLevel, AirQualityBand> = {
  good: {
    level: 'good',
    label: 'Good',
    rangeText: '0 – 50',
    min: 0,
    max: 50,
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500',
    accentHex: '#10b981',
    summary: 'Air quality is considered satisfactory, and air pollution poses little or no risk.'
  },
  moderate: {
    level: 'moderate',
    label: 'Moderate',
    rangeText: '51 – 100',
    min: 51,
    max: 100,
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500',
    accentHex: '#06b6d4',
    summary: 'Air quality is acceptable. Normal daily activities can continue.'
  },
  unhealthy: {
    level: 'unhealthy',
    label: 'Unhealthy',
    rangeText: '101 – 200',
    min: 101,
    max: 200,
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    badgeBg: 'bg-amber-500',
    accentHex: '#f59e0b',
    summary: 'Mild irritation to eyes, nose and throat. Vulnerable groups should limit outdoor exertion.'
  },
  very_unhealthy: {
    level: 'very_unhealthy',
    label: 'Very Unhealthy',
    rangeText: '201 – 300',
    min: 201,
    max: 300,
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    badgeBg: 'bg-rose-500',
    accentHex: '#f43f5e',
    summary: 'Significant respiratory strain. General public should reduce prolonged strenuous activities outdoors.'
  },
  hazardous: {
    level: 'hazardous',
    label: 'Hazardous',
    rangeText: '301+',
    min: 301,
    max: 500,
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    badgeBg: 'bg-purple-500',
    accentHex: '#a855f7',
    summary: 'Emergency conditions. Everyone should minimise outdoor activity and stay indoors with air purifiers.'
  }
};

export const PM25_BANDS: Record<PM25BandLevel, PM25Band> = {
  normal: {
    level: 'normal',
    label: 'Band I (Normal)',
    bandName: 'Band I',
    rangeText: '0 – 55 µg/m³',
    min: 0,
    max: 55,
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    accentHex: '#10b981',
    actionAdvice: 'Normal activities can be carried out.'
  },
  elevated: {
    level: 'elevated',
    label: 'Band II (Elevated)',
    bandName: 'Band II',
    rangeText: '56 – 150 µg/m³',
    min: 56,
    max: 150,
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    accentHex: '#f59e0b',
    actionAdvice: 'Vulnerable individuals should reduce prolonged or strenuous outdoor exertion.'
  },
  high: {
    level: 'high',
    label: 'Band III (High)',
    bandName: 'Band III',
    rangeText: '151 – 250 µg/m³',
    min: 151,
    max: 250,
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    accentHex: '#f43f5e',
    actionAdvice: 'Avoid outdoor exertion. Wear N95 masks if prolonged outdoor presence is required.'
  },
  very_high: {
    level: 'very_high',
    label: 'Band IV (Very High)',
    bandName: 'Band IV',
    rangeText: '> 250 µg/m³',
    min: 251,
    max: 999,
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    accentHex: '#a855f7',
    actionAdvice: 'Minimise outdoor exposure. Run HEPA air purifiers indoors and close all windows.'
  }
};

export function getPsiBand(psi: number): AirQualityBand {
  if (psi <= 50) return PSI_BANDS.good;
  if (psi <= 100) return PSI_BANDS.moderate;
  if (psi <= 200) return PSI_BANDS.unhealthy;
  if (psi <= 300) return PSI_BANDS.very_unhealthy;
  return PSI_BANDS.hazardous;
}

export function getPM25Band(pm25: number): PM25Band {
  if (pm25 <= 55) return PM25_BANDS.normal;
  if (pm25 <= 150) return PM25_BANDS.elevated;
  if (pm25 <= 250) return PM25_BANDS.high;
  return PM25_BANDS.very_high;
}

export function getHealthAdvisory(psi: number): HealthAdvisoryItem[] {
  if (psi <= 50) {
    return [
      {
        targetGroup: 'general',
        title: 'Healthy Persons',
        advice: 'Normal daily outdoor activities and exercise can be carried out safely.',
        outdoorStrenuous: 'Permitted without restrictions',
        maskRecommendation: 'No mask required'
      },
      {
        targetGroup: 'vulnerable',
        title: 'Vulnerable Persons (Elderly, Pregnant, Children, Heart/Lung)',
        advice: 'Normal activities can continue without restriction.',
        outdoorStrenuous: 'Permitted',
        maskRecommendation: 'No mask required'
      }
    ];
  }

  if (psi <= 100) {
    return [
      {
        targetGroup: 'general',
        title: 'Healthy Persons',
        advice: 'Normal activities can continue. Air quality remains within acceptable limits.',
        outdoorStrenuous: 'Permitted',
        maskRecommendation: 'No mask required'
      },
      {
        targetGroup: 'vulnerable',
        title: 'Vulnerable Persons (Elderly, Pregnant, Children, Heart/Lung)',
        advice: 'Persons with chronic respiratory or cardiovascular conditions should keep quick-relief medication handy.',
        outdoorStrenuous: 'Monitor for shortness of breath',
        maskRecommendation: 'Optional for sensitive individuals'
      }
    ];
  }

  if (psi <= 200) {
    return [
      {
        targetGroup: 'general',
        title: 'Healthy Persons',
        advice: 'Reduce prolonged or strenuous outdoor physical exertion (e.g. running, long cycling, field sports).',
        outdoorStrenuous: 'Reduce duration & intensity',
        maskRecommendation: 'N95 mask recommended if outdoors for >2 hours'
      },
      {
        targetGroup: 'vulnerable',
        title: 'Vulnerable Persons (Elderly, Pregnant, Children, Heart/Lung)',
        advice: 'Avoid prolonged or strenuous outdoor exertion. Keep windows and doors closed at home.',
        outdoorStrenuous: 'Avoid completely; move workouts indoors',
        maskRecommendation: 'N95 mask advised if stepping outdoors'
      }
    ];
  }

  if (psi <= 300) {
    return [
      {
        targetGroup: 'general',
        title: 'Healthy Persons',
        advice: 'Avoid prolonged or strenuous outdoor exertion. Elderly and children should stay indoors in air-conditioned environments.',
        outdoorStrenuous: 'Avoid all outdoor workouts',
        maskRecommendation: 'N95 mask strongly advised outdoors'
      },
      {
        targetGroup: 'vulnerable',
        title: 'Vulnerable Persons (Elderly, Pregnant, Children, Heart/Lung)',
        advice: 'Avoid all outdoor activity. Individuals feeling unwell should seek immediate medical attention at a polyclinic or GP.',
        outdoorStrenuous: 'Strictly prohibited',
        maskRecommendation: 'N95 mask required if traveling outdoors'
      }
    ];
  }

  return [
    {
      targetGroup: 'general',
      title: 'Healthy Persons',
      advice: 'Hazardous air quality. Minimise all outdoor activity. Keep all windows shut and run HEPA air cleaners.',
      outdoorStrenuous: 'Strictly prohibited for all',
      maskRecommendation: 'N95 / FFP2 mask mandatory outdoors'
    },
    {
      targetGroup: 'vulnerable',
      title: 'Vulnerable Persons (Elderly, Pregnant, Children, Heart/Lung)',
      advice: 'Remain indoors. Keep emergency asthma/respiratory inhalers nearby. Contact healthcare provider if chest discomfort occurs.',
      outdoorStrenuous: 'Strictly prohibited; remain indoors',
      maskRecommendation: 'Do not go outdoors unless emergency'
    }
  ];
}
