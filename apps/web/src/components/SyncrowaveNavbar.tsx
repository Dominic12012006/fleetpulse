import React from 'react';
import { 
  Activity, 
  Search, 
  Bell, 
  LogOut, 
  User, 
  Flame, 
  Bot, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { UserSession } from '../services/api';

interface SyncrowaveNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserSession;
  onLogout: () => void;
  openAlertsCount: number;
  onOpenCopilot: () => void;
  onOpenScenarios: () => void;
}

export const SyncrowaveNavbar: React.FC<SyncrowaveNavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  openAlertsCount,
  onOpenCopilot,
  onOpenScenarios
}) => {
  const navItems = [
    { id: 'command', label: 'Overview' },
    { id: 'map', label: 'Telemetry Map' },
    { id: 'queue', label: 'Risk Queue', count: openAlertsCount },
    { id: 'vehicles', label: 'Vehicle Intel' },
    { id: 'analytics', label: 'Predictive ML' },
    { id: 'audit', label: 'Audit Trail' }
  ];

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700',
    FLEET_MANAGER: 'bg-blue-100 text-blue-700',
    DISPATCHER: 'bg-amber-100 text-amber-700',
    SAFETY_OFFICER: 'bg-rose-100 text-rose-700',
    TECHNICIAN: 'bg-emerald-100 text-emerald-700'
  };

  return (
    <nav className="bg-white border-b border-[#EBEFF5] px-6 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur-md bg-white/95 font-sans">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Brand Left */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
              Syncrowave <span className="text-blue-600 font-normal">FleetPulse</span>
            </span>
          </div>
        </div>

        {/* Center Pill Navigation Container matching Dribbble shot */}
        <div className="hidden md:flex items-center bg-[#F4F6FA] p-1 rounded-full border border-[#E8ECF2]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Utilities: Search, Bell, Chaos Lab, Copilot, User */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Chaos Lab Preset */}
          <button
            onClick={onOpenScenarios}
            title="Inject Chaos Scenario"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden lg:inline">Chaos Lab</span>
          </button>

          {/* Copilot Trigger */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Fleet Copilot</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button className="w-9 h-9 rounded-full bg-[#F4F6FA] hover:bg-slate-100 border border-[#E8ECF2] flex items-center justify-center text-slate-600 transition-colors">
              <Bell className="w-4 h-4" />
              {openAlertsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
              )}
            </button>
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center space-x-2.5 pl-1.5 border-l border-slate-200">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
            </div>

            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">{user.name.split(' ')[0]}</div>
              <span className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded-full mt-0.5 ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
                {user.role.replace('_', ' ')}
              </span>
            </div>

            <button
              onClick={onLogout}
              title="Log out"
              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
