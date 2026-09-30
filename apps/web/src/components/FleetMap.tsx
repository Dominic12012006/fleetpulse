import React, { useState } from 'react';
import { Vehicle } from '../services/api';
import { Navigation, Info, ArrowUpRight, Zap, Filter } from 'lucide-react';

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
  const [hoveredVehicle, setHoveredVehicle] = useState<Vehicle | null>(null);

  // Filter vehicles
  const displayedVehicles = vehicles.filter(v => {
    if (filterSeverity === 'ALL') return true;
    return v.current_severity === filterSeverity;
  });

  // Accurate SVG 1000x550 Projection Mapping
  // US & European Metro Hubs: Lon [-125, 15], Lat [25, 58]
  const getMapCoordinates = (lat: number, lon: number) => {
    const clampedLon = Math.max(-125, Math.min(15, lon));
    const clampedLat = Math.max(25, Math.min(58, lat));
    
    // X mapped from 50 to 950
    const x = ((clampedLon - (-125)) / (15 - (-125))) * 900 + 50;
    // Y inverted: 50 (North Europe) to 480 (South US)
    const y = 490 - (((clampedLat - 25) / (58 - 25)) * 430 + 30);
    return { x, y };
  };

  const criticalCount = vehicles.filter(v => v.current_severity === 'CRITICAL').length;
  const highCount = vehicles.filter(v => v.current_severity === 'HIGH').length;

  return (
    <div className="bg-white border border-[#E5E9F2] rounded-[24px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col h-[520px] font-sans">
      {/* Header controls matching Syncrowave style */}
      <div className="px-6 py-4 border-b border-[#F0F3F8] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">Live Telemetry Geo-Map</h3>
              <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-full font-mono font-medium">
                {displayedVehicles.length} plotted
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Real-time GPS tracking across trans-Atlantic fleet corridors</p>
          </div>
        </div>

        {/* Filter Pill Tabs */}
        <div className="flex items-center space-x-1 bg-[#F4F6FA] p-1 rounded-full text-xs">
          {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                filterSeverity === sev
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sev === 'ALL' ? 'All Units' : sev}
              {sev === 'CRITICAL' && criticalCount > 0 && ` (${criticalCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Visual Surface */}
      <div className="relative flex-1 bg-[#F8FAFC] overflow-hidden">
        {/* Subtle Map Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />

        {/* SVG Viewport with 1000x550 space */}
        <svg 
          viewBox="0 0 1000 550" 
          className="w-full h-full absolute inset-0"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Soft Radial Gradients for Hub Areas */}
            <radialGradient id="hubGlowUS" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hubGlowEU" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Hub Region Ambient Areas */}
          <circle cx="210" cy="310" r="140" fill="url(#hubGlowUS)" />
          <circle cx="480" cy="230" r="110" fill="url(#hubGlowUS)" />
          <circle cx="850" cy="130" r="100" fill="url(#hubGlowEU)" />

          {/* Inter-Hub Logistics Flight / Freight Corridor Vectors */}
          <path
            d="M 120 330 Q 300 240, 480 230 T 630 180 T 850 130"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="opacity-70"
          />
          <path
            d="M 450 380 Q 470 300, 480 230"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            className="opacity-70"
          />

          {/* Hub Region Labels */}
          <g className="select-none font-mono text-[11px] font-bold fill-slate-400">
            <text x="75" y="360">PORT OF LOS ANGELES</text>
            <text x="440" y="415">DALLAS LOGISTICS</text>
            <text x="450" y="210">CHICAGO METRO HUB</text>
            <text x="610" y="165">NEW YORK GATEWAY</text>
            <text x="800" y="105">FRANKFURT / ROTTERDAM</text>
          </g>

          {/* Hub Anchor Indicators */}
          {[
            { x: 105, y: 340, name: 'LAX' },
            { x: 470, y: 395, name: 'DFW' },
            { x: 480, y: 225, name: 'ORD' },
            { x: 625, y: 175, name: 'JFK' },
            { x: 865, y: 125, name: 'FRA' }
          ].map(hub => (
            <g key={hub.name} transform={`translate(${hub.x}, ${hub.y})`}>
              <circle r="6" fill="#3B82F6" fillOpacity="0.2" />
              <circle r="3" fill="#2563EB" />
            </g>
          ))}

          {/* Plotted Vehicles using exact cx / cy numeric coordinates */}
          {displayedVehicles.slice(0, 150).map(v => {
            const { x, y } = getMapCoordinates(v.lat, v.lon);
            const isSelected = v.id === selectedVehicleId;
            const isCritical = v.current_severity === 'CRITICAL';
            const isHigh = v.current_severity === 'HIGH';

            let fill = '#3B82F6'; // Syncrowave primary Blue
            if (isCritical) fill = '#EF4444'; // Rose / Red
            else if (isHigh) fill = '#F59E0B'; // Amber

            return (
              <g 
                key={v.id} 
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => onSelectVehicle(v)}
                onMouseEnter={() => setHoveredVehicle(v)}
                onMouseLeave={() => setHoveredVehicle(null)}
              >
                {/* Critical ping ring */}
                {isCritical && (
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="#EF4444"
                    fillOpacity="0.25"
                  >
                    <animate
                      attributeName="r"
                      values="6;16;6"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="fill-opacity"
                      values="0.3;0;0.3"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Outer focus halo */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="9"
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Core Vehicle Pin */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : isCritical ? 5 : 3.8}
                  fill={fill}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>

        {/* Hovered Vehicle Inspection Card Popup */}
        {hoveredVehicle && (
          <div 
            className="absolute top-4 left-4 bg-white/95 border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xl backdrop-blur-md z-30 pointer-events-none w-64 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-mono">{hoveredVehicle.vin}</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                hoveredVehicle.current_severity === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                hoveredVehicle.current_severity === 'HIGH' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {hoveredVehicle.current_severity}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {hoveredVehicle.make} {hoveredVehicle.model} ({hoveredVehicle.propulsion_type})
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Risk: <strong className="text-slate-900">{hoveredVehicle.current_risk_score}</strong></span>
              <span>Speed: <strong className="text-slate-900">{hoveredVehicle.speed_kmh} km/h</strong></span>
            </div>
          </div>
        )}

        {/* Bottom Status Legend matching Syncrowave style */}
        <div className="absolute bottom-4 left-4 bg-white/90 border border-[#E2E8F0] px-4 py-2.5 rounded-full text-[11px] font-medium flex items-center space-x-4 text-slate-600 shadow-sm backdrop-blur-md">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Nominal Fleet</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Elevated Risk (60-79)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Critical Grounding (&gt;80)</span>
          </div>
        </div>

        {/* Map Tip */}
        <div className="absolute bottom-4 right-4 bg-white/90 border border-[#E2E8F0] px-3 py-2 rounded-full text-[10px] font-medium text-slate-500 flex items-center space-x-1.5 shadow-sm backdrop-blur-md">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Click any vehicle beacon to open component telemetry</span>
        </div>
      </div>
    </div>
  );
};
