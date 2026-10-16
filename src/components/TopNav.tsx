/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, ShieldAlert } from 'lucide-react';

interface TopNavProps {
  activeTab: 'map' | 'trends' | 'advisory' | 'log' | 'simulator';
  onTabChange: (tab: 'map' | 'trends' | 'advisory' | 'log' | 'simulator') => void;
  onOpenSettings: () => void;
  notificationsGranted: boolean;
  alertCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  notificationsGranted,
  alertCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element, no subtitle in header) */}
        <a
          href="#map"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('map');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2 whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors"
        >
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <span>AirGuard SG</span>
        </a>

        {/* Zone 2: 4–5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onTabChange('map')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
              activeTab === 'map'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            Live Map
          </button>

          <button
            onClick={() => onTabChange('trends')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
              activeTab === 'trends'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            24h Trends
          </button>

          <button
            onClick={() => onTabChange('advisory')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
              activeTab === 'advisory'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            Health Advisory
          </button>

          <button
            onClick={() => onTabChange('log')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'log'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <span>Alerts Log</span>
            {alertCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-400 border border-cyan-800 font-mono">
                {alertCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('simulator')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
              activeTab === 'simulator'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            Haze Simulator
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Configure Alerts</span>
            {notificationsGranted && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" title="Notifications active" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Secondary Navigation Row for responsive thumb interaction */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto text-xs">
        <button
          onClick={() => onTabChange('map')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'map' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Map
        </button>
        <button
          onClick={() => onTabChange('trends')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'trends' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Trends
        </button>
        <button
          onClick={() => onTabChange('advisory')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'advisory' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Advisory
        </button>
        <button
          onClick={() => onTabChange('log')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'log' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Log ({alertCount})
        </button>
        <button
          onClick={() => onTabChange('simulator')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'simulator' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Haze Sim
        </button>
      </div>
    </header>
  );
};
