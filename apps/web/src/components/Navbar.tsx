import React from 'react';
import { Activity, ShieldAlert, Cpu, BarChart3, Bot, FileText, Zap, Radio } from 'lucide-react';
import { FleetSummary } from '../services/api';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  summary: FleetSummary | null;
  onOpenCopilot: () => void;
  onOpenScenarios: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  summary,
  onOpenCopilot,
  onOpenScenarios
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">FleetPulse</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  COMMAND v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Global Logistics Corp • 100K Fleet Stream</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('command')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'command'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Command Centre</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'queue'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Risk Queue</span>
              {summary && summary.critical_alerts_count > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-red-500/30 text-red-300 border border-red-500/40 rounded-full text-[10px] font-bold">
                  {summary.critical_alerts_count}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'vehicles'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Vehicle Intel</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & ML</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'audit'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Log</span>
            </button>
          </nav>

          {/* Action Tools & Status */}
          <div className="flex items-center space-x-2">
            {/* Live Streaming Indicator */}
            <div className="hidden lg:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 radar-dot"></span>
              <span className="text-emerald-400 font-semibold">{summary ? summary.events_per_sec.toLocaleString() : '104,520'}</span>
              <span className="text-slate-500">EPS</span>
              <span className="text-slate-700">|</span>
              <span className="text-sky-400">{summary ? summary.ingestion_latency_ms : '12.4'}ms</span>
            </div>

            {/* Scenario Injection Trigger */}
            <button
              onClick={onOpenScenarios}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 flex items-center space-x-1 transition-all"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">Scenario Lab</span>
            </button>

            {/* Copilot Trigger */}
            <button
              onClick={onOpenCopilot}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fleet Copilot</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
