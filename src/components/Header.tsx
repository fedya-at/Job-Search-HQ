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
  BarChart3,
  SlidersHorizontal,
  ExternalLink,
  LogIn,
  LogOut,
  X,
  RefreshCw,
  Sheet,
  Search,
  User,
  Building2,
  ArrowRight,
  ChevronDown,
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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
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

  // Handle click outside to close quick search dropdown and export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
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
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'applications', label: 'APPLICATIONS', icon: TableProperties },
    {
      id: 'followup',
      label: 'FOLLOW-UP',
      icon: Clock,
      badge: overdueCount + todayCount > 0 ? overdueCount + todayCount : undefined,
    },
    { id: 'resumes', label: 'RESUME LIBRARY', icon: FileText },
    { id: 'analytics', label: 'INSIGHTS', icon: BarChart3 },
    { id: 'lists', label: 'LISTS', icon: SlidersHorizontal },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
      {/* 3-Section Main Navbar: Logo | Nav Items | Actions & Login */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* 1. LEFT: Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <h1 className="text-2xl sm:text-3xl font-serif text-[#003049] tracking-tight font-bold group-hover:text-[#780000] transition-colors">
                JOB SEARCH HQ
              </h1>
              <p className="text-[11px] text-gray-400 font-light tracking-wider hidden sm:block">
                Personal Career Command Center
              </p>
            </button>
          </div>

          {/* 2. CENTER: Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1 bg-gray-50/80 p-1 rounded-2xl border border-gray-200/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-btn-${tab.id}`}
                  onClick={() => onSelectTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#003049] text-white shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-[#003049] hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#669bbc]'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#c1121f] text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 3. RIGHT: Action Buttons & Login */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Color Legend */}
            <button
              onClick={() => setShowLegendModal(true)}
              className="p-2 text-gray-500 hover:text-[#003049] hover:bg-gray-100 rounded-xl transition-colors hidden sm:inline-flex"
              title="Color Palette Legend"
            >
              <Palette className="w-4 h-4 text-[#780000]" />
            </button>

            {/* Export & Sync Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#003049] bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all cursor-pointer"
                title="Spreadsheet sync and export options"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#669bbc]" />
                <span className="hidden sm:inline">Sheets / Export</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-200 shadow-xl py-2 z-50 text-xs">
                  {onExportExcel && (
                    <button
                      onClick={() => {
                        onExportExcel();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-[#003049] font-medium"
                    >
                      <Sheet className="w-4 h-4 text-emerald-600" />
                      <span>Download Excel (.xlsx)</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onExportCsv();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-[#003049] font-medium"
                  >
                    <Download className="w-4 h-4 text-[#003049]" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      onSyncToSheets();
                      setShowExportMenu(false);
                    }}
                    disabled={isSyncing}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-[#003049] font-medium border-t border-gray-100"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 text-[#669bbc] animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-[#669bbc]" />
                    )}
                    <span>{isSyncing ? 'Syncing...' : 'Sync to Google Drive'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* + Add Role */}
            <button
              id="header-add-application-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#780000] hover:bg-[#c1121f] active:bg-[#600000] rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Role</span>
            </button>

            {/* Login / User Account */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google user'}
                      className="w-5 h-5 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#780000] text-white flex items-center justify-center font-bold text-[10px]">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[#003049] font-medium hidden md:inline max-w-[80px] truncate">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={onSignOut}
                    className="text-gray-400 hover:text-red-600 ml-1 p-0.5"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              onSignIn && (
                <button
                  onClick={onSignIn}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#003049] bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all shadow-2xs cursor-pointer"
                  title="Sign In with Google to securely access your personal applications"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-3.5 h-3.5"
                  />
                  <span>Sign In</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Mobile / Tablet Tabs Navigation */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pt-3 border-t border-gray-100 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#003049] text-white font-semibold'
                    : 'text-gray-600 hover:text-[#003049] hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#669bbc]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#c1121f] text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Search Bar */}
        <div className="mt-3 relative" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
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
              className="w-full pl-10 pr-28 py-2 text-xs sm:text-sm rounded-xl bg-gray-50 border border-gray-200 text-[#003049] placeholder-gray-400 focus:outline-none focus:border-[#780000] focus:ring-2 focus:ring-[#780000]/10 shadow-2xs transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {searchQuery ? (
                <>
                  <span
                    id="global-search-match-count-badge"
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      searchMatches.length > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
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
                    className="p-1 text-gray-400 hover:text-[#780000] rounded-lg transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-white border border-gray-200 rounded-md">
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
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs text-[#003049]">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#780000]" />
                  <span className="font-medium">
                    Matches for <strong className="text-[#780000]">"{searchQuery}"</strong> ({searchMatches.length})
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 hidden sm:inline">
                  Click to open role details • Press Enter to view in table
                </span>
              </div>

              {searchMatches.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 space-y-1 bg-white">
                  <p className="font-semibold text-sm text-[#003049]">No applications found</p>
                  <p className="text-[12px] text-gray-400">
                    No roles matched "{searchQuery}".
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 bg-white">
                  {searchMatches.slice(0, 8).map((app) => {
                    const statusConfig = STATUS_COLORS[app.status] || STATUS_COLORS['Applied'];
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
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#003049] text-white flex items-center justify-center font-serif font-bold text-xs shrink-0 group-hover:bg-[#780000] transition-colors">
                            {app.company.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-[#003049] group-hover:text-[#780000] transition-colors truncate">
                                {app.company}
                              </span>
                              <span className="text-[11px] text-gray-300">•</span>
                              <span className="text-xs sm:text-sm text-gray-600 truncate">
                                {app.jobTitle}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-500">
                              {app.contactName && (
                                <span className="inline-flex items-center gap-1 font-medium text-gray-700 bg-gray-100 px-2 py-0.2 rounded-md">
                                  <User className="w-3 h-3 text-[#780000]" />
                                  <span>{app.contactName}</span>
                                </span>
                              )}
                              {app.location && <span>📍 {app.location}</span>}
                              {app.salary && <span>💰 {app.salary}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                            {app.status}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#780000] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
                <span className="text-gray-500 text-[11px]">
                  Showing {Math.min(8, searchMatches.length)} of {searchMatches.length} matches
                </span>
                <button
                  onClick={() => {
                    onSelectTab('applications');
                    setIsSearchFocused(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs text-white bg-[#003049] hover:bg-[#780000] rounded-xl transition-all shadow-xs"
                >
                  <span>View in Table</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Legend Modal */}
      {showLegendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#780000]" />
                <h3 className="font-bold text-base text-[#003049]">
                  Application Status & Formatting
                </h3>
              </div>
              <button
                onClick={() => setShowLegendModal(false)}
                className="text-gray-400 hover:text-[#003049]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(Object.keys(STATUS_COLORS) as ApplicationStatus[]).map((st) => {
                const conf = STATUS_COLORS[st];
                return (
                  <div
                    key={st}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200"
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

            <div className="pt-2 border-t border-gray-200 text-right">
              <button
                onClick={() => setShowLegendModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#780000] hover:bg-[#c1121f] rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
