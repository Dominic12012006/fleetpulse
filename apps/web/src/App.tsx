import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { HeroMetrics } from './components/HeroMetrics';
import { LoginPage } from './components/LoginPage';
import { FleetMap } from './components/FleetMap';
import { RiskQueue } from './components/RiskQueue';
import { VehicleDetail } from './components/VehicleDetail';
import { AnalyticsView } from './components/AnalyticsView';
import { AuditView } from './components/AuditView';
import { CopilotModal } from './components/CopilotModal';
import { ScenarioBar } from './components/ScenarioBar';
import { MaintenanceModal } from './components/MaintenanceModal';
import { api, FleetSummary, Vehicle, Alert, UserSession } from './services/api';
import { Search, Filter, ShieldCheck, Activity, AlertCircle, ArrowRight } from 'lucide-react';

export function App() {
  const [session, setSession] = useState<UserSession | null>(() => api.getStoredSession());
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
    if (session) {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [session, searchQuery, severityFilter]);

  // WebSocket Live Updates Connection
  useEffect(() => {
    if (!session) return;
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
  }, [session]);

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

  function handleLogout() {
    api.logout();
    setSession(null);
  }

  // If not authenticated, show modern Syncrowave LoginPage
  if (!session) {
    return <LoginPage onLoginSuccess={(sess) => setSession(sess)} />;
  }

  const openAlertsCount = alerts.filter(a => a.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased overflow-x-hidden">
      {/* Syncrowave Vertical Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={session}
        onLogout={handleLogout}
        openAlertsCount={openAlertsCount}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenScenarios={() => setIsScenariosOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Header Bar */}
        <TopHeader
          summary={summary}
          user={session}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenScenarios={() => setIsScenariosOpen(true)}
          openAlertsCount={openAlertsCount}
        />

        {/* Dynamic Page Content with Framer Motion Transition */}
        <main className="flex-1 p-5 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          <AnimatePresence mode="wait">
            {/* View 1: Command Centre Dashboard */}
            {activeTab === 'command' && (
              <motion.div
                key="command"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Syncrowave Hero Metric Cards */}
                <HeroMetrics summary={summary} />

                {/* Live Geo-Map & Priority Risk Queue Grid */}
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
                      alerts={alerts.slice(0, 6)}
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

                {/* Connected Fleet Registry Table */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg p-5 space-y-4 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white tracking-tight">
                          Connected Telematics Fleet Registry
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          {vehicles.length} Active Connected Units with Real-Time Thermodynamic Sensors
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Filter registry..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-48 transition-colors"
                        />
                      </div>

                      <select
                        value={severityFilter}
                        onChange={e => setSeverityFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
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
                  <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">VIN / Plate</th>
                          <th className="px-4 py-3">Specification</th>
                          <th className="px-4 py-3">Propulsion</th>
                          <th className="px-4 py-3">Priority Score</th>
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3">Active DTCs</th>
                          <th className="px-4 py-3">Live Telemetry</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-mono text-[11px] bg-slate-900/40">
                        {vehicles.slice(0, 15).map(v => (
                          <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-bold text-white">
                              <div>{v.vin}</div>
                              <div className="text-[10px] text-slate-500 font-normal">{v.license_plate}</div>
                            </td>
                            <td className="px-4 py-3 font-sans text-slate-300">
                              {v.make} {v.model} ({v.year})
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800/80 text-sky-300 border border-sky-500/20">
                                {v.propulsion_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-white">
                              {v.current_risk_score}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                                  v.current_severity === 'CRITICAL'
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                                    : v.current_severity === 'HIGH'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {v.current_severity}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {v.active_dtcs.length > 0 ? (
                                <div className="flex space-x-1">
                                  {v.active_dtcs.map(c => (
                                    <span key={c} className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[9px] font-bold">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-600">None</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {v.engine_temp_c || v.battery_temp_c || 90}°C • {v.speed_kmh} km/h
                            </td>
                            <td className="px-4 py-3 text-right font-sans">
                              <button
                                onClick={() => {
                                  setSelectedVehicle(v);
                                  setActiveTab('vehicles');
                                }}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View 2: Live Telemetry Map Focus */}
            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Full Geographic Telematics</h2>
                    <p className="text-xs text-slate-400">Real-time GPS coordinates projected across central logistics corridors.</p>
                  </div>
                </div>
                <FleetMap
                  vehicles={vehicles}
                  onSelectVehicle={(v) => {
                    setSelectedVehicle(v);
                    setActiveTab('vehicles');
                  }}
                  selectedVehicleId={selectedVehicle?.id}
                />
              </motion.div>
            )}

            {/* View 3: Full Priority Risk Queue */}
            {activeTab === 'queue' && (
              <motion.div
                key="queue"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Priority Risk Queue</h2>
                    <p className="text-xs text-slate-400">Dynamic sorting powered by Priority = Probability × Impact × Urgency.</p>
                  </div>
                </div>
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
              </motion.div>
            )}

            {/* View 4: Vehicle Intelligence & Diagnostic Detail */}
            {activeTab === 'vehicles' && (
              <motion.div
                key="vehicles"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {selectedVehicle ? (
                  <VehicleDetail
                    vehicle={selectedVehicle}
                    onBack={() => setActiveTab('command')}
                    onScheduleService={(v) => handleScheduleService(v)}
                  />
                ) : (
                  <div className="p-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
                    Select a vehicle from the Command Centre or Risk Queue to view real-time diagnostics.
                  </div>
                )}
              </motion.div>
            )}

            {/* View 5: Predictive ML Risk Analytics */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <AnalyticsView />
              </motion.div>
            )}

            {/* View 6: Immutable Audit Trail */}
            {activeTab === 'audit' && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <AuditView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

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
