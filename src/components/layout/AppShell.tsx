import React, { useState } from 'react';
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
  Building2,
  Calendar,
  Layers,
  History,
  FileText,
  LogOut,
  UserCheck,
  KeyRound,
  X,
  Check,
} from 'lucide-react';
import { CounselorScope, User } from '@/types';
import { store } from '@/lib/storage/store';

export type NavTab =
  | 'admin-dashboard'
  | 'admin-counselors'
  | 'admin-departments'
  | 'admin-years'
  | 'admin-sections'
  | 'admin-audit'
  | 'dashboard'
  | 'students'
  | 'counselling'
  | 'manage'
  | 'upload'
  | 'followups'
  | 'improvement'
  | 'settings';

interface AppShellProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentUser: User;
  scope: CounselorScope | null;
  onLogout: () => void;
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
  currentUser,
  scope,
  onLogout,
  children,
  stats = { totalStudents: 0, highRiskCount: 0, followUpsDueCount: 0 },
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  // Password change modal state
  const [showPassModal, setShowPassModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);
    setIsChangingPass(true);

    try {
      const res = await store.changeOwnPassword(currentUser.id, currentPass, newPass);
      if (!res.success) {
        setPassError(res.error || 'Failed to update password.');
      } else {
        setPassSuccess('Password updated successfully! It is saved to your account.');
        setCurrentPass('');
        setNewPass('');
        setTimeout(() => {
          setShowPassModal(false);
          setPassSuccess(null);
        }, 2000);
      }
    } catch (err: any) {
      setPassError(err.message || 'Error changing password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Admin Navigation structure as specified in Section 5 & 19 of newupdation.md
  const adminNavItems = [
    {
      id: 'admin-dashboard' as NavTab,
      label: 'Admin Dashboard',
      icon: LayoutDashboard,
      description: 'Campus-wide Metrics & Risk',
    },
    {
      id: 'admin-counselors' as NavTab,
      label: 'Users & Counselors',
      icon: UserCheck,
      description: 'Credentials & Scope Capacity',
    },
    {
      id: 'admin-departments' as NavTab,
      label: 'Departments',
      icon: Building2,
      description: 'Branches & Programs',
    },
    {
      id: 'admin-years' as NavTab,
      label: 'Years',
      icon: Calendar,
      description: 'Academic Batches (1–4)',
    },
    {
      id: 'admin-sections' as NavTab,
      label: 'Sections',
      icon: Layers,
      description: 'Class Sections (Max 2/sec)',
    },
    {
      id: 'students' as NavTab,
      label: 'Students Directory',
      icon: Users,
      badge: stats.highRiskCount > 0 ? `${stats.highRiskCount} High` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      description: 'Institutional Cohort',
    },
    {
      id: 'counselling' as NavTab,
      label: 'Counselling Records',
      icon: FileText,
      description: 'All Session Records',
    },
    {
      id: 'followups' as NavTab,
      label: 'Follow-ups',
      icon: CalendarCheck,
      badge: stats.followUpsDueCount > 0 ? `${stats.followUpsDueCount} Due` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      description: 'Intervention Milestones',
    },
    {
      id: 'improvement' as NavTab,
      label: 'Improvement Tracking',
      icon: TrendingUp,
      description: 'Longitudinal Growth Analysis',
    },
    {
      id: 'settings' as NavTab,
      label: 'Risk Configuration',
      icon: Sliders,
      description: 'Deterministic Engine Rules',
    },
    {
      id: 'upload' as NavTab,
      label: 'CSV Imports',
      icon: UploadCloud,
      description: 'Institutional Bulk Data Ingestion',
    },
    {
      id: 'admin-audit' as NavTab,
      label: 'Audit Logs',
      icon: History,
      description: 'Immutable Event Trail',
    },
    {
      id: 'manage' as NavTab,
      label: 'Student Deletion',
      icon: UserX,
      description: 'Safe Cascading Cleanup',
    },
  ];

  // Counselor Navigation structure as specified in Section 6 & 19 of newupdation.md
  const counselorNavItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Assigned Cohort Risk',
    },
    {
      id: 'students' as NavTab,
      label: 'Students & Risk',
      icon: Users,
      badge: stats.highRiskCount > 0 ? `${stats.highRiskCount} High` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      description: 'Section Student Directory',
    },
    {
      id: 'counselling' as NavTab,
      label: 'Counselling Records',
      icon: FileText,
      description: 'Session Workspaces & Notes',
    },
    {
      id: 'upload' as NavTab,
      label: 'CSV Upload',
      icon: UploadCloud,
      description: 'Upload Assigned Section Data',
    },
    {
      id: 'followups' as NavTab,
      label: 'Follow-up Queue',
      icon: CalendarCheck,
      badge: stats.followUpsDueCount > 0 ? `${stats.followUpsDueCount} Due` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      description: 'Action Plan Deadlines',
    },
    {
      id: 'improvement' as NavTab,
      label: 'Improvement Tracking',
      icon: TrendingUp,
      description: 'Before & After Snapshots',
    },
  ];

  const activeNavItems = isAdmin ? adminNavItems : counselorNavItems;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 hidden md:flex">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-base">CounselAI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-medium border border-blue-400/30">
                {isAdmin ? 'Admin' : 'Portal'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
              Role-Based Intervention System
            </p>
          </div>
        </div>

        {/* Scope Indicator Pill / Profile Card in Sidebar */}
        <div className="px-3.5 pt-3 pb-1">
          <div className="p-3.5 rounded-2xl bg-slate-800/95 border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between text-[11px] mb-2.5">
              <span
                className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {currentUser.role}
              </span>

              <button
                onClick={onLogout}
                title="Logout from account"
                className="flex items-center gap-1.5 text-xs text-rose-200 hover:text-white bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 px-2.5 py-1 rounded-lg transition-all font-bold shadow-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate">
              {isAdmin ? (
                'Institution-Wide Access'
              ) : scope ? (
                `${scope.department_code} • Year ${scope.year_number} • Sec ${scope.section_name}`
              ) : (
                'Scope Not Assigned'
              )}
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isAdmin ? 'Administrative Modules' : 'Counselor Workspace'}
          </div>
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer User Info & Logout */}
        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{currentUser.username}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.role}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/80 transition-colors text-xs font-semibold shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto py-1 max-w-[65%]">
            {activeNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
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
            <h1 className="text-base font-bold text-slate-800">
              {activeNavItems.find((n) => n.id === currentTab)?.label}
            </h1>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs text-slate-500">
              {activeNavItems.find((n) => n.id === currentTab)?.description}
            </span>
          </div>

          {/* Quick Metrics & User Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500">
                {isAdmin ? 'Campus Cohort:' : `${scope?.department_code || 'Dept'} Yr ${scope?.year_number || ''}:`}
              </span>
              <span className="font-bold text-slate-800">
                {stats.totalStudents} Students
              </span>
              {stats.highRiskCount > 0 && (
                <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {stats.highRiskCount} High / Crit
                </span>
              )}
            </div>

            <button
              onClick={() => onTabChange('upload')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import CSV</span>
            </button>

            {/* Profile & Password & Logout in Top Bar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:flex items-center gap-2 text-xs">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center border border-blue-200 text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left leading-tight">
                  <span className="font-bold text-slate-800 block text-xs truncate max-w-[120px]">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">{currentUser.role}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setPassError(null);
                  setPassSuccess(null);
                  setCurrentPass('');
                  setNewPass('');
                  setShowPassModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                title="Change Account Password"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Password</span>
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Sign out of CounsellAI"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* MODAL: SELF-SERVICE CHANGE PASSWORD */}
      {showPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Change Password</h3>
                  <p className="text-[10px] text-slate-400">Account: {currentUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPassModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 mt-4 text-xs">
              {passError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password..."
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 4 chars)..."
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-mono focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass || !currentPass || !newPass}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {isChangingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
