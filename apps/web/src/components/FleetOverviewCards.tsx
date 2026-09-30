import React from 'react';
import { ArrowUpRight, MoreHorizontal, ShieldCheck, Zap } from 'lucide-react';
import { FleetSummary } from '../services/api';

interface FleetOverviewCardsProps {
  summary: FleetSummary | null;
}

export const FleetOverviewCards: React.FC<FleetOverviewCardsProps> = ({ summary }) => {
  const activeCount = summary ? summary.active_vehicles : 10000;
  const totalCount = summary ? summary.total_vehicles : 10000;
  const highRisk = summary ? summary.high_risk_vehicles : 1420;
  const criticalCount = summary ? summary.critical_alerts_count : 366;
  const nominalCount = Math.max(0, totalCount - highRisk - criticalCount);
  const eps = summary ? summary.events_per_sec : 104520;
  const latency = summary ? summary.ingestion_latency_ms : 12.4;
  const uptime = summary ? summary.system_health_pct : 99.98;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
      {/* Card 1: Fleet Reliability Index (Vibrant Royal Blue Gradient Card matching Dribbble shot) */}
      <div className="rounded-[24px] p-6 bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#60A5FA] text-white shadow-xl shadow-blue-500/10 relative overflow-hidden flex flex-col justify-between min-h-[185px]">
        {/* Soft background ambient glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-200" />
            <span className="text-xs font-semibold text-blue-100 tracking-wide uppercase">Fleet Reliability Index</span>
          </div>
          <button 
            title="Inspect Stream Metrics"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 my-3">
          <div className="text-3xl sm:text-4xl font-black tracking-tight font-sans">
            99.4%
          </div>
          <div className="text-[11px] text-blue-100/90 font-mono mt-0.5">
            {eps.toLocaleString()} EPS • 0.012ms Watermark Lag
          </div>
        </div>

        <div className="relative z-10 flex items-center space-x-2">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm">
            <span>+1.9%</span>
          </div>
          <span className="text-[11px] text-blue-100">Uptime vs previous 30 days</span>
        </div>
      </div>

      {/* Card 2: Active Connected Units */}
      <div className="rounded-[24px] p-6 bg-white border border-[#E5E9F2] shadow-[0_4px_25px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col justify-between min-h-[185px]">
        {/* Subtle decorative curved shape on bottom right */}
        <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-blue-50/60 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Connected Units</span>
          <button 
            title="View Fleet Registry"
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 my-3">
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-sans">
            {totalCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {nominalCount.toLocaleString()} Nominal • {highRisk.toLocaleString()} Watchlist • {criticalCount.toLocaleString()} Grounded
          </div>
        </div>

        <div className="relative z-10 flex items-center space-x-2">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold">
            <span>+1.2%</span>
          </div>
          <span className="text-[11px] text-slate-500">Fleet telemetry coverage</span>
        </div>
      </div>

      {/* Card 3: System SLA & Asset Health */}
      <div className="rounded-[24px] p-6 bg-white border border-[#E5E9F2] shadow-[0_4px_25px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col justify-between min-h-[185px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">System SLA & Health</span>
          <button 
            title="SLA Details"
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="my-2">
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-sans">
            {uptime}% <span className="text-lg font-bold text-slate-400">SLA</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            $9,421,642 Protected Valuation • p95: {latency.toFixed(1)}ms
          </div>
        </div>

        {/* Multi-Tone Progress Pill matching Dribbble template */}
        <div className="space-y-2">
          <div className="w-full h-3 rounded-full bg-slate-100 p-0.5 flex overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full w-[82%] rounded-l-full" />
            <div className="bg-amber-400 h-full w-[14%]" />
            <div className="bg-rose-500 h-full w-[4%] rounded-r-full" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Nominal (82%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Watchlist (14%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Grounded (4%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
