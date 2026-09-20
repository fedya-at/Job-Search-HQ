import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ExternalLink,
  Plus,
  Clock,
  MapPin,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  Mail,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon,
  Trash2,
  Edit2,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  GripVertical,
} from 'lucide-react';
import { Application, ApplicationOrigin, ApplicationStatus, DataLists } from '../types';
import {
  daysBetween,
  daysUntil,
  formatDateDisplay,
  isDateOverdue,
  isDateToday,
  STATUS_COLORS,
} from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface ApplicationTrackerProps {
  applications: Application[];
  lists: DataLists;
  onSelectApplication: (app: Application) => void;
  onOpenAddModal: () => void;
  onUpdateApplicationStatus: (id: string, newStatus: ApplicationStatus) => void;
  onDeleteApplication: (id: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications,
  lists,
  onSelectApplication,
  onOpenAddModal,
  onUpdateApplicationStatus,
  onDeleteApplication,
  searchTerm: controlledSearchTerm,
  onSearchChange: onControlledSearchChange,
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = controlledSearchTerm !== undefined ? controlledSearchTerm : internalSearchTerm;
  const handleSearchChange = (val: string) => {
    if (onControlledSearchChange) {
      onControlledSearchChange(val);
    } else {
      setInternalSearchTerm(val);
    }
  };

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [originFilter, setOriginFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [sortField, setSortField] = useState<keyof Application>('dateApplied');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [appToDelete, setAppToDelete] = useState<{ id: string; name: string } | null>(null);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ApplicationStatus | null>(null);

  // Extract unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    applications.forEach((a) => {
      if (a.location) locs.add(a.location);
    });
    return Array.from(locs);
  }, [applications]);

  // Filter and Sort
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        const matchesSearch =
          app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (app.location && app.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (app.contactName && app.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (app.contactRole && app.contactRole.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (app.contactInfo && app.contactInfo.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (app.nextAction && app.nextAction.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
        const matchesOrigin = originFilter === 'All' || app.origin === originFilter;
        const matchesLocation = locationFilter === 'All' || app.location === locationFilter;

        return matchesSearch && matchesStatus && matchesOrigin && matchesLocation;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? '';
        const valB = b[sortField] ?? '';
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [applications, searchTerm, statusFilter, originFilter, locationFilter, sortField, sortAsc]);

  const handleSort = (field: keyof Application) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Control Bar: Search, Filters, View Modes */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE5DD] shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A89D91] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="app-search-input"
              type="text"
              placeholder="Search companies, roles, locations, contacts..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] placeholder-[#A69D92] focus:outline-none focus:border-[#A36B58] focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A89D91] hover:text-[#524B43]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action and View Mode Toggle */}
          <div className="flex items-center gap-2.5">
            {/* View switcher */}
            <div className="inline-flex rounded-xl bg-[#F2EDE7] p-1 border border-[#E3D9CD]">
              <button
                id="view-table-btn"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#2C2723] shadow-xs'
                    : 'text-[#7D736A] hover:text-[#2C2723]'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-[#A36B58]" />
                <span className="hidden sm:inline">Spreadsheet</span> Table
              </button>
              <button
                id="view-kanban-btn"
                onClick={() => setViewMode('kanban')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-[#2C2723] shadow-xs'
                    : 'text-[#7D736A] hover:text-[#2C2723]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#A36B58]" />
                Pipeline Board
              </button>
            </div>

            {/* + Add Application */}
            <button
              id="tracker-add-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#A36B58] hover:bg-[#8F5744] rounded-xl transition-all shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span> Role
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#F2ECE5] text-xs">
          <div className="flex items-center gap-1.5 text-[#8A7F73] mr-1">
            <Filter className="w-3.5 h-3.5 text-[#A36B58]" />
            <span className="font-semibold text-[11px] uppercase tracking-wider">Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            id="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E3D9CD] text-[#4A423B] focus:outline-none focus:border-[#A36B58] text-xs"
          >
            <option value="All">All Statuses ({applications.length})</option>
            {lists.statuses.map((st) => (
              <option key={st} value={st}>
                {st} ({applications.filter((a) => a.status === st).length})
              </option>
            ))}
          </select>

          {/* Origin Filter */}
          <select
            id="origin-filter-select"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E3D9CD] text-[#4A423B] focus:outline-none focus:border-[#A36B58] text-xs"
          >
            <option value="All">All Sources</option>
            {lists.origins.map((orig) => (
              <option key={orig} value={orig}>
                {orig} ({applications.filter((a) => a.origin === orig).length})
              </option>
            ))}
          </select>

          {/* Location Filter */}
          {uniqueLocations.length > 0 && (
            <select
              id="location-filter-select"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E3D9CD] text-[#4A423B] focus:outline-none focus:border-[#A36B58] text-xs"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          )}

          {/* Active Filter Clear */}
          {(statusFilter !== 'All' || originFilter !== 'All' || locationFilter !== 'All' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('All');
                setOriginFilter('All');
                setLocationFilter('All');
                handleSearchChange('');
              }}
              className="text-xs text-[#A36B58] hover:underline ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-xs text-[#8A7F73]">
            Showing <span className="font-bold text-[#2C2723]">{filteredApps.length}</span> of {applications.length} applications
          </div>
        </div>
      </div>

      {/* VIEW 1: SPREADSHEET TABLE VIEW (Elegant Notion × Luxury Excel) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-[#ECE5DD] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-xs border-collapse">
              {/* Frozen Header with Sort indicators */}
              <thead className="sticky top-0 bg-[#F7F4EF] z-20 shadow-2xs text-[#7A6F64] uppercase tracking-wider text-[10px] font-bold border-b border-[#E3D9CD]">
                <tr>
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:text-[#2C2723] whitespace-nowrap"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center gap-1">
                      Company & Role
                      <ArrowUpDown className="w-3 h-3 text-[#A89E93]" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-[#2C2723] whitespace-nowrap"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="w-3 h-3 text-[#A89E93]" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-[#2C2723] whitespace-nowrap"
                    onClick={() => handleSort('dateApplied')}
                  >
                    <div className="flex items-center gap-1">
                      Date Applied
                      <ArrowUpDown className="w-3 h-3 text-[#A89E93]" />
                    </div>
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Location & Type</th>
                  <th className="py-3 px-3 whitespace-nowrap">Salary</th>
                  <th className="py-3 px-3 whitespace-nowrap">Resume / Cover</th>
                  <th className="py-3 px-3 whitespace-nowrap">Source</th>
                  <th className="py-3 px-3 whitespace-nowrap">Contact</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-[#2C2723] whitespace-nowrap"
                    onClick={() => handleSort('nextFollowUp')}
                  >
                    <div className="flex items-center gap-1">
                      Follow-up & Due
                      <ArrowUpDown className="w-3 h-3 text-[#A89E93]" />
                    </div>
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Next Action</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap pr-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F2EDE6]">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[#8C8276]">
                      <div className="max-w-sm mx-auto space-y-2">
                        <FileText className="w-8 h-8 mx-auto text-[#C9BFB5]" />
                        <p className="font-serif text-sm font-semibold text-[#4A423B]">
                          No matching applications found
                        </p>
                        <p className="text-xs text-[#8A8075]">
                          Try adjusting your search terms or filters, or add a new job opening.
                        </p>
                        <button
                          onClick={onOpenAddModal}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#A36B58] rounded-xl"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Application
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const color = STATUS_COLORS[app.status] || STATUS_COLORS.Applied;
                    const daysAgo = app.dateApplied ? daysBetween(app.dateApplied) : null;
                    const daysToFollowUp = daysUntil(app.nextFollowUp);
                    const isOverdue = isDateOverdue(app.nextFollowUp);
                    const isToday = isDateToday(app.nextFollowUp);

                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-[#FAF7F2] transition-colors cursor-pointer group"
                        onClick={() => onSelectApplication(app)}
                      >
                        {/* Company & Job Title */}
                        <td className="py-3 px-3.5 min-w-[200px]">
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#F5EFE8] flex items-center justify-center text-[#8C6D53] shrink-0 font-serif font-bold text-xs mt-0.5">
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
                                    className="text-[#A3998F] hover:text-[#2C2723] transition-colors"
                                    title="Open Job URL"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              <div className="text-[11px] text-[#73695F]">
                                {app.jobTitle}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status (Interactive dropdown pill) */}
                        <td className="py-3 px-3 min-w-[130px]" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <select
                              value={app.status}
                              onChange={(e) =>
                                onUpdateApplicationStatus(app.id, e.target.value as ApplicationStatus)
                              }
                              className={`appearance-none text-[11px] font-medium pl-2.5 pr-6 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#A36B58] transition-all ${color.bg} ${color.text} ${color.border}`}
                            >
                              {lists.statuses.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                          </div>
                        </td>

                        {/* Date Applied & Days Since */}
                        <td className="py-3 px-3 whitespace-nowrap min-w-[110px]">
                          <div className="text-[#38312B] font-medium">
                            {formatDateDisplay(app.dateApplied)}
                          </div>
                          {daysAgo !== null && (
                            <div className="text-[10px] text-[#91867A]">
                              {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                            </div>
                          )}
                        </td>

                        {/* Location & Employment Type */}
                        <td className="py-3 px-3 min-w-[140px]">
                          <div className="text-[#4F473F] flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-[#A89E93] shrink-0" />
                            <span className="truncate">{app.location || '—'}</span>
                          </div>
                          <div className="text-[10px] text-[#8C8074]">
                            {app.employmentType}
                          </div>
                        </td>

                        {/* Salary */}
                        <td className="py-3 px-3 min-w-[120px] whitespace-nowrap">
                          <span className="text-[#3D352E] font-medium">
                            {app.salary || <span className="text-[#C4B9AF]">—</span>}
                          </span>
                        </td>

                        {/* Resume Used & Cover Letter */}
                        <td className="py-3 px-3 min-w-[160px]">
                          <div className="flex items-center gap-1.5 text-[#003049] truncate font-medium max-w-[150px]">
                            {app.cvFileName ? (
                              app.cvFileData ? (
                                <a
                                  href={app.cvFileData}
                                  download={app.cvFileName}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-[#003049] hover:text-[#780000] hover:underline inline-flex items-center gap-1 font-semibold truncate"
                                  title={`Download ${app.cvFileName}`}
                                >
                                  <span>📄 {app.cvFileName}</span>
                                </a>
                              ) : (
                                <span className="truncate">📄 {app.cvFileName}</span>
                              )
                            ) : app.resumeUsed ? (
                              <span>{app.resumeUsed.replace('📄 ', '')}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <span>Cover: <strong>{app.coverLetter}</strong></span>
                            {app.coverLetterText && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1 rounded font-medium">
                                Text saved
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Origin Source */}
                        <td className="py-3 px-3 min-w-[110px] whitespace-nowrap">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-[#F4EFEA] text-[#63594F] text-[11px]">
                            {app.origin}
                          </span>
                        </td>

                        {/* Contact Name & Role */}
                        <td className="py-3 px-3 min-w-[140px]">
                          {app.contactName ? (
                            <div>
                              <div className="font-medium text-[#2C2723] truncate">
                                {app.contactName}
                              </div>
                              <div className="text-[10px] text-[#8C8074] truncate">
                                {app.contactRole || app.contactMethod || '—'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#C4B9AF]">—</span>
                          )}
                        </td>

                        {/* Follow-up Date & Overdue Indicator */}
                        <td className="py-3 px-3 whitespace-nowrap min-w-[130px]">
                          {app.nextFollowUp ? (
                            <div>
                              <div
                                className={`inline-flex items-center gap-1 font-medium ${
                                  isOverdue
                                    ? 'text-[#C13626] font-bold'
                                    : isToday
                                    ? 'text-[#9A6720] font-bold'
                                    : 'text-[#544B42]'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {formatDateDisplay(app.nextFollowUp)}
                              </div>
                              <div className="text-[10px]">
                                {isOverdue && (
                                  <span className="text-[#C13626] font-semibold">
                                    {Math.abs(daysToFollowUp!)}d Overdue
                                  </span>
                                )}
                                {isToday && (
                                  <span className="text-[#9A6720] font-semibold">
                                    Due Today
                                  </span>
                                )}
                                {!isOverdue && !isToday && daysToFollowUp !== null && (
                                  <span className="text-[#8C8074]">
                                    In {daysToFollowUp}d
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#C4B9AF]">—</span>
                          )}
                        </td>

                        {/* Next Action */}
                        <td className="py-3 px-3 max-w-[180px]">
                          <div className="text-[#4A423A] truncate font-medium" title={app.nextAction}>
                            {app.nextAction || <span className="text-[#C4B9AF]">—</span>}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
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
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAppToDelete({
                                  id: app.id,
                                  name: `${app.company} (${app.jobTitle})`,
                                });
                              }}
                              className="p-1 rounded-md text-[#A89E93] hover:text-[#C13626] hover:bg-[#FEEAEA] transition-colors cursor-pointer"
                              title="Delete application"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Formula Legend */}
          <div className="bg-[#FAF8F5] border-t border-[#ECE5DD] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#8C8074]">
            <div className="flex items-center gap-4">
              <span>
                <strong className="text-[#4A423A]">Smart Columns:</strong> Days Since Applied, Days Until Follow-up, Overdue highlights
              </span>
              <span>•</span>
              <span>Click any row to open the complete notes & interview dossier</span>
            </div>
            <div className="font-mono text-[#A3998F]">
              Total Records: {filteredApps.length}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: KANBAN PIPELINE BOARD (Pinterest Card View) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {lists.statuses.map((status) => {
            const color = STATUS_COLORS[status] || STATUS_COLORS.Applied;
            const columnApps = filteredApps.filter((a) => a.status === status);
            const isDragOver = dragOverStatus === status;

            return (
              <div
                key={status}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverStatus !== status) setDragOverStatus(status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverStatus(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain') || draggedAppId;
                  setDraggedAppId(null);
                  setDragOverStatus(null);
                  if (id && onUpdateApplicationStatus) {
                    onUpdateApplicationStatus(id, status);
                  }
                }}
                className={`rounded-2xl p-3.5 border flex flex-col min-h-[300px] transition-all duration-200 ${
                  isDragOver
                    ? 'bg-[#FBF5EE] border-[#C9AFA3] ring-2 ring-[#A36B58] shadow-md'
                    : 'bg-[#FBF9F6] border-[#ECE5DD]'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ECE5DD]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                    <span className="font-serif font-bold text-xs text-[#2C2723]">
                      {status}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#8C8074] bg-white px-2 py-0.5 rounded-full border border-[#ECE5DD]">
                    {columnApps.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 flex-1">
                  {isDragOver && (
                    <div className="border-2 border-dashed border-[#A36B58] bg-[#FFF9F5] rounded-xl p-2.5 text-center text-xs font-semibold text-[#8C5240] animate-pulse">
                      Drop to move to {status}
                    </div>
                  )}

                  {columnApps.length === 0 && !isDragOver ? (
                    <div className="text-center py-6 text-[11px] text-[#C4B9AF] font-light">
                      No roles in this stage
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const isOverdue = isDateOverdue(app.nextFollowUp);
                      const isToday = isDateToday(app.nextFollowUp);
                      const isBeingDragged = draggedAppId === app.id;

                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', app.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedAppId(app.id);
                          }}
                          onDragEnd={() => {
                            setDraggedAppId(null);
                            setDragOverStatus(null);
                          }}
                          onClick={() => onSelectApplication(app)}
                          className={`bg-white rounded-xl p-3 border border-[#EAE3DA] shadow-2xs hover:shadow-xs hover:border-[#D8CBC0] transition-all cursor-grab active:cursor-grabbing group space-y-2 select-none ${
                            isBeingDragged
                              ? 'opacity-35 scale-95 ring-2 ring-[#A36B58]'
                              : 'opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 flex-1 min-w-0">
                              <GripVertical className="w-3.5 h-3.5 text-[#C4B9AF] group-hover:text-[#8C8074] shrink-0 pt-0.5" />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-xs text-[#2C2723] group-hover:text-[#A36B58] transition-colors truncate">
                                  {app.company}
                                </h4>
                                <p className="text-[11px] text-[#786F66] truncate">{app.jobTitle}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {app.jobUrl && (
                                <a
                                  href={app.jobUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 text-[#C4B9AF] hover:text-[#524B43] rounded"
                                  title="Open job posting URL"
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
                                className="p-1 text-[#A89E93] hover:text-[#A36B58] hover:bg-[#F2ECE5] rounded transition-colors cursor-pointer"
                                title="Edit application"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAppToDelete({
                                    id: app.id,
                                    name: `${app.company} (${app.jobTitle})`,
                                  });
                                }}
                                className="p-1 text-[#C4B9AF] hover:text-[#C13626] hover:bg-[#FEEAEA] rounded transition-colors cursor-pointer"
                                title="Delete application"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-[#8C8074]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              {app.location || 'Remote'}
                            </span>
                            {app.salary && <span>• {app.salary}</span>}
                          </div>

                          {app.nextAction && (
                            <div className="bg-[#FAF8F5] p-1.5 rounded text-[10px] text-[#595147] border border-[#F2ECE5]">
                              <span className="font-semibold text-[#8C6D53]">Next:</span> {app.nextAction}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#F5EFE9]">
                            <span className="text-[#A3998F]">
                              {app.dateApplied ? formatDateDisplay(app.dateApplied) : 'Draft'}
                            </span>

                            {app.nextFollowUp && (
                              <span
                                className={`font-medium ${
                                  isOverdue
                                    ? 'text-[#C13626] font-bold'
                                    : isToday
                                    ? 'text-[#9A6720] font-bold'
                                    : 'text-[#8C8074]'
                                }`}
                              >
                                {isOverdue ? '⚠️ Overdue' : isToday ? '⏰ Today' : formatDateDisplay(app.nextFollowUp)}
                              </span>
                            )}
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
      )}

      {/* In-App Safe Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(appToDelete)}
        title="Delete Application?"
        message={`Are you sure you want to remove "${appToDelete?.name}" from your tracker? This action cannot be undone.`}
        confirmLabel="Delete Application"
        onConfirm={() => {
          if (appToDelete) {
            onDeleteApplication(appToDelete.id);
            setAppToDelete(null);
          }
        }}
        onCancel={() => setAppToDelete(null)}
      />
    </div>
  );
};
