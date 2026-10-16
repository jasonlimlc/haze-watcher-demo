/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  AirQualitySnapshot,
  AlertSettings,
  HourlyHistoricalRecord,
  NotificationLogItem,
  RegionKey,
  REGIONS
} from './types/psi';
import {
  DEFAULT_ALERT_SETTINGS,
  dispatchBrowserNotification,
  evaluateSnapshotAlerts,
  loadAlertSettings,
  loadNotificationHistory,
  playAlertChime,
  saveAlertSettings,
  saveNotificationHistory,
  triggerHapticFeedback
} from './services/notificationService';
import { fetchLiveAirQuality, SimulationScenario } from './services/psiApi';
import { findNearestSingaporeRegion } from './utils/geolocation';
import { getPsiBand } from './utils/constants';

import { TopNav } from './components/TopNav';
import { LiveTelemetryBar } from './components/LiveTelemetryBar';
import { InteractiveMap } from './components/InteractiveMap';
import { RegionCardGrid } from './components/RegionCardGrid';
import { TrendChart } from './components/TrendChart';
import { HealthAdvisorySection } from './components/HealthAdvisorySection';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { AlertNotificationLog } from './components/AlertNotificationLog';
import { HazeSimulatorPanel } from './components/HazeSimulatorPanel';

