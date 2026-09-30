import React, { useState } from 'react';
import { Vehicle } from '../services/api';
import { MapPin, Navigation, Info } from 'lucide-react';

interface FleetMapProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  selectedVehicleId?: string;
}

export const FleetMap: React.FC<FleetMapProps> = ({
  vehicles,
  onSelectVehicle,
  selectedVehicleId
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Filter vehicles
  const displayedVehicles = vehicles.filter(v => {
    if (filterSeverity === 'ALL') return true;
    return v.current_severity === filterSeverity;
  });

  // Calculate coordinates bounds mapped to 0-100% SVG coordinates
  // US and European bounds roughly mapped for visualization
  const getMapCoordinates = (lat: number, lon: number) => {
    // Basic projection mapping for US/Europe metros
    // Lon [-125, 15] -> X [5, 95]
    // Lat [25, 55] -> Y [85, 15]
    const x = Math.min(95, Math.max(5, ((lon - (-125)) / (15 - (-125))) * 90 + 5));
    const y = Math.min(90, Math.max(10, 100 - (((lat - 25) / (55 - 25)) * 80 + 10)));
    return { x, y };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-[480px]">
      {/* Header controls */}
      <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Live Fleet Geo-Telemetry
          </span>
          <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-mono">
            {displayedVehicles.length} plotted
          </span>
        </div>

        <div className="flex items-center space-x-1 text-xs">
          {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                filterSeverity === sev
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Visual Surface */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden cursor-crosshair">
        {/* Subtle Map Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-25"></div>

        {/* Major Hub Regions Background Labels */}
        <div className="absolute top-[32%] left-[18%] text-[10px] font-mono text-slate-700 select-none">PORT OF LA / WEST</div>
        <div className="absolute top-[28%] left-[45%] text-[10px] font-mono text-slate-700 select-none">CHICAGO METRO HUB</div>
        <div className="absolute top-[48%] left-[42%] text-[10px] font-mono text-slate-700 select-none">DALLAS LOGISTICS</div>
        <div className="absolute top-[34%] left-[65%] text-[10px] font-mono text-slate-700 select-none">NEW YORK / NE</div>
        <div className="absolute top-[22%] left-[82%] text-[10px] font-mono text-slate-700 select-none">FRANKFURT / ROTTERDAM</div>

        {/* Vehicles Plotting Points */}
        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          {displayedVehicles.slice(0, 150).map(v => {
            const { x, y } = getMapCoordinates(v.lat, v.lon);
            const isSelected = v.id === selectedVehicleId;
            const isCritical = v.current_severity === 'CRITICAL';
            const isHigh = v.current_severity === 'HIGH';

            let fill = '#10b981'; // Green
            if (isCritical) fill = '#ef4444'; // Red
            else if (isHigh) fill = '#f59e0b'; // Amber

            return (
              <g key={v.id} transform={`translate(${x}%, ${y}%)`} className="pointer-events-auto cursor-pointer" onClick={() => onSelectVehicle(v)}>
                {isCritical && (
                  <circle r="12" fill={fill} opacity="0.3" className="animate-ping" />
                )}
                <circle
                  r={isSelected ? "7" : isCritical ? "5" : "3.5"}
                  fill={fill}
                  stroke={isSelected ? "#ffffff" : "#0f172a"}
                  strokeWidth="1.5"
                  className="transition-all hover:scale-150"
                />
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg text-[10px] font-mono flex items-center space-x-3 text-slate-300">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Critical (&gt;80)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>High (60-79)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Normal (&lt;60)</span>
          </div>
        </div>

        {/* Map tip */}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 flex items-center space-x-1">
          <Info className="w-3 h-3" />
          <span>Click any vehicle node to inspect diagnostic timeline</span>
        </div>
      </div>
    </div>
  );
};
