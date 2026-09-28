'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  CalendarCheck,
  TrendingUp,
  Sliders,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Database,
  FileSpreadsheet,
  UserX,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'students'
  | 'manage'
  | 'upload'
  | 'followups'
  | 'improvement'
  | 'settings';

interface AppShellProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  children: React.ReactNode;
  stats?: {
    totalStudents: number;
    highRiskCount: number;
    followUpsDueCount: number;
  };
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onTabChange,
  children,
  stats = { totalStudents: 0, highRiskCount: 0, followUpsDueCount: 0 },
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Risk Summary',
    },
    {
      id: 'students' as NavTab,
      label: 'Students & Risk',
      icon: Users,
      badge: stats.highRiskCount > 0 ? `${stats.highRiskCount} High` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
      description: 'Directory & Risk Signals',
    },
    {
      id: 'manage' as NavTab,
      label: 'Manage & Delete',
      icon: UserX,
      description: 'Search & Safe Student Deletion',
    },
    {
      id: 'upload' as NavTab,
      label: 'CSV Upload & Validate',
      icon: UploadCloud,
      description: 'Ingestion & Error Checking',
    },
    {
      id: 'followups' as NavTab,
      label: 'Follow-up Queue',
      icon: CalendarCheck,
      badge: stats.followUpsDueCount > 0 ? `${stats.followUpsDueCount} Due` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      description: 'Intervention Milestones',
    },
    {
      id: 'improvement' as NavTab,
      label: 'Improvement Tracking',
      icon: TrendingUp,
      description: 'Before & After Analysis',
    },
    {
      id: 'settings' as NavTab,
      label: 'Risk Config & System',
      icon: Sliders,
      description: 'Engine Weights & API Status',
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 hidden md:flex">
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-base">CounsellAI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-medium border border-blue-400/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              Student Intervention Agent
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-semibold text-slate-200">
              SM
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">Dr. S. Mehta</p>
              <p className="text-[11px] text-slate-400">Chief Counsellor</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>Auth</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-20">
          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden items-center gap-2 overflow-x-auto py-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium shrink-0 ${
                  currentTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <h1 className="text-base font-semibold text-slate-800">
              {navItems.find((n) => n.id === currentTab)?.label}
            </h1>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">
              {navItems.find((n) => n.id === currentTab)?.description}
            </span>
          </div>

          {/* Quick Metrics Header Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500">Active Cohort:</span>
              <span className="font-semibold text-slate-800">
                {stats.totalStudents} Students
              </span>
              {stats.highRiskCount > 0 && (
                <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {stats.highRiskCount} High / Critical
                </span>
              )}
            </div>

            <button
              onClick={() => onTabChange('upload')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
