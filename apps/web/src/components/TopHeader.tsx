import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Flame, 
  Bot, 
  Radio, 
  Building2, 
  Sparkles,
  Command
} from 'lucide-react';
import { FleetSummary, UserSession } from '../services/api';

interface TopHeaderProps {
  summary: FleetSummary | null;
  user: UserSession;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCopilot: () => void;
  onOpenScenarios: () => void;
  openAlertsCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  summary,
  user,
  searchQuery,
  onSearchChange,
  onOpenCopilot,
  onOpenScenarios,
  openAlertsCount
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeStr(now.toUTCString().slice(17, 25) + ' UTC');
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 font-sans">
      {/* Search Input Bar */}
      <div className="flex items-center space-x-3 w-full max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search VIN, license plate, model, driver..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800/90 rounded-xl pl-9 pr-12 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all"
          />
          <div className="absolute right-2.5 top-2 flex items-center space-x-0.5 text-[10px] text-slate-500 bg-slate-800/80 border border-slate-700/60 rounded px-1.5 py-0.5 pointer-events-none">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Utility & Status Cluster */}
      <div className="flex items-center space-x-3.5">
        {/* Real-time Streaming Ingestion Health Badge */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-400">Stream:</span>
          <span className="text-emerald-400 font-bold">
            {summary ? `${summary.events_per_sec.toLocaleString()} EPS` : '104,520 EPS'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">p95:</span>
          <span className="text-sky-400 font-bold">
            {summary ? `${summary.ingestion_latency_ms.toFixed(1)}ms` : '12.4ms'}
          </span>
        </div>

        {/* Operational Hub Indicator */}
        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-medium text-[11px]">Frankfurt & Rotterdam Hubs</span>
        </div>

        {/* Live Clock */}
        <div className="hidden xl:block text-[11px] font-mono text-slate-500 bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
          {timeStr}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Quick Scenario Lab Trigger */}
          <button
            onClick={onOpenScenarios}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all shadow-sm"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Chaos Lab</span>
          </button>

          {/* Quick Fleet Copilot Trigger */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fleet Copilot</span>
          </button>

          {/* Notification Alert Bell */}
          <div className="relative">
            <button 
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {openAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center font-mono animate-bounce">
                  {openAlertsCount > 9 ? '9+' : openAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
