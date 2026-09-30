'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell, NavTab } from '@/components/layout/AppShell';
import { LoginView } from '@/components/auth/LoginView';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';
import { CounselorsManagementView } from '@/components/admin/CounselorsManagementView';
import { DepartmentsManagementView } from '@/components/admin/DepartmentsManagementView';
import { YearsManagementView } from '@/components/admin/YearsManagementView';
import { SectionsManagementView } from '@/components/admin/SectionsManagementView';
import { AuditLogsView } from '@/components/admin/AuditLogsView';
import { AllCounsellingRecordsView } from '@/components/counselling/AllCounsellingRecordsView';
import { StudentsTableView } from '@/components/students/StudentsTableView';
import { CsvUploadView } from '@/components/upload/CsvUploadView';
import { FollowUpsView } from '@/components/followups/FollowUpsView';
import { ImprovementView } from '@/components/improvement/ImprovementView';
import { SettingsView } from '@/components/settings/SettingsView';
import { StudentManagementView } from '@/components/students/StudentManagementView';
import { StudentProfileModal } from '@/components/students/StudentProfileModal';
import { CounsellingSessionModal } from '@/components/counselling/CounsellingSessionModal';
import { store, DashboardStats } from '@/lib/storage/store';
import { authService, AuthSession } from '@/lib/auth/auth-service';
import {
  CompleteStudentRecord,
  CounsellingSession,
  DataImport,
  FollowUpItem,
  FollowUpStatus,
  ImprovementComparison,
  Student,
  User,
} from '@/types';
import { CsvParseResult } from '@/lib/csv/csv-parser';

