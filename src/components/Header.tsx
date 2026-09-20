import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  FileSpreadsheet,
  Download,
  Palette,
  LayoutDashboard,
  TableProperties,
  Clock,
  FileText,
  Users,
  BarChart3,
  SlidersHorizontal,
  ExternalLink,
  LogIn,
  LogOut,
  X,
  CheckCircle2,
  RefreshCw,
  Sheet,
  Search,
  User,
  Building2,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import { SheetTab, ApplicationStatus, Application } from '../types';
import { STATUS_COLORS } from '../utils/calculations';
import { isInIframe } from '../services/firebaseAuth';

interface HeaderProps {
  currentTab: SheetTab;
  onSelectTab: (tab: SheetTab) => void;
  onOpenAddModal: () => void;
  onSyncToSheets: () => void;
  onExportCsv: () => void;
  onExportExcel?: () => void;
  isSyncing?: boolean;
  overdueCount: number;
  todayCount: number;
  googleSheetUrl?: string | null;
  user?: any;
  onSignIn?: () => void;
  onSignOut?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  applications?: Application[];
  onSelectApplication?: (app: Application) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  onSyncToSheets,
  onExportCsv,
  onExportExcel,
  isSyncing = false,
  overdueCount,
  todayCount,
  googleSheetUrl,
  user,
  onSignIn,
  onSignOut,
  searchQuery = '',
  onSearchChange,
  applications = [],
  onSelectApplication,
}) => {
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inIframe = isInIframe();

  // Keyboard shortcut listener: press "/" or "Cmd/Ctrl + K" to focus global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTypingInInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
        !isTypingInInput
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === 'Escape' && isSearchFocused) {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused]);

  // Handle click outside to close quick search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter applications by company, job title, or recruiter contact
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return applications.filter((app) => {
      const matchCompany = app.company?.toLowerCase().includes(q);
      const matchJobTitle = app.jobTitle?.toLowerCase().includes(q);
      const matchRecruiter =
        (app.contactName && app.contactName.toLowerCase().includes(q)) ||
        (app.contactInfo && app.contactInfo.toLowerCase().includes(q)) ||
        (app.contactRole && app.contactRole.toLowerCase().includes(q));

      return matchCompany || matchJobTitle || matchRecruiter;
    });
  }, [applications, searchQuery]);

  const tabs: { id: SheetTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'JOB SEARCH HQ', icon: LayoutDashboard },
    { id: 'applications', label: 'APPLICATIONS', icon: TableProperties },
    {
      id: 'followup',
      label: 'FOLLOW-UP',
      icon: Clock,
      badge: overdueCount + todayCount > 0 ? overdueCount + todayCount : undefined,
    },
    { id: 'resumes', label: 'RESUME LIBRARY', icon: FileText },
    { id: 'contacts', label: 'NETWORKING', icon: Users },
    { id: 'analytics', label: 'INSIGHTS', icon: BarChart3 },
    { id: 'lists', label: 'LISTS', icon: SlidersHorizontal },
  ];

  return (
    <header className="bg-[#FDF9F0] border-b border-[#EEDFCA] sticky top-0 z-30 shadow-xs">
      {/* Top Banner with Brand, Title, and Primary Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#FDF0D5] text-[#780000] border border-[#F2D7A5] tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#c1121f]" />
                PINTEREST AESTHETIC CAREER PLANNER
              </span>
              {googleSheetUrl && (
                <a
                  href={googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EBF3F8] text-[#003049] border border-[#C6DCED] hover:bg-[#D7E9F4] transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-[#669bbc]" />
                  Synced in Google Sheets
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#003049] tracking-tight font-bold">
              JOB SEARCH HQ
            </h1>
            <p className="text-sm text-[#003049]/70 font-light tracking-wide">
              Track applications. Follow up. Get hired.
            </p>
          </div>

          {/* Quick Action Tools */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Status Legend Button */}
            <button
              id="header-status-legend-btn"
              onClick={() => setShowLegendModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#003049] bg-[#FDF0D5] hover:bg-[#F8E7C4] rounded-xl transition-all border border-[#ECD7AE]"
              title="View status colors legend"
            >
              <Palette className="w-3.5 h-3.5 text-[#780000]" />
              <span className="hidden sm:inline">Color</span> Legend
            </button>

            {/* Open in New Tab if in iframe preview */}
            {inIframe && (
              <a
                id="header-open-tab-btn"
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#003049] bg-[#FDF0D5] hover:bg-[#F8E7C4] rounded-xl transition-all border border-[#ECD7AE]"
                title="Open app in a separate browser tab (recommended for Google sign-in)"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#003049]" />
                <span className="hidden sm:inline">New</span> Tab
              </a>
            )}

            {/* Export CSV Button */}
            <button
              id="header-export-csv-btn"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#003049] bg-[#FDF0D5] hover:bg-[#F8E7C4] rounded-xl transition-all border border-[#ECD7AE]"
              title="Download CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-[#003049]" />
              <span className="hidden sm:inline">Export</span> CSV
            </button>

            {/* Download Excel (.xlsx) Button */}
            {onExportExcel && (
              <button
                id="header-export-excel-btn"
                onClick={onExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#669bbc] hover:bg-[#5284a3] rounded-xl transition-all border border-[#5284a3] shadow-xs"
                title="Download complete multi-sheet Excel (.xlsx) workbook"
              >
                <Sheet className="w-3.5 h-3.5 text-white" />
                <span>Excel (.xlsx)</span>
              </button>
            )}

            {/* Google Sheets Sync Button */}
            <button
              id="header-google-sheets-sync-btn"
              onClick={onSyncToSheets}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FDF0D5] bg-[#003049] hover:bg-[#002235] rounded-xl transition-all border border-[#003049] shadow-xs disabled:opacity-50"
              title="Create live formatted Google Sheet in your Google Drive"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 text-[#669bbc] animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-[#FDF0D5]" />
              )}
              <span>{isSyncing ? 'Syncing...' : 'Sync to Sheets'}</span>
            </button>

            {/* Google Sign-in / User Profile */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-[#FDF0D5] px-2.5 py-1.5 rounded-xl border border-[#ECD7AE] text-xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google user'}
                    className="w-5 h-5 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#780000] text-[#FDF0D5] flex items-center justify-center font-bold text-[10px]">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[#003049] font-medium hidden sm:inline max-w-[90px] truncate">
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={onSignOut}
                  className="text-[#003049]/60 hover:text-[#c1121f] ml-1"
                  title="Sign out of Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              onSignIn && (
                <button
                  onClick={onSignIn}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#003049] bg-[#FDF0D5] hover:bg-[#F8E7C4] rounded-xl border border-[#ECD7AE] transition-all shadow-2xs"
                  title="Sign in with Google to enable automatic spreadsheet synchronization"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-3.5 h-3.5"
                  />
                  <span className="hidden sm:inline">Google</span> Sign In
                </button>
              )
            )}

            {/* Primary + Add Application */}
            <button
              id="header-add-application-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FDF0D5] bg-[#780000] hover:bg-[#c1121f] active:bg-[#600000] rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              + Add Role
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mt-3.5 relative" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#003049]/60 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="global-header-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                if (onSearchChange) onSearchChange(e.target.value);
                if (!isSearchFocused) setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSelectTab('applications');
                  setIsSearchFocused(false);
                }
              }}
              placeholder="Search applications by company name, job title, or recruiter contact... (Press / to search)"
              className="w-full pl-10 pr-28 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#FFFDF9] border border-[#ECD7AE] text-[#003049] placeholder-[#003049]/50 focus:outline-none focus:border-[#780000] focus:ring-2 focus:ring-[#780000]/15 shadow-2xs transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {searchQuery ? (
                <>
                  <span
                    id="global-search-match-count-badge"
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      searchMatches.length > 0
                        ? 'bg-[#FDF0D5] text-[#780000] border-[#F2D7A5]'
                        : 'bg-[#FEECEC] text-[#8C2020] border-[#F8B8B8]'
                    }`}
                  >
                    {searchMatches.length} {searchMatches.length === 1 ? 'match' : 'matches'}
                  </span>
                  <button
                    id="global-header-search-clear-btn"
                    onClick={() => {
                      if (onSearchChange) onSearchChange('');
                      setIsSearchFocused(false);
                    }}
                    className="p-1 text-[#003049]/50 hover:text-[#780000] rounded-lg transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-[#003049]/60 bg-[#FDF0D5] border border-[#ECD7AE] rounded-md">
                  <span>press</span>
                  <kbd className="font-bold text-[#780000]">/</kbd>
                </span>
              )}
            </div>
          </div>

          {/* Quick Search Results Popover Dropdown */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div
              id="global-search-results-dropdown"
              className="absolute top-full left-0 right-0 mt-2 bg-[#FFFDF9] rounded-2xl border border-[#EEDFCA] shadow-2xl z-50 overflow-hidden"
            >
              {/* Dropdown Header */}
              <div className="px-4 py-2.5 bg-[#FDF9F0] border-b border-[#EEDFCA] flex items-center justify-between text-xs text-[#003049]">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#780000]" />
                  <span className="font-medium">
                    Matches for <strong className="text-[#780000]">"{searchQuery}"</strong> ({searchMatches.length})
                  </span>
                </div>
                <span className="text-[11px] text-[#003049]/60 hidden sm:inline">
                  Click to open role details • Press Enter to view in Applications Table
                </span>
              </div>

              {/* Dropdown List */}
              {searchMatches.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#003049]/70 space-y-1 bg-white">
                  <p className="font-semibold text-sm text-[#003049]">No applications found</p>
                  <p className="text-[12px] text-[#003049]/60">
                    No roles matched "{searchQuery}". You can filter by company name, job title, or recruiter contact name/email.
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-[#EEDFCA]/60 bg-white">
                  {searchMatches.slice(0, 8).map((app) => {
                    const statusConfig = STATUS_COLORS[app.status] || STATUS_COLORS['Applied'];
                    const qLower = searchQuery.toLowerCase().trim();
                    const matchedTypes: string[] = [];

                    if (app.company.toLowerCase().includes(qLower)) {
                      matchedTypes.push('Company');
                    }
                    if (app.jobTitle.toLowerCase().includes(qLower)) {
                      matchedTypes.push('Role');
                    }
                    if (
                      (app.contactName && app.contactName.toLowerCase().includes(qLower)) ||
                      (app.contactInfo && app.contactInfo.toLowerCase().includes(qLower)) ||
                      (app.contactRole && app.contactRole.toLowerCase().includes(qLower))
                    ) {
                      matchedTypes.push('Recruiter');
                    }

                    return (
                      <div
                        key={app.id}
                        id={`search-result-item-${app.id}`}
                        onClick={() => {
                          if (onSelectApplication) {
                            onSelectApplication(app);
                          }
                          setIsSearchFocused(false);
                        }}
                        className="px-4 py-3 hover:bg-[#FDF0D5]/40 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#003049] text-[#FDF0D5] flex items-center justify-center font-serif font-bold text-xs shrink-0 group-hover:bg-[#780000] transition-colors shadow-2xs">
                            {app.company.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-[#003049] group-hover:text-[#780000] transition-colors truncate">
                                {app.company}
                              </span>
                              <span className="text-[11px] text-[#003049]/40">•</span>
                              <span className="text-xs sm:text-sm text-[#003049]/80 truncate">
                                {app.jobTitle}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#003049]/70">
                              {app.contactName ? (
                                <span className="inline-flex items-center gap-1 font-medium text-[#003049] bg-[#FDF0D5] px-2 py-0.2 rounded-md border border-[#F2D7A5]">
                                  <User className="w-3 h-3 text-[#780000]" />
                                  <span>{app.contactName}</span>
                                  {app.contactRole && (
                                    <span className="text-[#003049]/60 font-normal">
                                      ({app.contactRole})
                                    </span>
                                  )}
                                  {app.contactInfo && (
                                    <span className="text-[#003049]/50 font-normal truncate max-w-[120px]">
                                      • {app.contactInfo}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#003049]/45 italic">
                                  No recruiter contact listed
                                </span>
                              )}

                              {app.location && (
                                <span className="text-[#003049]/65">
                                  📍 {app.location}
                                </span>
                              )}

                              {app.salary && (
                                <span className="text-[#003049]/65">
                                  💰 {app.salary}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {matchedTypes.length > 0 && (
                            <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#EBF3F8] text-[#003049] border border-[#C6DCED]">
                              Matched {matchedTypes.join(' & ')}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                            {app.status}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#003049]/30 group-hover:text-[#780000] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dropdown Footer */}
              <div className="p-3 bg-[#FDF9F0] border-t border-[#EEDFCA] flex items-center justify-between text-xs">
                <span className="text-[#003049]/65 text-[11px]">
                  Showing {Math.min(8, searchMatches.length)} of {searchMatches.length} matching applications
                </span>
                <button
                  id="global-search-open-table-btn"
                  onClick={() => {
                    onSelectTab('applications');
                    setIsSearchFocused(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs text-[#FDF0D5] bg-[#003049] hover:bg-[#780000] rounded-xl transition-all shadow-xs"
                >
                  <span>View in Applications Table</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sheet Tabs Bar (Spreadsheet Tab bar styled with Pinterest/Notion warmth) */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-[#EEDFCA] pt-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#003049] text-[#FDF0D5] shadow-xs font-semibold'
                    : 'text-[#003049]/70 hover:text-[#003049] hover:bg-[#FDF0D5]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FDF0D5]' : 'text-[#669bbc]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#c1121f] text-[#FDF0D5]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Legend Modal */}
      {showLegendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFDF9] rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#EEDFCA] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEDFCA]">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#780000]" />
                <h3 className="font-serif font-bold text-base text-[#003049]">
                  Status Formatting & Color Palette
                </h3>
              </div>
              <button
                onClick={() => setShowLegendModal(false)}
                className="text-[#003049]/60 hover:text-[#003049]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#FDF0D5] border border-[#F2D7A5] space-y-1.5 text-xs text-[#003049]">
              <p className="font-semibold text-[#780000]">Curated Pinterest Palette:</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-6 h-6 rounded-lg bg-[#780000] border border-black/10 inline-block shadow-2xs" title="#780000 Deep Wine" />
                <span className="w-6 h-6 rounded-lg bg-[#c1121f] border border-black/10 inline-block shadow-2xs" title="#c1121f Ruby Red" />
                <span className="w-6 h-6 rounded-lg bg-[#fdf0d5] border border-[#d6c39a] inline-block shadow-2xs" title="#fdf0d5 Warm Almond" />
                <span className="w-6 h-6 rounded-lg bg-[#003049] border border-black/10 inline-block shadow-2xs" title="#003049 Deep Navy" />
                <span className="w-6 h-6 rounded-lg bg-[#669bbc] border border-black/10 inline-block shadow-2xs" title="#669bbc Cerulean Denim" />
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(Object.keys(STATUS_COLORS) as ApplicationStatus[]).map((st) => {
                const conf = STATUS_COLORS[st];
                return (
                  <div
                    key={st}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FDF9F0] border border-[#EEDFCA]"
                  >
                    <span className="text-xs text-[#003049] font-medium">{st}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${conf.bg} ${conf.text} ${conf.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#EEDFCA] text-right">
              <button
                onClick={() => setShowLegendModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-[#FDF0D5] bg-[#780000] hover:bg-[#c1121f] rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