import { AlertTriangle, Bell, Shield, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'trends' | 'advisory' | 'log' | 'simulator'>('map');
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('national');
  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [history, setHistory] = useState<HourlyHistoricalRecord[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario>('live');

  // Playback index for 24h scrubber
  const [activePlaybackIndex, setActivePlaybackIndex] = useState<number | null>(null);

  // Settings & Notification state
  const [settings, setSettings] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS);
  const [notificationLog, setNotificationLog] = useState<NotificationLogItem[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<NotificationLogItem | null>(null);
  const [geoStatusMessage, setGeoStatusMessage] = useState<string | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    setSettings(loadAlertSettings());
    setNotificationLog(loadNotificationHistory());
  }, []);

  // Sync settings when updated
  const handleSaveSettings = (newSettings: AlertSettings) => {
    setSettings(newSettings);
    saveAlertSettings(newSettings);
  };

  // Add new alert to state and persist
  const handleNewAlert = useCallback((item: NotificationLogItem) => {
    setActiveToast(item);
    setNotificationLog((prev) => {
      const updated = [item, ...prev];
      saveNotificationHistory(updated);
      return updated;
    });
  }, []);

  // Fetch or update air quality data
  const loadData = useCallback(async (scenario: SimulationScenario = currentScenario) => {
    setIsRefreshing(true);
    try {
      const res = await fetchLiveAirQuality(scenario);
      setSnapshot(res.snapshot);
      setIsSimulated(res.isSimulated);
      setHistory(res.history);

      // Evaluate alerts against settings
      evaluateSnapshotAlerts(res.snapshot, settings, handleNewAlert);
    } catch (err) {
      console.error('Failed to load air quality:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentScenario, settings, handleNewAlert]);

  // Initial load
  useEffect(() => {
    loadData();
    // Auto refresh every 2 minutes
    const interval = setInterval(() => {
      loadData();
    }, 120000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Geolocation handler to match closest Singapore region
  const handleGeolocateUser = () => {
    if (!navigator.geolocation) {
      setGeoStatusMessage('Geolocation not supported by browser');
      setTimeout(() => setGeoStatusMessage(null), 4000);
      return;
    }

    setGeoStatusMessage('Detecting GPS location in Singapore...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const result = findNearestSingaporeRegion(latitude, longitude);
        setSelectedRegion(result.region);
        setGeoStatusMessage(`Matched to ${REGIONS[result.region].name} (~${result.distanceKm} km)`);
        setTimeout(() => setGeoStatusMessage(null), 5000);
      },
      (err) => {
        setGeoStatusMessage('Location access declined or timed out');
        setTimeout(() => setGeoStatusMessage(null), 4000);
      },
      { timeout: 8000 }
    );
  };

  // Scenario change handler
  const handleSelectScenario = (scenario: SimulationScenario) => {
    setCurrentScenario(scenario);
    loadData(scenario);
  };

  // Instant surge injector (creates synthetic spike to verify alert dispatch)
  const handleTriggerInstantSpike = (psiValue: number) => {
    if (!snapshot) return;

    const spikedSnapshot: AirQualitySnapshot = {
      ...snapshot,
      timestamp: new Date().toISOString(),
      readings: {
        ...snapshot.readings,
        west: {
          ...snapshot.readings.west,
          psi24h: psiValue,
          pm25OneHourly: Math.round(psiValue * 0.65)
        },
        national: {
          ...snapshot.readings.national,
          psi24h: Math.max(snapshot.readings.national.psi24h, psiValue)
        }
      }
    };

    setSnapshot(spikedSnapshot);
    setIsSimulated(true);
    setSelectedRegion('west');

    const band = getPsiBand(psiValue);
    const testItem: NotificationLogItem = {
      id: `alert-surge-${Date.now()}`,
      timestamp: new Date().toISOString(),
      region: 'west',
      regionName: 'West Region (Jurong Industrial)',
      psi: psiValue,
      pm25: Math.round(psiValue * 0.65),
      band: band.level,
      title: `🚨 Instant Spike Alert: West Region PSI ${psiValue}`,
      body: `Haze spike simulation triggered. 24-hr PSI has risen to ${psiValue} (${band.label}). Vulnerable groups must reduce outdoor exertion immediately.`
    };

    playAlertChime('hazard');
    triggerHapticFeedback([200, 100, 200]);
    dispatchBrowserNotification(testItem.title, {
      body: testItem.body,
      tag: 'haze-spike'
    });

    handleNewAlert(testItem);
  };

  // Send a manual test alert
  const handleSendTestAlert = () => {
    const testItem: NotificationLogItem = {
      id: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      region: selectedRegion === 'national' ? 'west' : selectedRegion,
      regionName: REGIONS[selectedRegion === 'national' ? 'west' : selectedRegion].name,
      psi: 124,
      pm25: 78,
      band: 'unhealthy',
      title: '⚠️ AirGuard SG: Push Notification Test',
      body: 'Push alerts and audio warning synthesizer are operating normally. Real alerts will fire when live PSI crosses your configured threshold.'
    };

    playAlertChime('unhealthy');
    triggerHapticFeedback([150, 100, 150]);
    dispatchBrowserNotification(testItem.title, {
      body: testItem.body,
      tag: 'test-alert'
    });

    handleNewAlert(testItem);
  };

  const handleClearHistory = () => {
    setNotificationLog([]);
    saveNotificationHistory([]);
  };

  // Derive active displayed snapshot (if historical scrubber is active, show historical state)
  const displayedSnapshot = React.useMemo(() => {
    if (!snapshot) return null;
    if (activePlaybackIndex === null || !history[activePlaybackIndex]) {
      return snapshot;
    }

    const histItem = history[activePlaybackIndex];
    return {
      ...snapshot,
      timestamp: histItem.timestamp,
      readings: {
        ...snapshot.readings,
        national: { ...snapshot.readings.national, psi24h: histItem.readings.national.psi, pm25OneHourly: histItem.readings.national.pm25 },
        west: { ...snapshot.readings.west, psi24h: histItem.readings.west.psi, pm25OneHourly: histItem.readings.west.pm25 },
        south: { ...snapshot.readings.south, psi24h: histItem.readings.south.psi, pm25OneHourly: histItem.readings.south.pm25 },
        central: { ...snapshot.readings.central, psi24h: histItem.readings.central.psi, pm25OneHourly: histItem.readings.central.pm25 },
        north: { ...snapshot.readings.north, psi24h: histItem.readings.north.psi, pm25OneHourly: histItem.readings.north.pm25 },
        east: { ...snapshot.readings.east, psi24h: histItem.readings.east.psi, pm25OneHourly: histItem.readings.east.pm25 }
      }
    };
  }, [snapshot, activePlaybackIndex, history]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-white">
      {/* Top Bar with Three-Zone Top Bar Contract */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        notificationsGranted={
          typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
        }
        alertCount={notificationLog.length}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {displayedSnapshot ? (
          <>
            {/* Live Telemetry Ribbon */}
            <LiveTelemetryBar
              snapshot={displayedSnapshot}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              isSimulated={isSimulated}
              onRefresh={() => loadData(currentScenario)}
              isRefreshing={isRefreshing}
            />

            {/* Tab Views */}
            {activeTab === 'map' && (
              <div className="space-y-6">
                {/* Interactive Map */}
                <InteractiveMap
                  snapshot={displayedSnapshot}
                  selectedRegion={selectedRegion}
                  onSelectRegion={setSelectedRegion}
                  onGeolocateUser={handleGeolocateUser}
                  geoStatusMessage={geoStatusMessage}
                />

                {/* 5-Region Telemetry Cards */}
                <RegionCardGrid
                  snapshot={displayedSnapshot}
                  selectedRegion={selectedRegion}
                  onSelectRegion={setSelectedRegion}
                />
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="space-y-6">
                <TrendChart
                  history={history}
                  selectedRegion={selectedRegion}
                  onSelectRegion={setSelectedRegion}
                  activePlaybackIndex={activePlaybackIndex}
                  onPlaybackChange={setActivePlaybackIndex}
                />

                <RegionCardGrid
                  snapshot={displayedSnapshot}
                  selectedRegion={selectedRegion}
                  onSelectRegion={setSelectedRegion}
                />
              </div>
            )}

            {activeTab === 'advisory' && (
              <HealthAdvisorySection
                snapshot={displayedSnapshot}
                selectedRegion={selectedRegion}
              />
            )}

            {activeTab === 'log' && (
              <AlertNotificationLog
                history={notificationLog}
                onClearHistory={handleClearHistory}
                onTriggerTestAlert={handleSendTestAlert}
              />
            )}

            {activeTab === 'simulator' && (
              <HazeSimulatorPanel
                currentScenario={currentScenario}
                onSelectScenario={handleSelectScenario}
                onTriggerInstantSpike={handleTriggerInstantSpike}
              />
            )}
          </>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-300">
              Connecting to Singapore Air Quality Telemetry Feed...
            </p>
          </div>
        )}
      </main>

      {/* Floating In-App Toast Banner when Alert Fires */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  {activeToast.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeToast.body}
                </p>
                <div className="mt-2 text-[10px] font-mono text-slate-400">
                  PSI {activeToast.psi} · 1-hr PM2.5: {activeToast.pm25} µg/m³
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-slate-100 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Alert Settings Modal */}
      <AlertSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onSendTestAlert={handleSendTestAlert}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">AirGuard SG</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Singapore Open Data (NEA data.gov.sg API)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>MOH HealthLine: 1800-225-4122</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Emergency: 995</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
