import React, { useState, useRef } from 'react';
import {
  GripVertical,
  Briefcase,
  Clock,
  Sparkles,
  Award,
  XCircle,
  CheckCircle2,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  Search,
  ArrowRight,
  ChevronDown,
  Plus,
  Check,
  FileText,
} from 'lucide-react';
import { Application, ApplicationStatus, SheetTab } from '../types';
import {
  STATUS_COLORS,
  formatDateDisplay,
  isDateOverdue,
  isDateToday,
  daysUntil,
} from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface PipelineKanbanBoardProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onQuickStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onDeleteApplication?: (id: string) => void;
  onSelectTab?: (tab: SheetTab) => void;
}

interface KanbanColumnDef {
  id: string;
  title: string;
  shortLabel: string;
  targetStatus: ApplicationStatus;
  matchingStatuses: ApplicationStatus[];
  color: string;
  dotColor: string;
  bgBadge: string;
  lightHeader: string;
  borderAccent: string;
  icon: React.ElementType;
}

const PIPELINE_COLUMNS: KanbanColumnDef[] = [
  {
    id: 'wishlist',
    title: 'Wishlist & Prep',
    shortLabel: 'Wishlist',
    targetStatus: 'Wishlist',
    matchingStatuses: ['Wishlist', 'Preparing'],
    color: '#003049',
    dotColor: 'bg-[#669bbc]',
    bgBadge: 'bg-[#FDF0D5] text-[#003049]',
    lightHeader: 'bg-[#FDF7EA]',
    borderAccent: 'border-[#F1E3C8]',
    icon: Briefcase,
  },
  {
    id: 'applied',
    title: 'Applied',
    shortLabel: 'Applied',
    targetStatus: 'Applied',
    matchingStatuses: ['Applied', 'Application Viewed'],
    color: '#003049',
    dotColor: 'bg-[#669bbc]',
    bgBadge: 'bg-[#EBF3F8] text-[#003049]',
    lightHeader: 'bg-[#F2F7FB]',
    borderAccent: 'border-[#C6DCED]',
    icon: FileText,
  },
  {
    id: 'screening',
    title: 'Screening',
    shortLabel: 'Screening',
    targetStatus: 'Screening',
    matchingStatuses: ['Screening'],
    color: '#003049',
    dotColor: 'bg-[#003049]',
    bgBadge: 'bg-[#E7EEF4] text-[#003049]',
    lightHeader: 'bg-[#F0F5F9]',
    borderAccent: 'border-[#BED2E2]',
    icon: Sparkles,
  },
  {
    id: 'interviewing',
    title: 'Interviewing',
    shortLabel: 'Interviews',
    targetStatus: 'Interview',
    matchingStatuses: ['Interview', 'Technical Interview', 'Final Interview'],
    color: '#003049',
    dotColor: 'bg-[#003049]',
    bgBadge: 'bg-[#E0EBF2] text-[#003049]',
    lightHeader: 'bg-[#EBF2F7]',
    borderAccent: 'border-[#ADC7DB]',
    icon: Sparkles,
  },
  {
    id: 'offer',
    title: 'Offer Extended',
    shortLabel: 'Offer',
    targetStatus: 'Offer',
    matchingStatuses: ['Offer'],
    color: '#780000',
    dotColor: 'bg-[#780000]',
    bgBadge: 'bg-[#FDF0F1] text-[#780000]',
    lightHeader: 'bg-[#FDF4F5]',
    borderAccent: 'border-[#F8C8CB]',
    icon: Award,
  },
  {
    id: 'accepted',
    title: 'Accepted 🎉',
    shortLabel: 'Accepted',
    targetStatus: 'Accepted',
    matchingStatuses: ['Accepted'],
    color: '#780000',
    dotColor: 'bg-[#c1121f]',
    bgBadge: 'bg-[#FDECEE] text-[#780000]',
    lightHeader: 'bg-[#FDF0F2]',
    borderAccent: 'border-[#F7BAC1]',
    icon: CheckCircle2,
  },
  {
    id: 'archived',
    title: 'Archived / Closed',
    shortLabel: 'Archived',
    targetStatus: 'Rejected',
    matchingStatuses: ['Rejected', 'Ghosted', 'Withdrawn'],
    color: '#c1121f',
    dotColor: 'bg-[#c1121f]',
    bgBadge: 'bg-[#FDF0F1] text-[#c1121f]',
    lightHeader: 'bg-[#FAF6F3]',
    borderAccent: 'border-[#F5D5D8]',
    icon: XCircle,
  },
];

