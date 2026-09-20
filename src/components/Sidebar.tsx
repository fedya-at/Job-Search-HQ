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
  LogIn,
  Sheet,
  RefreshCw,
  X,
  Lock,
  Sparkles,
  ExternalLink,
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
    <div className="flex flex-col h-full bg-white text-[#003049] select-none">
      {/* 1. Header & Brand Logo */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={() => {
            onSelectTab('dashboard');
            if (onCloseMobile) onCloseMobile();
          }}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <h1 className="text-2xl font-serif text-[#003049] tracking-tight font-bold group-hover:text-[#780000] transition-colors flex items-center gap-1.5">
            <span>Job Search HQ</span>
            <span className="text-sm font-sans text-[#780000]">♡</span>
          </h1>
          <p className="text-[11px] text-gray-400 tracking-wider mt-0.5">
            Career Command Center
          </p>
        </button>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Primary Action Button (+ Add Role) */}
      <div className="p-4">
        <button
          id="sidebar-add-role-btn"
          onClick={() => {
            onOpenAddModal();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#780000] hover:bg-[#c1121f] active:bg-[#600000] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Application</span>
        </button>
      </div>

      {/* 3. Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">
          Navigation
        </div>
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#003049] text-white shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-[#003049] hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#669bbc]'}`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-[#c1121f] text-white'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Exports & Spreadsheets Tools */}
        <div className="pt-5 px-3 pb-1.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">
          Sheets & Exports
        </div>

        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-[#003049] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Sheet className="w-4 h-4 text-emerald-600" />
            <span>Download Excel (.xlsx)</span>
          </button>
        )}

        <button
          onClick={onExportCsv}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-[#003049] hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#003049]" />
          <span>Export CSV Database</span>
        </button>

        <button
          onClick={onSyncToSheets}
          disabled={isSyncing}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-[#003049] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center gap-2.5">
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 text-[#669bbc] animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-[#669bbc]" />
            )}
            <span>{isSyncing ? 'Syncing...' : 'Sync to Google Drive'}</span>
          </div>
        </button>

        {googleSheetUrl && (
          <a
            href={googleSheetUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Live Google Sheet</span>
            </div>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>
        )}

        {/* Color Legend Trigger */}
        <button
          onClick={() => setShowLegendModal(true)}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-[#003049] hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Palette className="w-4 h-4 text-[#780000]" />
          <span>Status Color Legend</span>
        </button>
      </div>

      {/* 4. Bottom User Account Profile & Auth */}
      <div className="p-3 border-t border-gray-100">
        {user ? (
          <div className="p-2.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full border border-gray-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#003049] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-xs text-[#003049] truncate">
                  {user.displayName || 'Authenticated User'}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {user.email || 'Private Account'}
                </p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          onSignIn && (
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-[#003049] transition-all shadow-2xs cursor-pointer"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-4 h-4"
              />
              <span>Sign In with Google</span>
            </button>
          )
        )}
      </div>

      {/* Color Legend Modal */}
      {showLegendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
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

            <div className="pt-2 border-t border-gray-100 text-right">
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
      {/* Desktop Sidebar (Persistent Left Column) */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-gray-200 bg-white shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
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
