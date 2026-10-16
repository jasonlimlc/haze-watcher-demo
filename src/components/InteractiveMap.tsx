/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AirQualitySnapshot, RegionKey, REGIONS } from '../types/psi';
import { getPsiBand, getPM25Band } from '../utils/constants';
import { Compass, Locate, Maximize2, Minus, Navigation, Plus, RotateCcw, Wind } from 'lucide-react';

interface InteractiveMapProps {
  snapshot: AirQualitySnapshot;
  selectedRegion: RegionKey;
  onSelectRegion: (region: RegionKey) => void;
  onGeolocateUser?: () => void;
  geoStatusMessage?: string | null;
}

// Singapore coordinate-aligned SVG regional paths
// Normalized to a 1000x560 viewBox representing Singapore's main landmass and key islands
const REGION_PATHS: Record<Exclude<RegionKey, 'national'>, {
  path: string;
  centroid: [number, number];
  name: string;
}> = {
  north: {
    // Woodlands, Sembawang, Yishun, Mandai, Lim Chu Kang north
    path: 'M 360,110 L 460,85 L 560,95 L 610,135 L 635,170 L 600,200 L 530,210 L 470,225 L 410,215 L 360,185 Z',
    centroid: [490, 150],
    name: 'North'
  },
  west: {
    // Tuas, Jurong Industrial, Tengah, Clementi, Choa Chu Kang, Bukit Batok
    path: 'M 140,320 L 190,260 L 260,230 L 360,185 L 410,215 L 420,290 L 390,345 L 330,375 L 250,380 L 180,360 L 120,380 L 95,430 L 70,390 Z',
    centroid: [270, 290],
    name: 'West'
  },
  central: {
    // Ang Mo Kio, Bishan, Toa Payoh, Novena, Queenstown, Bukit Timah
    path: 'M 410,215 L 470,225 L 530,210 L 580,240 L 590,300 L 550,340 L 490,355 L 440,340 L 420,290 Z',
    centroid: [490, 275],
    name: 'Central'
  },
  east: {
    // Tampines, Bedok, Pasir Ris, Changi, Paya Lebar
    path: 'M 600,200 L 635,170 L 720,165 L 820,195 L 890,240 L 895,290 L 815,310 L 730,325 L 660,330 L 590,300 L 580,240 Z',
    centroid: [730, 250],
    name: 'East'
  },
  south: {
    // Bukit Merah, Downtown Core, Marina Bay, Telok Blangah, Tanjong Pagar
    path: 'M 420,290 L 440,340 L 490,355 L 550,340 L 590,300 L 660,330 L 635,370 L 575,395 L 490,405 L 430,395 L 390,345 Z',
    centroid: [520, 360],
    name: 'South'
  }
};

