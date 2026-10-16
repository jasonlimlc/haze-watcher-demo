/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NotificationLogItem } from '../types/psi';
import { PSI_BANDS } from '../utils/constants';
import { BellRing, CheckCircle, Clock, Trash2, Zap } from 'lucide-react';

interface AlertNotificationLogProps {
  history: NotificationLogItem[];
  onClearHistory: () => void;
  onTriggerTestAlert: () => void;
}

export const AlertNotificationLog: React.FC<AlertNotificationLogProps> = ({
  history,
  onClearHistory,
  onTriggerTestAlert
}) => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Air Quality Incident & Notification Log
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Recorded instances when Singapore air quality exceeded user alert thresholds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerTestAlert}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Test Alert Trigger</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Log list */}
      {history.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-400/60 mx-auto" />
          <p className="text-sm font-medium text-slate-300">No Haze Threshold Incidents Recorded</p>
          <p className="text-xs max-w-sm mx-auto text-slate-400">
            All Singapore monitoring stations are currently reporting levels within safe thresholds.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const bandInfo = PSI_BANDS[item.band] || PSI_BANDS.moderate;
            const formattedDate = new Date(item.timestamp).toLocaleString('en-SG', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Singapore'
            });

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">
                      {item.title}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${bandInfo.bgColor} ${bandInfo.textColor} ${bandInfo.borderColor}`}>
                      {bandInfo.label.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.body}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formattedDate} SGT</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Station: {item.regionName}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1 shrink-0 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    Readings
                  </div>
                  <div className="flex sm:flex-col items-baseline gap-2 sm:gap-0">
                    <span className={`text-base font-bold font-mono tabular-nums ${bandInfo.textColor}`}>
                      PSI {item.psi}
                    </span>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {item.pm25} µg/m³
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
