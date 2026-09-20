import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Download,
  Info,
  Search,
  Lock,
  LogIn,
} from 'lucide-react';
import {
  Application,
  ContactItem,
  DataLists,
  ResumeItem,
  SheetTab,
  ApplicationStatus,
} from './types';
import { INITIAL_LISTS } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MainDashboard } from './components/MainDashboard';
import { ApplicationTracker } from './components/ApplicationTracker';
import { FollowUpCenter } from './components/FollowUpCenter';
import { ResumeLibrary } from './components/ResumeLibrary';
import { AnalyticsView } from './components/AnalyticsView';
import { ListsSettingsView } from './components/ListsSettingsView';
import { ApplicationModal } from './components/ApplicationModal';
import { PopupBlockedModal } from './components/PopupBlockedModal';
import {
  googleSignIn,
  logout,
  getAccessToken,
  initAuth,
  isPopupBlockedError,
} from './services/firebaseAuth';
import {
  createGoogleSheet,
  exportApplicationsToCSV,
  downloadCSV,
  downloadExcelWorkbook,
} from './services/googleSheetsService';
import { isDateOverdue, isDateToday } from './utils/calculations';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<SheetTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    actionUrl?: string;
    actionLabel?: string;
  } | null>(null);

  // Core Data States — Empty by default unless loaded for authenticated account
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [lists, setLists] = useState<DataLists>(INITIAL_LISTS);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showPopupBlockedModal, setShowPopupBlockedModal] = useState(false);

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // 1. Persistent Auth Observer
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser: any) => {
        setUser(currentUser);
        setIsAuthLoaded(true);
      },
      () => {
        setUser(null);
        setIsAuthLoaded(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Load User-Scoped Private Data when user logs in
  useEffect(() => {
    if (user?.uid) {
      const userAppsKey = `jshq_user_${user.uid}_apps`;
      const userResumesKey = `jshq_user_${user.uid}_resumes`;
      const userContactsKey = `jshq_user_${user.uid}_contacts`;
      const userListsKey = `jshq_user_${user.uid}_lists`;

      const savedApps = localStorage.getItem(userAppsKey);
      const savedResumes = localStorage.getItem(userResumesKey);
      const savedContacts = localStorage.getItem(userContactsKey);
      const savedLists = localStorage.getItem(userListsKey);

      setApplications(savedApps ? JSON.parse(savedApps) : []);
      setResumes(savedResumes ? JSON.parse(savedResumes) : []);
      setContacts(savedContacts ? JSON.parse(savedContacts) : []);
      if (savedLists) setLists(JSON.parse(savedLists));
    } else if (isAuthLoaded) {
      // Empty when logged out
      setApplications([]);
      setResumes([]);
      setContacts([]);
    }
  }, [user?.uid, isAuthLoaded]);

  // 3. Save User-Scoped Data on Updates (Private to authenticated account)
  useEffect(() => {
    if (user?.uid && isAuthLoaded) {
      localStorage.setItem(`jshq_user_${user.uid}_apps`, JSON.stringify(applications));
    }
  }, [applications, user?.uid, isAuthLoaded]);

  useEffect(() => {
    if (user?.uid && isAuthLoaded) {
      localStorage.setItem(`jshq_user_${user.uid}_resumes`, JSON.stringify(resumes));
    }
  }, [resumes, user?.uid, isAuthLoaded]);

  useEffect(() => {
    if (user?.uid && isAuthLoaded) {
      localStorage.setItem(`jshq_user_${user.uid}_contacts`, JSON.stringify(contacts));
    }
  }, [contacts, user?.uid, isAuthLoaded]);

  useEffect(() => {
    if (user?.uid && isAuthLoaded) {
      localStorage.setItem(`jshq_user_${user.uid}_lists`, JSON.stringify(lists));
    }
  }, [lists, user?.uid, isAuthLoaded]);

  // Real-time filtered applications
  const filteredApplications = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return applications;

    return applications.filter((app) => {
      const matchCompany = app.company?.toLowerCase().includes(q);
      const matchJobTitle = app.jobTitle?.toLowerCase().includes(q);
      const matchRecruiter =
        (app.contactName && app.contactName.toLowerCase().includes(q)) ||
        (app.contactInfo && app.contactInfo.toLowerCase().includes(q)) ||
        (app.contactRole && app.contactRole.toLowerCase().includes(q));

      return matchCompany || matchJobTitle || matchRecruiter;
    });
  }, [applications, globalSearchQuery]);

  // Calculate follow-up counts
  const overdueCount = applications.filter(
    (a) =>
      a.nextFollowUp &&
      isDateOverdue(a.nextFollowUp) &&
      !['Rejected', 'Withdrawn', 'Ghosted', 'Accepted'].includes(a.status)
  ).length;

  const todayCount = applications.filter(
    (a) =>
      a.nextFollowUp &&
      isDateToday(a.nextFollowUp) &&
      !['Rejected', 'Withdrawn', 'Ghosted', 'Accepted'].includes(a.status)
  ).length;

  // Handle Google Auth
  const handleGoogleSignIn = async (forceAttempt = false) => {
    try {
      const result = await googleSignIn(forceAttempt);
      if (result) {
        setUser(result.user);
        setShowPopupBlockedModal(false);
        setToastMessage({
          type: 'success',
          text: `Signed in as ${result.user.displayName || result.user.email}. Your personal applications are loaded.`,
        });
      }
    } catch (err: any) {
      if (isPopupBlockedError(err)) {
        setShowPopupBlockedModal(true);
      } else {
        console.error('Sign in error:', err);
        setToastMessage({
          type: 'error',
          text: err?.message || 'Google Sign-In failed. Please try again.',
        });
      }
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToastMessage({
      type: 'info',
      text: 'Signed out. Your private session has ended.',
    });
  };

  // Google Sheets Export & Sync
  const handleSyncToSheets = async () => {
    let token = getAccessToken();
    if (!token) {
      try {
        const result = await googleSignIn();
        if (result) {
          token = result.accessToken;
          setUser(result.user);
        } else {
          return;
        }
      } catch (e: any) {
        if (isPopupBlockedError(e)) {
          setShowPopupBlockedModal(true);
          return;
        }
        setToastMessage({
          type: 'error',
          text: 'Google Sign-In is required to generate a Google Sheet in your Google Drive.',
        });
        return;
      }
    }

    if (!token) {
      setToastMessage({
        type: 'error',
        text: 'Missing authorization token. Please sign in again.',
      });
      return;
    }

    setIsSyncing(true);
    setToastMessage({
      type: 'info',
      text: 'Generating formatted "Job Application Tracker" in your Google Drive...',
    });

    try {
      const result = await createGoogleSheet(
        token,
        'Job Application Tracker — Career Dashboard',
        applications,
        resumes,
        contacts,
        lists
      );
      setCreatedSheetUrl(result.spreadsheetUrl);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#780000', '#c1121f', '#fdf0d5', '#003049', '#669bbc'],
      });
      setToastMessage({
        type: 'success',
        text: '🎉 Spreadsheet successfully created in your Google Drive with Sage Green & Blush design and live formulas!',
        actionUrl: result.spreadsheetUrl,
        actionLabel: 'Open Google Sheet ↗',
      });
    } catch (error: any) {
      console.error('Sync failed:', error);
      setToastMessage({
        type: 'error',
        text: `Google Sheets creation error: ${error.message || 'Please check permissions'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportExcel = () => {
    downloadExcelWorkbook(
      applications,
      resumes,
      contacts,
      lists,
      'Job-Application-Tracker.xlsx'
    );
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#780000', '#c1121f', '#fdf0d5', '#003049', '#669bbc'],
    });
    setToastMessage({
      type: 'success',
      text: 'Downloaded Job-Application-Tracker.xlsx formatted with Sage Green & Blush layout.',
    });
  };

  const handleExportCSV = () => {
    const csvContent = exportApplicationsToCSV(applications);
    downloadCSV(csvContent, 'Job_Applications.csv');
    setToastMessage({
      type: 'success',
      text: 'Downloaded Job_Applications.csv with all application records.',
    });
  };

  // CRUD Operations on Applications
  const handleOpenAddModal = () => {
    setSelectedApplication(null);
    setIsModalOpen(true);
  };

  const handleSelectApplication = (app: Application) => {
    setSelectedApplication(app);
    setIsModalOpen(true);
  };

  const handleSaveApplication = (app: Application) => {
    const exists = applications.some((a) => a.id === app.id);
    let updatedList: Application[];

    if (exists) {
      updatedList = applications.map((a) => (a.id === app.id ? app : a));
    } else {
      updatedList = [app, ...applications];
    }

    if (app.status === 'Offer' || app.status === 'Accepted') {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#388E3C', '#81C784', '#780000', '#FFD54F'],
      });
    }

    setApplications(updatedList);
  };

  const handleUpdateStatus = (id: string, newStatus: ApplicationStatus) => {
    const updated = applications.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: newStatus,
          lastContact:
            newStatus.includes('Interview') || newStatus === 'Offer'
              ? new Date().toISOString().split('T')[0]
              : a.lastContact,
        };
      }
      return a;
    });

    if (newStatus === 'Offer' || newStatus === 'Accepted') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#780000', '#c1121f', '#fdf0d5'],
      });
    }

    setApplications(updated);
  };

  const handleDeleteApplication = (id: string) => {
    setApplications(applications.filter((a) => a.id !== id));
  };

  const handleFilterByResume = (_resumeName: string) => {
    setCurrentTab('applications');
  };

  return (
    <div className="min-h-screen bg-white text-[#003049] flex font-sans selection:bg-[#FDF0D5] selection:text-[#780000]">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={handleOpenAddModal}
        onSyncToSheets={handleSyncToSheets}
        onExportCsv={handleExportCSV}
        onExportExcel={handleExportExcel}
        isSyncing={isSyncing}
        overdueCount={overdueCount}
        todayCount={todayCount}
        googleSheetUrl={createdSheetUrl}
        user={user}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sleek Top Bar */}
        <TopBar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAddModal={handleOpenAddModal}
          searchQuery={globalSearchQuery}
          onSearchChange={setGlobalSearchQuery}
          applications={applications}
          onSelectApplication={handleSelectApplication}
          onSelectTab={setCurrentTab}
        />

        {/* Login Prompt Banner for unauthenticated users */}
        {!user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-[#003049] shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-gray-200 shrink-0 text-[#780000]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#003049]">Private & Secure Career Tracker</p>
                  <p className="text-gray-500">
                    Sign in with Google to save your personal job applications, attached CV files, and cover letters securely to your account.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleGoogleSignIn()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003049] hover:bg-[#002035] text-white font-semibold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Search Filter Banner */}
        {globalSearchQuery.trim() && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-3">
            <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-[#003049] shadow-2xs">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#780000]" />
                <span>
                  Filtered by <strong className="text-[#780000]">"{globalSearchQuery}"</strong> — showing{' '}
                  <strong className="text-[#003049]">{filteredApplications.length}</strong> of{' '}
                  {applications.length} applications
                </span>
              </div>
              <button
                onClick={() => setGlobalSearchQuery('')}
                className="inline-flex items-center gap-1 font-semibold text-[11px] text-[#780000] hover:text-[#c1121f] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filter</span>
              </button>
            </div>
          </div>
        )}

        {/* Notification / Toast Banner */}
        {toastMessage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4">
            <div
              className={`rounded-2xl p-4 border flex items-center justify-between gap-4 shadow-xs transition-all ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : toastMessage.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
                {toastMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : toastMessage.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600 shrink-0" />
                )}
                <span>{toastMessage.text}</span>
                {toastMessage.actionUrl && (
                  <a
                    href={toastMessage.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline ml-2 inline-flex items-center gap-1 hover:opacity-80"
                  >
                    {toastMessage.actionLabel || 'View Document'}
                  </a>
                )}
              </div>

              <button
                onClick={() => setToastMessage(null)}
                className="text-xs p-1 hover:opacity-70 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Active Tab Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
          {currentTab === 'dashboard' && (
            <MainDashboard
              applications={filteredApplications}
              onSelectTab={setCurrentTab}
              onSelectApplication={handleSelectApplication}
              onQuickStatusChange={handleUpdateStatus}
              onDeleteApplication={handleDeleteApplication}
            />
          )}

          {currentTab === 'applications' && (
            <ApplicationTracker
              applications={applications}
              lists={lists}
              onSelectApplication={handleSelectApplication}
              onOpenAddModal={handleOpenAddModal}
              onUpdateApplicationStatus={handleUpdateStatus}
              onDeleteApplication={handleDeleteApplication}
              searchTerm={globalSearchQuery}
              onSearchChange={setGlobalSearchQuery}
            />
          )}

          {currentTab === 'followup' && (
            <FollowUpCenter
              applications={filteredApplications}
              onSelectApplication={handleSelectApplication}
              onUpdateApplication={handleSaveApplication}
            />
          )}

          {currentTab === 'resumes' && (
            <ResumeLibrary
              resumes={resumes}
              applications={applications}
              onAddResume={(res) => setResumes([...resumes, res])}
              onUpdateResume={(res) =>
                setResumes(resumes.map((r) => (r.id === res.id ? res : r)))
              }
              onDeleteResume={(id) =>
                setResumes(resumes.filter((r) => r.id !== id))
              }
              onFilterByResume={handleFilterByResume}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView applications={filteredApplications} />
          )}

          {currentTab === 'lists' && (
            <ListsSettingsView lists={lists} onUpdateLists={setLists} />
          )}
        </main>
      </div>

      {/* Application Add / Edit Dossier Modal */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        application={selectedApplication}
        lists={lists}
        onSave={handleSaveApplication}
        onDelete={handleDeleteApplication}
      />

      {/* Pop-up Blocked Guidance Modal */}
      <PopupBlockedModal
        isOpen={showPopupBlockedModal}
        onClose={() => setShowPopupBlockedModal(false)}
        onRetry={() => handleGoogleSignIn(true)}
        onExportCsv={handleExportCSV}
      />
    </div>
  );
}
