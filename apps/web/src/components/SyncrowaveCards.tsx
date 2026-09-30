import React from 'react';
import { ArrowUpRight, MoreHorizontal, TrendingUp } from 'lucide-react';
import { FleetSummary } from '../services/api';

interface SyncrowaveCardsProps {
  summary: FleetSummary | null;
}

export const SyncrowaveCards: React.FC<SyncrowaveCardsProps> = ({ summary }) => {
  const activeCount = summary ? summary.active_vehicles : 10000;
  const totalCount = summary ? summary.total_vehicles : 10000;
  const highRisk = summary ? summary.high_risk_vehicles : 555;
  const criticalCount = summary ? summary.critical_alerts_count : 0;
  const avgRisk = summary ? summary.avg_fleet_risk_score : 24.9;
  const eps = summary ? summary.events_per_sec : 104520;
  const latency = summary ? summary.ingestion_latency_ms : 12.4;
  const uptime = summary ? summary.system_health_pct : 99.98;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
      {/* Card 1: Overall Revenue / Fleet Reliability (Vibrant Royal Blue Gradient Card) */}
      <div className="rounded-[24px] p-6 bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#60A5FA] text-white shadow-xl shadow-blue-500/10 relative overflow-hidden flex flex-col justify-between min-h-[175px]">
        {/* Soft background ambient glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-medium text-blue-100">Overall Revenue</span>
          <button className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 my-3">
          <div className="text-3xl sm:text-4xl font-black tracking-tight font-sans">
            $25,912
          </div>
          <div className="text-[11px] text-blue-100/80 font-mono mt-0.5">
            Fleet Reliability Index: 99.4% • {eps.toLocaleString()} EPS
          </div>
        </div>

        <div className="relative z-10 flex items-center space-x-2">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm">
            <span>+1.9%</span>
          </div>
          <span className="text-[11px] text-blue-100">Than last month</span>
        </div>
      </div>

      {/* Card 2: Total Insight / Active Fleet Volume */}
      <div className="rounded-[24px] p-6 bg-white border border-[#E5E9F2] shadow-[0_4px_25px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col justify-between min-h-[175px]">
        {/* Subtle decorative curved shape on bottom right */}
        <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-blue-50/60 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Total Insight</span>
          <button className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 my-3">
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-sans">
            129,521
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {activeCount.toLocaleString()} Connected Units Active
          </div>
        </div>

        <div className="relative z-10 flex items-center space-x-2">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[11px] font-semibold">
            <span>+1.2%</span>
          </div>
          <span className="text-[11px] text-slate-500">Than last month</span>
        </div>
      </div>

      {/* Card 3: Finance Balance / System Health & SLA */}
      <div className="rounded-[24px] p-6 bg-white border border-[#E5E9F2] shadow-[0_4px_25px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col justify-between min-h-[175px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Finance Balance</span>
          <button className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="my-2">
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-sans">
            $9,421,642
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            System SLA: {uptime}% • p95 Latency: {latency.toFixed(1)}ms
          </div>
        </div>

        {/* Syncrowave Multi-Tone Progress Pill */}
        <div className="space-y-2">
          <div className="w-full h-3 rounded-full bg-slate-100 p-0.5 flex overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[65%] rounded-l-full" />
            <div className="bg-blue-300 h-full w-[25%]" />
            <div className="bg-slate-200 h-full w-[10%] rounded-r-full" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Profit</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-300" />
              <span>Total Earning</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span>Total Target</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
