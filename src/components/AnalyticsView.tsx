import React from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Layers,
  Award,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  Target,
} from 'lucide-react';
import { Application } from '../types';
import { daysBetween, STATUS_COLORS } from '../utils/calculations';

interface AnalyticsViewProps {
  applications: Application[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ applications }) => {
  const total = applications.length;

  // Submitted count (ignoring Wishlist / Preparing drafts)
  const submitted = applications.filter(
    (a) => a.status !== 'Wishlist' && a.status !== 'Preparing'
  );

  // Time-based
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const appsThisMonth = applications.filter(
    (a) => a.dateApplied && a.dateApplied.startsWith(currentMonthStr)
  ).length;

  const appsThisWeek = applications.filter((a) => {
    if (!a.dateApplied) return false;
    const days = daysBetween(a.dateApplied);
    return days !== null && days >= 0 && days <= 7;
  }).length;

  // Outcome categories
  const interviews = applications.filter((a) =>
    ['Interview', 'Technical Interview', 'Final Interview'].includes(a.status)
  ).length;

  const offers = applications.filter((a) =>
    ['Offer', 'Accepted'].includes(a.status)
  ).length;

  const rejected = applications.filter((a) => a.status === 'Rejected').length;

  const responded = submitted.filter(
    (a) => !['Applied', 'Ghosted'].includes(a.status)
  ).length;

  // Rates
  const responseRate = submitted.length > 0 ? Math.round((responded / submitted.length) * 100) : 0;
  const interviewRate = submitted.length > 0 ? Math.round((interviews / submitted.length) * 100) : 0;
  const offerRate = submitted.length > 0 ? Math.round((offers / submitted.length) * 100) : 0;
  const rejectionRate = submitted.length > 0 ? Math.round((rejected / submitted.length) * 100) : 0;

  // Average days until response
  const responseDaysList = applications
    .filter((a) => a.dateApplied && a.lastContact && a.status !== 'Applied')
    .map((a) => daysBetween(a.dateApplied, a.lastContact))
    .filter((d): d is number => d !== null && d >= 0);

  const avgDaysToResponse =
    responseDaysList.length > 0
      ? Math.round(responseDaysList.reduce((acc, v) => acc + v, 0) / responseDaysList.length)
      : 7;

  // 1. Applications by Month
  const monthlyCounts: Record<string, number> = {};
  applications.forEach((a) => {
    if (a.dateApplied) {
      const ym = a.dateApplied.substring(0, 7); // YYYY-MM
      monthlyCounts[ym] = (monthlyCounts[ym] || 0) + 1;
    }
  });

  const sortedMonths = Object.entries(monthlyCounts).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonthCount = Math.max(...sortedMonths.map((m) => m[1]), 1);

  // 2. Status Breakdown
  const statusCounts: Record<string, number> = {};
  applications.forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  // 3. Application Sources
  const sourceCounts: Record<string, number> = {};
  applications.forEach((a) => {
    const src = a.origin || 'Other';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const maxSourceCount = Math.max(...sortedSources.map((s) => s[1]), 1);

  // 4. Role Categories
  const roleCounts: Record<string, number> = {};
  applications.forEach((a) => {
    const roleCat = a.roleCategory || 'Other';
    roleCounts[roleCat] = (roleCounts[roleCat] || 0) + 1;
  });
  const sortedRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
  const maxRoleCount = Math.max(...sortedRoles.map((r) => r[1]), 1);

  // 5. Response Funnel
  const funnelStages = [
    { label: 'All Tracked', count: total },
    { label: 'Submitted (Applied)', count: submitted.length },
    {
      label: 'Screened / Active Review',
      count: applications.filter((a) =>
        ['Screening', 'Interview', 'Technical Interview', 'Final Interview', 'Offer', 'Accepted'].includes(
          a.status
        )
      ).length,
    },
    {
      label: 'Interview Round',
      count: applications.filter((a) =>
        ['Interview', 'Technical Interview', 'Final Interview', 'Offer', 'Accepted'].includes(a.status)
      ).length,
    },
    {
      label: 'Final / Offer',
      count: applications.filter((a) =>
        ['Final Interview', 'Offer', 'Accepted'].includes(a.status)
      ).length,
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-[#F4EDE4] text-[#A36B58]">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2C2723]">
              JOB SEARCH INSIGHTS
            </h2>
          </div>
          <p className="text-xs text-[#7D736A]">
            Comprehensive conversion analytics, funnel performance, and search velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#8C8074] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#ECE5DD]">
          <span>Database Size:</span>
          <strong className="text-[#2C2723]">{total} Applications</strong>
        </div>
      </div>

      {/* KPI Formula Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-[#ECE5DD] shadow-2xs">
          <span className="text-[10px] font-semibold text-[#8C8074] uppercase block">Total</span>
          <div className="text-2xl font-serif font-bold text-[#2C2723] mt-1">{total}</div>
          <span className="text-[10px] text-[#A3998F]">All entries</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#ECE5DD] shadow-2xs">
          <span className="text-[10px] font-semibold text-[#8C8074] uppercase block">This Month</span>
          <div className="text-2xl font-serif font-bold text-[#2C2723] mt-1">{appsThisMonth}</div>
          <span className="text-[10px] text-[#A3998F]">Current cycle</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#ECE5DD] shadow-2xs">
          <span className="text-[10px] font-semibold text-[#8C8074] uppercase block">This Week</span>
          <div className="text-2xl font-serif font-bold text-[#4B85B5] mt-1">{appsThisWeek}</div>
          <span className="text-[10px] text-[#A3998F]">Active 7d</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#ECE5DD] shadow-2xs">
          <span className="text-[10px] font-semibold text-[#8C8074] uppercase block">Response Rate</span>
          <div className="text-2xl font-serif font-bold text-[#A36B58] mt-1">{responseRate}%</div>
          <span className="text-[10px] text-[#A3998F]">Received reply</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#ECE5DD] shadow-2xs">
          <span className="text-[10px] font-semibold text-[#8C8074] uppercase block">Interview Rate</span>
          <div className="text-2xl font-serif font-bold text-[#7C4EB5] mt-1">{interviewRate}%</div>
          <span className="text-[10px] text-[#A3998F]">Reached round</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#ECE5DD] shadow-2xs">
          <span className="text-[10px] font-semibold text-[#8C8074] uppercase block">Offer Rate</span>
          <div className="text-2xl font-serif font-bold text-[#2E8B45] mt-1">{offerRate}%</div>
          <span className="text-[10px] text-[#A3998F]">Conversion</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#ECE5DD] shadow-2xs">
          <span className="text-[10px] font-semibold text-[#8C8074] uppercase block">Rejection Rate</span>
          <div className="text-2xl font-serif font-bold text-[#8F3737] mt-1">{rejectionRate}%</div>
          <span className="text-[10px] text-[#A3998F]">Closed out</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#ECE5DD] shadow-2xs">
          <span className="text-[10px] font-semibold text-[#8C8074] uppercase block">Avg Response</span>
          <div className="text-2xl font-serif font-bold text-[#91672C] mt-1">{avgDaysToResponse}d</div>
          <span className="text-[10px] text-[#A3998F]">Turnaround</span>
        </div>
      </div>

      {/* 5 Aesthetic Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: Applications Over Time */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif font-bold text-base text-[#2C2723]">
                1. Applications Over Time
              </h3>
              <span className="text-xs font-mono text-[#8C8074]">Monthly Velocity</span>
            </div>
            <p className="text-xs text-[#8C8074] mb-6">
              Number of submitted applications per month
            </p>

            <div className="h-48 flex items-end justify-between gap-4 pt-4 px-2 border-b border-[#EAE3DA]">
              {sortedMonths.length === 0 ? (
                <div className="w-full text-center py-12 text-xs text-[#A89E93]">
                  No dated applications yet
                </div>
              ) : (
                sortedMonths.map(([month, count]) => {
                  const heightPct = Math.max(Math.round((count / maxMonthCount) * 100), 15);
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-xs font-semibold text-[#544B42]">{count}</span>
                      <div className="w-full max-w-[44px] bg-[#F5EFE9] rounded-t-xl h-full flex flex-col justify-end overflow-hidden">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-[#A36B58] group-hover:bg-[#8F5744] rounded-t-xl transition-all duration-500"
                        />
                      </div>
                      <span className="text-[11px] text-[#8C8074] whitespace-nowrap mt-1 font-medium">
                        {month}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-4 text-xs text-[#8C8074] flex items-center justify-between pt-3 border-t border-[#F5EFE9]">
            <span>Consistent application pacing delivers optimal interview pipeline.</span>
          </div>
        </div>

        {/* CHART 2: Status Breakdown */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif font-bold text-base text-[#2C2723]">
                2. Status Breakdown
              </h3>
              <span className="text-xs font-mono text-[#8C8074]">Stage Distribution</span>
            </div>
            <p className="text-xs text-[#8C8074] mb-5">
              Proportion of all applications in each career milestone
            </p>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {Object.entries(statusCounts).map(([status, count]) => {
                const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Applied;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={status} className="flex items-center gap-3 text-xs">
                    <div className="w-32 flex items-center gap-1.5 truncate">
                      <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                      <span className="truncate font-medium text-[#4A423B]">{status}</span>
                    </div>
                    <div className="flex-1 bg-[#F5EFE9] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color.dot.replace('bg-[', '').replace(']', ''),
                        }}
                      />
                    </div>
                    <div className="w-14 text-right font-semibold text-[#2C2723]">
                      {count} <span className="text-[10px] font-normal text-[#968C81]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 text-xs text-[#8C8074] pt-3 border-t border-[#F5EFE9]">
            <span>Healthy balance: 15–25% in active screening and interview stages.</span>
          </div>
        </div>

        {/* CHART 3: Application Sources */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif font-bold text-base text-[#2C2723]">
                3. Application Sources
              </h3>
              <span className="text-xs font-mono text-[#8C8074]">Channel ROI</span>
            </div>
            <p className="text-xs text-[#8C8074] mb-5">
              Channels generating your career opportunities
            </p>

            <div className="space-y-3">
              {sortedSources.map(([source, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={source} className="flex items-center gap-3 text-xs">
                    <span className="w-32 font-medium text-[#4A423B] truncate">{source}</span>
                    <div className="flex-1 bg-[#F5EFE9] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#B58572] h-full rounded-full transition-all duration-500"
                        style={{ width: `${(count / maxSourceCount) * 100}%` }}
                      />
                    </div>
                    <div className="w-14 text-right font-semibold text-[#2C2723]">
                      {count} <span className="text-[10px] font-normal text-[#968C81]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 text-xs text-[#8C8074] pt-3 border-t border-[#F5EFE9]">
            <span>Referrals typically have 4x higher response rates than cold job boards.</span>
          </div>
        </div>

        {/* CHART 4: Role Categories */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif font-bold text-base text-[#2C2723]">
                4. Role Categories
              </h3>
              <span className="text-xs font-mono text-[#8C8074]">Discipline Distribution</span>
            </div>
            <p className="text-xs text-[#8C8074] mb-5">
              Which specializations you are primarily targeting
            </p>

            <div className="space-y-3">
              {sortedRoles.map(([role, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={role} className="flex items-center gap-3 text-xs">
                    <span className="w-36 font-medium text-[#4A423B] truncate">{role}</span>
                    <div className="flex-1 bg-[#F5EFE9] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#8C6D53] h-full rounded-full transition-all duration-500"
                        style={{ width: `${(count / maxRoleCount) * 100}%` }}
                      />
                    </div>
                    <div className="w-14 text-right font-semibold text-[#2C2723]">
                      {count} <span className="text-[10px] font-normal text-[#968C81]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 text-xs text-[#8C8074] pt-3 border-t border-[#F5EFE9]">
            <span>Ensure resume versions match your target role specializations.</span>
          </div>
        </div>

        {/* CHART 5: Response Funnel */}
        <div className="lg:col-span-12 bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-serif font-bold text-base text-[#2C2723]">
              5. Response & Hiring Funnel
            </h3>
            <span className="text-xs font-mono text-[#8C8074]">Step-by-Step Conversion</span>
          </div>
          <p className="text-xs text-[#8C8074] mb-6">
            Stage progression drop-off from initial tracking to final offer
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {funnelStages.map((stage, idx) => {
              const prevCount = idx === 0 ? stage.count : funnelStages[idx - 1].count;
              const dropOffPct = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0;
              const overallPct = total > 0 ? Math.round((stage.count / total) * 100) : 0;

              return (
                <div
                  key={stage.label}
                  className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#ECE5DD] flex flex-col justify-between space-y-3 relative"
                >
                  <div>
                    <span className="text-[10px] font-semibold text-[#8C8074] uppercase tracking-wider block">
                      Stage {idx + 1}
                    </span>
                    <h4 className="font-semibold text-xs text-[#2C2723] mt-0.5">
                      {stage.label}
                    </h4>
                  </div>

                  <div>
                    <div className="text-2xl font-serif font-bold text-[#A36B58]">
                      {stage.count}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#8C8074] mt-1 pt-1 border-t border-[#EAE3DA]">
                      <span>{overallPct}% of all</span>
                      {idx > 0 && (
                        <span className="font-semibold text-[#544B42]">
                          {dropOffPct}% passed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
