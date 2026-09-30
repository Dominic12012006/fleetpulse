import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Vehicle } from '../services/api';
import { Compass, ZoomIn, ZoomOut, Layers, MapPin, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface FleetMapProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  selectedVehicleId?: string;
}

interface TileProvider {
  name: string;
  url: string;
  subdomains?: string;
  maxZoom: number;
  attribution: string;
}

const TILE_PROVIDERS: Record<string, TileProvider> = {
  streets: {
    name: 'Navigation Roads',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: '&copy; Esri &mdash; High-definition global navigation telematics'
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  },
  canvas: {
    name: 'Clean Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    attribution: '&copy; Esri, HERE, Garmin'
  }
};

const HUBS = [
  { id: 'all', name: 'Global Corridor', lat: 39.5, lon: -45.0, zoom: 3 },
  { id: 'chicago', name: 'Chicago Hub', lat: 41.8781, lon: -87.6298, zoom: 10 },
  { id: 'dallas', name: 'Dallas Logistics', lat: 32.7767, lon: -96.7970, zoom: 10 },
  { id: 'atlanta', name: 'Atlanta Distribution', lat: 33.7490, lon: -84.3880, zoom: 10 },
  { id: 'la', name: 'Los Angeles Port', lat: 34.0522, lon: -118.2437, zoom: 10 },
  { id: 'newyork', name: 'New York Gateway', lat: 40.7128, lon: -74.0060, zoom: 10 },
  { id: 'frankfurt', name: 'Frankfurt Central', lat: 50.1109, lon: 8.6821, zoom: 10 },
  { id: 'rotterdam', name: 'Rotterdam Port', lat: 51.9244, lon: 4.4777, zoom: 10 }
];

