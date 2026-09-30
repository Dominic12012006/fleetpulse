import React from 'react';
import { 
  LayoutDashboard, 
  Compass, 
  AlertTriangle, 
  Cpu, 
  BarChart3, 
  ShieldCheck, 
  Flame, 
  Bot, 
  LogOut, 
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { UserSession } from '../services/api';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserSession;
  onLogout: () => void;
  openAlertsCount: number;
  onOpenCopilot: () => void;
  onOpenScenarios: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  openAlertsCount,
  onOpenCopilot,
  onOpenScenarios
}) => {
  const roleBadges: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    FLEET_MANAGER: { label: 'Fleet Ops Manager', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
    DISPATCHER: { label: 'Lead Dispatcher', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    SAFETY_OFFICER: { label: 'Safety Officer', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    TECHNICIAN: { label: 'Diagnostic Tech', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
  };

  const currentRoleBadge = roleBadges[user.role] || { label: user.role, color: 'bg-slate-800 text-slate-300 border-slate-700' };

  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'command', label: 'Command Centre', icon: LayoutDashboard },
        { id: 'map', label: 'Live Telemetry Map', icon: Compass },
        { 
          id: 'queue', 
          label: 'Priority Risk Queue', 
          icon: AlertTriangle, 
          badge: openAlertsCount > 0 ? String(openAlertsCount) : undefined,
          badgeColor: openAlertsCount > 0 ? 'bg-rose-500 text-white' : undefined
        },
        { id: 'vehicles', label: 'Vehicle Intel & DTCs', icon: Cpu }
      ]
    },
    {
      title: 'INTELLIGENCE & AUDIT',
      items: [
        { id: 'analytics', label: 'ML Risk Analytics', icon: BarChart3 },
        { id: 'audit', label: 'Immutable Audit Log', icon: ShieldCheck }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 backdrop-blur-xl z-20 font-sans select-none">
      <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/10">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-black tracking-tight text-white font-mono">FleetPulse</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">SyncroWave Telematics</span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3.5 space-y-6 flex-1">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 px-3 tracking-wider font-mono uppercase">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-sky-500/15 text-sky-400 font-semibold shadow-sm ring-1 ring-sky-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full font-mono ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Interactive Actions */}
          <div className="space-y-1.5 pt-2">
            <div className="text-[10px] font-bold text-slate-500 px-3 tracking-wider font-mono uppercase">
              SIMULATION & COPILOT
            </div>
            <div className="space-y-1.5">
              <button
                onClick={onOpenScenarios}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-amber-300 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Flame className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Chaos Scenario Lab</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400 opacity-60" />
              </button>

              <button
                onClick={onOpenCopilot}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Bot className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span>Fleet Copilot AI</span>
                </div>
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-500/30 text-indigo-200">
                  Tool-use
                </span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Syncrowave User Profile Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center font-bold text-xs text-white">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <span className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded border ${currentRoleBadge.color}`}>
                {currentRoleBadge.label}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
