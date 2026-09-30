import React, { useState } from 'react';
import { Radio, X, Flame, Disc, BatteryWarning, Zap, RotateCcw } from 'lucide-react';
import { api } from '../services/api';

interface ScenarioBarProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioTriggered: () => void;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({ isOpen, onClose, onScenarioTriggered }) => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  if (!isOpen) return null;

  async function handleTrigger(scenarioName: string) {
    setLoading(true);
    try {
      const res = await api.injectScenario(scenarioName);
      setLastResult(res);
      onScenarioTriggered();
    } catch (err: any) {
      console.error('Scenario injection failed', err);
    } finally {
      setLoading(false);
    }
  }

  const scenarios = [
    {
      id: 'thermal_overheat',
      name: 'Thermal Overheat',
      desc: 'Coolant climbs >118°C, triggers P0128 & P0300 misfire DTCs',
      icon: Flame,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
    },
    {
      id: 'brake_failure',
      name: 'Brake System Stress',
      desc: 'Repeated harsh decelerations, triggers C0035 ABS sensor failure',
      icon: Disc,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
    },
    {
      id: 'ev_battery_degradation',
      name: 'EV Pack Degradation',
      desc: 'Pack temp >60°C, rapid SoC collapse, triggers P0A80 module fault',
      icon: BatteryWarning,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20'
    },
    {
      id: 'burst_3x',
      name: '3x Peak Telemetry Burst',
      desc: 'Simulates 300,000 events/sec rush hour surge',
      icon: Zap,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
    },
    {
      id: 'normal',
      name: 'Reset Fleet to Normal',
      desc: 'Clears active scenario overrides and resets physical state',
      icon: RotateCcw,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">Scenario Injection & Chaos Lab</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-400">
            Inject real-time physical faults or ingestion surges to observe live event detection, Flink window aggregation, and immediate WebSocket UI updates.
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {scenarios.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => handleTrigger(s.id)}
                  disabled={loading}
                  className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all ${s.color}`}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold font-mono">{s.name}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {lastResult && (
            <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400">
              Scenario injected on {lastResult.target_vehicle}! New priority: {lastResult.new_priority_score} ({lastResult.new_severity}).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
