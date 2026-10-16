/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AirQualitySnapshot, RegionKey, REGIONS } from '../types/psi';
import { getPsiBand, getPM25Band } from '../utils/constants';
import { Activity, AlertTriangle, CheckCircle, Clock, RefreshCw, ShieldCheck } from 'lucide-react';

interface LiveTelemetryBarProps {
  snapshot: AirQualitySnapshot;
  selectedRegion: RegionKey;
  onSelectRegion: (region: RegionKey) => void;
  isSimulated: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const LiveTelemetryBar: React.FC<LiveTelemetryBarProps> = ({
  snapshot,
  selectedRegion,
  onSelectRegion,
  isSimulated,
  onRefresh,
  isRefreshing
}) => {
  const currentRegion = snapshot.readings[selectedRegion] || snapshot.readings.national;
  const currentMeta = REGIONS[selectedRegion];
  const psiBand = getPsiBand(currentRegion.psi24h);
  const pm25Band = getPM25Band(currentRegion.pm25OneHourly);

  const formattedTime = new Date(snapshot.timestamp).toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Singapore'
  });

  const isAlertThresholdActive = currentRegion.psi24h > 100 || currentRegion.pm25OneHourly > 55;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left block: Region title and clean unboxed metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              {currentMeta.name}
            </h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${psiBand.bgColor} ${psiBand.textColor} ${psiBand.borderColor}`}>
              {psiBand.label.toUpperCase()}
            </span>
          </div>

          {/* Clean unboxed metadata according to Zero-Pill rule */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>NEA Sync: {formattedTime} SGT</span>
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono">
              Source: {isSimulated ? 'Haze Simulation Engine' : 'data.gov.sg (Live NEA Feed)'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Wind: {snapshot.wind.direction} @ {snapshot.wind.speedKnots} knots</span>
          </div>
        </div>

        {/* Center / Right Metrics Ribbon */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* 24-hr PSI Primary Metric */}
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl min-w-[140px]">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
              24-HR PSI
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono tabular-nums ${psiBand.textColor}`}>
                {currentRegion.psi24h}
              </span>
              <span className="text-xs font-medium text-slate-400 font-mono">
                {psiBand.rangeText}
              </span>
            </div>
          </div>

          {/* 1-hr PM2.5 Secondary Metric */}
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl min-w-[140px]">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
              1-HR PM2.5
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-100">
                {currentRegion.pm25OneHourly}
              </span>
              <span className="text-xs font-medium text-slate-400 font-mono">
                µg/m³
              </span>
            </div>
            <div className={`text-[11px] font-medium ${pm25Band.textColor}`}>
              {pm25Band.bandName}
            </div>
          </div>

          {/* Status Indicator & Refresh Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              title="Refresh live NEA reading"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Alert Banner (Conditional when PSI or PM2.5 exceeds healthy bounds) */}
      {isAlertThresholdActive && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Air Quality Advisory:</strong> Elevated pollutant levels detected in {currentMeta.name}.
              Vulnerable persons (elderly, children, respiratory conditions) should avoid prolonged outdoor exertion.
            </span>
          </div>
        </div>
      )}

      {/* Regional Selector Strip */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-mono text-slate-400 whitespace-nowrap mr-2">
          SELECT ZONE:
        </span>
        {(['national', 'north', 'south', 'east', 'west', 'central'] as RegionKey[]).map((rKey) => {
          const isSelected = selectedRegion === rKey;
          const regRead = snapshot.readings[rKey];
          const regBand = getPsiBand(regRead.psi24h);

          return (
            <button
              key={rKey}
              onClick={() => onSelectRegion(rKey)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-slate-800 border-cyan-400 text-cyan-300 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <span className="capitalize">{rKey === 'national' ? 'Island-wide' : rKey}</span>
              <span className={`font-mono font-bold tabular-nums ${regBand.textColor}`}>
                {regRead.psi24h}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