export default function HomePage() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Scoped / Master Datasets
  const [students, setStudents] = useState<CompleteStudentRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    criticalRiskCount: 0,
    highRiskCount: 0,
    moderateRiskCount: 0,
    lowRiskCount: 0,
    followUpsDueCount: 0,
    followUpsUpcomingCount: 0,
    totalCounsellingSessions: 0,
    improvedStudentsCount: 0,
    departmentBreakdown: {},
    riskDistribution: [],
  });
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [recentImports, setRecentImports] = useState<DataImport[]>([]);
  const [comparisons, setComparisons] = useState<ImprovementComparison[]>([]);

  // Modals state
  const [selectedStudentRegNo, setSelectedStudentRegNo] = useState<string | null>(null);
  const [counsellingStudentRegNo, setCounsellingStudentRegNo] = useState<string | null>(null);

  // Subscribe to Authentication State
  useEffect(() => {
    const unsubscribe = authService.subscribe((session) => {
      setAuthSession(session);
      setIsAuthChecking(false);
      if (session) {
        // Restore previous tab from sessionStorage if available for this session, else default
        let targetTab: NavTab = session.user.role === 'ADMIN' ? 'admin-dashboard' : 'dashboard';
        if (typeof window !== 'undefined') {
          const savedTab = sessionStorage.getItem('counsellai_active_tab') as NavTab | null;
          if (savedTab) {
            // Validate that counselor cannot land on admin tab
            if (session.user.role === 'COUNSELLOR' && savedTab.startsWith('admin-')) {
              targetTab = 'dashboard';
            } else {
              targetTab = savedTab;
            }
          }
        }
        setCurrentTab(targetTab);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('counsellai_active_tab', tab);
    }
  };

  const currentUser: User | null = authSession
    ? store.getUserById(authSession.user.id) || {
        id: authSession.user.id,
        name: authSession.user.name,
        username: authSession.user.username,
        role: authSession.user.role,
        status: authSession.user.status,
        password_hash: '',
        email: authSession.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null;

  const counselorScope = authSession?.scope || null;

  // Sync state from store with strict scope enforcement
  const refreshData = useCallback(() => {
    if (!authSession) return;

    // Refresh active scope in case admin changed counselor assignment in background
    let currentScope = authSession.scope;
    if (authSession.user.role === 'COUNSELLOR') {
      currentScope = store.getCounselorScope(authSession.user.id);
    }

    const scopedRecords = store.getAllCompleteStudentRecords(currentScope);
    setStudents(scopedRecords);
    setStats(store.getDashboardStats(currentScope));
    setFollowUps(store.getFollowUps(currentScope));
    setRecentImports(store.getDataImports(currentScope));
    setComparisons(store.getAllImprovementComparisons(currentScope));
  }, [authSession]);

  useEffect(() => {
    if (authSession) {
      refreshData();
    }
  }, [authSession, refreshData]);

  // Handle Logout
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('counsellai_active_tab');
    }
    if (authSession) {
      store.recordAuditLog({
        user_id: authSession.user.id,
        username: authSession.user.username,
        user_role: authSession.user.role,
        action: 'LOGOUT',
        entity_type: 'AUTH',
        metadata: { note: 'User logged out' },
      });
    }
    authService.logout();
    setAuthSession(null);
  };

  // Handle CSV Import
  const handleImportSuccess = (
    result: CsvParseResult,
    snapshotLabel: string,
    filename: string
  ) => {
    if (!currentUser) return;

    const res = store.importData({
      filename,
      snapshotLabel,
      students: result.validStudents,
      academicRecords: result.validAcademicRecords,
      behaviourRecords: result.validBehaviourRecords,
      scope: counselorScope,
      currentUser,
    });

    if (!res.success) {
      alert(res.error || 'Import failed.');
      return;
    }

    refreshData();
  };

  // Handle Save Counselling Session
  const handleSaveSession = (sessionData: any) => {
    if (!currentUser) return;
    store.recordCounsellingSession(sessionData, currentUser);
    refreshData();
  };

  // Handle Toggle Action Item
  const handleToggleActionItem = (
    sessionId: string,
    actionId: string,
    completed: boolean
  ) => {
    store.toggleActionPlanItem(sessionId, actionId, completed);
    refreshData();
  };

  // Handle Update Follow-up Status
  const handleUpdateFollowUpStatus = (
    followUpId: string,
    status: FollowUpStatus,
    notes?: string
  ) => {
    store.updateFollowUpStatus(followUpId, status, notes);
    refreshData();
  };

  // Handle Conduct Follow-up Review
  const handleConductFollowUpReview = (params: {
    followUpId: string;
    status: FollowUpStatus;
    improvementStatus?: any;
    notes?: string;
    actionPlan?: any[];
  }) => {
    if (!currentUser) return;
    store.conductFollowUpReview({ ...params, currentUser });
    refreshData();
  };

  // Handle Delete Student Record
  const handleDeleteStudent = (registerNumber: string) => {
    if (!currentUser) return;
    store.deleteStudent(registerNumber, currentUser);
    refreshData();
  };

  // Selected student record for profile modal
  const activeStudentRecord = selectedStudentRegNo
    ? store.getCompleteStudentRecord(selectedStudentRegNo, counselorScope)
    : null;

  // Selected student entity for counselling modal
  const activeStudentForCounselling = counsellingStudentRegNo
    ? store.getStudent(counsellingStudentRegNo, counselorScope)
    : null;

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying CounselAI Session...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated, present the Secure Login View
  if (!authSession || !currentUser) {
    return <LoginView onLoginSuccess={(session) => setAuthSession(session)} />;
  }

  return (
    <AppShell
      currentTab={currentTab}
      onTabChange={handleTabChange}
      currentUser={currentUser}
      scope={counselorScope}
      onLogout={handleLogout}
      stats={{
        totalStudents: stats.totalStudents,
        highRiskCount: stats.highRiskCount + stats.criticalRiskCount,
        followUpsDueCount: stats.followUpsDueCount,
      }}
    >
      {/* 1. Admin Central Dashboard */}
      {currentTab === 'admin-dashboard' && currentUser.role === 'ADMIN' && (
        <AdminDashboardView
          stats={stats}
          students={students}
          recentImports={recentImports}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
          onNavigateToTab={(tab) => handleTabChange(tab)}
        />
      )}

      {/* 2. Admin: Users & Counselors Directory */}
      {currentTab === 'admin-counselors' && currentUser.role === 'ADMIN' && (
        <CounselorsManagementView
          currentUser={currentUser}
          onRefresh={refreshData}
        />
      )}

      {/* 3. Admin: Departments Structure */}
      {currentTab === 'admin-departments' && currentUser.role === 'ADMIN' && (
        <DepartmentsManagementView
          currentUser={currentUser}
          onRefresh={refreshData}
        />
      )}

      {/* 4. Admin: Academic Years */}
      {currentTab === 'admin-years' && currentUser.role === 'ADMIN' && (
        <YearsManagementView
          currentUser={currentUser}
          onRefresh={refreshData}
        />
      )}

      {/* 5. Admin: Sections & Capacity */}
      {currentTab === 'admin-sections' && currentUser.role === 'ADMIN' && (
        <SectionsManagementView
          currentUser={currentUser}
          onRefresh={refreshData}
        />
      )}

      {/* 6. Admin: Audit Logs */}
      {currentTab === 'admin-audit' && currentUser.role === 'ADMIN' && (
        <AuditLogsView />
      )}

      {/* 7. Counselor Scoped Dashboard */}
      {currentTab === 'dashboard' && (
        <DashboardView
          stats={stats}
          students={students}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
          onNavigateToTab={(tab) => handleTabChange(tab)}
        />
      )}

      {/* 8. Students & Risk Directory */}
      {currentTab === 'students' && (
        <StudentsTableView
          students={students}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
          onOpenCounsellingModal={(regNo) => setCounsellingStudentRegNo(regNo)}
        />
      )}

      {/* 9. All Counselling Records */}
      {currentTab === 'counselling' && (
        <AllCounsellingRecordsView
          currentUser={currentUser}
          scope={counselorScope}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
        />
      )}

      {/* 10. CSV Upload & Validate */}
      {currentTab === 'upload' && (
        <CsvUploadView
          onImportSuccess={handleImportSuccess}
          recentImports={recentImports}
          onNavigateToStudents={() => handleTabChange('students')}
          currentUser={currentUser}
          scope={counselorScope}
        />
      )}

      {/* 11. Follow-ups Queue */}
      {currentTab === 'followups' && (
        <FollowUpsView
          followUps={followUps}
          onUpdateStatus={handleUpdateFollowUpStatus}
          onConductFollowUpReview={handleConductFollowUpReview}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
        />
      )}

      {/* 12. Longitudinal Improvement Tracking */}
      {currentTab === 'improvement' && (
        <ImprovementView
          comparisons={comparisons}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
          onNavigateToUpload={() => handleTabChange('upload')}
          totalStudentsCount={stats.totalStudents}
        />
      )}

      {/* 13. Manage & Delete Students */}
      {currentTab === 'manage' && (
        <StudentManagementView
          students={students}
          onDeleteStudent={handleDeleteStudent}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
        />
      )}

      {/* 14. Settings & Risk Engine Configuration (Admin Only or Config View) */}
      {currentTab === 'settings' && (
        <SettingsView
          currentConfig={store.getRiskConfig()}
          onUpdateConfig={(cfg) => {
            store.setRiskConfig(cfg, currentUser);
            refreshData();
          }}
          onClearAllData={() => {
            store.clearAll(currentUser);
            refreshData();
          }}
        />
      )}

      {/* Student Profile & AI Brief Modal (Unified Counselling Workspace) */}
      <StudentProfileModal
        isOpen={Boolean(selectedStudentRegNo)}
        onClose={() => setSelectedStudentRegNo(null)}
        record={activeStudentRecord}
        currentUser={currentUser}
        onSaveSession={handleSaveSession}
        onToggleActionItem={handleToggleActionItem}
      />

      {/* Standalone Quick Counselling Session Modal */}
      <CounsellingSessionModal
        isOpen={Boolean(counsellingStudentRegNo)}
        onClose={() => setCounsellingStudentRegNo(null)}
        student={activeStudentForCounselling || null}
        currentUser={currentUser}
        onSaveSession={handleSaveSession}
      />
    </AppShell>
  );
}
