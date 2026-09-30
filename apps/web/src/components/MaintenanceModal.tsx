import React, { useState } from 'react';
import { Wrench, X, Calendar, AlertTriangle } from 'lucide-react';
import { Vehicle, Alert, api } from '../services/api';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  alert?: Alert | null;
  onSuccess: () => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  alert,
  onSuccess
}) => {
  const [actionType, setActionType] = useState('THERMAL_SYSTEM_REPAIR');
  const [priority, setPriority] = useState('URGENT');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !vehicle) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicle) return;
    setLoading(true);

    try {
      await api.createMaintenanceAction({
        vehicle_id: vehicle.id,
        alert_id: alert?.id,
        action_type: actionType,
        priority: priority,
        notes: notes || `Scheduled via command centre for ${vehicle.vin}`,
        scheduled_for: new Date(Date.now() + 86400000).toISOString()
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      window.alert(err.message || 'Failed to schedule maintenance');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Dispatch Maintenance Work Order</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Target Vehicle</label>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white">
              {vehicle.vin} • {vehicle.make} {vehicle.model}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Maintenance Action Type</label>
            <select
              value={actionType}
              onChange={e => setActionType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500"
            >
              <option value="THERMAL_SYSTEM_REPAIR">Thermal System & Coolant Repair</option>
              <option value="BRAKE_SERVICE">Brake Actuator & Pad Service</option>
              <option value="BATTERY_REPLACEMENT">High-Voltage Battery Module Replacement</option>
              <option value="INSPECTION">Comprehensive Diagnostic Scan & Inspection</option>
              <option value="OIL_CHANGE">Fluids & Powertrain Lubrication</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Priority Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {['ROUTINE', 'URGENT', 'CRITICAL'].map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`p-2 rounded-lg font-mono font-bold text-center border transition-all ${
                    priority === p
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Technician Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Inspect coolant thermostat, check cylinder misfire DTCs P0300..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors"
            >
              {loading ? 'Dispatching...' : 'Confirm Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
