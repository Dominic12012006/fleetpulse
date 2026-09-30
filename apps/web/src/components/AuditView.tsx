import React, { useEffect, useState } from 'react';
import { FileText, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';
import { AuditLog, api } from '../services/api';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Tamper-Proof Platform Audit Trail
          </h2>
          <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-mono">
            {logs.length} Logged Transactions
          </span>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh Audit Logs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono">
            <tr>
              <th className="px-4 py-2.5">Timestamp (UTC)</th>
              <th className="px-4 py-2.5">Action Executed</th>
              <th className="px-4 py-2.5">Target Entity</th>
              <th className="px-4 py-2.5">Details & State Mutation</th>
              <th className="px-4 py-2.5">Actor / Origin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500 font-sans text-xs">
                  No security audit events recorded in current session.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-850/50">
                  <td className="px-4 py-2.5 text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">
                    {log.entity_type}: {log.entity_id.slice(0, 12)}...
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 font-sans text-xs">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">
                    manager@fleetpulse.io
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
