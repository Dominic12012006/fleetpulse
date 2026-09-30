import React from 'react';
import { AlertTriangle, CheckCircle, Wrench, ChevronRight, ShieldAlert } from 'lucide-react';
import { Alert, Vehicle } from '../services/api';

interface RiskQueueProps {
  alerts: Alert[];
  vehicles: Vehicle[];
  onAcknowledge: (alertId: string) => void;
  onScheduleService: (vehicle: Vehicle, alert?: Alert) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export const RiskQueue: React.FC<RiskQueueProps> = ({
  alerts,
  vehicles,
  onAcknowledge,
  onScheduleService,
  onSelectVehicle
}) => {
  // Map vehicle_id to vehicle object for fast lookup
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Prioritized Risk-to-Impact Queue
          </h2>
          <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono">
            {alerts.length} Actionable Items
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          Priority = Probability × Exposure × Urgency
        </span>
      </div>

      <div className="divide-y divide-slate-800/80 max-h-[550px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No active open risk alerts. The fleet is operating within safe physical thresholds.
          </div>
        ) : (
          alerts.map(alert => {
            const vehicle = vehicleMap.get(alert.vehicle_id);
            const isCritical = alert.severity === 'CRITICAL';
            const isAcked = alert.status === 'ACKNOWLEDGED';

            return (
              <div
                key={alert.id}
                className="p-4 hover:bg-slate-850/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Vehicle and Severity info */}
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div
                    className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      isCritical ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-mono font-bold text-white text-sm">
                        {alert.vin || (vehicle ? vehicle.vin : 'VIN-UNKNOWN')}
                      </span>
                      {vehicle && (
                        <span className="text-xs text-slate-400">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          isCritical
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      {isAcked && (
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded font-medium flex items-center space-x-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>Acknowledged</span>
                        </span>
                      )}
                    </div>

                    {/* Factors and DTCs */}
                    <div className="mt-1.5 flex items-center space-x-2 text-xs flex-wrap gap-y-1">
                      {alert.dtc_codes.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] text-slate-500">DTCs:</span>
                          {alert.dtc_codes.map(c => (
                            <span key={c} className="px-1.5 py-0.5 bg-slate-800 text-rose-300 font-mono text-[10px] rounded border border-rose-500/20">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      {alert.contributing_factors.length > 0 && (
                        <span className="text-slate-400 text-[11px] truncate">
                          Primary: {alert.contributing_factors[0].factor} ({alert.contributing_factors[0].detail || alert.contributing_factors[0].value})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Calculated P x I x U breakdown */}
                <div className="flex items-center space-x-4 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/80 text-center flex-shrink-0">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Priority</div>
                    <div className="text-base font-bold font-mono text-sky-400">{alert.priority_score}</div>
                  </div>
                  <div className="text-slate-700">×</div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Prob (P)</div>
                    <div className="text-xs font-mono text-slate-200">{(alert.risk_probability * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-slate-700">×</div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Exp (I)</div>
                    <div className="text-xs font-mono text-slate-200">{alert.impact_exposure}</div>
                  </div>
                  <div className="text-slate-700">×</div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Urg (U)</div>
                    <div className="text-xs font-mono text-slate-200">{alert.urgency_factor}x</div>
                  </div>
                </div>

                {/* Right: Operational Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {!isAcked && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                    >
                      Ack
                    </button>
                  )}
                  {vehicle && (
                    <button
                      onClick={() => onScheduleService(vehicle, alert)}
                      className="px-2.5 py-1.5 text-xs font-medium bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-md flex items-center space-x-1 transition-colors"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Schedule</span>
                    </button>
                  )}
                  {vehicle && (
                    <button
                      onClick={() => onSelectVehicle(vehicle)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                      title="Inspect Vehicle Intelligence"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
