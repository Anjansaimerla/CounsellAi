import React from 'react';
import { ImprovementStatus, RiskLevel, FollowUpStatus } from '@/types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'risk' | 'status' | 'improvement';
  riskLevel?: RiskLevel;
  status?: FollowUpStatus;
  improvement?: ImprovementStatus;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  riskLevel,
  status,
  improvement,
  className = '',
}) => {
  // Risk Level Badges
  if (riskLevel) {
    const riskStyles: Record<RiskLevel, string> = {
      LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
      MODERATE: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10',
      HIGH: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/10',
      CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10 animate-pulse',
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskStyles[riskLevel]} ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            riskLevel === 'LOW'
              ? 'bg-emerald-500'
              : riskLevel === 'MODERATE'
              ? 'bg-amber-500'
              : riskLevel === 'HIGH'
              ? 'bg-orange-500'
              : 'bg-rose-500'
          }`}
        />
        {riskLevel} RISK
      </span>
    );
  }

  // Follow-up Status Badges
  if (status) {
    const statusStyles: Record<FollowUpStatus, string> = {
      PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
      DUE: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      MISSED: 'bg-red-50 text-red-700 border-red-200',
      RESCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
      CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[status]} ${className}`}
      >
        {status}
      </span>
    );
  }

  // Improvement Status Badges
  if (improvement) {
    const impStyles: Record<ImprovementStatus, string> = {
      IMPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
      PARTIALLY_IMPROVED: 'bg-teal-50 text-teal-700 border-teal-200',
      NO_SIGNIFICANT_IMPROVEMENT: 'bg-slate-100 text-slate-700 border-slate-200',
      DECLINED: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
      NOT_EVALUATED: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${impStyles[improvement]} ${className}`}
      >
        {improvement.replace(/_/g, ' ')}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
    >
      {children}
    </span>
  );
};
