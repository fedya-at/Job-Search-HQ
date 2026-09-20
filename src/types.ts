export type ApplicationStatus =
  | 'Wishlist'
  | 'Preparing'
  | 'Applied'
  | 'Application Viewed'
  | 'Screening'
  | 'Interview'
  | 'Technical Interview'
  | 'Final Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Ghosted';

export type ApplicationOrigin =
  | 'LinkedIn'
  | 'Indeed'
  | 'Company Website'
  | 'Recruiter'
  | 'Referral'
  | 'Networking'
  | 'Direct Email'
  | 'Job Fair'
  | 'Other';

export type EmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Internship';

export type CoverLetterType =
  | 'Yes'
  | 'No'
  | 'Customized'
  | 'Template';

export type ContactMethod =
  | 'LinkedIn'
  | 'Email'
  | 'Phone'
  | 'WhatsApp'
  | 'Referral';

export type FollowUpStatus =
  | 'Not contacted'
  | 'Contacted'
  | 'Waiting'
  | 'Follow-up due'
  | 'Follow-up sent';

export interface Application {
  id: string;
  // Job Information
  dateAdded: string; // YYYY-MM-DD
  dateApplied: string; // YYYY-MM-DD
  company: string;
  jobTitle: string;
  jobUrl: string;
  location: string;
  employmentType: EmploymentType;
  salary?: string;

  // Application Information
  resumeUsed: string;
  coverLetter: CoverLetterType;
  coverLetterText?: string;
  cvFileName?: string;
  cvFileData?: string;
  status: ApplicationStatus;
  origin: ApplicationOrigin;

  // People / Follow-up
  contactName?: string;
  contactRole?: string;
  contactMethod?: ContactMethod;
  contactInfo?: string; // Email, URL, phone
  lastContact?: string; // YYYY-MM-DD
  nextFollowUp?: string; // YYYY-MM-DD
  followUpStatus: FollowUpStatus;

  // Notes
  jobRequirements?: string;
  whyIApplied?: string;
  interviewNotes?: string;
  nextAction?: string;
  notes?: string;

  // Role categorization for analytics
  roleCategory?: string;
}

export interface ResumeItem {
  id: string;
  name: string;
  targetRole: string;
  version: string;
  dateCreated: string;
  lastUpdated: string;
  usedFor: string; // description or count
  fileLink: string;
  skills: string[];
  notes?: string;
}

export interface ContactItem {
  id: string;
  name: string;
  company: string;
  role: string;
  relationship: string;
  linkedIn?: string;
  email?: string;
  phone?: string;
  lastContact?: string;
  nextFollowUp?: string;
  notes?: string;
  associatedApps?: string[]; // IDs or company names
}

export type SheetTab =
  | 'dashboard'
  | 'applications'
  | 'followup'
  | 'resumes'
  | 'contacts'
  | 'analytics'
  | 'lists';

export interface DataLists {
  statuses: ApplicationStatus[];
  resumes: string[];
  origins: ApplicationOrigin[];
  employmentTypes: EmploymentType[];
  contactMethods: ContactMethod[];
  followUpStatuses: FollowUpStatus[];
  roleCategories: string[];
}
