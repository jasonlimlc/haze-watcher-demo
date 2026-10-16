/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulationScenario } from '../services/psiApi';
import { AlertCircle, Flame, Shield, Sparkles, Wind, Zap } from 'lucide-react';

interface HazeSimulatorPanelProps {
  currentScenario: SimulationScenario;
  onSelectScenario: (scenario: SimulationScenario) => void;
  onTriggerInstantSpike: (psiValue: number) => void;
}

export const HazeSimulatorPanel: React.FC<HazeSimulatorPanelProps> = ({
  currentScenario,
  onSelectScenario,
  onTriggerInstantSpike
}) => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Singapore Haze Crisis Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Simulate regional transboundary haze events to test threshold alerts, map choropleths, and push notifications
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Mode: {currentScenario === 'live' ? 'Live Singapore NEA Feed' : 'Synthetic Simulation'}
        </span>
      </div>

      {/* Scenario Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Preset 1: Live NEA API */}
        <div
          onClick={() => onSelectScenario('live')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            currentScenario === 'live'
              ? 'bg-cyan-950/30 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-cyan-400 font-semibold text-sm">
            <Shield className="w-4 h-4" />
            <span>Live NEA Data Feed</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Directly pulls live 24-hr PSI and 1-hr PM2.5 feeds from official Singapore data.gov.sg servers.
          </p>
          <div className="text-[11px] font-mono text-slate-400">
            Target: Real-world conditions
          </div>
        </div>

        {/* Preset 2: Pristine Air */}
        <div
          onClick={() => onSelectScenario('pristine')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            currentScenario === 'pristine'
              ? 'bg-emerald-950/30 border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Clean Monsoon Day</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Post-downpour pristine air with Northeast monsoon winds. PSI ~24, PM2.5 ~8 µg/m³.
          </p>
          <div className="text-[11px] font-mono text-emerald-400">
            PSI 0–50: Good
          </div>
        </div>

        {/* Preset 3: Unhealthy Plume Surge */}
        <div
          onClick={() => onSelectScenario('unhealthy_spike')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            currentScenario === 'unhealthy_spike'
              ? 'bg-amber-950/30 border-amber-400 shadow-md ring-1 ring-amber-400/40'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Unhealthy Haze Surge</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Southwest monsoon winds carry smoke plumes into West & South Singapore. Triggers user push notification!
          </p>
          <div className="text-[11px] font-mono text-amber-400 font-bold">
            PSI 101–200: Unhealthy (Alert Triggers)
          </div>
        </div>

        {/* Preset 4: Severe Regional Emergency */}
        <div
          onClick={() => onSelectScenario('severe_crisis')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            currentScenario === 'severe_crisis'
              ? 'bg-rose-950/30 border-rose-400 shadow-md ring-1 ring-rose-400/40'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-rose-400 font-semibold text-sm">
            <Flame className="w-4 h-4" />
            <span>Severe Transboundary Haze</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Dense smoke blanket across the entire island. Islandwide PSI ~245, PM2.5 &gt;150 µg/m³. Urgent warning sirens.
          </p>
          <div className="text-[11px] font-mono text-rose-400 font-bold">
            PSI 201+: Very Unhealthy / Hazardous
          </div>
        </div>
      </div>

      {/* Manual Instant Spike Controls */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Rapid Haze Surge Injector
          </span>
          <span className="text-xs text-slate-400">
            Instantaneous threshold crossing simulation
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onTriggerInstantSpike(115)}
            className="px-3.5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Inject Spike: PSI 115 (Unhealthy)</span>
          </button>

          <button
            onClick={() => onTriggerInstantSpike(165)}
            className="px-3.5 py-2 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-semibold hover:bg-orange-500/30 transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Inject Spike: PSI 165 (High Haze)</span>
          </button>

          <button
            onClick={() => onTriggerInstantSpike(230)}
            className="px-3.5 py-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Inject Spike: PSI 230 (Very Unhealthy)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