export const PipelineKanbanBoard: React.FC<PipelineKanbanBoardProps> = ({
  applications,
  onSelectApplication,
  onQuickStatusChange,
  onDeleteApplication,
  onSelectTab,
}) => {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(true);
  const [statusMoveMenuAppId, setStatusMoveMenuAppId] = useState<string | null>(null);
  const [lastMovedBanner, setLastMovedBanner] = useState<{
    company: string;
    stageName: string;
  } | null>(null);

  const bannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter apps by search if any
  const filteredApps = applications.filter((app) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      app.company.toLowerCase().includes(q) ||
      app.jobTitle.toLowerCase().includes(q) ||
      (app.location && app.location.toLowerCase().includes(q)) ||
      (app.roleCategory && app.roleCategory.toLowerCase().includes(q))
    );
  });

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('text/plain', appId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAppId(appId);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverColId(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: string) => {
    // Only clear if actually leaving the column container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColId === colId) {
      setDragOverColId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCol: KanbanColumnDef) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    setDraggedAppId(null);
    setDragOverColId(null);

    if (!appId) return;

    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;

    // If application already has one of the matching statuses for this column, do nothing
    if (targetCol.matchingStatuses.includes(targetApp.status)) return;

    // Update status
    onQuickStatusChange(appId, targetCol.targetStatus);

    // Show temporary feedback banner
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    setLastMovedBanner({
      company: targetApp.company,
      stageName: targetCol.title,
    });
    bannerTimeoutRef.current = setTimeout(() => {
      setLastMovedBanner(null);
    }, 4000);
  };

  const visibleColumns = PIPELINE_COLUMNS.filter(
    (col) => showArchived || col.id !== 'archived'
  );

  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs space-y-4">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-[#F0EAE1]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#F5EFE9] text-[#A36B58]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-serif font-semibold text-[#2C2723]">
              Interactive Application Pipeline Board
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-[#7D736A] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#EAE3DA]">
              <GripVertical className="w-3 h-3 text-[#A36B58]" />
              Drag cards to advance stages
            </span>
          </div>
          <p className="text-xs text-[#857B71] mt-0.5">
            Visually track your job applications through every round. Drag and drop cards across columns to instantly update statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A89E93]" />
            <input
              type="text"
              placeholder="Search company or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58] w-48 sm:w-56"
            />
          </div>

          {/* Toggle Archived Column */}
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 text-xs rounded-xl border font-medium transition-colors cursor-pointer ${
              showArchived
                ? 'bg-[#F5EFE9] border-[#D8C7B8] text-[#5C5046]'
                : 'bg-white border-[#E3D9CD] text-[#8C8074] hover:bg-[#FAF8F5]'
            }`}
            title="Toggle visibility of the Archived/Closed column"
          >
            {showArchived ? 'Hide Closed' : 'Show Closed'}
          </button>

          {/* Database link */}
          {onSelectTab && (
            <button
              type="button"
              onClick={() => onSelectTab('applications')}
              className="text-xs font-semibold text-[#A36B58] hover:text-[#834E3C] inline-flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-[#FAF6F2] cursor-pointer"
            >
              Full Database <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Instant Feedback Pill */}
      {lastMovedBanner && (
        <div className="bg-[#EBF7EE] border border-[#BDE5C8] text-[#1E5C2D] px-3.5 py-2 rounded-xl text-xs flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-3.5 h-3.5 text-[#2E8B45]" />
            <span>
              Updated <strong>{lastMovedBanner.company}</strong> status to{' '}
              <strong>{lastMovedBanner.stageName}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLastMovedBanner(null)}
            className="text-[11px] underline text-[#1E5C2D] hover:opacity-80 ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Horizontal Scrollable Kanban Columns Container */}
      <div className="overflow-x-auto pb-3 pt-1 -mx-2 px-2 scrollbar-thin">
        <div
          className="grid gap-3.5"
          style={{
            gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(240px, 1fr))`,
            minWidth: `${visibleColumns.length * 240}px`,
          }}
        >
          {visibleColumns.map((col) => {
            const colApps = filteredApps.filter((a) =>
              col.matchingStatuses.includes(a.status)
            );
            const isDragOver = dragOverColId === col.id;
            const pctOfTotal =
              applications.length > 0
                ? Math.round((colApps.length / applications.length) * 100)
                : 0;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col)}
                className={`flex flex-col rounded-2xl border transition-all duration-200 min-h-[460px] ${
                  isDragOver
                    ? 'ring-2 ring-[#780000] bg-[#FDF0D5]/50 border-[#780000] shadow-md'
                    : 'bg-[#FDFCF8] border-[#EEDFCA]'
                }`}
              >
                {/* Column Header */}
                <div
                  className={`p-3.5 rounded-t-2xl border-b ${col.lightHeader} ${col.borderAccent} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor} shrink-0`} />
                    <h4 className="font-serif font-bold text-xs text-[#2C2723] truncate">
                      {col.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-[#918579] font-mono">
                      {pctOfTotal}%
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.bgBadge} border border-black/5`}
                    >
                      {colApps.length}
                    </span>
                  </div>
                </div>

                {/* Column Body / Drop Zone */}
                <div className="p-2.5 flex-1 flex flex-col space-y-2.5">
                  {/* Drop zone placeholder indicator when dragging over */}
                  {isDragOver && (
                    <div className="border-2 border-dashed border-[#A36B58] bg-[#FFF9F5] rounded-xl p-3 text-center text-xs font-semibold text-[#8C5240] animate-pulse">
                      Drop here to move to {col.shortLabel}
                    </div>
                  )}

                  {colApps.length === 0 && !isDragOver ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 px-3 text-center rounded-xl border border-dashed border-[#E3DBD0]/80 bg-white/40">
                      <div className="w-7 h-7 rounded-full bg-[#F5EFE8] flex items-center justify-center text-[#B0A497] mb-2">
                        <Briefcase className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[11px] font-medium text-[#7D736A]">
                        No roles in {col.shortLabel}
                      </p>
                      <p className="text-[10px] text-[#A89E93] mt-0.5">
                        Drag applications here to advance
                      </p>
                    </div>
                  ) : (
                    colApps.map((app) => {
                      const isBeingDragged = draggedAppId === app.id;
                      const isOverdue = isDateOverdue(app.nextFollowUp);
                      const isToday = isDateToday(app.nextFollowUp);
                      const statusColor = STATUS_COLORS[app.status] || STATUS_COLORS.Applied;
                      const isMoveMenuOpen = statusMoveMenuAppId === app.id;

                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onSelectApplication(app)}
                          className={`relative rounded-xl p-3 bg-white border border-[#E8DFD5] shadow-2xs hover:shadow-xs hover:border-[#C9B9AA] transition-all cursor-grab active:cursor-grabbing group space-y-2 select-none ${
                            isBeingDragged
                              ? 'opacity-35 scale-95 ring-2 ring-[#A36B58] rotate-1'
                              : 'opacity-100'
                          }`}
                        >
                          {/* Card Header: Drag Handle, Company & Actions */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-start gap-1.5 min-w-0 flex-1">
                              <span
                                className="text-[#C4B9AF] group-hover:text-[#8C8074] transition-colors pt-0.5 shrink-0"
                                title="Drag to move between stages"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>
                              <div className="min-w-0">
                                <h5 className="font-semibold text-xs text-[#2C2723] group-hover:text-[#A36B58] transition-colors truncate">
                                  {app.company}
                                </h5>
                                <p className="text-[11px] text-[#6E645A] truncate">
                                  {app.jobTitle}
                                </p>
                              </div>
                            </div>

                            {/* Card Hover Action Buttons */}
                            <div
                              className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {app.jobUrl && (
                                <a
                                  href={app.jobUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 text-[#A89E93] hover:text-[#2C2723] hover:bg-[#F4EFEA] rounded transition-colors"
                                  title="Open job link"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectApplication(app);
                                }}
                                className="p-1 text-[#A89E93] hover:text-[#A36B58] hover:bg-[#F4EFEA] rounded transition-colors cursor-pointer"
                                title="Edit application details"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              {onDeleteApplication && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAppToDelete(app);
                                  }}
                                  className="p-1 text-[#A89E93] hover:text-[#C13626] hover:bg-[#FEEAEA] rounded transition-colors cursor-pointer"
                                  title="Delete application"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Specific Status Badge & Salary */}
                          <div className="flex items-center justify-between gap-1 text-[10px]">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`} />
                              {app.status}
                            </span>

                            {app.salary && (
                              <span className="font-mono text-[#7D736A] truncate max-w-[100px]">
                                {app.salary}
                              </span>
                            )}
                          </div>

                          {/* Location & Resume tag */}
                          <div className="flex items-center justify-between gap-2 text-[10px] text-[#8C8074]">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              {app.location || 'Remote'}
                            </span>

                            {app.resumeUsed && (
                              <span
                                className="truncate max-w-[100px] text-[#786E64]"
                                title={`Resume: ${app.resumeUsed}`}
                              >
                                {app.resumeUsed}
                              </span>
                            )}
                          </div>

                          {/* Follow-up Due Tag if scheduled */}
                          {app.nextFollowUp && (
                            <div
                              className={`flex items-center justify-between text-[10px] px-2 py-1 rounded-lg border ${
                                isOverdue
                                  ? 'bg-[#FEECEC] border-[#F8B8B8] text-[#8C2020] font-semibold'
                                  : isToday
                                  ? 'bg-[#FFF6E5] border-[#F9E4C5] text-[#91672C] font-semibold'
                                  : 'bg-[#FAF8F5] border-[#F0EAE1] text-[#73685E]'
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDateDisplay(app.nextFollowUp)}
                              </span>
                              <span>
                                {isOverdue && 'Overdue'}
                                {isToday && 'Due Today'}
                                {!isOverdue && !isToday && `${daysUntil(app.nextFollowUp)}d`}
                              </span>
                            </div>
                          )}

                          {/* Quick Mobile/Click Move-To Control */}
                          <div
                            className="pt-1 border-t border-[#F2ECE5] flex items-center justify-between text-[10px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[#A3998F] text-[9px] uppercase tracking-wider font-semibold">
                              Move stage:
                            </span>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStatusMoveMenuAppId(isMoveMenuOpen ? null : app.id);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF7F4] hover:bg-[#F2ECE5] text-[#6E6359] border border-[#E3D9CD] transition-colors cursor-pointer"
                              >
                                <span>Change</span>
                                <ChevronDown className="w-2.5 h-2.5" />
                              </button>

                              {/* Dropdown menu for fast 1-click status change */}
                              {isMoveMenuOpen && (
                                <div
                                  className="absolute right-0 bottom-full mb-1 z-30 w-44 bg-white rounded-xl shadow-lg border border-[#E3D9CD] py-1.5 text-xs text-[#2C2723]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#8C8074] uppercase tracking-wider border-b border-[#F0EAE1]">
                                    Move to Pipeline Stage
                                  </div>
                                  <div className="max-h-48 overflow-y-auto py-1">
                                    {PIPELINE_COLUMNS.map((targetC) => {
                                      const isCurrent = targetC.matchingStatuses.includes(
                                        app.status
                                      );
                                      return (
                                        <button
                                          key={targetC.id}
                                          type="button"
                                          disabled={isCurrent}
                                          onClick={() => {
                                            onQuickStatusChange(app.id, targetC.targetStatus);
                                            setStatusMoveMenuAppId(null);
                                            setLastMovedBanner({
                                              company: app.company,
                                              stageName: targetC.title,
                                            });
                                          }}
                                          className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between text-[11px] transition-colors ${
                                            isCurrent
                                              ? 'text-[#A89E93] bg-[#FAF8F5] cursor-default'
                                              : 'hover:bg-[#F6EFE9] text-[#3D352E] cursor-pointer'
                                          }`}
                                        >
                                          <span className="flex items-center gap-1.5">
                                            <span
                                              className={`w-1.5 h-1.5 rounded-full ${targetC.dotColor}`}
                                            />
                                            {targetC.title}
                                          </span>
                                          {isCurrent && (
                                            <span className="text-[9px] text-[#A89E93] font-mono">
                                              Current
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(appToDelete)}
        title="Delete Application?"
        message={`Are you sure you want to permanently delete "${appToDelete?.company}" (${appToDelete?.jobTitle}) from your pipeline?`}
        confirmLabel="Delete Application"
        onConfirm={() => {
          if (appToDelete && onDeleteApplication) {
            onDeleteApplication(appToDelete.id);
            setAppToDelete(null);
          }
        }}
        onCancel={() => setAppToDelete(null)}
      />
    </section>
  );
};
