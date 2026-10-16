/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HourlyHistoricalRecord, RegionKey, REGIONS } from '../types/psi';
import { getPsiBand } from '../utils/constants';
import { History, Play, Pause, RotateCcw } from 'lucide-react';

interface TrendChartProps {
  history: HourlyHistoricalRecord[];
  selectedRegion: RegionKey;
  onSelectRegion: (region: RegionKey) => void;
  activePlaybackIndex: number | null;
  onPlaybackChange: (index: number | null) => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  history,
  selectedRegion,
  onSelectRegion,
  activePlaybackIndex,
  onPlaybackChange
}) => {
  const [metricMode, setMetricMode] = useState<'psi' | 'pm25'>('psi');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!history || history.length === 0) {
    return (
      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        Loading 24-hour historical telemetry...
      </div>
    );
  }

  const chartHeight = 220;
  const chartWidth = 800;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };

  // Calculate scales
  const maxValue = metricMode === 'psi' ? 250 : 150;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => padding.left + (index / (history.length - 1)) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - (Math.min(val, maxValue) / maxValue) * innerHeight;

  // Build SVG path for region
  const regionKey = selectedRegion === 'national' ? 'national' : selectedRegion;
  const points = history.map((record, index) => {
    const val = metricMode === 'psi' ? record.readings[regionKey].psi : record.readings[regionKey].pm25;
    return `${getX(index)},${getY(val)}`;
  });
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${getX(history.length - 1)},${padding.top + innerHeight} L ${getX(0)},${padding.top + innerHeight} Z`;

  // Autoplay historical timeline
  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const current = activePlaybackIndex ?? 0;
      const next = current + 1;
      if (next >= history.length) {
        setIsPlaying(false);
        onPlaybackChange(null);
      } else {
        onPlaybackChange(next);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [isPlaying, activePlaybackIndex, history.length, onPlaybackChange]);

  const activeIdx = hoverIndex !== null ? hoverIndex : activePlaybackIndex !== null ? activePlaybackIndex : history.length - 1;
  const activePoint = history[activeIdx];
  const activeVal = metricMode === 'psi' ? activePoint?.readings[regionKey].psi : activePoint?.readings[regionKey].pm25;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              24-Hour Air Quality Historical Trend
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Hourly progression for {REGIONS[regionKey].name}
          </p>
        </div>

        {/* Metric Switcher & Region Selector */}
        <div className="flex items-center gap-2">
          {/* Metric Selector Button Group */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setMetricMode('psi')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                metricMode === 'psi'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              24h PSI
            </button>
            <button
              onClick={() => setMetricMode('pm25')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                metricMode === 'pm25'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1h PM2.5
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full h-[240px] bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Reference Threshold horizontal lines */}
          {metricMode === 'psi' ? (
            <>
              {/* Unhealthy threshold: 100 */}
              <line
                x1={padding.left}
                y1={getY(100)}
                x2={chartWidth - padding.right}
                y2={getY(100)}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth="1"
                opacity="0.6"
              />
              <text
                x={padding.left + 5}
                y={getY(100) - 5}
                fill="#f59e0b"
                fontSize="10"
                fontFamily="IBM Plex Mono"
              >
                UNHEALTHY THRESHOLD (100)
              </text>

              {/* Moderate threshold: 50 */}
              <line
                x1={padding.left}
                y1={getY(50)}
                x2={chartWidth - padding.right}
                y2={getY(50)}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                strokeWidth="1"
                opacity="0.4"
              />
              <text
                x={padding.left + 5}
                y={getY(50) - 5}
                fill="#06b6d4"
                fontSize="10"
                fontFamily="IBM Plex Mono"
              >
                MODERATE BOUNDARY (50)
              </text>
            </>
          ) : (
            <>
              {/* PM2.5 Elevated threshold: 55 */}
              <line
                x1={padding.left}
                y1={getY(55)}
                x2={chartWidth - padding.right}
                y2={getY(55)}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth="1"
                opacity="0.6"
              />
              <text
                x={padding.left + 5}
                y={getY(55) - 5}
                fill="#f59e0b"
                fontSize="10"
                fontFamily="IBM Plex Mono"
              >
                ELEVATED THRESHOLD (55 µg/m³)
              </text>
            </>
          )}

          {/* Area fill */}
          <path d={areaD} fill="url(#trendGradient)" />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

          {/* Interactive cursor line */}
          {activeIdx !== null && (
            <g>
              <line
                x1={getX(activeIdx)}
                y1={padding.top}
                x2={getX(activeIdx)}
                y2={padding.top + innerHeight}
                stroke="#ffffff"
                strokeDasharray="2 2"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <circle
                cx={getX(activeIdx)}
                cy={getY(activeVal ?? 0)}
                r="5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X Axis labels */}
          {history.map((record, index) => {
            if (index % 4 === 0 || index === history.length - 1) {
              return (
                <text
                  key={`x-${index}`}
                  x={getX(index)}
                  y={chartHeight - 12}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="IBM Plex Mono"
                  textAnchor="middle"
                >
                  {record.hourLabel}
                </text>
              );
            }
            return null;
          })}

          {/* Invisible interactive hover rects */}
          {history.map((_, index) => (
            <rect
              key={`hover-${index}`}
              x={getX(index) - innerWidth / (history.length * 2)}
              y={padding.top}
              width={innerWidth / history.length}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              onClick={() => onPlaybackChange(index)}
              className="cursor-pointer"
            />
          ))}
        </svg>

        {/* Hover info badge */}
        {activePoint && (
          <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-md backdrop-blur-sm text-xs font-mono">
            <span className="text-slate-400">{activePoint.hourLabel}</span>
            <span aria-hidden="true" className="mx-1 text-slate-600">·</span>
            <span className="text-cyan-400 font-bold tabular-nums">
              {metricMode === 'psi' ? `PSI ${activeVal}` : `${activeVal} µg/m³`}
            </span>
          </div>
        )}
      </div>

      {/* Historical Playback Timeline Scrubber */}
      <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-colors font-medium"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play 24h Playback</span>
              </>
            )}
          </button>

          {activePlaybackIndex !== null && (
            <button
              onClick={() => {
                onPlaybackChange(null);
                setIsPlaying(false);
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
              title="Return to latest live time"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Live</span>
            </button>
          )}
        </div>

        {/* Range slider */}
        <div className="flex items-center gap-3 flex-1 sm:max-w-md">
          <span className="text-slate-400 font-mono text-[11px] shrink-0">
            {history[0]?.hourLabel}
          </span>
          <input
            type="range"
            min={0}
            max={history.length - 1}
            value={activePlaybackIndex ?? history.length - 1}
            onChange={(e) => {
              onPlaybackChange(parseInt(e.target.value, 10));
              setIsPlaying(false);
            }}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-slate-400 font-mono text-[11px] shrink-0">
            {history[history.length - 1]?.hourLabel} (Now)
          </span>
        </div>
      </div>
    </div>
  );
};
