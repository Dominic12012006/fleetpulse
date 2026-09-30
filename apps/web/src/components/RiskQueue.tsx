import React from 'react';
import { AlertTriangle, CheckCircle, Wrench, ChevronRight, ShieldAlert, ArrowUpRight } from 'lucide-react';
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
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  return (
    <div className="bg-white border border-[#E5E9F2] rounded-[24px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.03)] font-sans">
      {/* Syncrowave Header */}
      <div className="px-6 py-4 border-b border-[#F0F3F8] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">Prioritized Risk Queue</h3>
              <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded-full font-mono font-bold">
                {alerts.length} Actionable
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Sorted by Priority = Probability × Exposure × Urgency</p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Gradient-Boosted v1.1
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-[#F0F3F8] max-h-[520px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No active open risk alerts. The entire fleet is currently operating within safe physical thresholds.
          </div>
        ) : (
          alerts.map(alert => {
            const vehicle = vehicleMap.get(alert.vehicle_id);
            const isCritical = alert.severity === 'CRITICAL';
            const isAcked = alert.status === 'ACKNOWLEDGED';

            return (
              <div
                key={alert.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Vehicle and Severity info */}
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div
                    className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      isCritical ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {vehicle?.vin || alert.vin || 'VIN Unknown'}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          isCritical
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      {isAcked && (
                        <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-full font-medium">
                          Acknowledged
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 mt-1 flex items-center space-x-2">
                      <span>{vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : 'Commercial Unit'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-slate-500">{alert.alert_type}</span>
                    </div>

                    {/* Contributing Factors Pills */}
                    {alert.contributing_factors && alert.contributing_factors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {alert.contributing_factors.slice(0, 3).map((f, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {f.factor}: {(f.weight * 100).toFixed(0)}% wt
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Priority Score Badge */}
                <div className="flex items-center md:flex-col md:items-end justify-between md:justify-center shrink-0">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Decision Priority</div>
                  <div className="text-lg font-black font-mono text-slate-900">
                    {alert.priority_score.toFixed(1)}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {!isAcked && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-colors flex items-center space-x-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ack</span>
                    </button>
                  )}

                  {vehicle && (
                    <button
                      onClick={() => onScheduleService(vehicle, alert)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold transition-all shadow-sm flex items-center space-x-1"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Service</span>
                    </button>
                  )}

                  {vehicle && (
                    <button
                      onClick={() => onSelectVehicle(vehicle)}
                      title="Drill down"
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
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
