import { Application, ApplicationStatus } from '../types';

export const STATUS_COLORS: Record<
  ApplicationStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  Wishlist: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
  },
  Preparing: {
    bg: 'bg-orange-50',
    text: 'text-orange-900',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
  },
  Applied: {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    border: 'border-blue-300',
    dot: 'bg-blue-600',
  },
  'Application Viewed': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-900',
    border: 'border-cyan-300',
    dot: 'bg-cyan-500',
  },
  Screening: {
    bg: 'bg-sky-50',
    text: 'text-sky-900',
    border: 'border-sky-300',
    dot: 'bg-sky-600',
  },
  Interview: {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-300',
    dot: 'bg-purple-600',
  },
  'Technical Interview': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-900',
    border: 'border-indigo-300',
    dot: 'bg-indigo-600',
  },
  'Final Interview': {
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-900',
    border: 'border-fuchsia-300',
    dot: 'bg-fuchsia-600',
  },
  Offer: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
  },
  Accepted: {
    bg: 'bg-teal-50',
    text: 'text-teal-900',
    border: 'border-teal-300',
    dot: 'bg-teal-500',
  },
  Rejected: {
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
  },
  Withdrawn: {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  },
  Ghosted: {
    bg: 'bg-zinc-100',
    text: 'text-zinc-800',
    border: 'border-zinc-300',
    dot: 'bg-zinc-500',
  },
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr?: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

export function daysBetween(fromStr?: string, toStr?: string): number | null {
  const from = parseDate(fromStr);
  const to = toStr ? parseDate(toStr) : new Date();
  if (!from || !to) return null;
  const diffTime = to.getTime() - from.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function daysUntil(targetDateStr?: string): number | null {
  if (!targetDateStr) return null;
  const target = parseDate(targetDateStr);
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function isDateOverdue(targetDateStr?: string): boolean {
  const days = daysUntil(targetDateStr);
  return days !== null && days < 0;
}

export function isDateToday(targetDateStr?: string): boolean {
  const days = daysUntil(targetDateStr);
  return days === 0;
}

export function isDateThisWeek(targetDateStr?: string): boolean {
  const days = daysUntil(targetDateStr);
  return days !== null && days > 0 && days <= 7;
}

export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function calculateKpis(applications: Application[]) {
  const total = applications.length;

  // Applied this week (past 7 days)
  const appliedThisWeek = applications.filter((app) => {
    if (!app.dateApplied) return false;
    const days = daysBetween(app.dateApplied);
    return days !== null && days >= 0 && days <= 7;
  }).length;

  // Active interviews
  const interviews = applications.filter((app) =>
    ['Interview', 'Technical Interview', 'Final Interview'].includes(app.status)
  ).length;

  // Offers
  const offers = applications.filter((app) =>
    ['Offer', 'Accepted'].includes(app.status)
  ).length;

  // Awaiting response (Applied or Viewed or Screening with no outcome yet)
  const awaitingResponse = applications.filter((app) =>
    ['Applied', 'Application Viewed', 'Screening'].includes(app.status)
  ).length;

  // Rejected
  const rejected = applications.filter((app) => app.status === 'Rejected').length;

  // Response rate: percentage of submitted applications that received any reaction
  // (Screening, Interview, Offer, Rejected, Accepted, etc. - anything beyond just 'Applied' or 'Wishlist')
  const submitted = applications.filter((app) => app.status !== 'Wishlist' && app.status !== 'Preparing');
  const responded = submitted.filter((app) =>
    !['Applied', 'Ghosted'].includes(app.status)
  ).length;
  const responseRate = submitted.length > 0 ? Math.round((responded / submitted.length) * 100) : 0;

  return {
    total,
    appliedThisWeek,
    interviews,
    offers,
    awaitingResponse,
    rejected,
    responseRate,
    submittedCount: submitted.length,
  };
}

export function calculatePipeline(applications: Application[]) {
  const stages: {
    key: string;
    label: string;
    count: number;
    statuses: ApplicationStatus[];
    color: string;
  }[] = [
    {
      key: 'wishlist',
      label: 'Wishlist',
      count: applications.filter((a) => a.status === 'Wishlist' || a.status === 'Preparing').length,
      statuses: ['Wishlist', 'Preparing'],
      color: '#9C9488',
    },
    {
      key: 'applied',
      label: 'Applied',
      count: applications.filter((a) => a.status === 'Applied' || a.status === 'Application Viewed').length,
      statuses: ['Applied', 'Application Viewed'],
      color: '#4B85B5',
    },
    {
      key: 'screening',
      label: 'Screening',
      count: applications.filter((a) => a.status === 'Screening').length,
      statuses: ['Screening'],
      color: '#896AB8',
    },
    {
      key: 'interview',
      label: 'Interview',
      count: applications.filter((a) => a.status === 'Interview' || a.status === 'Technical Interview').length,
      statuses: ['Interview', 'Technical Interview'],
      color: '#7C4EB5',
    },
    {
      key: 'final',
      label: 'Final Round',
      count: applications.filter((a) => a.status === 'Final Interview').length,
      statuses: ['Final Interview'],
      color: '#D49841',
    },
    {
      key: 'offer',
      label: 'Offer',
      count: applications.filter((a) => a.status === 'Offer').length,
      statuses: ['Offer'],
      color: '#43A65E',
    },
    {
      key: 'accepted',
      label: 'Accepted',
      count: applications.filter((a) => a.status === 'Accepted').length,
      statuses: ['Accepted'],
      color: '#2E8B45',
    },
  ];

  return stages;
}
