/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AirQualitySnapshot, RegionKey, REGIONS } from '../types/psi';
import { getPsiBand, getPM25Band } from '../utils/constants';
import { ChevronRight, Wind } from 'lucide-react';

interface RegionCardGridProps {
  snapshot: AirQualitySnapshot;
  selectedRegion: RegionKey;
  onSelectRegion: (region: RegionKey) => void;
}

export const RegionCardGrid: React.FC<RegionCardGridProps> = ({
  snapshot,
  selectedRegion,
  onSelectRegion
}) => {
  const regions: RegionKey[] = ['north', 'south', 'east', 'west', 'central'];

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">
            Regional Telemetry & Sub-Pollutant Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Click any regional sensor station to inspect in detail on the map
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {regions.map((key) => {
          const reading = snapshot.readings[key];
          const meta = REGIONS[key];
          const psiBand = getPsiBand(reading.psi24h);
          const pm25Band = getPM25Band(reading.pm25OneHourly);
          const isSelected = selectedRegion === key;

          return (
            <div
              key={key}
              onClick={() => onSelectRegion(key)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400/50 shadow-md'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                      ZONE
                    </span>
                    <h3 className="text-sm font-bold text-slate-200">
                      {meta.name.replace(' Region', '')}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${psiBand.bgColor} ${psiBand.textColor} ${psiBand.borderColor}`}>
                    {psiBand.label}
                  </span>
                </div>

                {/* Primary numbers */}
                <div className="grid grid-cols-2 gap-2 my-3 py-2 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">24h PSI</span>
                    <span className={`text-2xl font-extrabold font-mono tabular-nums ${psiBand.textColor}`}>
                      {reading.psi24h}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">1h PM2.5</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold font-mono text-slate-200 tabular-nums">
                        {reading.pm25OneHourly}
                      </span>
                      <span className="text-[10px] text-slate-400">µg</span>
                    </div>
                  </div>
                </div>

                {/* Sub-pollutants table */}
                <div className="space-y-1 text-[11px] font-mono text-slate-400 border-t border-slate-800/60 pt-2">
                  <div className="flex justify-between">
                    <span>PM10:</span>
                    <span className="text-slate-300 tabular-nums">{reading.pm10_24h} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>O3 (Ozone):</span>
                    <span className="text-slate-300 tabular-nums">{reading.o3_8h} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NO2:</span>
                    <span className="text-slate-300 tabular-nums">{reading.no2_1h} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SO2:</span>
                    <span className="text-slate-300 tabular-nums">{reading.so2_24h} µg/m³</span>
                  </div>
                </div>
              </div>

              {/* Coverage towns */}
              <div className="mt-3 pt-2 border-t border-slate-800/40 text-[10px] text-slate-400 truncate">
                {meta.towns.slice(0, 3).join(', ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
