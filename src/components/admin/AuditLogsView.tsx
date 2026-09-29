'use client';

import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  User,
  Activity,
  Code,
  X,
  FileText,
} from 'lucide-react';
import { AuditLog } from '@/types';
import { store } from '@/lib/storage/store';

export const AuditLogsView: React.FC = () => {
  const auditLogs = store.getAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [inspectedLog, setInspectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(auditLogs.map((l) => l.action)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Security & Compliance
            </span>
            <span className="text-xs text-slate-400">• Immutable System Audit Trail</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Institutional Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time record of all administrative, counselor, authentication, and cohort data events.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{auditLogs.length} Total Events Logged</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search user, action, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Actions ({auditLogs.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Entity</th>
                <th className="px-4 py-3.5">Metadata Preview</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No audit logs matching search filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-700">
                          {log.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{log.username}</span>
                          <span className="text-[10px] text-slate-400">{log.user_role}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 truncate max-w-xs font-mono text-[11px]">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setInspectedLog(log)}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT METADATA MODAL */}
      {inspectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Audit Log Event Inspector</h3>
              </div>
              <button onClick={() => setInspectedLog(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Action</span>
                  <span className="font-bold text-slate-900 font-mono">{inspectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Timestamp</span>
                  <span className="font-medium text-slate-800">
                    {new Date(inspectedLog.timestamp).toISOString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Actor User</span>
                  <span className="font-semibold text-slate-800">
                    {inspectedLog.username} ({inspectedLog.user_role})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Entity Type</span>
                  <span className="font-semibold text-slate-800">{inspectedLog.entity_type}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Raw Event Metadata JSON</label>
                <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56">
                  {JSON.stringify(inspectedLog.metadata || {}, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setInspectedLog(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
