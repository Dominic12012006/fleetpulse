import React, { useState } from 'react';
import { ArrowUpRight, ChevronDown, MoreHorizontal, TrendingUp, Cpu, Zap } from 'lucide-react';

export const FleetDistributionCharts: React.FC = () => {
  const [selectedCorridor, setSelectedCorridor] = useState('All Freight Corridors');
  const [selectedMetric, setSelectedMetric] = useState('Hourly EPS');

  // Dot matrix columns data for the 12 months (mimicking the Dribbble shot aesthetic)
  const monthsData = [
    { month: 'Jan', blueCount: 2, lightCount: 1 },
    { month: 'Feb', blueCount: 3, lightCount: 2 },
    { month: 'Mar', blueCount: 4, lightCount: 2 },
    { month: 'Apr', blueCount: 6, lightCount: 3 },
    { month: 'May', blueCount: 8, lightCount: 4 },
    { month: 'Jun', blueCount: 10, lightCount: 5 },
    { month: 'Jul', blueCount: 12, lightCount: 6, isHovered: true },
    { month: 'Aug', blueCount: 9, lightCount: 4 },
    { month: 'Sep', blueCount: 7, lightCount: 3 },
    { month: 'Oct', blueCount: 5, lightCount: 2 },
    { month: 'Nov', blueCount: 6, lightCount: 3 },
    { month: 'Dec', blueCount: 8, lightCount: 4 },
  ];

  // Radial arc ticks (34 tick lines across a 180-degree semicircular arc)
  const totalTicks = 34;
  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    // Angle from -180 deg to 0 deg
    const angle = Math.PI - (i / (totalTicks - 1)) * Math.PI;
    const rOuter = 102;
    const rInner = 74;
    const cx = 130;
    const cy = 115;
    const x1 = cx + rInner * Math.cos(angle);
    const y1 = cy - rInner * Math.sin(angle);
    const x2 = cx + rOuter * Math.cos(angle);
    const y2 = cy - rOuter * Math.sin(angle);

    // Color gradient across the ticks matching Dribbble shot: deep blue -> light blue -> slate
    const ratio = i / totalTicks;
    let stroke = '#1D4ED8';
    if (ratio > 0.65) stroke = '#E2E8F0';
    else if (ratio > 0.45) stroke = '#93C5FD';
    else if (ratio > 0.25) stroke = '#3B82F6';

    return { x1, y1, x2, y2, stroke };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Left Card: Telemetry Ingestion Volume (Bubble Matrix Columns Chart matching Dribbble template) */}
      <div className="lg:col-span-8 bg-white border border-[#E5E9F2] rounded-[24px] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Telemetry Ingestion Volume</h3>
            <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Kafka Event Stream</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-200" />
                <span>Flink Window Cache</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 bg-[#F4F6FA] border border-[#E8ECF2] rounded-full text-xs font-semibold text-slate-700 flex items-center space-x-1">
              <span>{selectedCorridor}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="px-3 py-1.5 bg-[#F4F6FA] border border-[#E8ECF2] rounded-full text-xs font-semibold text-slate-700 flex items-center space-x-1">
              <span>{selectedMetric}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <button 
              title="More ingestion options"
              className="w-8 h-8 rounded-full bg-[#F4F6FA] hover:bg-slate-100 border border-[#E8ECF2] flex items-center justify-center text-slate-600 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Matrix Columns Canvas */}
        <div className="relative pt-6 pb-2">
          {/* Y Axis Grid Lines */}
          <div className="space-y-6 text-[10px] font-mono text-slate-400">
            <div className="flex items-center space-x-3">
              <span className="w-7 text-right">100K</span>
              <div className="flex-1 border-t border-dashed border-slate-100" />
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-7 text-right">70K</span>
              <div className="flex-1 border-t border-dashed border-slate-100" />
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-7 text-right">50K</span>
              <div className="flex-1 border-t border-dashed border-slate-100" />
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-7 text-right">25K</span>
              <div className="flex-1 border-t border-dashed border-slate-100" />
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-7 text-right">0</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
          </div>

          {/* Stacked Dot Columns */}
          <div className="absolute inset-x-0 bottom-6 left-12 right-4 flex items-end justify-between px-2">
            {monthsData.map((col) => (
              <div key={col.month} className="flex flex-col items-center group relative cursor-pointer">
                {/* July Tooltip Bubble (as shown in Dribbble reference) */}
                {col.isHovered && (
                  <div className="absolute -top-16 bg-white border border-[#E2E8F0] shadow-lg rounded-xl px-2.5 py-1.5 text-[10px] font-semibold text-slate-800 z-20 whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>Kafka Stream: <strong>70,901 EPS</strong></span>
                    </div>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                      <span>Flink Cache: <strong>92,921 Evt/s</strong></span>
                    </div>
                  </div>
                )}

                {/* Stack of circles */}
                <div className="flex flex-col-reverse items-center space-y-reverse space-y-1">
                  {/* Blue circles */}
                  {Array.from({ length: col.blueCount }).map((_, cIdx) => (
                    <div
                      key={`b-${cIdx}`}
                      className="w-3 h-3 rounded-full bg-blue-600 transition-transform group-hover:scale-110"
                    />
                  ))}
                  {/* Light blue circles on top */}
                  {Array.from({ length: col.lightCount }).map((_, cIdx) => (
                    <div
                      key={`l-${cIdx}`}
                      className="w-3 h-3 rounded-full bg-blue-200 transition-transform group-hover:scale-110"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* X Axis Month Labels */}
          <div className="flex justify-between pl-12 pr-4 pt-2 text-[11px] font-medium text-slate-500">
            {monthsData.map(m => (
              <span key={m.month} className={m.isHovered ? 'text-blue-600 font-bold' : ''}>
                {m.month}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Card: Fleet Propulsion & Risk Segment (Radial Arc Meter matching Dribbble template) */}
      <div className="lg:col-span-4 bg-white border border-[#E5E9F2] rounded-[24px] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[360px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Propulsion & Risk Category</h3>
            <p className="text-[11px] text-slate-500 font-medium">Fleet breakdown by powertrain</p>
          </div>
          <button 
            title="Inspect Powertrain Distribution"
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Semicircular Radial Sliced Arc Meter */}
        <div className="flex flex-col items-center justify-center my-2 relative">
          <svg viewBox="0 0 260 140" className="w-56 h-32">
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.stroke}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Center Metric */}
          <div className="absolute bottom-2 text-center">
            <div className="text-3xl font-black tracking-tight text-slate-900 font-sans">
              8,214
            </div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              Nominal Fleet Units
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-500 font-medium my-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Heavy EV (3,450)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-300" />
            <span>Hybrid (2,850)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span>Clean ICE (3,700)</span>
          </div>
        </div>

        {/* Bottom Green Pill Chip matching Dribbble template */}
        <div className="mt-2 py-2 px-3 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-emerald-100">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>+12.2% Predictive downtime avoided vs prior cycle</span>
        </div>
      </div>
    </div>
  );
};
