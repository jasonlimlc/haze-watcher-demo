/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertSettings, RegionKey, REGIONS } from '../types/psi';
import { playAlertChime, requestNotificationPermission, triggerHapticFeedback } from '../services/notificationService';
import { Bell, Check, Radio, Sliders, Volume2, X, Zap } from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlertSettings;
  onSaveSettings: (settings: AlertSettings) => void;
  onSendTestAlert: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onSendTestAlert
}) => {
  const [localSettings, setLocalSettings] = useState<AlertSettings>(settings);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const perm = await requestNotificationPermission();
    setPermissionState(perm);
    setIsRequesting(false);
    if (perm === 'granted') {
      const updated = { ...localSettings, browserNotificationsEnabled: true };
      setLocalSettings(updated);
      onSaveSettings(updated);
    }
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleTestAudio = () => {
    playAlertChime('unhealthy');
    triggerHapticFeedback([150, 80, 150]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Air Quality Alert & Push Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Push Notification Permission Status */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-slate-400 block">
                Browser Push Notifications
              </span>
              <span className="text-sm font-semibold text-slate-200">
                System Status:{' '}
                <span className={
                  permissionState === 'granted'
                    ? 'text-emerald-400'
                    : permissionState === 'denied'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }>
                  {permissionState === 'granted'
                    ? 'Enabled (Permitted)'
                    : permissionState === 'denied'
                    ? 'Blocked by Browser'
                    : 'Permission Not Yet Granted'}
                </span>
              </span>
            </div>

            {permissionState !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-900 text-xs font-semibold shadow-sm transition-colors"
              >
                {isRequesting ? 'Requesting...' : 'Allow Push Alerts'}
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            When enabled, AirGuard SG dispatches instantaneous push notifications to your operating system or mobile screen when Singapore PSI or 1-hr PM2.5 crosses your safety threshold.
          </p>
        </div>

        {/* Threshold Controls */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                24-hr PSI Alert Threshold
              </label>
              <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                PSI ≥ {localSettings.psiThreshold}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={250}
              step={10}
              value={localSettings.psiThreshold}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, psiThreshold: parseInt(e.target.value, 10) })
              }
              className="w-full accent-amber-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>50 (Moderate)</span>
              <span className="text-amber-400 font-bold">100 (Unhealthy - Recommended)</span>
              <span>200 (Very Unhealthy)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                1-hr PM2.5 Alert Threshold
              </label>
              <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                PM2.5 ≥ {localSettings.pm25Threshold} µg/m³
              </span>
            </div>
            <input
              type="range"
              min={35}
              max={150}
              step={5}
              value={localSettings.pm25Threshold}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, pm25Threshold: parseInt(e.target.value, 10) })
              }
              className="w-full accent-amber-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>35 µg/m³</span>
              <span className="text-amber-400 font-bold">55 µg/m³ (Band II Elevated)</span>
              <span>150 µg/m³</span>
            </div>
          </div>
        </div>

        {/* Monitored Region Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Region to Monitor
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => setLocalSettings({ ...localSettings, monitoredRegion: 'all' })}
              className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                localSettings.monitoredRegion === 'all'
                  ? 'bg-slate-800 border-cyan-400 text-cyan-300 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Singapore
            </button>
            {(['north', 'south', 'east', 'west', 'central'] as RegionKey[]).map((rKey) => (
              <button
                key={rKey}
                onClick={() => setLocalSettings({ ...localSettings, monitoredRegion: rKey })}
                className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-colors capitalize ${
                  localSettings.monitoredRegion === rKey
                    ? 'bg-slate-800 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {rKey} Region
              </button>
            ))}
          </div>
        </div>

        {/* Sound & Haptic Feedback Toggles */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-200">
                Audible Alert Chime (Web Audio Synthesizer)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestAudio}
                className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                title="Test audio alert tone"
              >
                Play Tone
              </button>
              <input
                type="checkbox"
                checked={localSettings.soundEnabled}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-200">
                Mobile Haptic Vibration Pulse
              </span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.vibrateEnabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, vibrateEnabled: e.target.checked })
              }
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onSendTestAlert}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 rounded-lg transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Send Test Push Notification</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-900 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