// Offshore islands for authentic Singapore geography
const ISLAND_PATHS = [
  // Sentosa
  { id: 'sentosa', path: 'M 460,425 Q 510,420 545,435 Q 520,455 470,445 Z', name: 'Sentosa Island' },
  // Jurong Island
  { id: 'jurong_island', path: 'M 270,420 L 330,410 L 360,445 L 340,480 L 280,470 Z', name: 'Jurong Island' },
  // Pulau Ubin
  { id: 'pulau_ubin', path: 'M 770,140 Q 825,135 845,155 Q 815,170 765,160 Z', name: 'Pulau Ubin' },
  // Pulau Tekong
  { id: 'pulau_tekong', path: 'M 880,145 Q 940,150 945,190 Q 890,210 865,175 Z', name: 'Pulau Tekong' }
];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  snapshot,
  selectedRegion,
  onSelectRegion,
  onGeolocateUser,
  geoStatusMessage
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredRegion, setHoveredRegion] = useState<RegionKey | null>(null);
  const [showWindVectors, setShowWindVectors] = useState(true);
  const [showStations, setShowStations] = useState(true);

  const handleZoomIn = () => setZoom((prev) => Math.min(2.2, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.85, prev - 0.25));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const activeRegion = hoveredRegion || (selectedRegion !== 'national' ? selectedRegion : null);
  const activeReading = activeRegion ? snapshot.readings[activeRegion] : snapshot.readings.national;
  const activeMeta = activeRegion ? REGIONS[activeRegion] : REGIONS.national;
  const activeBand = getPsiBand(activeReading.psi24h);
  const activePM25Band = getPM25Band(activeReading.pm25OneHourly);

  return (
    <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* Map Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-slate-100">
              Singapore Haze & Air Quality Map
            </span>
            <span className="text-xs text-slate-400 font-mono">
              NEA 5-Zone Radar
            </span>
          </div>

          {geoStatusMessage && (
            <span className="text-xs px-2.5 py-1 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono">
              {geoStatusMessage}
            </span>
          )}
        </div>

        {/* View toggles & Map tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWindVectors(!showWindVectors)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showWindVectors
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Monsoon Wind Direction"
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Monsoon Wind</span>
          </button>

          <button
            onClick={() => setShowStations(!showStations)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showStations
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle NEA Monitoring Stations"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Stations</span>
          </button>

          {onGeolocateUser && (
            <button
              onClick={onGeolocateUser}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              title="Locate my position in Singapore"
            >
              <Locate className="w-3.5 h-3.5 text-cyan-400" />
              <span>Locate Me</span>
            </button>
          )}

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas SVG Container */}
      <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] bg-slate-950 flex items-center justify-center select-none overflow-hidden cursor-grab active:cursor-grabbing">
        {/* Subtle coordinate grid lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Singapore Map SVG */}
        <svg
          viewBox="0 0 1000 560"
          className="w-full h-full transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            {/* Filter glow for hovered region */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Pattern for water around Singapore Straits */}
            <pattern id="straitsGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 40 M 0 0 L 40 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* Water background */}
          <rect width="1000" height="560" fill="url(#straitsGrid)" opacity="0.4" />

          {/* Johor / Malaysia Border Reference Outline (North) */}
          <path
            d="M 120,60 Q 300,40 500,30 Q 700,45 880,70"
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.5"
          />
          <text x="500" y="35" fill="#475569" fontSize="11" fontFamily="IBM Plex Mono" textAnchor="middle" letterSpacing="2">
            JOHOR STRAIT (MALAYSIA)
          </text>

          {/* Singapore Strait Reference (South) */}
          <text x="500" y="525" fill="#475569" fontSize="11" fontFamily="IBM Plex Mono" textAnchor="middle" letterSpacing="2">
            SINGAPORE STRAIT (INDONESIA)
          </text>

          {/* Offshore Islands */}
          {ISLAND_PATHS.map((island) => (
            <path
              key={island.id}
              d={island.path}
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1"
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <title>{island.name}</title>
            </path>
          ))}

          {/* 5 Main Regions Polygons */}
          {(['north', 'west', 'central', 'east', 'south'] as const).map((rKey) => {
            const regionData = REGION_PATHS[rKey];
            const reading = snapshot.readings[rKey];
            const band = getPsiBand(reading.psi24h);
            const isSelected = selectedRegion === rKey;
            const isHovered = hoveredRegion === rKey;

            return (
              <g
                key={rKey}
                onClick={() => onSelectRegion(rKey)}
                onMouseEnter={() => setHoveredRegion(rKey)}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-pointer"
              >
                {/* Region boundary polygon */}
                <path
                  d={regionData.path}
                  fill={band.accentHex}
                  fillOpacity={isSelected ? 0.42 : isHovered ? 0.32 : 0.22}
                  stroke={isSelected ? '#38bdf8' : band.accentHex}
                  strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                  filter={isSelected || isHovered ? 'url(#glow)' : undefined}
                  className="transition-all duration-200"
                />

                {/* Region Label at Centroid */}
                <text
                  x={regionData.centroid[0]}
                  y={regionData.centroid[1] - 16}
                  fill="#f8fafc"
                  fontSize="14"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans"
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow"
                >
                  {regionData.name.toUpperCase()}
                </text>

                {/* Live PSI Badge inside region */}
                <g transform={`translate(${regionData.centroid[0]}, ${regionData.centroid[1] + 10})`}>
                  <rect
                    x="-38"
                    y="-14"
                    width="76"
                    height="28"
                    rx="6"
                    fill="#0f172a"
                    stroke={band.accentHex}
                    strokeWidth="1.5"
                    className="shadow-lg"
                  />
                  <text
                    x="0"
                    y="5"
                    fill={band.accentHex}
                    fontSize="13"
                    fontWeight="700"
                    fontFamily="IBM Plex Mono"
                    textAnchor="middle"
                    className="tabular-nums"
                  >
                    PSI {reading.psi24h}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Monitoring Station Pins */}
          {showStations &&
            (['north', 'west', 'central', 'east', 'south'] as const).map((rKey) => {
              const regionData = REGION_PATHS[rKey];
              const reading = snapshot.readings[rKey];
              const band = getPsiBand(reading.psi24h);

              return (
                <g key={`station-${rKey}`} transform={`translate(${regionData.centroid[0] + 45}, ${regionData.centroid[1] - 30})`}>
                  {/* Subtle radar pulse ring */}
                  <circle
                    r="9"
                    fill="none"
                    stroke={band.accentHex}
                    strokeWidth="1"
                    opacity="0.6"
                    className="animate-ping"
                    style={{ animationDuration: '3s' }}
                  />
                  <circle
                    r="4"
                    fill={band.accentHex}
                  />
                  <text
                    x="8"
                    y="4"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="IBM Plex Mono"
                    className="font-medium pointer-events-none"
                  >
                    {reading.pm25OneHourly} µg/m³
                  </text>
                </g>
              );
            })}

          {/* Wind Direction Indicator & Dispersion Plume */}
          {showWindVectors && (
            <g transform="translate(100, 110)">
              {/* Compass Ring */}
              <circle r="36" fill="#0f172a" stroke="#334155" strokeWidth="1.5" opacity="0.9" />
              {/* Arrow rotated according to wind vector */}
              <g transform={`rotate(${snapshot.wind.degrees})`}>
                <line x1="0" y1="26" x2="0" y2="-26" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow)" />
                <polygon points="0,-28 -6,-16 6,-16" fill="#38bdf8" />
              </g>
              <circle r="3" fill="#38bdf8" />
              <text x="0" y="-42" fill="#64748b" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle">
                N
              </text>
              <text x="0" y="48" fill="#e2e8f0" fontSize="10" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="600">
                {snapshot.wind.direction} {snapshot.wind.speedKnots}kt
              </text>
            </g>
          )}
        </svg>

        {/* Floating Active Region Quick Inspector Card (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 max-w-xs w-full bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="text-xs font-mono text-slate-400">
                {activeRegion ? 'SELECTED STATION' : 'NATIONAL SUMMARY'}
              </div>
              <div className="text-base font-bold text-slate-100">
                {activeMeta.name}
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${activeBand.bgColor} ${activeBand.textColor} border ${activeBand.borderColor}`}>
              {activeBand.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 mb-2">
            <div>
              <span className="text-slate-500 block text-[10px]">24-HR PSI</span>
              <span className={`text-xl font-bold ${activeBand.textColor} tabular-nums`}>
                {activeReading.psi24h}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">1-HR PM2.5</span>
              <span className="text-xl font-bold text-slate-200 tabular-nums">
                {activeReading.pm25OneHourly}{' '}
                <span className="text-[10px] font-normal text-slate-400">µg/m³</span>
              </span>
              <span className={`text-[10px] block ${activePM25Band.textColor}`}>
                {activePM25Band.bandName}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 line-clamp-2">
            {activeBand.summary}
          </div>

          {activeRegion && activeRegion !== 'national' && (
            <div className="mt-2 text-[10px] text-slate-400">
              Coverage: {activeMeta.towns.slice(0, 3).join(', ')}...
            </div>
          )}
        </div>

        {/* Map Legend (Bottom-Right) */}
        <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-lg backdrop-blur-md hidden sm:block">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
            Singapore NEA PSI Scale
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
              <span className="text-slate-300 font-mono text-[11px] w-14">0 – 50</span>
              <span className="text-emerald-400 font-medium">Good</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 shrink-0" />
              <span className="text-slate-300 font-mono text-[11px] w-14">51 – 100</span>
              <span className="text-cyan-400 font-medium">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
              <span className="text-slate-300 font-mono text-[11px] w-14">101 – 200</span>
              <span className="text-amber-400 font-medium">Unhealthy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" />
              <span className="text-slate-300 font-mono text-[11px] w-14">201 – 300</span>
              <span className="text-rose-400 font-medium">Very Unhealthy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 shrink-0" />
              <span className="text-slate-300 font-mono text-[11px] w-14">301+</span>
              <span className="text-purple-400 font-medium">Hazardous</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
