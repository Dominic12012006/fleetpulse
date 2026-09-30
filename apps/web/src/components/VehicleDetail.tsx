import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Cpu, Thermometer, BatteryCharging, Gauge, AlertCircle, Wrench, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Vehicle, RiskExplanation, api } from '../services/api';

interface VehicleDetailProps {
  vehicle: Vehicle;
  onBack: () => void;
  onScheduleService: (vehicle: Vehicle) => void;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicle,
  onBack,
  onScheduleService
}) => {
  const [risk, setRisk] = useState<RiskExplanation | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [rData, tData] = await Promise.all([
          api.getVehicleRisk(vehicle.id),
          api.getVehicleTimeline(vehicle.id, 25)
        ]);
        if (mounted) {
          setRisk(rData);
          setTimeline(tData.timeline);
        }
      } catch (err) {
        console.error('Failed to load vehicle details', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [vehicle.id]);

  // ECharts Timeline options
  const chartOptions = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 11 }
    },
    legend: {
      data: ['Temperature (°C)', 'Speed (km/h)', 'Battery SoC (%)'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '16%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timeline.map(t => new Date(t.timestamp).toLocaleTimeString()),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#64748b', fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Temp / Speed',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#64748b', fontSize: 10 }
      },
      {
        type: 'value',
        name: 'SoC %',
        min: 0,
        max: 100,
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 10 }
      }
    ],
    series: [
      {
        name: 'Temperature (°C)',
        type: 'line',
        smooth: true,
        data: timeline.map(t => t.temperature_c),
        lineStyle: { color: '#ef4444', width: 2.5 },
        itemStyle: { color: '#ef4444' }
      },
      {
        name: 'Speed (km/h)',
        type: 'line',
        smooth: true,
        data: timeline.map(t => t.speed_kmh),
        lineStyle: { color: '#38bdf8', width: 2 },
        itemStyle: { color: '#38bdf8' }
      },
      {
        name: 'Battery SoC (%)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: timeline.map(t => t.soc_pct),
        lineStyle: { color: '#10b981', width: 2, type: 'dashed' },
        itemStyle: { color: '#10b981' }
      }
    ]
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold font-mono text-white">{vehicle.vin}</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {vehicle.propulsion_type}
              </span>
              <span className="text-xs text-slate-400">
                {vehicle.make} {vehicle.model} ({vehicle.year}) • {vehicle.license_plate}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              OEM: <span className="font-mono text-slate-300">{vehicle.oem}</span> • Odometer: <span className="font-mono text-slate-300">{vehicle.odometer_km.toLocaleString()} km</span> • Status: <span className="text-emerald-400 font-medium">{vehicle.status}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => onScheduleService(vehicle)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all"
        >
          <Wrench className="w-4 h-4" />
          <span>Dispatch Work Order</span>
        </button>
      </div>

      {/* Sensor Gauges & Risk Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Risk Score Highlight */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Risk-to-Impact Score</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {risk ? risk.priority_score : vehicle.current_risk_score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold rounded border ${
                vehicle.current_severity === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {vehicle.current_severity} SEVERITY
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Model: {risk ? risk.model_version : 'v1.1-gradient-boost'}
          </div>
        </div>

        {/* Temperature Gauge */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Coolant / Pack Temp</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {vehicle.engine_temp_c || vehicle.battery_temp_c || 92.0} <span className="text-sm font-normal text-slate-400">°C</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Normal threshold: 85 - 105 °C</div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                (vehicle.engine_temp_c || 90) > 110 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, ((vehicle.engine_temp_c || 90) / 130) * 100)}%` }}
            />
          </div>
        </div>

        {/* Battery SoC / Fuel */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Energy State (SoC)</span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {vehicle.soc_pct !== undefined && vehicle.soc_pct !== null ? vehicle.soc_pct : 82.5} <span className="text-sm font-normal text-slate-400">%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Discharge rate: -0.04 %/min</div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${vehicle.soc_pct || 82}%` }}
            />
          </div>
        </div>

        {/* Kinematic Speed */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ground Speed</span>
            <Gauge className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {vehicle.speed_kmh} <span className="text-sm font-normal text-slate-400">km/h</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">GPS: {vehicle.lat.toFixed(4)}, {vehicle.lon.toFixed(4)}</div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500"
              style={{ width: `${Math.min(100, (vehicle.speed_kmh / 120) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry Timeline Chart */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Diagnostic Event-Time Stream (Last 15 Minutes)
        </h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
            Streaming diagnostic window...
          </div>
        ) : (
          <ReactECharts option={chartOptions} style={{ height: '260px' }} />
        )}
      </div>

      {/* Explainable Contributing Factors & Recommendations */}
      {risk && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-sky-400" />
              <span>Explainable Contributing Factors (Why Did This Trigger?)</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              P: {(risk.risk_probability * 100).toFixed(0)}% • I: {risk.impact_exposure} • U: {risk.urgency_factor}x
            </span>
          </div>

          {/* Recommended Action Alert */}
          {risk.recommended_action && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200 flex items-start space-x-2">
              <Wrench className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">Recommended Dispatch Action:</span> {risk.recommended_action}
              </div>
            </div>
          )}

          {/* Factors Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono">
                <tr>
                  <th className="px-3 py-2">Signal / Anomaly Factor</th>
                  <th className="px-3 py-2">Relative Weight</th>
                  <th className="px-3 py-2">Measured Value</th>
                  <th className="px-3 py-2">Safe Threshold</th>
                  <th className="px-3 py-2">Impact Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {risk.contributing_factors.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-850/50">
                    <td className="px-3 py-2.5 font-medium text-slate-200">{f.factor}</td>
                    <td className="px-3 py-2.5 font-mono text-sky-400">{(f.weight * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2.5 font-mono text-rose-300 font-bold">{f.value || 'Active'}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">{f.threshold || 'Nominal'}</td>
                    <td className="px-3 py-2.5 text-slate-300">{f.detail || 'Critical threshold breached'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
