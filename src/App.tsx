import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Download,
  Sparkles,
  Info,
  Search,
} from 'lucide-react';
import {
  Application,
  ContactItem,
  DataLists,
  ResumeItem,
  SheetTab,
  ApplicationStatus,
} from './types';
import {
  INITIAL_APPLICATIONS,
  INITIAL_CONTACTS,
  INITIAL_LISTS,
  INITIAL_RESUMES,
} from './data/initialData';
import { Header } from './components/Header';
import { MainDashboard } from './components/MainDashboard';
import { ApplicationTracker } from './components/ApplicationTracker';
import { FollowUpCenter } from './components/FollowUpCenter';
import { ResumeLibrary } from './components/ResumeLibrary';
import { ContactsView } from './components/ContactsView';
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

const STORAGE_KEYS = {
  APPS: 'jshq_applications_v1',
  RESUMES: 'jshq_resumes_v1',
  CONTACTS: 'jshq_contacts_v1',
  LISTS: 'jshq_lists_v1',
};

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<SheetTab>('dashboard');

  // Core Data States
  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved applications', e);
      }
    }
    return INITIAL_APPLICATIONS;
  });

  const [resumes, setResumes] = useState<ResumeItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESUMES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved resumes', e);
      }
    }
    return INITIAL_RESUMES;
  });

  const [contacts, setContacts] = useState<ContactItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved contacts', e);
      }
    }
    return INITIAL_CONTACTS;
  });

  const [lists, setLists] = useState<DataLists>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LISTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved lists', e);
      }
    }
    return INITIAL_LISTS;
  });

  // Auth & Sync State
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    actionUrl?: string;
    actionLabel?: string;
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showPopupBlockedModal, setShowPopupBlockedModal] = useState(false);

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Real-time filtered applications by company, job title, or recruiter contact
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

  // Persist data on updates
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(resumes));
  }, [resumes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
  }, [lists]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser: any) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

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
          text: `Signed in as ${result.user.displayName || result.user.email}. Ready to sync with Google Sheets!`,
        });
      }
    } catch (err: any) {
      if (isPopupBlockedError(err)) {
        console.warn('Google Sign-in popup was blocked or app is running in preview iframe');
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
      text: 'Signed out of Google Workspace.',
    });
  };

  // Google Sheets Export & Sync
  const handleSyncToSheets = async () => {
    // Check token synchronously to keep direct user gesture context for the browser
    let token = getAccessToken();
    if (!token) {
      // Must prompt sign in directly without intermediate async microtask
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
          console.warn('Google Sheets sync requires authorization outside preview iframe');
          setShowPopupBlockedModal(true);
          return;
        }
        console.error('Sign in error before sync:', e);
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
      text: 'Generating formatted "Job Search HQ" workbook in your Google Drive...',
    });

    try {
      const result = await createGoogleSheet(
        token,
        'JOB SEARCH HQ — Career Command Center',
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
        text: '🎉 Spreadsheet successfully created in your Google Drive with all 6 Pinterest-styled tabs and live formulas!',
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
      'Job-Search-HQ-Career-Dashboard.xlsx'
    );
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#780000', '#c1121f', '#fdf0d5', '#003049', '#669bbc'],
    });
    setToastMessage({
      type: 'success',
      text: 'Downloaded Job-Search-HQ-Career-Dashboard.xlsx with all 6 Pinterest-styled worksheets & KPI calculations.',
    });
  };

  const handleExportCSV = () => {
    const csvContent = exportApplicationsToCSV(applications);
    downloadCSV(csvContent, 'Job_Applications_Database.csv');
    setToastMessage({
      type: 'success',
      text: 'Downloaded Job_Applications_Database.csv with complete tracking fields.',
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

    // Trigger celebration if Offer or Accepted
    if (app.status === 'Offer' || app.status === 'Accepted') {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#388E3C', '#81C784', '#A36B58', '#FFD54F'],
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
        colors: ['#4E8B5C', '#A36B58', '#F5EFE9'],
      });
    }

    setApplications(updated);
  };

  const handleDeleteApplication = (id: string) => {
    setApplications(applications.filter((a) => a.id !== id));
  };

  // Filter application table by resume
  const handleFilterByResume = (_resumeName: string) => {
    setCurrentTab('applications');
  };

  return (
    <div className="min-h-screen bg-white text-[#003049] flex flex-col font-sans selection:bg-[#FDF0D5] selection:text-[#780000]">
      {/* 1. Universal Top Header & Navigation */}
      <Header
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
        searchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
        applications={applications}
        onSelectApplication={handleSelectApplication}
      />

      {/* 2. Global Filter Notice Banner */}
      {globalSearchQuery.trim() && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-3">
          <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-[#FDF0D5] border border-[#F2D7A5] text-xs text-[#003049] shadow-2xs">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#780000] shrink-0" />
              <span>
                Filtered by <strong className="text-[#780000]">"{globalSearchQuery}"</strong> (company, job title, or recruiter) — showing{' '}
                <strong className="text-[#003049]">{filteredApplications.length}</strong> of{' '}
                {applications.length} applications
              </span>
            </div>
            <button
              id="clear-global-search-banner-btn"
              onClick={() => setGlobalSearchQuery('')}
              className="inline-flex items-center gap-1 font-semibold text-[11px] text-[#780000] hover:text-[#c1121f] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Notification / Toast Banner */}
      {toastMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4">
          <div
            className={`rounded-2xl p-4 border flex items-center justify-between gap-4 shadow-xs transition-all ${
              toastMessage.type === 'success'
                ? 'bg-[#EBF7EE] border-[#BBE5C7] text-[#1E5C2D]'
                : toastMessage.type === 'error'
                ? 'bg-[#FEECEC] border-[#F8B8B8] text-[#8C2020]'
                : 'bg-[#F0F6FC] border-[#C8E1F8] text-[#1C4E7C]'
            }`}
          >
            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-[#2E8B45] shrink-0" />
              ) : toastMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-[#C13626] shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-[#2B6CB0] shrink-0" />
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
              className="text-xs p-1 hover:opacity-70 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Sheet Content Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6">
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

        {currentTab === 'contacts' && (
          <ContactsView
            contacts={contacts}
            applications={applications}
            onAddContact={(c) => setContacts([...contacts, c])}
            onUpdateContact={(c) =>
              setContacts(contacts.map((item) => (item.id === c.id ? c : item)))
            }
            onDeleteContact={(id) =>
              setContacts(contacts.filter((c) => c.id !== id))
            }
            onSelectApplication={handleSelectApplication}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView applications={filteredApplications} />
        )}

        {currentTab === 'lists' && (
          <ListsSettingsView lists={lists} onUpdateLists={setLists} />
        )}
      </main>

      {/* 4. Application Add / Edit Dossier Modal */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        application={selectedApplication}
        lists={lists}
        onSave={handleSaveApplication}
        onDelete={handleDeleteApplication}
      />

      {/* 5. Pop-up Blocked Guidance Modal */}
      <PopupBlockedModal
        isOpen={showPopupBlockedModal}
        onClose={() => setShowPopupBlockedModal(false)}
        onRetry={() => handleGoogleSignIn(true)}
        onExportCsv={handleExportCSV}
      />

      {/* 5. Minimalist Elegant Footer */}
      <footer className="bg-white border-t border-[#ECE5DD] py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8C8074]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#A36B58]">JOB SEARCH HQ</span>
            <span>•</span>
            <span>Modern Professional Career Command Center</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentTab('lists')}
              className="hover:text-[#2C2723] transition-colors"
            >
              Validation Rules
            </button>
            <button
              onClick={handleExportCSV}
              className="hover:text-[#2C2723] transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5 text-[#A36B58]" />
              Export CSV
            </button>
            {createdSheetUrl && (
              <a
                href={createdSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#2E8B45] hover:underline flex items-center gap-1 font-semibold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Live Google Sheet ↗
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
