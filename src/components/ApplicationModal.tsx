import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Application, ApplicationStatus, ApplicationOrigin, DataLists } from '../types';
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

  // Form states
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [dateAdded, setDateAdded] = useState(getTodayDateString());
  const [dateApplied, setDateApplied] = useState(getTodayDateString());
  const [jobUrl, setJobUrl] = useState('');
  const [location, setLocation] = useState('Remote');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [salary, setSalary] = useState('');

  // Application Info
  const [resumeUsed, setResumeUsed] = useState(lists.resumes[0] || '📄 General CV');
  const [coverLetter, setCoverLetter] = useState<'Yes' | 'No' | 'Customized' | 'Template'>('Customized');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [origin, setOrigin] = useState<ApplicationOrigin>('LinkedIn');
  const [roleCategory, setRoleCategory] = useState(lists.roleCategories[0] || 'Full-Stack Engineering');

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
      setCoverLetter(application.coverLetter || 'Customized');
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
      setCoverLetter('Customized');
      setStatus('Applied');
      setOrigin('LinkedIn');
      setRoleCategory(lists.roleCategories[0] || '');
      setContactName('');
      setContactRole('');
      setContactMethod('LinkedIn');
      setContactInfo('');
      setLastContact(getTodayDateString());
      // Default next follow-up 7 days from today
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7);
      setNextFollowUp(nextDate.toISOString().split('T')[0]);
      setFollowUpStatus('Waiting');
      setJobRequirements('');
      setWhyIApplied('');
      setInterviewNotes('');
      setNextAction('Research company and wait for response');
      setNotes('');
    }
  }, [application, lists]);

  if (!isOpen) return null;

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
      coverLetter,
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
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-[#ECE5DD] shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-[#ECE5DD] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F2EDE7] text-[#A36B58] flex items-center justify-center font-serif font-bold text-lg border border-[#E8DFD5]">
              {company ? company.charAt(0) : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2C2723]">
                {isEditing ? (
                  <span>
                    {company} <span className="text-[#8C8074] font-normal text-sm font-sans">— {jobTitle}</span>
                  </span>
                ) : (
                  'Add New Job Application'
                )}
              </h3>
              <p className="text-xs text-[#7D736A]">
                Structured career entry with smart automated tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && onDelete && application && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-[#A89E93] hover:text-[#C13626] hover:bg-[#FEEAEA] rounded-xl transition-colors cursor-pointer"
                title="Delete Application"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#8C8074] hover:text-[#2C2723] hover:bg-[#EAE2D8] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smart Calculated Insights Strip */}
        {isEditing && (
          <div className="bg-[#FAF4ED] px-6 py-2.5 border-b border-[#EFE8DF] flex flex-wrap items-center justify-between gap-3 text-xs text-[#63594F] shrink-0">
            <div className="flex items-center gap-4">
              <span>
                Applied: <strong className="text-[#2C2723]">{formatDateDisplay(dateApplied)}</strong>{' '}
                {daysSinceApplied !== null && <span className="text-[#8C8074]">({daysSinceApplied}d ago)</span>}
              </span>
              <span>•</span>
              <span>
                Follow-up:{' '}
                {nextFollowUp ? (
                  <strong
                    className={
                      isOverdue
                        ? 'text-[#C13626]'
                        : isToday
                        ? 'text-[#9A6720]'
                        : 'text-[#2C2723]'
                    }
                  >
                    {formatDateDisplay(nextFollowUp)}{' '}
                    {isOverdue && `(⚠️ ${Math.abs(daysToFollowUp!)}d Overdue)`}
                    {isToday && '(⏰ Due Today)'}
                  </strong>
                ) : (
                  'None'
                )}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#8C8074]">
              Status: <span className="font-semibold text-[#A36B58]">{status}</span>
            </span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1 text-xs">
          {/* SECTION 1: JOB INFORMATION */}
          <div>
            <h4 className="font-serif font-bold text-sm text-[#2C2723] mb-3 pb-1 border-b border-[#F2ECE5] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A36B58]" />
              1. Job Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Figma, Canva, Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Job Title / Position *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Date Added
                  </label>
                  <input
                    type="date"
                    value={dateAdded}
                    onChange={(e) => setDateAdded(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Date Applied
                  </label>
                  <input
                    type="date"
                    value={dateApplied}
                    onChange={(e) => setDateApplied(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Location (City / Remote / Hybrid)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Doha, Qatar / Remote / London"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Employment Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  >
                    {lists.employmentTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $145,000 / QAR 35k"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: APPLICATION INFORMATION */}
          <div>
            <h4 className="font-serif font-bold text-sm text-[#2C2723] mb-3 pb-1 border-b border-[#F2ECE5] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7C4EB5]" />
              2. Application Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58] font-semibold"
                >
                  {lists.statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Resume Version Used
                </label>
                <select
                  value={resumeUsed}
                  onChange={(e) => setResumeUsed(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                >
                  {lists.resumes.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Cover Letter
                </label>
                <select
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Customized">Customized</option>
                  <option value="Template">Template</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Origin / Source
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value as ApplicationOrigin)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                >
                  {lists.origins.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Role Category
                </label>
                <select
                  value={roleCategory}
                  onChange={(e) => setRoleCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                >
                  {lists.roleCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: PEOPLE & FOLLOW-UP */}
          <div>
            <h4 className="font-serif font-bold text-sm text-[#2C2723] mb-3 pb-1 border-b border-[#F2ECE5] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C14436]" />
              3. People & Follow-up
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Contact Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Tech Recruiter"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Contact Method
                </label>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                >
                  {lists.contactMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Contact Info / Email / LinkedIn
                </label>
                <input
                  type="text"
                  placeholder="sarah.jenkins@company.com or linkedin.com/in/..."
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Last Contact Date
                </label>
                <input
                  type="date"
                  value={lastContact}
                  onChange={(e) => setLastContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Follow-up Status
                </label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
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
            <h4 className="font-serif font-bold text-sm text-[#2C2723] mb-3 pb-1 border-b border-[#F2ECE5] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4B85B5]" />
              4. Preparation & Notes
            </h4>
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Next Action
                </label>
                <input
                  type="text"
                  placeholder="e.g. Send follow-up email, Research company culture, Prepare system design demo"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Job Requirements Summary
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Key skills: TypeScript, Distributed systems, Tailwind..."
                    value={jobRequirements}
                    onChange={(e) => setJobRequirements(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Why I Applied (Personal note)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Admire their product design and remote-first culture..."
                    value={whyIApplied}
                    onChange={(e) => setWhyIApplied(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Interview Notes & Debrief
                </label>
                <textarea
                  rows={2}
                  placeholder="Questions asked, interviewers met, key highlights..."
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  General Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Referral names, compensation notes, next steps..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>
            </div>
          </div>

          {/* Footer Save / Cancel Controls */}
          <div className="pt-4 border-t border-[#ECE5DD] flex items-center justify-between gap-3 sticky bottom-0 bg-white py-3">
            <div>
              {isEditing && onDelete && application && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#C13626] bg-[#FEEAEA] hover:bg-[#FCD7D7] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Application
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[#E3D9CD] text-[#665D54] hover:bg-[#F5EFE9] font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#A36B58] hover:bg-[#8F5744] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isEditing ? 'Save Changes' : 'Add to HQ'}
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete Application Record?"
          message={`Are you sure you want to permanently delete the application for ${application?.company} (${application?.jobTitle})? This action cannot be undone.`}
          confirmLabel="Delete Application"
          onConfirm={() => {
            if (onDelete && application) {
              onDelete(application.id);
              setShowDeleteConfirm(false);
              onClose();
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  );
};
