import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  Sparkles,
  Award,
  Clock,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  MapPin,
  ExternalLink,
  Building2,
  CheckCircle2,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Application, SheetTab } from '../types';
import {
  calculateKpis,
  calculatePipeline,
  formatDateDisplay,
  isDateOverdue,
  isDateToday,
  STATUS_COLORS,
} from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';
import { PipelineKanbanBoard } from './PipelineKanbanBoard';

interface MainDashboardProps {
  applications: Application[];
  onSelectTab: (tab: SheetTab) => void;
  onSelectApplication: (app: Application) => void;
  onQuickStatusChange: (id: string, newStatus: Application['status']) => void;
  onDeleteApplication?: (id: string) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  applications,
  onSelectTab,
  onSelectApplication,
  onQuickStatusChange,
  onDeleteApplication,
}) => {
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const kpis = calculateKpis(applications);
  const pipeline = calculatePipeline(applications);

  // Overdue follow-up items
  const overdueApps = applications.filter(
    (app) =>
      app.nextFollowUp &&
      isDateOverdue(app.nextFollowUp) &&
      !['Rejected', 'Withdrawn', 'Ghosted', 'Accepted'].includes(app.status)
  );

  const todayApps = applications.filter(
    (app) =>
      app.nextFollowUp &&
      isDateToday(app.nextFollowUp) &&
      !['Rejected', 'Withdrawn', 'Ghosted', 'Accepted'].includes(app.status)
  );

  // Sources breakdown calculation
  const sourceCounts: Record<string, number> = {};
  applications.forEach((app) => {
    const src = app.origin || 'Other';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  const allSources = [
    'LinkedIn',
    'Indeed',
    'Company Website',
    'Recruiter',
    'Referral',
    'Networking',
    'Direct Email',
    'Other',
  ];

  // Weekly activity simulation from actual applications
  // Group by week (past 4 weeks)
  const now = new Date();
  const weeksData = [
    { label: '3 Wks Ago', count: 0 },
    { label: '2 Wks Ago', count: 0 },
    { label: 'Last Week', count: 0 },
    { label: 'This Week', count: 0 },
  ];

  applications.forEach((app) => {
    if (!app.dateApplied) return;
    const parts = app.dateApplied.split('-');
    if (parts.length !== 3) return;
    const appDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const diffDays = Math.floor((now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7 && diffDays >= 0) {
      weeksData[3].count += 1;
    } else if (diffDays <= 14 && diffDays > 7) {
      weeksData[2].count += 1;
    } else if (diffDays <= 21 && diffDays > 14) {
      weeksData[1].count += 1;
    } else if (diffDays <= 30 && diffDays > 21) {
      weeksData[0].count += 1;
    }
  });

  const maxWeeklyCount = Math.max(...weeksData.map((w) => w.count), 1);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Overdue / Urgent Alert Banner if any */}
      {(overdueApps.length > 0 || todayApps.length > 0) && (
        <div className="bg-[#FFF4F2] border border-[#FCD8D4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAD2CE] flex items-center justify-center shrink-0 text-[#C14436] mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#661E16]">
                Follow-ups Requiring Attention
              </h4>
              <p className="text-xs text-[#8A3B31] mt-0.5">
                {overdueApps.length > 0 && (
                  <span className="font-bold text-[#A72B1F] mr-2">
                    {overdueApps.length} overdue
                  </span>
                )}
                {todayApps.length > 0 && (
                  <span className="font-medium text-[#8F471B]">
                    {todayApps.length} due today
                  </span>
                )}
                — Keep your momentum active by sending touchpoints on time.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('followup')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#82271D] bg-[#FEE9E6] hover:bg-[#FCD7D2] rounded-xl transition-all border border-[#F5BEB7] shrink-0"
          >
            Review Follow-ups
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. KPI Cards Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9E948A]">
            Career Metrics & KPIs
          </h2>
          <span className="text-[11px] text-[#A69C92] font-mono">
            Automated Live Formulas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          {/* Total Applications */}
          <div className="bg-[#FFFDF9] rounded-2xl p-4 border border-[#EEDFCA] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-[#003049]/70 mb-2">
              <span className="text-xs font-medium">Total Applications</span>
              <Briefcase className="w-3.5 h-3.5 text-[#003049]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#003049]">
              {kpis.total}
            </div>
            <p className="text-[11px] text-[#003049]/60 mt-1">Full database</p>
          </div>

          {/* Applied This Week */}
          <div className="bg-[#FFFDF9] rounded-2xl p-4 border border-[#C6DCED] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-[#003049]/70 mb-2">
              <span className="text-xs font-medium">Applied This Week</span>
              <Calendar className="w-3.5 h-3.5 text-[#669bbc]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#003049]">
              {kpis.appliedThisWeek}
            </div>
            <p className="text-[11px] text-[#003049]/60 mt-1">Past 7 days velocity</p>
          </div>

          {/* Active Interviews */}
          <div className="bg-[#FFFDF9] rounded-2xl p-4 border border-[#BED2E2] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-[#003049]/70 mb-2">
              <span className="text-xs font-medium">Interviews</span>
              <Sparkles className="w-3.5 h-3.5 text-[#003049]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#003049]">
              {kpis.interviews}
            </div>
            <p className="text-[11px] text-[#003049]/60 mt-1">Active interview stages</p>
          </div>

          {/* Offers */}
          <div className="bg-[#FDF5F6] rounded-2xl p-4 border border-[#F8C8CB] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-[#780000] mb-2">
              <span className="text-xs font-medium">Offers</span>
              <Award className="w-3.5 h-3.5 text-[#780000]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#780000]">
              {kpis.offers}
            </div>
            <p className="text-[11px] text-[#780000]/70 mt-1">Offers & Accepted</p>
          </div>

          {/* Awaiting Response */}
          <div className="bg-[#FDF9F0] rounded-2xl p-4 border border-[#F1E3C8] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-[#003049]/70 mb-2">
              <span className="text-xs font-medium">Awaiting Response</span>
              <Clock className="w-3.5 h-3.5 text-[#003049]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#003049]">
              {kpis.awaitingResponse}
            </div>
            <p className="text-[11px] text-[#003049]/60 mt-1">Pending review</p>
          </div>

          {/* Rejected */}
          <div className="bg-[#FDF5F6] rounded-2xl p-4 border border-[#F9CFD3] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-[#c1121f] mb-2">
              <span className="text-xs font-medium">Rejected</span>
              <XCircle className="w-3.5 h-3.5 text-[#c1121f]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#c1121f]">
              {kpis.rejected}
            </div>
            <p className="text-[11px] text-[#c1121f]/70 mt-1">Closed out</p>
          </div>

          {/* Response Rate */}
          <div className="bg-[#EBF3F8]/30 rounded-2xl p-4 border border-[#C6DCED] shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-[#003049]/80 mb-2">
              <span className="text-xs font-medium">Response Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#669bbc]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#003049]">
              {kpis.responseRate}%
            </div>
            <p className="text-[11px] text-[#003049]/60 mt-1">Of submitted roles</p>
          </div>
        </div>
      </section>

      {/* 2. Interactive Application Pipeline Drag & Drop Kanban */}
      <PipelineKanbanBoard
        applications={applications}
        onSelectApplication={onSelectApplication}
        onQuickStatusChange={onQuickStatusChange}
        onDeleteApplication={onDeleteApplication}
        onSelectTab={onSelectTab}
      />

      {/* 3. Visual Charts Grid: Weekly Activity & Application Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Activity (Chart) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-serif font-semibold text-[#2C2723]">
                Weekly Activity
              </h3>
              <span className="text-xs font-mono text-[#8C8277]">Past 4 Weeks</span>
            </div>
            <p className="text-xs text-[#857B71] mb-6">
              Applications submitted per weekly cycle
            </p>

            {/* Modern Aesthetic Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-3 sm:gap-6 pt-4 px-2 border-b border-[#EAE3DA]">
              {weeksData.map((week, idx) => {
                const heightPct = Math.max(Math.round((week.count / maxWeeklyCount) * 100), 12);
                const isCurrent = idx === 3;
                return (
                  <div key={week.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[11px] font-semibold text-[#665D54] opacity-80 group-hover:opacity-100 transition-opacity">
                      {week.count}
                    </div>
                    <div className="w-full max-w-[48px] bg-[#F3EBE3] rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isCurrent
                            ? 'bg-[#A36B58] group-hover:bg-[#8F5744]'
                            : 'bg-[#C9B6A6] group-hover:bg-[#B59F8E]'
                        }`}
                      />
                    </div>
                    <span className={`text-[11px] mt-1 whitespace-nowrap ${isCurrent ? 'font-semibold text-[#A36B58]' : 'text-[#8E8377]'}`}>
                      {week.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#7D736A]">
            <span>Active pacing target: 3–5 applications/week</span>
            <span className="font-medium text-[#2E7D32] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Steady Momentum
            </span>
          </div>
        </div>

        {/* Application Sources Breakdown */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-serif font-semibold text-[#2C2723]">
                Application Sources
              </h3>
              <span className="text-xs font-mono text-[#8C8277]">Origin Breakdown</span>
            </div>
            <p className="text-xs text-[#857B71] mb-5">
              Where your opportunities are originating from
            </p>

            <div className="space-y-3">
              {allSources.map((src) => {
                const count = sourceCounts[src] || 0;
                const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0;
                return (
                  <div key={src} className="flex items-center gap-3">
                    <span className="w-32 text-xs font-medium text-[#5E544B] truncate">
                      {src}
                    </span>
                    <div className="flex-1 bg-[#F5EFE8] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#B58572] h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-xs font-semibold text-[#3D352E]">
                      {count}{' '}
                      <span className="text-[10px] font-normal text-[#968C81]">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2EDE6] flex items-center justify-between text-xs text-[#7D736A]">
            <span>Top channel: {Object.entries(sourceCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'LinkedIn'}</span>
            <button
              onClick={() => onSelectTab('analytics')}
              className="text-xs font-semibold text-[#A36B58] hover:underline"
            >
              Full Channel Analytics →
            </button>
          </div>
        </div>
      </div>

      {/* 4. Active Applications Quick Table (Recent High-Priority Applications) */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-serif font-semibold text-[#2C2723]">
              Active & Interviewing Roles
            </h3>
            <p className="text-xs text-[#857B71]">
              Roles currently in screening, technical interview, or offer stages
            </p>
          </div>
          <button
            onClick={() => onSelectTab('applications')}
            className="text-xs font-semibold text-[#A36B58] hover:text-[#834E3C] inline-flex items-center gap-1 transition-colors"
          >
            Open All {applications.length} Applications <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAE3DA] text-[#8C8176]">
                <th className="py-2.5 px-3 font-semibold">Company & Position</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Next Action</th>
                <th className="py-2.5 px-3 font-semibold">Follow-up</th>
                <th className="py-2.5 px-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE6]">
              {applications.slice(0, 5).map((app) => {
                const color = STATUS_COLORS[app.status] || STATUS_COLORS.Applied;
                const isOverdue = isDateOverdue(app.nextFollowUp);
                const isToday = isDateToday(app.nextFollowUp);

                return (
                  <tr
                    key={app.id}
                    className="hover:bg-[#FAF7F2] transition-colors group cursor-pointer"
                    onClick={() => onSelectApplication(app)}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#F5EFE9] flex items-center justify-center text-[#8C6D53] shrink-0 font-serif font-bold text-xs">
                          {app.company.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-[#2C2723] group-hover:text-[#A36B58] transition-colors flex items-center gap-1.5">
                            {app.company}
                            {app.jobUrl && (
                              <a
                                href={app.jobUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#A3998F] hover:text-[#524B43]"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-[#7D736A]">
                            {app.jobTitle}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-[#665D54]">
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-[#A89E93]" />
                        {app.location}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${color.bg} ${color.text} ${color.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                        {app.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[#544D44] max-w-xs truncate text-[11px]">
                      {app.nextAction || '—'}
                    </td>

                    <td className="py-3 px-3">
                      {app.nextFollowUp ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            isOverdue
                              ? 'bg-[#FEECEC] text-[#A62F2F] font-bold'
                              : isToday
                              ? 'bg-[#FFF6E5] text-[#91672C] font-semibold'
                              : 'text-[#7D736A]'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {formatDateDisplay(app.nextFollowUp)}
                          {isOverdue && ' (Overdue)'}
                          {isToday && ' (Today)'}
                        </span>
                      ) : (
                        <span className="text-[#B5AAA0]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectApplication(app);
                          }}
                          className="p-1 rounded-md text-[#7D736A] hover:text-[#A36B58] hover:bg-[#F2ECE5] transition-colors cursor-pointer"
                          title="Edit application details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteApplication && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAppToDelete(app);
                            }}
                            className="p-1 rounded-md text-[#A89E93] hover:text-[#C13626] hover:bg-[#FEEAEA] transition-colors cursor-pointer"
                            title="Delete application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectApplication(app);
                          }}
                          className="text-xs font-semibold text-[#A36B58] hover:text-[#7A4B3A] underline underline-offset-2 ml-1 cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Main Dashboard Application Deletion Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(appToDelete)}
        title="Delete Application?"
        message={`Are you sure you want to remove ${appToDelete?.company} (${appToDelete?.jobTitle}) from your tracker?`}
        confirmLabel="Delete Application"
        onConfirm={() => {
          if (appToDelete && onDeleteApplication) {
            onDeleteApplication(appToDelete.id);
            setAppToDelete(null);
          }
        }}
        onCancel={() => setAppToDelete(null)}
      />
    </div>
  );
};
