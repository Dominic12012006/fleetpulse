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
  CheckCircle2
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
  color: string;
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
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:border-sky-400',
      accent: 'text-sky-400',
      description: 'Prioritize risk alerts, schedule service work orders, inspect fleet health'
    },
    {
      id: 'dispatcher',
      name: 'Elena Rostova',
      role: 'DISPATCHER',
      roleLabel: 'Real-time Route Dispatcher',
      email: 'dispatcher@fleetpulse.io',
      icon: Navigation,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:border-amber-400',
      accent: 'text-amber-400',
      description: 'Live geographic map tracking, vehicle routing, priority triage'
    },
    {
      id: 'safety',
      name: 'Marcus Chen',
      role: 'SAFETY_OFFICER',
      roleLabel: 'Fleet Safety & Compliance',
      email: 'safety@fleetpulse.io',
      icon: ShieldCheck,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:border-rose-400',
      accent: 'text-rose-400',
      description: 'Harsh braking auditing, driver behavior risk scoring, tamper-proof logs'
    },
    {
      id: 'technician',
      name: 'David Miller',
      role: 'TECHNICIAN',
      roleLabel: 'Senior Diagnostic Tech',
      email: 'tech@fleetpulse.io',
      icon: Wrench,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-400',
      accent: 'text-emerald-400',
      description: 'Inspect active diagnostic DTCs, temperature velocity, component health'
    },
    {
      id: 'admin',
      name: 'Alex Mercer',
      role: 'SUPER_ADMIN',
      roleLabel: 'Super Administrator',
      email: 'admin@fleetpulse.io',
      icon: Sparkles,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:border-purple-400',
      accent: 'text-purple-400',
      description: 'Full multi-tenant authority, chaos scenario injection, audit oversight'
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting effects */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 my-8"
      >
        {/* Left Side: Brand & Product Highlights */}
        <div className="lg:col-span-6 space-y-6 px-2 sm:px-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 ring-1 ring-white/20">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-white font-mono">FleetPulse</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full">
                  v2.0 Syncrowave
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Connected Vehicle Intelligence Platform</p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Enterprise Telematics with <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Explainable AI Risk</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Continuously converts 100,000+ streaming vehicle signals into ranked operational impact. Protect uptime with real-time ML risk scoring and bounded AI copilot dispatch.
            </p>
          </div>

          {/* Value props */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">100K+ Streaming Scale (104,520 EPS)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Flink sliding windows with 5-second event-time watermarking and deduplication.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Decision Priority Formula</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Priority = Probability × Impact × Urgency backed by Gradient-Boosted Tabular ML.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Zero Data Loss Chaos Resilience</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated backpressure buffer preserves events during broker failure scenarios.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Role-Based Quick Access & Login */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">Select Role or Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose an operator persona for instant 1-click evaluation, or sign in with credentials.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Quick Persona Selector */}
          <div className="space-y-2 mb-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-1">
              Quick 1-Click Role Switcher
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
                    className={`p-3 rounded-2xl border text-left transition-all relative group flex flex-col justify-between ${
                      isCurrent 
                        ? `${p.color} ring-2 ring-sky-500/50 shadow-md` 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-lg bg-slate-800/80 ${p.accent}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.roleLabel}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 line-clamp-2">
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
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-mono">
              <span className="bg-slate-900 px-3 text-slate-500">Or Custom Credentials</span>
            </div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@fleetpulse.io"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : `Enter Platform as ${selectedRole.replace('_', ' ')}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Tenant Badge */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Tenant: Enterprise Fleet Logistics</span>
            <span>Security: JWT HS256 + RBAC</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
