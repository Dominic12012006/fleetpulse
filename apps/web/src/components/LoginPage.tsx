import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Activity, 
  Truck, 
  Wrench, 
  Navigation, 
  Flame, 
  ArrowRight, 
  Lock, 
  Mail, 
  Sparkles,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { api, UserSession } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

interface Persona {
  id: string;
  name: string;
  role: 'SUPER_ADMIN' | 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'TECHNICIAN';
  roleLabel: string;
  email: string;
  icon: any;
  badgeColor: string;
  accent: string;
  description: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('manager@fleetpulse.io');
  const [password, setPassword] = useState('FleetPulse2026!');
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'TECHNICIAN'>('FLEET_MANAGER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personas: Persona[] = [
    {
      id: 'manager',
      name: 'Dominic Vance',
      role: 'FLEET_MANAGER',
      roleLabel: 'Fleet Operations Manager',
      email: 'manager@fleetpulse.io',
      icon: Truck,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      accent: 'text-blue-600',
      description: 'Prioritize risk alerts, schedule service work orders, inspect fleet health'
    },
    {
      id: 'dispatcher',
      name: 'Elena Rostova',
      role: 'DISPATCHER',
      roleLabel: 'Lead Route Dispatcher',
      email: 'dispatcher@fleetpulse.io',
      icon: Navigation,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      accent: 'text-amber-600',
      description: 'Live geographic map tracking, vehicle routing, priority dispatch'
    },
    {
      id: 'safety',
      name: 'Marcus Chen',
      role: 'SAFETY_OFFICER',
      roleLabel: 'Safety & Compliance Officer',
      email: 'safety@fleetpulse.io',
      icon: ShieldCheck,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      accent: 'text-rose-600',
      description: 'Harsh braking auditing, driver risk scoring, tamper-proof logs'
    },
    {
      id: 'technician',
      name: 'David Miller',
      role: 'TECHNICIAN',
      roleLabel: 'Senior Diagnostic Tech',
      email: 'tech@fleetpulse.io',
      icon: Wrench,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accent: 'text-emerald-600',
      description: 'Inspect active diagnostic DTCs, temperature velocity, component health'
    },
    {
      id: 'admin',
      name: 'Alex Mercer',
      role: 'SUPER_ADMIN',
      roleLabel: 'Super Administrator',
      email: 'admin@fleetpulse.io',
      icon: Sparkles,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      accent: 'text-purple-600',
      description: 'Full multi-tenant governance, chaos scenario injection, audit oversight'
    }
  ];

  async function handleLogin(targetEmail = email, targetPassword = password, targetRole = selectedRole) {
    setLoading(true);
    setError(null);
    try {
      const session = await api.login(targetEmail, targetPassword, targetRole);
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPersona(p: Persona) {
    setSelectedRole(p.role);
    setEmail(p.email);
    setPassword('FleetPulse2026!');
    handleLogin(p.email, 'FleetPulse2026!', p.role);
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] pointer-events-none opacity-60" />

      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 my-4"
      >
        {/* Left Side: FleetPulse Branding & Value Props */}
        <div className="lg:col-span-6 space-y-6 px-2 sm:px-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-sans">FleetPulse</span>
                <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                  v2.2
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Connected Vehicle Intelligence Platform</p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Enterprise Telematics with <span className="text-blue-600">Explainable AI Risk</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              Converts 100,000+ vehicle streaming events into ranked operational impact. Protect fleet uptime with real-time ML risk scoring and bounded AI copilot dispatch.
            </p>
          </div>

          {/* FleetPulse Gradient Card Highlight */}
          <div className="p-6 rounded-[24px] bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#60A5FA] text-white shadow-xl shadow-blue-500/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100">Live Production Ingestion</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold">104,520 EPS</span>
            </div>
            <div className="text-2xl font-black">99.4% Fleet Reliability</div>
            <div className="text-xs text-blue-100/90 leading-relaxed">
              Priority = RiskProbability × ImpactExposure × UrgencyFactor validated by Gradient-Boosted Tabular ML.
            </div>
          </div>
        </div>

        {/* Right Side: Role-Based Quick Access & Login Card */}
        <div className="lg:col-span-6 bg-white border border-[#E5E9F2] rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.04)] relative">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Select Persona or Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an operator persona for instant 1-click evaluation, or sign in below.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Quick Persona Selector */}
          <div className="space-y-2 mb-6">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              1-Click Operator Persona Switcher
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {personas.map((p) => {
                const Icon = p.icon;
                const isCurrent = selectedRole === p.role;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPersona(p)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isCurrent 
                        ? `${p.badgeColor} ring-2 ring-blue-500/40 shadow-sm` 
                        : 'bg-[#F8FAFC] border-[#E8ECF2] hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-xl bg-white shadow-xs ${p.accent}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{p.roleLabel}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                      {p.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8ECF2]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
              <span className="bg-white px-3 text-slate-400">Or Manual Credentials</span>
            </div>
          </div>

          {/* Manual Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@fleetpulse.io"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs tracking-wide shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : `Sign in as ${selectedRole.replace('_', ' ')}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Tenant Badge Footer */}
          <div className="mt-5 pt-4 border-t border-[#F0F3F8] flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Tenant: Enterprise Fleet Logistics</span>
            <span>Security: JWT HS256 + RBAC</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
