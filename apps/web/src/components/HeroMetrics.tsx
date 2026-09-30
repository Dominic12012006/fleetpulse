import React from 'react';
import { 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  Zap, 
  Truck, 
  Gauge, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';
import { FleetSummary } from '../services/api';

interface HeroMetricsProps {
  summary: FleetSummary | null;
}

export const HeroMetrics: React.FC<HeroMetricsProps> = ({ summary }) => {
  const activeCount = summary ? summary.active_vehicles : 10000;
  const totalCount = summary ? summary.total_vehicles : 10000;
  const highRisk = summary ? summary.high_risk_vehicles : 555;
  const criticalCount = summary ? summary.critical_alerts_count : 0;
  const avgRisk = summary ? summary.avg_fleet_risk_score : 24.9;
  const eps = summary ? summary.events_per_sec : 104520;
  const latency = summary ? summary.ingestion_latency_ms : 12.4;
  const uptime = summary ? summary.system_health_pct : 99.98;

  return (
    <div className="space-y-4 font-sans">
      {/* Syncrowave Hero Gradient Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900/40 via-indigo-950/60 to-slate-900 border border-sky-500/20 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
        {/* Ambient background decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                SyncroWave Operational Telematics
              </span>
              <span className="text-xs text-slate-400 font-mono">100,000 Fleet Deployment</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Fleet Reliability Index: <span className="text-sky-400 font-mono">99.4%</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-time multi-OEM telemetry streams are continuously normalized, evaluated with Flink watermarked sliding windows, and prioritized via our validated Priority = Probability × Impact × Urgency risk decision engine.
            </p>
          </div>

          {/* Quick Metrics Cluster Inside Hero Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium">Uptime Health</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold font-mono text-white">{uptime}%</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">+0.04% this week</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium">Stream Velocity</span>
                <Zap className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-lg font-bold font-mono text-sky-300">{(eps / 1000).toFixed(1)}k <span className="text-xs font-normal">EPS</span></div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{latency.toFixed(1)}ms p95 latency</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium">Critical Faults</span>
                <ShieldAlert className={`w-3.5 h-3.5 ${criticalCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
              </div>
              <div className={`text-lg font-bold font-mono ${criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {criticalCount}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{highRisk} requiring triage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row of Syncrowave-Style Companion Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Vehicles */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Fleet Monitored</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-white">
              {activeCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {totalCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <span className="bg-sky-500 h-full w-[60%]" title="ICE" />
                <span className="bg-emerald-500 h-full w-[30%]" title="EV" />
                <span className="bg-amber-500 h-full w-[10%]" title="Hybrid" />
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>60% ICE</span>
              <span>30% EV</span>
              <span>10% Hybrid</span>
            </div>
          </div>
        </div>

        {/* Card 2: Average Risk Priority */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Avg Fleet Risk Score</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-white flex items-baseline space-x-2">
              <span>{avgRisk.toFixed(1)}</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Safe Nominal
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full"
                style={{ width: `${Math.min(100, avgRisk)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>Low (0-30)</span>
              <span>Medium (30-60)</span>
              <span>High (60+)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Prioritized Risk Queue */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">High Risk Queue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-amber-400">
              {highRisk} <span className="text-xs font-normal text-slate-500">vehicles</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Ranked by Impact × Urgency</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Top fault: Thermal velocity & ABS
            </div>
          </div>
        </div>

        {/* Card 4: Ingestion Performance SLA */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Ingestion & Watermark</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-emerald-400">
              0.012 ms <span className="text-xs font-normal text-slate-500">p95 engine</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>5s Watermark Tolerance</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              LRU Deduplication Filter: 100% active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
