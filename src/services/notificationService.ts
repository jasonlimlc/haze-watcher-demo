/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AirQualitySnapshot, AlertSettings, NotificationLogItem, RegionKey, REGIONS } from '../types/psi';
import { getPsiBand } from '../utils/constants';

const SETTINGS_KEY = 'airguard_alert_settings_v1';
const HISTORY_KEY = 'airguard_notification_history_v1';

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  browserNotificationsEnabled: false,
  psiThreshold: 100, // Singapore Unhealthy threshold (101+)
  pm25Threshold: 55, // Singapore Elevated PM2.5 threshold (56+)
  monitoredRegion: 'all',
  soundEnabled: true,
  vibrateEnabled: true,
  notifyOnEveryUpdate: false
};

// Play high-fidelity synthesized alert chimes via Web Audio API
export function playAlertChime(urgency: 'moderate' | 'unhealthy' | 'hazard' = 'unhealthy') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (urgency === 'hazard') {
      // Tri-tone urgent warning chime (880Hz -> 659Hz -> 880Hz)
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, now);
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(659.25, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (urgency === 'unhealthy') {
      // Two-tone advisory chime (587Hz -> 880Hz)
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, now);
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.15); // A5
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Gentle notification pulse (523Hz)
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.18, now);
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (err) {
    console.warn('Web Audio chime could not be played:', err);
  }
}

export function triggerHapticFeedback(pattern: number[] = [150, 80, 150]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors if not permitted
    }
  }
}

export function loadAlertSettings(): AlertSettings {
  if (typeof window === 'undefined') return DEFAULT_ALERT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_ALERT_SETTINGS;
    return { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ALERT_SETTINGS;
  }
}

export function saveAlertSettings(settings: AlertSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save alert settings to localStorage', e);
  }
}

export function loadNotificationHistory(): NotificationLogItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return getInitialHistory();
    return JSON.parse(raw);
  } catch {
    return getInitialHistory();
  }
}

export function saveNotificationHistory(history: NotificationLogItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save notification history', e);
  }
}

function getInitialHistory(): NotificationLogItem[] {
  return [
    {
      id: 'init-1',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      region: 'west',
      regionName: 'West Region (Jurong)',
      psi: 104,
      pm25: 62,
      band: 'unhealthy',
      title: 'PSI Threshold Exceeded: West Region',
      body: '24-hr PSI has risen to 104 (Unhealthy). Vulnerable individuals should reduce prolonged outdoor exertion.'
    },
    {
      id: 'init-2',
      timestamp: new Date(Date.now() - 3600000 * 7).toISOString(),
      region: 'south',
      regionName: 'South Region',
      psi: 78,
      pm25: 38,
      band: 'moderate',
      title: 'PSI Advisory: South Region',
      body: '24-hr PSI is currently 78 (Moderate). Normal activities may continue.'
    }
  ];
}

// Request permission for native browser push notification
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

// Send actual browser push notification if permitted
export function dispatchBrowserNotification(title: string, options: NotificationOptions): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } catch {
      // In mobile Chrome or certain iframe contexts, new Notification() might throw if service worker registration is expected
      console.info('Native Notification invoked');
    }
  }
}

export function evaluateSnapshotAlerts(
  snapshot: AirQualitySnapshot,
  settings: AlertSettings,
  onNewAlert: (item: NotificationLogItem) => void
): void {
  const regionsToCheck: RegionKey[] = settings.monitoredRegion === 'all'
    ? (['national', 'north', 'south', 'east', 'west', 'central'] as RegionKey[])
    : [settings.monitoredRegion];

  for (const rKey of regionsToCheck) {
    const reading = snapshot.readings[rKey];
    if (!reading) continue;

    const psiExceeded = reading.psi24h >= settings.psiThreshold;
    const pm25Exceeded = reading.pm25OneHourly >= settings.pm25Threshold;

    if (psiExceeded || pm25Exceeded) {
      const regionMeta = REGIONS[rKey];
      const band = getPsiBand(reading.psi24h);
      const isUrgent = reading.psi24h > 200;

      const title = `⚠️ AirGuard SG: ${regionMeta.name} is ${band.label}`;
      const body = `PSI: ${reading.psi24h} (${band.label}), 1-hr PM2.5: ${reading.pm25OneHourly} µg/m³. ${band.summary}`;

      // Trigger browser notification
      if (settings.browserNotificationsEnabled) {
        dispatchBrowserNotification(title, {
          body,
          tag: `airguard-${rKey}-${reading.psi24h}`,
          requireInteraction: isUrgent
        });
      }

      // Play audio chime
      if (settings.soundEnabled) {
        playAlertChime(isUrgent ? 'hazard' : 'unhealthy');
      }

      // Haptic feedback
      if (settings.vibrateEnabled) {
        triggerHapticFeedback([200, 100, 200]);
      }

      const logItem: NotificationLogItem = {
        id: `alert-${Date.now()}-${rKey}`,
        timestamp: new Date().toISOString(),
        region: rKey,
        regionName: regionMeta.name,
        psi: reading.psi24h,
        pm25: reading.pm25OneHourly,
        band: band.level,
        title,
        body
      };

      onNewAlert(logItem);
      break; // Notify once per batch to prevent multiple popups simultaneously
    }
  }
}
