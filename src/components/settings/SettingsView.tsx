'use client';

import React, { useState } from 'react';
import { RiskThresholdConfig } from '@/lib/risk/risk-config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import {
  Sliders,
  ShieldCheck,
  Key,
  Database,
  RefreshCw,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface SettingsViewProps {
  currentConfig: RiskThresholdConfig;
  onUpdateConfig: (config: Partial<RiskThresholdConfig>) => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentConfig,
  onUpdateConfig,
  onClearAllData,
}) => {
  const [config, setConfig] = useState<RiskThresholdConfig>(currentConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Risk Engine Weights Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Deterministic Risk Engine Parameters</CardTitle>
          <CardDescription>
            Institutional scoring weights and threshold rules used to identify students requiring early intervention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveConfig} className="space-y-6 text-xs">
            {/* Section 1: Attendance Thresholds */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-1">
                1. Attendance Deficit Triggers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Warning Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={config.attendanceWarningThreshold}
                    onChange={(e) =>
                      setConfig({ ...config, attendanceWarningThreshold: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Adds +{config.attendanceWarningPoints} pts to risk score</span>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Severe Deficit Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={config.attendanceSevereThreshold}
                    onChange={(e) =>
                      setConfig({ ...config, attendanceSevereThreshold: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Adds +{config.attendanceSeverePoints} pts to risk score</span>
                </div>
              </div>
            </div>

            {/* Section 2: Academic Drops & Backlogs */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-1">
                2. Academic Drop & Backlog Triggers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    SGPA Significant Drop Delta
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.sgpaDeclineThreshold}
                    onChange={(e) =>
                      setConfig({ ...config, sgpaDeclineThreshold: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Drop &gt; 0.5 adds +{config.sgpaDeclinePoints} pts</span>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Multiple Backlogs Threshold
                  </label>
                  <input
                    type="number"
                    value={config.backlogMultipleThreshold}
                    onChange={(e) =>
                      setConfig({ ...config, backlogMultipleThreshold: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">&gt;= 2 backlogs adds +{config.backlogMultiplePoints} pts (1 backlog = +{config.backlogSinglePoints} pt)</span>
                </div>
              </div>
            </div>

            {/* Section 3: Risk Classification Cutoffs */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-1">
                3. Risk Classification Bands (Point Cutoffs)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-800 block">LOW RISK</span>
                  <p className="text-emerald-700 mt-1">0 to {config.lowMaxScore} points</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="font-bold text-amber-800 block">MODERATE</span>
                  <p className="text-amber-700 mt-1">{config.lowMaxScore + 1} to {config.moderateMaxScore} points</p>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="font-bold text-rose-800 block">HIGH / CRITICAL</span>
                  <p className="text-rose-700 mt-1">{config.moderateMaxScore + 1} to {config.highMaxScore} (High) / &gt;{config.highMaxScore} (Critical)</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              {saveSuccess ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Parameters Updated Successfully
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-sm"
              >
                Save Engine Parameters
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* System Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Connectivity & Storage</CardTitle>
          <CardDescription>Status of external services and client database sync</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Google Gemini AI Engine</p>
                <p className="text-slate-500">
                  {process.env.GEMINI_API_KEY ? 'Configured in Environment' : 'Connected via fallback deterministic synthesis'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Supabase Database & Local Storage</p>
                <p className="text-slate-500">
                  {isSupabaseConfigured ? 'Connected to Remote Supabase PostgreSQL' : 'Local Storage Engine Active (Full Offline/Demo Support)'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Operational
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Data Management & Testing Isolation */}
      <Card className="border-rose-200/80">
        <CardHeader>
          <CardTitle className="text-rose-900">Database & State Management</CardTitle>
          <CardDescription>Reset or clear stored data across browser sessions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-xs">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all imported students and records?')) {
                onClearAllData();
              }
            }}
            className="px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </CardContent>
      </Card>
    </div>
  );
};
