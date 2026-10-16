/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AirQualitySnapshot, RegionKey, REGIONS } from '../types/psi';
import { getHealthAdvisory, getPsiBand, PSI_BANDS } from '../utils/constants';
import { HeartPulse, Info, ShieldAlert, Sparkles, UserCheck, Users } from 'lucide-react';

interface HealthAdvisorySectionProps {
  snapshot: AirQualitySnapshot;
  selectedRegion: RegionKey;
}

export const HealthAdvisorySection: React.FC<HealthAdvisorySectionProps> = ({
  snapshot,
  selectedRegion
}) => {
  const currentRegion = snapshot.readings[selectedRegion] || snapshot.readings.national;
  const currentPsi = currentRegion.psi24h;
  const currentBand = getPsiBand(currentPsi);
  const advisories = getHealthAdvisory(currentPsi);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Singapore Health & Activity Advisory
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Official guidelines aligned with Singapore Ministry of Health (MOH) & NEA standards
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Current Band</div>
            <div className={`text-sm font-bold ${currentBand.textColor}`}>
              {currentBand.label} (PSI {currentPsi})
            </div>
          </div>
          <div className={`w-3.5 h-3.5 rounded-full ${currentBand.badgeBg}`} />
        </div>
      </div>

      {/* Two Column Health Guidance: Healthy vs Vulnerable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {advisories.map((item, idx) => {
          const isVulnerable = item.targetGroup === 'vulnerable';

          return (
            <div
              key={idx}
              className={`p-5 rounded-xl border ${
                isVulnerable
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-cyan-950/20 border-cyan-500/30'
              } flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  {isVulnerable ? (
                    <Users className="w-5 h-5 text-rose-400 shrink-0" />
                  ) : (
                    <UserCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                  )}
                  <h3 className="text-sm font-bold text-slate-100">
                    {item.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {item.advice}
                </p>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Outdoor Strenuous Exertion
                    </span>
                    <span className="text-slate-200 font-medium">
                      {item.outdoorStrenuous}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Mask Recommendation
                    </span>
                    <span className="text-slate-200 font-medium">
                      {item.maskRecommendation}
                    </span>
                  </div>
                </div>
              </div>

              {isVulnerable && (
                <div className="mt-4 pt-3 border-t border-rose-500/20 text-[11px] text-rose-300">
                  Note: Includes seniors aged ≥65, children, pregnant women, and individuals with heart disease or asthma.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* NEA Haze Action Reference Table */}
      <div className="pt-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 font-semibold">
          Singapore 24-hr PSI Health Matrix Overview
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 font-mono text-[11px] text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">24-hr PSI Band</th>
                <th className="py-2.5 px-3">Healthy Persons</th>
                <th className="py-2.5 px-3">Vulnerable Groups</th>
                <th className="py-2.5 px-3">N95 Mask Advice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-emerald-400">0 – 50 (Good)</td>
                <td className="py-2.5 px-3">Normal activities</td>
                <td className="py-2.5 px-3">Normal activities</td>
                <td className="py-2.5 px-3 text-slate-400">Not needed</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-cyan-400">51 – 100 (Moderate)</td>
                <td className="py-2.5 px-3">Normal activities</td>
                <td className="py-2.5 px-3">Normal activities</td>
                <td className="py-2.5 px-3 text-slate-400">Not needed</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-amber-400">101 – 200 (Unhealthy)</td>
                <td className="py-2.5 px-3">Reduce prolonged strenuous exertion</td>
                <td className="py-2.5 px-3">Avoid prolonged strenuous exertion</td>
                <td className="py-2.5 px-3 text-amber-300">Advised for prolonged outdoor exposure</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-rose-400">201 – 300 (Very Unhealthy)</td>
                <td className="py-2.5 px-3">Avoid prolonged strenuous exertion</td>
                <td className="py-2.5 px-3">Avoid outdoor activity</td>
                <td className="py-2.5 px-3 text-rose-300">Recommended for all outdoor trips</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-purple-400">301+ (Hazardous)</td>
                <td className="py-2.5 px-3">Minimise outdoor activity</td>
                <td className="py-2.5 px-3">Stay indoors, close windows</td>
                <td className="py-2.5 px-3 text-purple-300">Mandatory when stepping out</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Practical Tips Callout */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-100 block">
            Why Surgical Masks Do Not Protect Against Haze:
          </span>
          <p className="text-slate-400">
            Surgical masks and cotton masks are designed to trap large respiratory droplets, not fine PM2.5 particulates.
            When PSI exceeds 100, only certified N95 respirators properly fitted over the nose and mouth can filter out 95% of airborne particulate matter.
          </p>
        </div>
      </div>
    </div>
  );
};
