import React from 'react';
import { Download, SlidersHorizontal, Calendar, MoreHorizontal } from 'lucide-react';

interface FleetHeaderProps {
  title?: string;
  subtitle?: string;
  subTab: string;
  setSubTab: (t: string) => void;
  onExportData?: () => void;
}

export const FleetHeader: React.FC<FleetHeaderProps> = ({
  title = "Fleet Operations Overview",
  subtitle = "Real-time multi-OEM telematics, Flink event-time windowing, and predictive ML risk prioritization.",
  subTab,
  setSubTab,
  onExportData
}) => {
  const subTabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'insight', label: 'Insight' },
    { id: 'diagnostics', label: 'Diagnostics' },
    { id: 'predictive', label: 'Predictive ML' },
    { id: 'sla', label: 'SLA Health' }
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* Top Title & Action Buttons Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Export Telemetry Pill Button */}
          <button
            onClick={onExportData}
            title="Download CSV dataset of current fleet telemetry"
            className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-full text-xs font-semibold text-slate-800 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Telemetry</span>
          </button>

          {/* Quick Settings / View Options Button */}
          <button 
            title="View Settings & Metrics Filter"
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-[#E2E8F0] flex items-center justify-center text-slate-600 shadow-sm transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Secondary Filter & Date Selector Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Sub-Tabs Pills matching Dribbble template */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {subTabs.map(tab => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-[#E8ECF2]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date Range Picker Pill & Options */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-white border border-[#E2E8F0] px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-700 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>1 June 2026</span>
            <span className="text-slate-300">—</span>
            <span>30 Sept 2026</span>
          </div>

          <button className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
