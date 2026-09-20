import React, { useState } from 'react';
import {
  LayoutDashboard,
  TableProperties,
  Clock,
  FileText,
  BarChart3,
  SlidersHorizontal,
  Plus,
  FileSpreadsheet,
  Download,
  Palette,
  LogOut,
  Sheet,
  RefreshCw,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { SheetTab, ApplicationStatus } from '../types';
import { STATUS_COLORS } from '../utils/calculations';

interface SidebarProps {
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
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
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
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [showLegendModal, setShowLegendModal] = useState(false);

  const navItems: { id: SheetTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: TableProperties },
    {
      id: 'followup',
      label: 'Follow-Up',
      icon: Clock,
      badge: overdueCount + todayCount > 0 ? overdueCount + todayCount : undefined,
    },
    { id: 'resumes', label: 'Resume Library', icon: FileText },
    { id: 'analytics', label: 'Insights & KPIs', icon: BarChart3 },
    { id: 'lists', label: 'Lists & Rules', icon: SlidersHorizontal },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-900 select-none border-r border-slate-200">
      {/* 1. Header & Brand Logo + Toggle Collapse Button */}
      <div className={`p-4 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
        <button
          onClick={() => {
            onSelectTab('dashboard');
            if (onCloseMobile) onCloseMobile();
          }}
          className="text-left group cursor-pointer focus:outline-none min-w-0"
          title="Job Search HQ"
        >
          {isCollapsed ? (
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-serif font-bold text-base shadow-xs group-hover:bg-[#780000] transition-colors">
              HQ
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-serif text-slate-900 tracking-tight font-bold group-hover:text-[#780000] transition-colors flex items-center gap-1.5">
                <span>Job Search HQ</span>
                <span className="text-sm font-sans text-[#780000]">♡</span>
              </h1>
              <p className="text-[11px] text-slate-600 font-medium tracking-wider mt-0.5">
                Career Command Center
              </p>
            </div>
          )}
        </button>

        {/* Toggle Collapse on Desktop */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-slate-700" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-700" />
            )}
          </button>
        )}

        {/* Close on Mobile */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Primary Action Button (+ Add Role) */}
      <div className={`p-3 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          id="sidebar-add-role-btn"
          onClick={() => {
            onOpenAddModal();
            if (onCloseMobile) onCloseMobile();
          }}
          className={`flex items-center justify-center rounded-xl bg-[#780000] hover:bg-[#c1121f] active:bg-[#600000] text-white font-bold shadow-xs transition-all cursor-pointer ${
            isCollapsed ? 'w-11 h-11 p-0' : 'w-full py-2.5 px-4 gap-2 text-xs'
          }`}
          title="Add New Job Application"
        >
          <Plus className={isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} />
          {!isCollapsed && <span>+ Add Application</span>}
        </button>
      </div>

      {/* 3. Navigation Links */}
      <div className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-600 tracking-wider uppercase">
            Navigation
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 relative">
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-700'}`}
                />
                {!isCollapsed && <span>{item.label}</span>}
                {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 rounded-full text-[9px] font-bold bg-[#c1121f] text-white">
                    {item.badge}
                  </span>
                )}
              </div>

              {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#c1121f] text-white' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Sheets & Export Section */}
        {!isCollapsed && (
          <div className="pt-4 px-3 pb-1.5 text-[10px] font-bold text-slate-600 tracking-wider uppercase">
            Sheets & Exports
          </div>
        )}

        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-slate-800 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3.5 py-2'
            }`}
            title="Download Excel (.xlsx)"
          >
            <Sheet className="w-4 h-4 text-emerald-700 shrink-0" />
            {!isCollapsed && <span>Download Excel (.xlsx)</span>}
          </button>
        )}

        <button
          onClick={onExportCsv}
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-slate-800 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3.5 py-2'
          }`}
          title="Export CSV Database"
        >
          <Download className="w-4 h-4 text-slate-800 shrink-0" />
          {!isCollapsed && <span>Export CSV Database</span>}
        </button>

        <button
          onClick={onSyncToSheets}
          disabled={isSyncing}
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-slate-800 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 ${
            isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2'
          }`}
          title="Sync to Google Drive"
        >
          <div className="flex items-center gap-2.5">
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 text-sky-700 animate-spin shrink-0" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-sky-700 shrink-0" />
            )}
            {!isCollapsed && <span>{isSyncing ? 'Syncing...' : 'Sync to Google Drive'}</span>}
          </div>
        </button>

        {googleSheetUrl && (
          <a
            href={googleSheetUrl}
            target="_blank"
            rel="noreferrer"
            className={`w-full flex items-center rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2'
            }`}
            title="Open Live Google Sheet"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
              {!isCollapsed && <span>Live Google Sheet</span>}
            </div>
            {!isCollapsed && <ExternalLink className="w-3 h-3 text-emerald-700" />}
          </a>
        )}

        {/* Color Legend */}
        <button
          onClick={() => setShowLegendModal(true)}
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-slate-800 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3.5 py-2'
          }`}
          title="Status Color Legend"
        >
          <Palette className="w-4 h-4 text-[#780000] shrink-0" />
          {!isCollapsed && <span>Status Color Legend</span>}
        </button>
      </div>

      {/* 4. Bottom User Account Profile & Auth */}
      <div className="p-3 border-t border-slate-200">
        {user ? (
          <div className={`rounded-2xl bg-slate-50 border border-slate-200 flex items-center ${isCollapsed ? 'p-2 justify-center' : 'p-2.5 justify-between'}`}>
            <div className="flex items-center gap-2.5 min-w-0" title={`${user.displayName || user.email}`}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full border border-slate-300 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 truncate">
                    {user.displayName || 'Authenticated User'}
                  </p>
                  <p className="text-[10px] text-slate-600 font-medium truncate">
                    {user.email || 'Private Account'}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          onSignIn && (
            <button
              onClick={onSignIn}
              className={`flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-900 transition-all shadow-2xs cursor-pointer ${
                isCollapsed ? 'w-10 h-10 p-0 mx-auto' : 'w-full py-2.5 px-3 gap-2'
              }`}
              title="Sign In with Google"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-4 h-4 shrink-0"
              />
              {!isCollapsed && <span>Sign In</span>}
            </button>
          )
        )}
      </div>

      {/* Color Legend Modal */}
      {showLegendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#780000]" />
                <h3 className="font-bold text-base text-slate-900">
                  Application Status & Formatting
                </h3>
              </div>
              <button
                onClick={() => setShowLegendModal(false)}
                className="text-slate-500 hover:text-slate-900"
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
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <span className="text-xs text-slate-900 font-semibold">{st}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
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
    </div>
  );

  return (
    <>
      {/* Desktop Toggleable Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-white shrink-0 z-30 transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-full bg-white h-full shadow-2xl flex flex-col z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
