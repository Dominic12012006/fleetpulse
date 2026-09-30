import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { KPICards } from './components/KPICards';
import { FleetMap } from './components/FleetMap';
import { RiskQueue } from './components/RiskQueue';
import { VehicleDetail } from './components/VehicleDetail';
import { AnalyticsView } from './components/AnalyticsView';
import { AuditView } from './components/AuditView';
import { CopilotModal } from './components/CopilotModal';
import { ScenarioBar } from './components/ScenarioBar';
import { MaintenanceModal } from './components/MaintenanceModal';
import { api, FleetSummary, Vehicle, Alert } from './services/api';
import { Search, Filter, ShieldCheck, Activity, AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('command');
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Modals state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isScenariosOpen, setIsScenariosOpen] = useState(false);
  const [maintenanceTarget, setMaintenanceTarget] = useState<{ vehicle: Vehicle; alert?: Alert } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Initial Data Fetching
  async function loadData() {
    try {
      const [sumData, vData, aData] = await Promise.all([
        api.getFleetSummary(),
        api.getVehicles(100, 0, severityFilter || undefined, searchQuery || undefined),
        api.getAlerts(50)
      ]);
      setSummary(sumData);
      setVehicles(vData.items);
      setAlerts(aData.items);

      if (!selectedVehicle && vData.items.length > 0) {
        setSelectedVehicle(vData.items[0]);
      }
    } catch (err) {
      console.error('Failed to load fleet data', err);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [searchQuery, severityFilter]);

  // WebSocket Live Updates Connection
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/live`;

      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => console.log('FleetPulse Live WebSocket connected');
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'SCENARIO_INJECTED' || data.type === 'INITIAL_FLEET_STATE') {
              loadData();
            }
          } catch (e) {
            console.error('WebSocket parse error', e);
          }
        };
        ws.onclose = () => {
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();
    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  async function handleAcknowledgeAlert(alertId: string) {
    try {
      await api.acknowledgeAlert(alertId);
      loadData();
    } catch (err) {
      console.error('Failed to ack alert', err);
    }
  }

  function handleScheduleService(vehicle: Vehicle, alert?: Alert) {
    setMaintenanceTarget({ vehicle, alert });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        summary={summary}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenScenarios={() => setIsScenariosOpen(true)}
      />

      {/* Main Command View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Summary Strip */}
        <KPICards summary={summary} />

        {/* Tab 1: Command Centre Overview */}
        {activeTab === 'command' && (
          <div className="space-y-6">
            {/* Live Map & Quick Risk Queue Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <FleetMap
                  vehicles={vehicles}
                  onSelectVehicle={(v) => {
                    setSelectedVehicle(v);
                    setActiveTab('vehicles');
                  }}
                  selectedVehicleId={selectedVehicle?.id}
                />
              </div>

              <div className="lg:col-span-5">
                <RiskQueue
                  alerts={alerts.slice(0, 5)}
                  vehicles={vehicles}
                  onAcknowledge={handleAcknowledgeAlert}
                  onScheduleService={handleScheduleService}
                  onSelectVehicle={(v) => {
                    setSelectedVehicle(v);
                    setActiveTab('vehicles');
                  }}
                />
              </div>
            </div>

            {/* Quick Filter & Vehicle Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Connected Fleet Registry
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-mono">
                    {vehicles.length} Vehicles
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search VIN, model, plate..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-52"
                    />
                  </div>

                  <select
                    value={severityFilter}
                    onChange={e => setSeverityFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">All Severities</option>
                    <option value="CRITICAL">Critical Only</option>
                    <option value="HIGH">High Only</option>
                    <option value="MEDIUM">Medium Only</option>
                    <option value="LOW">Low Only</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono">
                    <tr>
                      <th className="px-3 py-2">VIN / Plate</th>
                      <th className="px-3 py-2">Vehicle Specification</th>
                      <th className="px-3 py-2">Propulsion</th>
                      <th className="px-3 py-2">Risk Score</th>
                      <th className="px-3 py-2">Severity</th>
                      <th className="px-3 py-2">Active DTCs</th>
                      <th className="px-3 py-2">Telemetry</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    {vehicles.slice(0, 15).map(v => (
                      <tr key={v.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-white">
                          <div>{v.vin}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{v.license_plate}</div>
                        </td>
                        <td className="px-3 py-2.5 font-sans text-slate-300">
                          {v.make} {v.model} ({v.year})
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-sky-300 border border-sky-500/20">
                            {v.propulsion_type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-bold text-white">
                          {v.current_risk_score}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                              v.current_severity === 'CRITICAL'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : v.current_severity === 'HIGH'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {v.current_severity}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {v.active_dtcs.length > 0 ? (
                            <div className="flex space-x-1">
                              {v.active_dtcs.map(c => (
                                <span key={c} className="px-1 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[9px]">
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-600">None</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400">
                          {v.engine_temp_c || v.battery_temp_c || 90}°C • {v.speed_kmh} km/h
                        </td>
                        <td className="px-3 py-2.5 text-right font-sans">
                          <button
                            onClick={() => {
                              setSelectedVehicle(v);
                              setActiveTab('vehicles');
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                          >
                            Drill Down
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Risk Queue */}
        {activeTab === 'queue' && (
          <RiskQueue
            alerts={alerts}
            vehicles={vehicles}
            onAcknowledge={handleAcknowledgeAlert}
            onScheduleService={handleScheduleService}
            onSelectVehicle={(v) => {
              setSelectedVehicle(v);
              setActiveTab('vehicles');
            }}
          />
        )}

        {/* Tab 3: Vehicle Intelligence Detail */}
        {activeTab === 'vehicles' && (
          <div>
            {selectedVehicle ? (
              <VehicleDetail
                vehicle={selectedVehicle}
                onBack={() => setActiveTab('command')}
                onScheduleService={(v) => handleScheduleService(v)}
              />
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-xl">
                Select a vehicle from the Command Centre or Risk Queue to view real-time diagnostics.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Historical Analytics & ML Benchmark */}
        {activeTab === 'analytics' && <AnalyticsView />}

        {/* Tab 5: Tamper-Proof Audit Trail */}
        {activeTab === 'audit' && <AuditView />}
      </main>

      {/* Modals & Overlays */}
      <CopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onRefreshData={loadData}
      />

      <ScenarioBar
        isOpen={isScenariosOpen}
        onClose={() => setIsScenariosOpen(false)}
        onScenarioTriggered={loadData}
      />

      <MaintenanceModal
        isOpen={!!maintenanceTarget}
        onClose={() => setMaintenanceTarget(null)}
        vehicle={maintenanceTarget?.vehicle || null}
        alert={maintenanceTarget?.alert || null}
        onSuccess={loadData}
      />
    </div>
  );
}

export default App;
