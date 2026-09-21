import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  ExternalLink,
  FileText,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  Trash2,
  Upload,
  Download,
  Clipboard,
  FileCheck,
  Wand2,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Application, ApplicationStatus, ApplicationOrigin, DataLists } from '../types';
import { parseJobOfferText } from '../utils/jobOfferParser';
import {
  daysBetween,
  daysUntil,
  formatDateDisplay,
  getTodayDateString,
  isDateOverdue,
  isDateToday,
} from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  lists: DataLists;
  onSave: (app: Application) => void;
  onDelete?: (id: string) => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  application,
  lists,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(application);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [dateAdded, setDateAdded] = useState(getTodayDateString());
  const [dateApplied, setDateApplied] = useState(getTodayDateString());
  const [jobUrl, setJobUrl] = useState('');
  const [location, setLocation] = useState('Remote');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [salary, setSalary] = useState('');

  // Application Info & Attachments
  const [resumeUsed, setResumeUsed] = useState(lists.resumes[0] || '📄 General CV');
  const [cvFileName, setCvFileName] = useState('');
  const [cvFileData, setCvFileData] = useState('');
  const [coverLetter, setCoverLetter] = useState<'Yes' | 'No' | 'Customized' | 'Template'>('Customized');
  const [coverLetterText, setCoverLetterText] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [origin, setOrigin] = useState<ApplicationOrigin>('LinkedIn');
  const [roleCategory, setRoleCategory] = useState(lists.roleCategories[0] || 'Software Engineering');

  // People & Follow-up
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactMethod, setContactMethod] = useState('LinkedIn');
  const [contactInfo, setContactInfo] = useState('');
  const [lastContact, setLastContact] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<Application['followUpStatus']>('Waiting');

  // Notes & Preparation
  const [jobRequirements, setJobRequirements] = useState('');
  const [whyIApplied, setWhyIApplied] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [nextAction, setNextAction] = useState('Wait for response');
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Smart Job Offer & Description Paste Parser State
  const [showPasteBox, setShowPasteBox] = useState(!application);
  const [pastedOfferText, setPastedOfferText] = useState('');
  const [extractSuccessInfo, setExtractSuccessInfo] = useState<{
    count: number;
    fields: string[];
    company?: string;
    jobTitle?: string;
  } | null>(null);

  const handleExtractJobOffer = (textToParse?: string) => {
    const text = (textToParse !== undefined ? textToParse : pastedOfferText).trim();
    if (!text) return;

    const extracted = parseJobOfferText(text);
    const populatedFields: string[] = [];

    if (extracted.company && extracted.company !== 'Company Name') {
      setCompany(extracted.company);
      populatedFields.push('Company');
    }
    if (extracted.jobTitle && extracted.jobTitle !== 'Job Title / Position') {
      setJobTitle(extracted.jobTitle);
      populatedFields.push('Job Title');
    }
    if (extracted.location) {
      setLocation(extracted.location);
      populatedFields.push('Location');
    }
    if (extracted.employmentType) {
      setEmploymentType(extracted.employmentType);
      populatedFields.push('Type');
    }
    if (extracted.salary) {
      setSalary(extracted.salary);
      populatedFields.push('Salary');
    }
    if (extracted.jobUrl) {
      setJobUrl(extracted.jobUrl);
      populatedFields.push('Job Link');
    }
    if (extracted.origin) {
      setOrigin(extracted.origin);
      populatedFields.push('Source');
    }
    if (extracted.roleCategory) {
      setRoleCategory(extracted.roleCategory);
      populatedFields.push('Role Category');
    }
    if (extracted.contactName) {
      setContactName(extracted.contactName);
      populatedFields.push('Contact Name');
    }
    if (extracted.contactInfo) {
      setContactInfo(extracted.contactInfo);
      populatedFields.push('Contact Email');
    }
    if (extracted.jobRequirements) {
      setJobRequirements(extracted.jobRequirements);
      populatedFields.push('Requirements');
    }
    if (extracted.notes) {
      setNotes((prev) =>
        prev
          ? `${prev}\n\n--- Extracted Job Description ---\n${extracted.notes}`
          : extracted.notes || ''
      );
      populatedFields.push('Full Description');
    }

    setExtractSuccessInfo({
      count: populatedFields.length,
      fields: populatedFields,
      company: extracted.company !== 'Company Name' ? extracted.company : undefined,
      jobTitle: extracted.jobTitle !== 'Job Title / Position' ? extracted.jobTitle : undefined,
    });
  };

  const handleClipboardPasteAndExtract = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setPastedOfferText(text);
        handleExtractJobOffer(text);
      }
    } catch (e) {
      console.warn('Could not read from clipboard:', e);
    }
  };

  useEffect(() => {
    if (application) {
      setCompany(application.company || '');
      setJobTitle(application.jobTitle || '');
      setDateAdded(application.dateAdded || getTodayDateString());
      setDateApplied(application.dateApplied || getTodayDateString());
      setJobUrl(application.jobUrl || '');
      setLocation(application.location || '');
      setEmploymentType(application.employmentType || 'Full-time');
      setSalary(application.salary || '');
      setResumeUsed(application.resumeUsed || lists.resumes[0] || '');
      setCvFileName(application.cvFileName || '');
      setCvFileData(application.cvFileData || '');
      setCoverLetter(application.coverLetter || 'Customized');
      setCoverLetterText(application.coverLetterText || '');
      setStatus(application.status || 'Applied');
      setOrigin(application.origin || 'LinkedIn');
      setRoleCategory(application.roleCategory || lists.roleCategories[0] || '');
      setContactName(application.contactName || '');
      setContactRole(application.contactRole || '');
      setContactMethod(application.contactMethod || 'LinkedIn');
      setContactInfo(application.contactInfo || '');
      setLastContact(application.lastContact || '');
      setNextFollowUp(application.nextFollowUp || '');
      setFollowUpStatus(application.followUpStatus || 'Waiting');
      setJobRequirements(application.jobRequirements || '');
      setWhyIApplied(application.whyIApplied || '');
      setInterviewNotes(application.interviewNotes || '');
      setNextAction(application.nextAction || '');
      setNotes(application.notes || '');
    } else {
      setCompany('');
      setJobTitle('');
      setDateAdded(getTodayDateString());
      setDateApplied(getTodayDateString());
      setJobUrl('');
      setLocation('Remote');
      setEmploymentType('Full-time');
      setSalary('');
      setResumeUsed(lists.resumes[0] || '');
      setCvFileName('');
      setCvFileData('');
      setCoverLetter('Customized');
      setCoverLetterText('');
      setStatus('Applied');
      setOrigin('LinkedIn');
      setRoleCategory(lists.roleCategories[0] || '');
      setContactName('');
      setContactRole('');
      setContactMethod('LinkedIn');
      setContactInfo('');
      setLastContact(getTodayDateString());
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7);
      setNextFollowUp(nextDate.toISOString().split('T')[0]);
      setFollowUpStatus('Waiting');
      setJobRequirements('');
      setWhyIApplied('');
      setInterviewNotes('');
      setNextAction('Wait for response');
      setNotes('');
    }
  }, [application, lists]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller PDF or document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCvFileName(file.name);
      setCvFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCoverLetterText(text);
      }
    } catch (e) {
      console.warn('Could not read from clipboard:', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appToSave: Application = {
      id: application ? application.id : `app-${Date.now()}`,
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      dateAdded,
      dateApplied,
      jobUrl: jobUrl.trim(),
      location: location.trim(),
      employmentType: employmentType as any,
      salary: salary.trim(),
      resumeUsed,
      cvFileName: cvFileName || undefined,
      cvFileData: cvFileData || undefined,
      coverLetter,
      coverLetterText: coverLetter !== 'No' ? coverLetterText.trim() : undefined,
      status,
      origin,
      roleCategory,
      contactName: contactName.trim(),
      contactRole: contactRole.trim(),
      contactMethod: contactMethod as any,
      contactInfo: contactInfo.trim(),
      lastContact,
      nextFollowUp,
      followUpStatus,
      jobRequirements: jobRequirements.trim(),
      whyIApplied: whyIApplied.trim(),
      interviewNotes: interviewNotes.trim(),
      nextAction: nextAction.trim(),
      notes: notes.trim(),
    };
    onSave(appToSave);
    onClose();
  };

  const daysSinceApplied = dateApplied ? daysBetween(dateApplied) : null;
  const daysToFollowUp = nextFollowUp ? daysUntil(nextFollowUp) : null;
  const isOverdue = isDateOverdue(nextFollowUp);
  const isToday = isDateToday(nextFollowUp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-gray-200 shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#003049] text-white flex items-center justify-center font-serif font-bold text-lg shadow-2xs">
              {company ? company.charAt(0).toUpperCase() : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#003049]">
                {isEditing ? (
                  <span>
                    {company} <span className="text-gray-500 font-normal text-sm font-sans">— {jobTitle}</span>
                  </span>
                ) : (
                  'Add New Job Application'
                )}
              </h3>
              <p className="text-xs text-gray-500">
                Private role tracking, CV attachment, and cover letter records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && onDelete && application && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Delete Application"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-[#003049] hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smart Calculated Insights Strip */}
        {isEditing && (
          <div className="bg-gray-50 px-6 py-2.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 shrink-0">
            <div className="flex items-center gap-4">
              <span>
                Applied: <strong className="text-[#003049]">{formatDateDisplay(dateApplied)}</strong>{' '}
                {daysSinceApplied !== null && (
                  <span className="text-gray-400">({daysSinceApplied} days ago)</span>
                )}
              </span>
              <span>•</span>
              <span>
                Follow-up:{' '}
                {nextFollowUp ? (
                  <strong
                    className={
                      isOverdue
                        ? 'text-red-600'
                        : isToday
                        ? 'text-amber-600'
                        : 'text-[#003049]'
                    }
                  >
                    {formatDateDisplay(nextFollowUp)}{' '}
                    {daysToFollowUp !== null && (
                      <span className="font-normal">
                        ({daysToFollowUp < 0 ? `${Math.abs(daysToFollowUp)}d overdue` : `${daysToFollowUp}d left`})
                      </span>
                    )}
                  </strong>
                ) : (
                  'None'
                )}
              </span>
            </div>
            <span className="text-[11px] font-mono text-gray-500">
              Status: <span className="font-semibold text-[#780000]">{status}</span>
            </span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1 text-xs">
          {/* SMART JOB OFFER AUTO-FILL & EXTRACTION SECTION */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#780000] rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 font-bold shadow-xs shrink-0">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white tracking-wide">
                      Smart Auto-Fill from Job Offer / Post
                    </h4>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-amber-200 uppercase tracking-wider">
                      Auto-Extract
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Paste any job post copied from LinkedIn, Indeed, emails, or job boards to extract details instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleClipboardPasteAndExtract}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-semibold text-xs transition-colors border border-white/20 cursor-pointer shadow-2xs"
                  title="Paste directly from your system clipboard and auto-fill"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-amber-300" />
                  <span>Paste & Extract</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasteBox(!showPasteBox)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={showPasteBox ? 'Collapse Paste Box' : 'Expand Paste Box'}
                >
                  {showPasteBox ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Textarea & Action Bar */}
            {showPasteBox && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                <div className="relative">
                  <textarea
                    rows={4}
                    value={pastedOfferText}
                    onChange={(e) => {
                      setPastedOfferText(e.target.value);
                      if (extractSuccessInfo) setExtractSuccessInfo(null);
                    }}
                    placeholder="Paste your copied job offer or description here...&#10;&#10;Example:&#10;Senior Full Stack Engineer at Stripe&#10;Location: Remote / San Francisco, CA&#10;Salary: $140,000 - $180,000 / year • Full-time&#10;https://www.linkedin.com/jobs/view/12345678"
                    className="w-full p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all font-sans leading-relaxed"
                  />
                  {pastedOfferText && (
                    <button
                      type="button"
                      onClick={() => {
                        setPastedOfferText('');
                        setExtractSuccessInfo(null);
                      }}
                      className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-[10px] text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!pastedOfferText.trim()}
                      onClick={() => handleExtractJobOffer()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold text-xs shadow-md shadow-rose-900/30 active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>✨ Extract & Auto-Fill All Details</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Extracts Company, Title, Location, Salary, Link, Source, and Requirements
                  </span>
                </div>

                {/* Extraction Success Pill Banner */}
                {extractSuccessInfo && extractSuccessInfo.count > 0 && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs animate-in slide-in-from-top-1 duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>
                          🎉 Successfully extracted {extractSuccessInfo.count} fields from job post!
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {extractSuccessInfo.fields.map((field) => (
                          <span
                            key={field}
                            className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30"
                          >
                            ✓ {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 1: JOB INFORMATION */}
          <div>
            <h4 className="font-bold text-sm text-[#003049] mb-3 pb-1 border-b border-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#780000]" />
              1. Job Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Figma, Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Job Title / Position *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Date Added
                  </label>
                  <input
                    type="date"
                    value={dateAdded}
                    onChange={(e) => setDateAdded(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Date Applied
                  </label>
                  <input
                    type="date"
                    value={dateApplied}
                    onChange={(e) => setDateApplied(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Location (City / Remote / Hybrid)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote / New York / London"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                  >
                    {lists.employmentTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $130,000 - $150,000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: APPLICATION STATUS & ATTACHMENTS (CV & COVER LETTER) */}
          <div>
            <h4 className="font-bold text-sm text-[#003049] mb-3 pb-1 border-b border-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#669bbc]" />
              2. Application Information, CV & Cover Letter
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000] font-semibold"
                >
                  {lists.statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Resume / CV Preset
                </label>
                <select
                  value={resumeUsed}
                  onChange={(e) => setResumeUsed(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                >
                  {lists.resumes.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Cover Letter Option
                </label>
                <select
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                >
                  <option value="Yes">Yes (Attached / Pasted)</option>
                  <option value="Customized">Customized for this role</option>
                  <option value="Template">Template used</option>
                  <option value="No">No cover letter sent</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Origin / Source
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value as ApplicationOrigin)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                >
                  {lists.origins.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1">
                  Role Category
                </label>
                <select
                  value={roleCategory}
                  onChange={(e) => setRoleCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                >
                  {lists.roleCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload Sent CV / Resume File */}
            <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-sm text-[#003049] flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#780000]" />
                    Sent CV / Resume File
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Attach the exact resume or CV version sent for this position (PDF, DOCX)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-300 text-xs font-semibold text-[#003049] hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#780000]" />
                    <span>{cvFileName ? 'Replace CV' : 'Upload CV File'}</span>
                  </button>
                </div>
              </div>

              {cvFileName && (
                <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-[#003049] shrink-0" />
                    <span className="font-medium text-[#003049] truncate">{cvFileName}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-semibold shrink-0">
                      Saved
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {cvFileData && (
                      <a
                        href={cvFileData}
                        download={cvFileName}
                        className="text-xs font-semibold text-[#669bbc] hover:underline inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCvFileName('');
                        setCvFileData('');
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Paste Sent Cover Letter Content */}
            {coverLetter !== 'No' && (
              <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-xs text-[#003049] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#780000]" />
                    Cover Letter Text (Paste what you submitted)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-[11px] font-semibold text-[#003049] hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Clipboard className="w-3 h-3 text-[#780000]" />
                      Paste from Clipboard
                    </button>
                    {coverLetterText && (
                      <button
                        type="button"
                        onClick={() => setCoverLetterText('')}
                        className="text-[11px] text-gray-400 hover:text-red-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="Paste your submitted cover letter text here for future reference before interviews..."
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-[#003049] placeholder-gray-400 focus:outline-none focus:border-[#780000] font-sans text-xs leading-relaxed"
                />

                {coverLetterText && (
                  <div className="text-[10px] text-gray-400 text-right">
                    {coverLetterText.length} characters • {coverLetterText.trim().split(/\s+/).length} words
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: PEOPLE & FOLLOW-UP */}
          <div>
            <h4 className="font-bold text-sm text-[#003049] mb-3 pb-1 border-b border-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c1121f]" />
              3. People & Follow-up
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Contact Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Talent Partner"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Contact Method
                </label>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                >
                  {lists.contactMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-gray-700 mb-1">
                  Contact Info / Email / LinkedIn
                </label>
                <input
                  type="text"
                  placeholder="sarah.jenkins@company.com or linkedin.com/in/..."
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Last Contact Date
                </label>
                <input
                  type="date"
                  value={lastContact}
                  onChange={(e) => setLastContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Follow-up Status
                </label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                >
                  <option value="Not contacted">Not contacted</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Follow-up due">Follow-up due</option>
                  <option value="Follow-up sent">Follow-up sent</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: NOTES & PREPARATION */}
          <div>
            <h4 className="font-bold text-sm text-[#003049] mb-3 pb-1 border-b border-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#003049]" />
              4. Preparation & Notes
            </h4>
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Next Action
                </label>
                <input
                  type="text"
                  placeholder="e.g. Send follow-up email, Prepare system design demo"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Key Requirements / Tech Stack
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. React 19, TypeScript, GraphQL, 4+ yrs experience"
                    value={jobRequirements}
                    onChange={(e) => setJobRequirements(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Why I Applied / Pitch
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Love their design system, strong culture, exciting scale"
                    value={whyIApplied}
                    onChange={(e) => setWhyIApplied(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Interview Questions & Meeting Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes from initial screening, questions asked, team structure..."
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  General Private Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any other private notes or reminders..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[#003049] focus:outline-none focus:border-[#780000]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-[#003049] hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#780000] hover:bg-[#c1121f] rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {isEditing ? 'Save Changes' : '+ Save Application'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Job Application"
        message={`Are you sure you want to permanently delete your application for "${jobTitle}" at "${company}"?`}
        confirmLabel="Delete Application"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (application && onDelete) {
            onDelete(application.id);
          }
          setShowDeleteConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
