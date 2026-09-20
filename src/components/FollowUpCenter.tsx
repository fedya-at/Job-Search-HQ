import React from 'react';
import {
  Clock,
  AlertTriangle,
  CalendarCheck,
  Calendar,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Building2,
  ArrowUpRight,
  Sparkles,
  Edit2,
} from 'lucide-react';
import { Application } from '../types';
import {
  daysBetween,
  daysUntil,
  formatDateDisplay,
  getTodayDateString,
  isDateOverdue,
  isDateThisWeek,
  isDateToday,
} from '../utils/calculations';

interface FollowUpCenterProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onUpdateApplication: (app: Application) => void;
}

export const FollowUpCenter: React.FC<FollowUpCenterProps> = ({
  applications,
  onSelectApplication,
  onUpdateApplication,
}) => {
  // Only active applications with a follow-up scheduled
  const activeAppsWithFollowUp = applications.filter(
    (a) =>
      a.nextFollowUp &&
      !['Rejected', 'Withdrawn', 'Ghosted', 'Accepted'].includes(a.status)
  );

  // Split into OVERDUE, TODAY, THIS WEEK, and FUTURE
  const overdueItems = activeAppsWithFollowUp.filter((a) => isDateOverdue(a.nextFollowUp));
  const todayItems = activeAppsWithFollowUp.filter((a) => isDateToday(a.nextFollowUp));
  const thisWeekItems = activeAppsWithFollowUp.filter(
    (a) => isDateThisWeek(a.nextFollowUp) && !isDateToday(a.nextFollowUp)
  );

  const handleMarkFollowUpSent = (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    const today = getTodayDateString();
    // Schedule next follow-up 7 days from now
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const updated: Application = {
      ...app,
      lastContact: today,
      nextFollowUp: nextDateStr,
      followUpStatus: 'Follow-up sent',
      nextAction: 'Follow-up sent today. Awaiting recruiter response in 7 days.',
    };
    onUpdateApplication(updated);
  };

  const renderCardRow = (app: Application, type: 'overdue' | 'today' | 'week') => {
    const daysToFollowUp = daysUntil(app.nextFollowUp);
    const daysOverdue = daysToFollowUp !== null && daysToFollowUp < 0 ? Math.abs(daysToFollowUp) : 0;
    const daysSinceLastContact = app.lastContact ? daysBetween(app.lastContact) : null;

    return (
      <div
        key={app.id}
        onClick={() => onSelectApplication(app)}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE5DD] shadow-2xs hover:shadow-xs hover:border-[#D5C7B8] transition-all cursor-pointer group flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        {/* Left: Company, Position, Contact */}
        <div className="space-y-1.5 min-w-[240px]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-base text-[#2C2723] group-hover:text-[#A36B58] transition-colors">
              {app.company}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3EFE9] text-[#73695F] font-medium">
              {app.status}
            </span>
          </div>
          <div className="text-xs text-[#61584F] font-medium">
            {app.jobTitle}
          </div>
          {app.contactName && (
            <div className="text-xs text-[#8C8074] flex items-center gap-1.5 pt-0.5">
              <span>Contact:</span>
              <strong className="text-[#3D352E]">{app.contactName}</strong>
              {app.contactRole && <span>({app.contactRole})</span>}
            </div>
          )}
        </div>

        {/* Middle: Last Contact, Next Follow-up & Days Overdue */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#FAF7F2] p-3 rounded-xl border border-[#EFE8DF] min-w-[280px]">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#9E9285] block">
              Last Contact
            </span>
            <span className="font-semibold text-[#3D352E]">
              {formatDateDisplay(app.lastContact)}
            </span>
            {daysSinceLastContact !== null && (
              <span className="text-[10px] text-[#A69C92] block">
                {daysSinceLastContact}d ago
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#9E9285] block">
              Follow-up Date
            </span>
            <span
              className={`font-semibold ${
                type === 'overdue'
                  ? 'text-[#C13626]'
                  : type === 'today'
                  ? 'text-[#9A6720]'
                  : 'text-[#3D352E]'
              }`}
            >
              {formatDateDisplay(app.nextFollowUp)}
            </span>
            <span className="text-[10px] text-[#8C8074] block">
              {app.followUpStatus}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase tracking-wider text-[#9E9285] block">
              Urgency Status
            </span>
            {type === 'overdue' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FDECEC] text-[#C13626]">
                <AlertTriangle className="w-3 h-3" />
                {daysOverdue}d Overdue
              </span>
            ) : type === 'today' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF6E5] text-[#91672C]">
                <Clock className="w-3 h-3" />
                Action Today
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF3FB] text-[#2D5F85]">
                <Calendar className="w-3 h-3" />
                In {daysToFollowUp}d
              </span>
            )}
          </div>
        </div>

        {/* Right: Next Action & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:justify-end">
          {app.contactInfo && app.contactInfo.includes('@') && (
            <a
              href={`mailto:${app.contactInfo}?subject=Following up on ${encodeURIComponent(
                app.jobTitle
              )} application at ${encodeURIComponent(app.company)}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4A423B] bg-[#F2EDE7] hover:bg-[#EAE2D8] rounded-xl transition-all border border-[#DFD5C8]"
              title="Compose follow-up email"
            >
              <Mail className="w-3.5 h-3.5 text-[#A36B58]" />
              Email
            </a>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectApplication(app);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4A423B] bg-[#F2EDE7] hover:bg-[#EAE2D8] rounded-xl transition-all border border-[#DFD5C8] cursor-pointer"
            title="Edit application & follow-up schedule"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#8C8074]" />
            Edit
          </button>

          <button
            type="button"
            onClick={(e) => handleMarkFollowUpSent(app, e)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#A36B58] hover:bg-[#8F5744] rounded-xl transition-all shadow-xs cursor-pointer"
            title="Mark follow-up as sent and set next check-in in 7 days"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Sent
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C14436] animate-pulse" />
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2C2723]">
              FOLLOW-UP CENTER
            </h2>
          </div>
          <p className="text-xs text-[#7D736A]">
            Active touchpoint tracker. Automatically flags overdue responses and today's check-ins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#FFF4F2] px-3.5 py-1.5 rounded-xl border border-[#FCD8D4] text-xs">
            <span className="text-[#C13626] font-bold">{overdueItems.length}</span>
            <span className="text-[#8A3B31] ml-1.5">Overdue</span>
          </div>
          <div className="bg-[#FFFBF0] px-3.5 py-1.5 rounded-xl border border-[#FDE8B5] text-xs">
            <span className="text-[#B5812B] font-bold">{todayItems.length}</span>
            <span className="text-[#7A5B1E] ml-1.5">Due Today</span>
          </div>
          <div className="bg-[#F0F7FF] px-3.5 py-1.5 rounded-xl border border-[#D0E5FF] text-xs">
            <span className="text-[#2D5F85] font-bold">{thisWeekItems.length}</span>
            <span className="text-[#2D5F85] ml-1.5">This Week</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: OVERDUE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#FDECEC] text-[#C13626]">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h3 className="font-serif font-bold text-base text-[#2C2723]">
              OVERDUE ({overdueItems.length})
            </h3>
          </div>
          <span className="text-xs text-[#9E9285]">
            Applications that need immediate attention
          </span>
        </div>

        {overdueItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-[#ECE5DD] text-center text-xs text-[#8C8074]">
            <CheckCircle2 className="w-6 h-6 mx-auto text-[#43A65E] mb-1.5" />
            <p className="font-medium text-[#2C2723]">No overdue follow-ups!</p>
            <p className="text-[11px] text-[#A3998F]">All touchpoints are completely up-to-date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdueItems.map((app) => renderCardRow(app, 'overdue'))}
          </div>
        )}
      </section>

      {/* SECTION 2: TODAY */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#FFF6E5] text-[#91672C]">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="font-serif font-bold text-base text-[#2C2723]">
              TODAY ({todayItems.length})
            </h3>
          </div>
          <span className="text-xs text-[#9E9285]">
            Applications requiring action today
          </span>
        </div>

        {todayItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-[#ECE5DD] text-center text-xs text-[#8C8074]">
            <CalendarCheck className="w-6 h-6 mx-auto text-[#B59F8E] mb-1.5" />
            <p className="font-medium text-[#2C2723]">No follow-ups due today</p>
            <p className="text-[11px] text-[#A3998F]">Enjoy the focus time or research new openings.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayItems.map((app) => renderCardRow(app, 'today'))}
          </div>
        )}
      </section>

      {/* SECTION 3: THIS WEEK */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#EBF3FB] text-[#2D5F85]">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="font-serif font-bold text-base text-[#2C2723]">
              THIS WEEK ({thisWeekItems.length})
            </h3>
          </div>
          <span className="text-xs text-[#9E9285]">
            Upcoming scheduled follow-ups over the next 7 days
          </span>
        </div>

        {thisWeekItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-[#ECE5DD] text-center text-xs text-[#8C8074]">
            <p className="font-medium text-[#2C2723]">No upcoming follow-ups scheduled for this week</p>
          </div>
        ) : (
          <div className="space-y-3">
            {thisWeekItems.map((app) => renderCardRow(app, 'week'))}
          </div>
        )}
      </section>
    </div>
  );
};
