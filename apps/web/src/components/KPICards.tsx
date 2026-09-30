import React from 'react';
import { Truck, AlertTriangle, Zap, Gauge, CheckCircle2, ShieldAlert } from 'lucide-react';
import { FleetSummary } from '../services/api';

interface KPICardsProps {
  summary: FleetSummary | null;
}

export const KPICards: React.FC<KPICardsProps> = ({ summary }) => {
  if (!summary) return null;

  const cards = [
    {
      title: 'Monitored Fleet',
      value: summary.total_vehicles.toLocaleString(),
      sub: `${summary.active_vehicles.toLocaleString()} active on transit`,
      icon: Truck,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'High-Risk Vehicles',
      value: summary.high_risk_vehicles.toString(),
      sub: `Avg fleet risk: ${summary.avg_fleet_risk_score} / 100`,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Critical Risk Alerts',
      value: summary.critical_alerts_count.toString(),
      sub: 'Action required in <24h',
      icon: ShieldAlert,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20'
    },
    {
      title: 'Stream Ingestion',
      value: `${(summary.events_per_sec / 1000).toFixed(1)}k /s`,
      sub: 'Kafka + Flink real-time pipeline',
      icon: Zap,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Pipeline Latency (p95)',
      value: `${summary.ingestion_latency_ms} ms`,
      sub: 'SLA target: <200 ms (Passed)',
      icon: Gauge,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      title: 'System Health',
      value: `${summary.system_health_pct}%`,
      sub: '0 data loss • Multi-tenant active',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-lg border bg-slate-900/80 backdrop-blur-sm ${card.bg} transition-all hover:border-slate-700`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">{card.value}</div>
            <div className="text-[10px] text-slate-400 truncate mt-1">{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
};
