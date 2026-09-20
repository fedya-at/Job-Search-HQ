import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Menu,
  Plus,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import { SheetTab, Application } from '../types';
import { STATUS_COLORS } from '../utils/calculations';

interface TopBarProps {
  currentTab: SheetTab;
  onOpenMobileMenu: () => void;
  onOpenAddModal: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  applications?: Application[];
  onSelectApplication?: (app: Application) => void;
  onSelectTab: (tab: SheetTab) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

const TAB_TITLES: Record<SheetTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Career Command Center & Pipeline Performance' },
  applications: { title: 'Job Applications', subtitle: 'Master tracker of all sent applications' },
  followup: { title: 'Follow-Up Center', subtitle: 'Actionable touchpoints and recruiter schedules' },
  resumes: { title: 'Resume Library', subtitle: 'Tailored resume versions and file assets' },
  contacts: { title: 'Networking', subtitle: 'Professional contacts and recruiters' },
  analytics: { title: 'Insights & KPIs', subtitle: 'Conversion rates and pipeline analytics' },
  lists: { title: 'Lists & Rules', subtitle: 'Dropdown configuration and validation rules' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenAddModal,
  searchQuery = '',
  onSearchChange,
  applications = [],
  onSelectApplication,
  onSelectTab,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: press "/" or "Cmd/Ctrl + K" to focus search
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

  const activeTabMeta = TAB_TITLES[currentTab] || { title: 'Job Search HQ', subtitle: '' };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle / Desktop Sidebar Toggle & Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger menu */}
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 cursor-pointer"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop sidebar toggle button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden md:flex p-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-slate-700" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-700" />
              )}
            </button>
          )}

          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 truncate">
              {activeTabMeta.title}
            </h2>
            <p className="text-[11px] text-slate-600 font-medium hidden sm:block truncate">
              {activeTabMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Center / Right: Global Search Bar & Quick Add */}
        <div className="flex items-center gap-2.5 max-w-lg w-full justify-end">
          {/* Global Search Bar */}
          <div className="relative flex-1 max-w-md" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                id="topbar-search-input"
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
                placeholder="Search company, role, recruiter... (/)"
                className="w-full pl-9 pr-14 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-[#780000] focus:ring-1 focus:ring-[#780000]/20 transition-all shadow-2xs"
              />
              <div className="absolute right-2.5 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    onClick={() => {
                      if (onSearchChange) onSearchChange('');
                      setIsSearchFocused(false);
                    }}
                    className="p-0.5 text-slate-400 hover:text-[#780000] rounded-lg cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded">
                    /
                  </span>
                )}
              </div>
            </div>

            {/* Quick Search Popover */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div
                id="topbar-search-dropdown"
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden"
              >
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-900 font-semibold">
                  <span className="text-[11px]">
                    Matches for <strong className="text-[#780000]">"{searchQuery}"</strong> ({searchMatches.length})
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Press Enter for table</span>
                </div>

                {searchMatches.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-white">
                    No roles found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 bg-white">
                    {searchMatches.slice(0, 6).map((app) => {
                      const statusConfig = STATUS_COLORS[app.status] || STATUS_COLORS['Applied'];
                      return (
                        <div
                          key={app.id}
                          onClick={() => {
                            if (onSelectApplication) onSelectApplication(app);
                            setIsSearchFocused(false);
                          }}
                          className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-3 group text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-[#780000] truncate">
                              {app.company} <span className="font-normal text-slate-600">— {app.jobTitle}</span>
                            </div>
                            {app.contactName && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Recruiter: {app.contactName}
                              </div>
                            )}
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                            {app.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Add Button (Mobile) */}
          <button
            onClick={onOpenAddModal}
            className="inline-flex md:hidden items-center gap-1 px-3 py-2 rounded-xl bg-[#780000] hover:bg-[#c1121f] text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
};
