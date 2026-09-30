/**
 * FleetPulse Web Frontend — API Client Service
 */

const API_BASE = '/api/v1';

export interface FleetSummary {
  tenant_id: string;
  total_vehicles: number;
  active_vehicles: number;
  high_risk_vehicles: number;
  critical_alerts_count: number;
  avg_fleet_risk_score: number;
  events_per_sec: number;
  ingestion_latency_ms: number;
  system_health_pct: number;
  timestamp: string;
}

export interface Vehicle {
  id: string;
  vin: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  propulsion_type: 'ICE' | 'EV' | 'HYBRID';
  oem: string;
  odometer_km: number;
  status: 'ACTIVE' | 'IN_SERVICE' | 'GROUNDED';
  current_risk_score: number;
  current_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lat: number;
  lon: number;
  speed_kmh: number;
  engine_temp_c?: number;
  battery_temp_c?: number;
  soc_pct?: number;
  active_dtcs: string[];
}

export interface ContributingFactor {
  factor: string;
  weight: number;
  detail?: string;
  value?: string;
  threshold?: string;
}

export interface RiskExplanation {
  priority_score: number;
  risk_probability: number;
  impact_exposure: number;
  urgency_factor: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  model_version: string;
  contributing_factors: ContributingFactor[];
  recommended_action?: string;
}

export interface Alert {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  vin?: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority_score: number;
  risk_probability: number;
  impact_exposure: number;
  urgency_factor: number;
  contributing_factors: ContributingFactor[];
  dtc_codes: string[];
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  event_time: string;
}

export interface MaintenanceAction {
  id: string;
  vehicle_id: string;
  action_type: string;
  status: string;
  priority: string;
  notes?: string;
  scheduled_for: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
}

export interface UserSession {
  access_token: string;
  user_id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'TECHNICIAN';
  tenant_id: string;
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('fleetpulse_token');
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  async login(email: string, password: string, role?: string): Promise<UserSession> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    if (!res.ok) throw new Error('Invalid authentication credentials');
    const session: UserSession = await res.json();
    localStorage.setItem('fleetpulse_token', session.access_token);
    localStorage.setItem('fleetpulse_user', JSON.stringify(session));
    return session;
  },

  logout(): void {
    localStorage.removeItem('fleetpulse_token');
    localStorage.removeItem('fleetpulse_user');
  },

  getStoredSession(): UserSession | null {
    try {
      const data = localStorage.getItem('fleetpulse_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async getFleetSummary(): Promise<FleetSummary> {
    const res = await fetch(`${API_BASE}/fleet/summary`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch fleet summary');
    return res.json();
  },

  async getVehicles(limit = 50, offset = 0, severity?: string, query?: string): Promise<{ items: Vehicle[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (severity) params.append('severity', severity);
    if (query) params.append('query', query);
    const res = await fetch(`${API_BASE}/vehicles?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    return res.json();
  },

  async getMapVehicles(limit = 1200, severity?: string): Promise<{ items: Vehicle[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (severity && severity !== 'ALL') params.append('severity', severity);
    const res = await fetch(`${API_BASE}/vehicles/map?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch map vehicles');
    return res.json();
  },

  async getVehicleDetail(id: string): Promise<Vehicle> {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch vehicle detail');
    return res.json();
  },

  async getVehicleRisk(id: string): Promise<RiskExplanation> {
    const res = await fetch(`${API_BASE}/vehicles/${id}/risk`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch vehicle risk');
    return res.json();
  },

  async getVehicleTimeline(id: string, points = 30): Promise<{ timeline: any[] }> {
    const res = await fetch(`${API_BASE}/vehicles/${id}/timeline?points=${points}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch timeline');
    return res.json();
  },

  async getAlerts(limit = 50, status?: string): Promise<{ items: Alert[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/alerts?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async acknowledgeAlert(alertId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/ack`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  async createMaintenanceAction(payload: {
    vehicle_id: string;
    alert_id?: string;
    action_type: string;
    priority: string;
    notes?: string;
    scheduled_for: string;
  }): Promise<MaintenanceAction> {
    const res = await fetch(`${API_BASE}/maintenance-actions`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to schedule maintenance');
    return res.json();
  },

  async getMaintenanceActions(): Promise<MaintenanceAction[]> {
    const res = await fetch(`${API_BASE}/maintenance-actions`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch maintenance actions');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getAnalyticsRiskDistribution(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/risk-distribution`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch risk distribution');
    return res.json();
  },

  async getAnalyticsLeadTime(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/lead-time`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch lead time');
    return res.json();
  },

  async getAnalyticsOEMBreakdown(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/oem-breakdown`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch OEM breakdown');
    return res.json();
  },

  async queryCopilot(query: string, confirm = false, toolArgs?: any): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/query`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query, confirm_action: confirm, tool_arguments: toolArgs })
    });
    if (!res.ok) throw new Error('Copilot query failed');
    return res.json();
  },

  async injectScenario(scenario: string): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/scenario`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ scenario })
    });
    if (!res.ok) throw new Error('Failed to trigger scenario');
    return res.json();
  }
};