export const FleetMap: React.FC<FleetMapProps> = ({
  vehicles,
  onSelectVehicle,
  selectedVehicleId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeTileKey, setActiveTileKey] = useState<keyof typeof TILE_PROVIDERS>('streets');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [activeHub, setActiveHub] = useState<string>('all');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [39.5, -45.0],
        zoom: 3,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        preferCanvas: true
      });

      // Default: Voyager Tile Layer (rich, colorful, unmistakable geographic map with oceans and highways)
      const tileConfig = TILE_PROVIDERS[activeTileKey];
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: tileConfig.subdomains || 'abc',
        maxZoom: tileConfig.maxZoom || 19
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Layer group for vehicle markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Force recalculation of container size after DOM layout settles
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    // Resize observer to ensure tiles are never gray or clipped
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer if user toggles basemap
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const tileConfig = TILE_PROVIDERS[activeTileKey];
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains || 'abc',
      maxZoom: tileConfig.maxZoom || 19
    }).addTo(mapInstanceRef.current);
  }, [activeTileKey]);

  // Update Markers when vehicles, filters, or selected vehicle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = vehicles.filter(v => {
      if (filterSeverity === 'ALL') return true;
      return v.current_severity === filterSeverity;
    });

    filtered.forEach(v => {
      if (!v.lat || !v.lon) return;

      const isSelected = v.id === selectedVehicleId;
      const isCritical = v.current_severity === 'CRITICAL';
      const isHigh = v.current_severity === 'HIGH';

      let fillColor = '#2563EB'; // Royal Blue
      let strokeColor = '#FFFFFF';
      let radius = 6;
      let fillOpacity = 0.85;

      if (isCritical) {
        fillColor = '#EF4444';
        radius = 8;
        fillOpacity = 1.0;
        strokeColor = '#FFFFFF';

        // Static outer halo ring for critical grounding (pinned to vehicle coordinates)
        const outerHalo = L.circleMarker([v.lat, v.lon], {
          radius: 14,
          fillColor: '#EF4444',
          fillOpacity: 0.2,
          color: '#DC2626',
          weight: 1.5,
          opacity: 0.7
        });
        outerHalo.addTo(markersLayerRef.current!);
      } else if (isHigh) {
        fillColor = '#F59E0B';
        radius = 6.5;
        fillOpacity = 0.9;
        strokeColor = '#FFFFFF';
      }

      if (isSelected) {
        radius = 11;
        strokeColor = '#0F172A';
      }

      // Main Circle Marker with high-contrast border
      const marker = L.circleMarker([v.lat, v.lon], {
        radius: radius,
        fillColor: fillColor,
        color: strokeColor,
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: fillOpacity
      });

      // Hover Tooltip with vehicle specs
      marker.bindTooltip(
        `<div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <div style="font-weight: bold; color: #0F172A;">${v.vin}</div>
          <div style="color: ${fillColor}; font-weight: 600; font-size: 10px;">${v.current_severity} • ${v.make} ${v.model}</div>
          <div style="color: #64748B; font-size: 10px;">Speed: ${v.speed_kmh} km/h • Risk: ${v.current_risk_score}</div>
        </div>`,
        { direction: 'top', offset: [0, -8], opacity: 0.98 }
      );

      // Popup Content on click
      const popupHtml = `
        <div style="font-family: inherit; padding: 6px; min-width: 210px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-family: monospace; font-weight: bold; font-size: 12px; color: #0F172A;">${v.vin}</span>
            <span style="background: ${isCritical ? '#FEE2E2' : isHigh ? '#FEF3C7' : '#EFF6FF'}; color: ${isCritical ? '#DC2626' : isHigh ? '#D97706' : '#2563EB'}; padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: bold;">
              ${v.current_severity}
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            ${v.make} ${v.model} (${v.year}) • <span style="font-weight: 600;">${v.propulsion_type}</span>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px; font-size: 11px; font-family: monospace; color: #334155; margin-bottom: 8px; line-height: 1.5;">
            <div>Speed: <strong>${v.speed_kmh} km/h</strong></div>
            <div>Temp: <strong>${v.engine_temp_c || v.battery_temp_c || 90}°C</strong></div>
            <div>Risk Score: <strong>${v.current_risk_score} / 100</strong></div>
            ${v.active_dtcs && v.active_dtcs.length > 0 ? `<div style="color: #DC2626; margin-top: 3px;">Active DTCs: <strong>${v.active_dtcs.join(', ')}</strong></div>` : ''}
          </div>
          <button id="inspect-btn-${v.id}" style="width: 100%; padding: 7px; background: #0F172A; color: #FFFFFF; font-size: 11px; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; transition: background 0.15s ease;">
            Inspect Vehicle Diagnostics
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`inspect-btn-${v.id}`);
        if (btn) {
          btn.onclick = () => onSelectVehicle(v);
        }
      });

      marker.on('click', () => {
        onSelectVehicle(v);
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [vehicles, filterSeverity, selectedVehicleId]);

  function handleHubJump(hub: typeof HUBS[0]) {
    setActiveHub(hub.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hub.lat, hub.lon], hub.zoom, { duration: 1.2 });
    }
  }

  function handleFitAllVehicles() {
    if (!mapInstanceRef.current || vehicles.length === 0) return;
    const validCoords = vehicles
      .filter(v => v.lat && v.lon)
      .map(v => [v.lat, v.lon] as [number, number]);
    
    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  }

  const criticalCount = vehicles.filter(v => v.current_severity === 'CRITICAL').length;
  const highCount = vehicles.filter(v => v.current_severity === 'HIGH').length;
  const lowCount = vehicles.filter(v => v.current_severity === 'LOW' || v.current_severity === 'MEDIUM').length;

  return (
    <div className="bg-white border border-[#E5E9F2] rounded-[24px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col h-[580px] font-sans">
      {/* Map Header with Geographic Controls & Basemap Switcher */}
      <div className="px-6 py-4 border-b border-[#F0F3F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">Live Telemetry Geographic Map</h3>
              <span className="px-2.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-mono font-bold">
                {vehicles.length.toLocaleString()} Units Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Real-time global navigation & telematics tracking across freight corridors</p>
          </div>
        </div>

        {/* Severity Filter Pills & Layer Switcher */}
        <div className="flex items-center space-x-2">
          {/* Basemap Style Toggle */}
          <div className="hidden md:flex items-center bg-[#F4F6FA] p-1 rounded-full text-[11px] border border-[#E8ECF2]">
            {(Object.keys(TILE_PROVIDERS) as Array<keyof typeof TILE_PROVIDERS>).map(key => (
              <button
                key={key}
                onClick={() => setActiveTileKey(key)}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  activeTileKey === key
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {key === 'streets' ? 'Streets' : key === 'osm' ? 'OpenStreetMap' : 'Light Canvas'}
              </button>
            ))}
          </div>

          {/* Severity Pills with live counts */}
          <div className="flex items-center space-x-1 bg-[#F4F6FA] p-1 rounded-full text-xs border border-[#E8ECF2]">
            {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  filterSeverity === sev
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev === 'ALL' && `All (${vehicles.length})`}
                {sev === 'CRITICAL' && `Critical (${criticalCount})`}
                {sev === 'HIGH' && `High (${highCount})`}
                {sev === 'LOW' && `Low (${lowCount})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hub Quick-Jump Bar */}
      <div className="px-6 py-2.5 bg-[#F8FAFC] border-b border-[#F0F3F8] flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 font-mono">
          Corridor Hubs:
        </span>
        {HUBS.map(hub => (
          <button
            key={hub.id}
            onClick={() => handleHubJump(hub)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 ${
              activeHub === hub.id
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-white border border-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {hub.name}
          </button>
        ))}

        <button
          onClick={handleFitAllVehicles}
          title="Fit view to all vehicles"
          className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-600 bg-white border border-[#E2E8F0] hover:bg-slate-50 flex items-center space-x-1 shrink-0"
        >
          <RefreshCw className="w-3 h-3 text-slate-500" />
          <span>Fit All</span>
        </button>
      </div>

      {/* Real Map Surface */}
      <div className="relative flex-1 w-full h-full min-h-[360px]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Map Floating Legend matching Dribbble aesthetic */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 border border-[#E2E8F0] px-4 py-2.5 rounded-2xl text-[11px] font-medium flex items-center space-x-4 text-slate-700 shadow-md backdrop-blur-md">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Nominal Fleet</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Elevated Risk</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Critical Grounding</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col space-y-1.5">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zoom In"
            className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-md transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zoom Out"
            className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-md transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
