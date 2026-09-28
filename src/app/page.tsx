'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell, NavTab } from '@/components/layout/AppShell';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { StudentsTableView } from '@/components/students/StudentsTableView';
import { CsvUploadView } from '@/components/upload/CsvUploadView';
import { FollowUpsView } from '@/components/followups/FollowUpsView';
import { ImprovementView } from '@/components/improvement/ImprovementView';
import { SettingsView } from '@/components/settings/SettingsView';
import { StudentProfileModal } from '@/components/students/StudentProfileModal';
import { CounsellingSessionModal } from '@/components/counselling/CounsellingSessionModal';
import { store, DashboardStats } from '@/lib/storage/store';
import {
  CompleteStudentRecord,
  CounsellingSession,
  DataImport,
  FollowUpItem,
  FollowUpStatus,
  ImprovementComparison,
  Student,
} from '@/types';
import {
  CsvParseResult,
  parseAndValidateStudentCsv,
  generateSampleCsvContent,
  generateFollowUpCsvContent,
} from '@/lib/csv/csv-parser';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
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

  // Sync state from store
  const refreshData = useCallback(() => {
    const allRecords = store.getAllCompleteStudentRecords();
    setStudents(allRecords);
    setStats(store.getDashboardStats());
    setFollowUps(store.getFollowUps());
    setRecentImports(store.getDataImports());
    setComparisons(store.getAllImprovementComparisons());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle CSV Import
  const handleImportSuccess = (
    result: CsvParseResult,
    snapshotLabel: string,
    filename: string
  ) => {
    store.importData({
      filename,
      snapshotLabel,
      students: result.validStudents,
      academicRecords: result.validAcademicRecords,
      behaviourRecords: result.validBehaviourRecords,
    });
    refreshData();
  };

  // 1-Click Demo Baseline Cohort
  const handleQuickLoadDemo = () => {
    const csv = generateSampleCsvContent();
    const result = parseAndValidateStudentCsv(csv, 'Mid-Term 1 (Sep 2026)');
    store.importData({
      filename: 'sample_baseline_cohort.csv',
      snapshotLabel: 'Mid-Term 1 (Sep 2026)',
      students: result.validStudents,
      academicRecords: result.validAcademicRecords,
      behaviourRecords: result.validBehaviourRecords,
    });
    refreshData();
    setCurrentTab('dashboard');
  };

  // 1-Click Demo Follow-Up Update Cohort
  const handleQuickLoadUpdate = () => {
    const csv = generateFollowUpCsvContent();
    const result = parseAndValidateStudentCsv(csv, 'Mid-Term 2 (Nov 2026)');
    store.importData({
      filename: 'sample_followup_cohort.csv',
      snapshotLabel: 'Mid-Term 2 (Nov 2026)',
      students: result.validStudents,
      academicRecords: result.validAcademicRecords,
      behaviourRecords: result.validBehaviourRecords,
    });
    refreshData();
    setCurrentTab('improvement');
  };

  // Handle Save Counselling Session
  const handleSaveSession = (sessionData: any) => {
    store.recordCounsellingSession(sessionData);
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
    store.conductFollowUpReview(params);
    refreshData();
  };

  // Selected student record for profile modal
  const activeStudentRecord = selectedStudentRegNo
    ? store.getCompleteStudentRecord(selectedStudentRegNo)
    : null;

  // Selected student entity for counselling modal
  const activeStudentForCounselling = counsellingStudentRegNo
    ? store.getStudent(counsellingStudentRegNo)
    : null;

  return (
    <AppShell
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      stats={{
        totalStudents: stats.totalStudents,
        highRiskCount: stats.highRiskCount + stats.criticalRiskCount,
        followUpsDueCount: stats.followUpsDueCount,
      }}
      onQuickLoadDemo={handleQuickLoadDemo}
      onQuickLoadUpdate={handleQuickLoadUpdate}
    >
      {/* 1. Dashboard Tab */}
      {currentTab === 'dashboard' && (
        <DashboardView
          stats={stats}
          students={students}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
          onNavigateToTab={(tab) => setCurrentTab(tab)}
          onOpenQuickDemo={handleQuickLoadDemo}
        />
      )}

      {/* 2. Students & Risk Directory Tab */}
      {currentTab === 'students' && (
        <StudentsTableView
          students={students}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
          onOpenCounsellingModal={(regNo) => setCounsellingStudentRegNo(regNo)}
        />
      )}

      {/* 3. CSV Upload & Validate Tab */}
      {currentTab === 'upload' && (
        <CsvUploadView
          onImportSuccess={handleImportSuccess}
          recentImports={recentImports}
          onNavigateToStudents={() => setCurrentTab('students')}
        />
      )}

      {/* 4. Follow-ups Queue Tab */}
      {currentTab === 'followups' && (
        <FollowUpsView
          followUps={followUps}
          onUpdateStatus={handleUpdateFollowUpStatus}
          onConductFollowUpReview={handleConductFollowUpReview}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
        />
      )}

      {/* 5. Longitudinal Improvement Tab */}
      {currentTab === 'improvement' && (
        <ImprovementView
          comparisons={comparisons}
          onSelectStudent={(regNo) => setSelectedStudentRegNo(regNo)}
          onLoadUpdateDataset={handleQuickLoadUpdate}
          totalStudentsCount={stats.totalStudents}
        />
      )}

      {/* 6. Settings & Risk Engine Configuration Tab */}
      {currentTab === 'settings' && (
        <SettingsView
          currentConfig={store.getRiskConfig()}
          onUpdateConfig={(cfg) => {
            store.setRiskConfig(cfg);
            refreshData();
          }}
          onClearAllData={() => {
            store.clearAll();
            refreshData();
          }}
          onReloadDemo={handleQuickLoadDemo}
        />
      )}

      {/* Student Profile & AI Brief Modal (Unified Counselling Workspace) */}
      <StudentProfileModal
        isOpen={Boolean(selectedStudentRegNo)}
        onClose={() => setSelectedStudentRegNo(null)}
        record={activeStudentRecord}
        onSaveSession={handleSaveSession}
        onToggleActionItem={handleToggleActionItem}
      />

      {/* Standalone Quick Counselling Session Modal */}
      <CounsellingSessionModal
        isOpen={Boolean(counsellingStudentRegNo)}
        onClose={() => setCounsellingStudentRegNo(null)}
        student={activeStudentForCounselling || null}
        onSaveSession={handleSaveSession}
      />
    </AppShell>
  );
}
