import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FleetNavbar } from './components/FleetNavbar';
import { FleetHeader } from './components/FleetHeader';
import { FleetOverviewCards } from './components/FleetOverviewCards';
import { FleetDistributionCharts } from './components/FleetDistributionCharts';
import { FleetMap } from './components/FleetMap';
import { RiskQueue } from './components/RiskQueue';
import { VehicleDetail } from './components/VehicleDetail';
import { AnalyticsView } from './components/AnalyticsView';
import { AuditView } from './components/AuditView';
import { CopilotModal } from './components/CopilotModal';
import { ScenarioBar } from './components/ScenarioBar';
import { MaintenanceModal } from './components/MaintenanceModal';
import { LoginPage } from './components/LoginPage';
import { api, FleetSummary, Vehicle, Alert, UserSession } from './services/api';
import { Search, Filter, ShieldCheck, Activity, ChevronRight } from 'lucide-react';

export function App() {
  const [session, setSession] = useState<UserSession | null>(() => api.getStoredSession());
  const [activeTab, setActiveTab] = useState<string>('command');
  const [subTab, setSubTab] = useState<string>('summary');
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mapVehicles, setMapVehicles] = useState<Vehicle[]>([]);
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
      const [sumData, vData, aData, mapData] = await Promise.all([
        api.getFleetSummary(),
        api.getVehicles(100, 0, severityFilter || undefined, searchQuery || undefined),
        api.getAlerts(50),
        api.getMapVehicles(1200)
      ]);
      setSummary(sumData);
      setVehicles(vData.items);
      setAlerts(aData.items);
      setMapVehicles(mapData.items);

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

  function handleExportData() {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["VIN,Make,Model,Year,Propulsion,RiskScore,Severity,ActiveDTCs"]
      .concat(vehicles.map(v => `${v.vin},${v.make},${v.model},${v.year},${v.propulsion_type},${v.current_risk_score},${v.current_severity},"${v.active_dtcs.join(';')}"`))
      .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fleetpulse_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // If not authenticated, show modern LoginPage
  if (!session) {
    return <LoginPage onLoginSuccess={(sess) => setSession(sess)} />;
  }

  const openAlertsCount = alerts.filter(a => a.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Top Floating Pill Navigation Bar matching Dribbble shot */}
      <FleetNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={session}
        onLogout={handleLogout}
        openAlertsCount={openAlertsCount}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenScenarios={() => setIsScenariosOpen(true)}
      />

      {/* Main Body Canvas */}
      <main className="max-w-[1600px] mx-auto px-6 sm:px-8 py-8 space-y-7">
        <AnimatePresence mode="wait">
          {/* Main Tab: Overview (matching the Dribbble shot layout) */}
          {activeTab === 'command' && (
            <motion.div
              key="command"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-7"
            >
              {/* Header Title with Sub-tabs and Export button */}
              <FleetHeader
                title="Fleet Operations Overview"
                subtitle="Real-time multi-OEM telematics, Flink event-time windowing, and predictive ML risk prioritization."
                subTab={subTab}
                setSubTab={setSubTab}
                onExportData={handleExportData}
              />

              {/* Row 1: The 3 Highlight Cards (Fleet Reliability, Active Units, SLA & Health) */}
              <FleetOverviewCards summary={summary} />

              {/* Row 2: The Two Visual Charts (Telemetry Ingestion Bubble Matrix + Propulsion & Risk Radial Arc) */}
              <FleetDistributionCharts />

              {/* Row 3: Live Telemetry Geo-Map & Prioritized Risk Queue */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <FleetMap
                    vehicles={mapVehicles.length > 0 ? mapVehicles : vehicles}
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

              {/* Row 4: Connected Telematics Fleet Registry Table */}
              <div className="bg-white border border-[#E5E9F2] rounded-[24px] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Connected Telematics Fleet Registry
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {vehicles.length} Units Online with Real-Time Thermodynamic Sensors
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search VIN, model, plate..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-52 transition-colors"
                      />
                    </div>

                    <select
                      value={severityFilter}
                      onChange={e => setSeverityFilter(e.target.value)}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
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
                <div className="overflow-x-auto rounded-2xl border border-[#F0F3F8]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-slate-500 uppercase text-[10px] font-mono border-b border-[#F0F3F8]">
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
                    <tbody className="divide-y divide-[#F0F3F8] font-mono text-[11px] bg-white">
                      {vehicles.slice(0, 15).map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            <div>{v.vin}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{v.license_plate}</div>
                          </td>
                          <td className="px-4 py-3 font-sans text-slate-600 font-medium">
                            {v.make} {v.model} ({v.year})
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {v.propulsion_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-black text-slate-900">
                            {v.current_risk_score}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                v.current_severity === 'CRITICAL'
                                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                                  : v.current_severity === 'HIGH'
                                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              }`}
                            >
                              {v.current_severity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {v.active_dtcs.length > 0 ? (
                              <div className="flex space-x-1">
                                {v.active_dtcs.map(c => (
                                  <span key={c} className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded text-[9px] font-bold">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono">
                            {v.engine_temp_c || v.battery_temp_c || 90}°C • {v.speed_kmh} km/h
                          </td>
                          <td className="px-4 py-3 text-right font-sans">
                            <button
                              onClick={() => {
                                setSelectedVehicle(v);
                                setActiveTab('vehicles');
                              }}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-colors"
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

          {/* Tab 2: Full Screen Live Telemetry Map */}
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <FleetMap
                vehicles={mapVehicles.length > 0 ? mapVehicles : vehicles}
                onSelectVehicle={(v) => {
                  setSelectedVehicle(v);
                  setActiveTab('vehicles');
                }}
                selectedVehicleId={selectedVehicle?.id}
              />
            </motion.div>
          )}

          {/* Tab 3: Full Priority Risk Queue */}
          {activeTab === 'queue' && (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
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

          {/* Tab 4: Vehicle Intelligence Diagnostics */}
          {activeTab === 'vehicles' && (
            <motion.div
              key="vehicles"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {selectedVehicle ? (
                <VehicleDetail
                  vehicle={selectedVehicle}
                  onBack={() => setActiveTab('command')}
                  onScheduleService={(v) => handleScheduleService(v)}
                />
              ) : (
                <div className="p-12 text-center text-slate-500 text-sm bg-white border border-[#E5E9F2] rounded-[24px]">
                  Select a vehicle from the Overview or Risk Queue to inspect diagnostic telemetry.
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 5: ML Analytics */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <AnalyticsView />
            </motion.div>
          )}

          {/* Tab 6: Immutable Audit Trail */}
          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <AuditView />
            </motion.div>
          )}
        </AnimatePresence>
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
