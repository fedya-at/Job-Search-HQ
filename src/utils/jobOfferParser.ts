import { ApplicationOrigin, EmploymentType } from '../types';

export interface ExtractedJobOffer {
  company: string;
  jobTitle: string;
  location: string;
  employmentType: EmploymentType;
  salary?: string;
  jobUrl?: string;
  origin: ApplicationOrigin;
  roleCategory?: string;
  contactName?: string;
  contactInfo?: string;
  jobRequirements?: string;
  notes?: string;
  rawText: string;
  extractedCount: number;
}

/**
 * Intelligent Job Offer & Post Parser
 * Extracts structured details from LinkedIn, Indeed, Glassdoor, Lever, Greenhouse,
 * Twitter/X posts, email invitations, and raw job descriptions.
 */
export function parseJobOfferText(rawText: string): ExtractedJobOffer {
  if (!rawText || !rawText.trim()) {
    return {
      company: '',
      jobTitle: '',
      location: 'Remote',
      employmentType: 'Full-time',
      origin: 'LinkedIn',
      rawText: '',
      extractedCount: 0,
    };
  }

  const text = rawText.trim();
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let company = '';
  let jobTitle = '';
  let location = '';
  let employmentType: EmploymentType = 'Full-time';
  let salary = '';
  let jobUrl = '';
  let origin: ApplicationOrigin = 'LinkedIn';
  let roleCategory = '';
  let contactName = '';
  let contactInfo = '';
  let jobRequirements = '';
  let extractedCount = 0;

  // 1. URL Extraction
  const urlMatch = text.match(/https?:\/\/[^\s\)\],]+/i);
  if (urlMatch) {
    jobUrl = urlMatch[0];
    extractedCount++;
  }

  // 2. Origin / Source Detection
  const lowerText = text.toLowerCase();
  if (jobUrl.includes('linkedin.com') || lowerText.includes('linkedin')) {
    origin = 'LinkedIn';
  } else if (jobUrl.includes('indeed.com') || lowerText.includes('indeed')) {
    origin = 'Indeed';
  } else if (
    jobUrl.includes('greenhouse.io') ||
    jobUrl.includes('lever.co') ||
    jobUrl.includes('workday') ||
    jobUrl.includes('ashbyhq.com') ||
    jobUrl.includes('smartrecruiters') ||
    jobUrl.includes('bamboohr') ||
    lowerText.includes('company website') ||
    lowerText.includes('careers page')
  ) {
    origin = 'Company Website';
  } else if (lowerText.includes('recruiter') || lowerText.includes('headhunter') || lowerText.includes('staffing')) {
    origin = 'Recruiter';
  } else if (lowerText.includes('referral') || lowerText.includes('referred by')) {
    origin = 'Referral';
  } else if (
    jobUrl.includes('twitter.com') ||
    jobUrl.includes('x.com') ||
    lowerText.includes('twitter') ||
    lowerText.includes('post on x') ||
    lowerText.includes('dm me')
  ) {
    origin = 'Networking';
  } else if (lowerText.includes('direct email') || lowerText.includes('inbox') || lowerText.includes('reached out to me')) {
    origin = 'Direct Email';
  }

  // 3. Salary / Compensation Range Detection
  // Matches: $120k-$150k, $120,000 - $160,000, $50/hr, £60,000 - £80,000, €70k - €90k, USD 130,000 - 150,000
  const salaryRegexes = [
    /(?:salary|compensation|pay|rate|base\s*salary|pay\s*range)[\s\:\-\–]*([\$£€][\d\s,\.kK]+(?:[\s\-\–to]+\s*[\$£€]?[\d\s,\.kK]+)?(?:\s*(?:\/|\s+per\s+)(?:year|yr|hr|hour|month|mo|annum))?)/i,
    /([\$£€]\s*[\d,]+(?:\.\d+)?\s*(?:k|K)?\s*(?:[\-\–\—]|to)\s*[\$£€]?\s*[\d,]+(?:\.\d+)?\s*(?:k|K)?(?:\s*(?:\/|\s+per\s+)(?:year|yr|hr|hour|month|mo|annum))?)/i,
    /(\b\d{2,3}(?:,\d{3})+\s*(?:[\-\–\—]|to)\s*\d{2,3}(?:,\d{3})+\s*(?:USD|EUR|GBP|CAD|AUD)(?:\s*(?:\/|\s+per\s+)(?:year|yr|hr|hour|month|mo|annum))?)/i,
    /([\$£€]\s*[\d,]+(?:\.\d+)?\s*(?:k|K|hr|hour|yr|year))/i,
  ];

  for (const sReg of salaryRegexes) {
    const sMatch = text.match(sReg);
    if (sMatch && sMatch[1]) {
      salary = sMatch[1].trim();
      extractedCount++;
      break;
    }
  }

  // 4. Employment Type Detection
  if (/\b(full[\s-]time|permanent|fulltime)\b/i.test(text)) {
    employmentType = 'Full-time';
    extractedCount++;
  } else if (/\b(contract(?:or)?|freelance|temporary|temp|c2c|w2\s*contract)\b/i.test(text)) {
    employmentType = 'Contract';
    extractedCount++;
  } else if (/\b(part[\s-]time|parttime)\b/i.test(text)) {
    employmentType = 'Part-time';
    extractedCount++;
  } else if (/\b(intern(?:ship)?|trainee|co-op)\b/i.test(text)) {
    employmentType = 'Internship';
    extractedCount++;
  }

  // 5. Location Detection
  if (/\b(remote|work\s+from\s+home|wfh|anywhere|distributed|virtual)\b/i.test(text)) {
    if (/\b(hybrid|remote\s*\/\s*hybrid|hybrid\s*remote)\b/i.test(text)) {
      location = 'Hybrid (Remote / Onsite)';
    } else {
      location = 'Remote';
    }
    extractedCount++;
  } else if (/\b(hybrid)\b/i.test(text)) {
    location = 'Hybrid';
    extractedCount++;
  } else if (/\b(on[\s-]site|onsite|in[\s-]office)\b/i.test(text)) {
    location = 'On-site';
    extractedCount++;
  }

  // Look for explicit "Location:" / "Based in:"
  const locMatch = text.match(/(?:location|based\s+in|workplace|city)[\s\:\-\–]*([A-Za-z\s,\.\(\)\/-]{2,50})/i);
  if (locMatch && locMatch[1]) {
    const candidate = locMatch[1].split('\n')[0].replace(/[\(\)].*$/, '').trim();
    if (candidate.length > 2 && !candidate.toLowerCase().includes('requirements') && !candidate.toLowerCase().includes('responsibilities')) {
      location = location ? `${candidate} (${location})` : candidate;
    }
  }

  if (!location) {
    location = 'Remote';
  }

  // 6. Job Title & Company Detection
  // Common LinkedIn / Indeed / Lever header patterns:
  // e.g., "Senior Frontend Engineer at Stripe"
  // e.g., "Stripe is hiring a Senior Frontend Engineer"
  // e.g., "Job Title: Software Engineer\nCompany: Google"
  // e.g., "Title: Full Stack Developer"
  // e.g., "Role: Product Manager"

  // Check explicit labels first:
  const titleLabelMatch = text.match(/(?:job\s*title|position|role|title)[\s\:\-\–]*([^\n\r\|•]+)/i);
  if (titleLabelMatch && titleLabelMatch[1]) {
    const cand = titleLabelMatch[1].trim();
    if (cand.length > 2 && cand.length < 80) {
      jobTitle = cand;
    }
  }

  const companyLabelMatch = text.match(/(?:company(?:\s*name)?|organization|employer|client)[\s\:\-\–]*([^\n\r\|•]+)/i);
  if (companyLabelMatch && companyLabelMatch[1]) {
    const cand = companyLabelMatch[1].trim();
    if (cand.length > 1 && cand.length < 60) {
      company = cand;
    }
  }

  // Pattern: "[Job Title] at [Company]" (e.g. "Senior Software Engineer at Stripe")
  if (!jobTitle || !company) {
    const titleAtCompanyMatch = text.match(/([A-Z][A-Za-z0-9\s\/\-\,\(\)]+?)\s+(?:at|@|with)\s+([A-Z][A-Za-z0-9\s\.\,\&]+)/);
    if (titleAtCompanyMatch) {
      const candidateTitle = titleAtCompanyMatch[1].trim();
      const candidateCompany = titleAtCompanyMatch[2].trim().split('\n')[0].replace(/\s+(is|in|for|we|are).*$/i, '');

      if (!jobTitle && candidateTitle.length > 2 && candidateTitle.length < 70) {
        jobTitle = candidateTitle;
      }
      if (!company && candidateCompany.length > 1 && candidateCompany.length < 50) {
        company = candidateCompany;
      }
    }
  }

  // Pattern: "[Company] is hiring a [Title]" or "[Company] is looking for a [Title]"
  if (!company || !jobTitle) {
    const hiringMatch = text.match(/([A-Z][A-Za-z0-9\s\.\&]+?)\s+is\s+(?:hiring|looking\s+for|seeking)(?:\s+an?|\s+our\s+next)?\s+([A-Z][A-Za-z0-9\s\/\-\,\(\)]+)/i);
    if (hiringMatch) {
      if (!company) company = hiringMatch[1].trim();
      if (!jobTitle) jobTitle = hiringMatch[2].trim().split('\n')[0].replace(/[\.\,\!].*$/, '');
    }
  }

  // Pattern: Header lines from LinkedIn / Indeed copied posts
  // First 3 lines often contain Title and Company
  if (!jobTitle && lines.length > 0) {
    const titleKeywords = [
      'engineer', 'developer', 'designer', 'manager', 'lead', 'architect',
      'analyst', 'specialist', 'director', 'associate', 'consultant', 'intern',
      'scientist', 'coordinator', 'executive', 'officer', 'head', 'vp', 'founder',
      'administrator', 'technician', 'writer', 'editor', 'producer', 'strategist',
      'frontend', 'backend', 'fullstack', 'full-stack', 'devops', 'sre', 'ui', 'ux',
    ];

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      const lower = line.toLowerCase();
      if (titleKeywords.some((kw) => lower.includes(kw)) && line.length < 80 && !lower.includes('experience') && !lower.includes('years')) {
        jobTitle = line;
        // If the next line is short, it might be the company!
        if (!company && lines[i + 1] && lines[i + 1].length < 50 && !lines[i + 1].includes(':')) {
          company = lines[i + 1].replace(/·.*$/, '').trim();
        }
        break;
      }
    }
  }

  if (!company) {
    // Check "About [Company]" pattern
    const aboutMatch = text.match(/about\s+([A-Z][A-Za-z0-9\s\.\&]{2,40})/i);
    if (aboutMatch) {
      company = aboutMatch[1].trim().split('\n')[0].replace(/[\:\.\,].*$/, '');
    }
  }

  if (jobTitle) extractedCount++;
  if (company) extractedCount++;

  // Clean company & jobTitle
  company = company.replace(/^(company|employer|client|organization)[\:\s\-]+/i, '').trim();
  jobTitle = jobTitle.replace(/^(job\s*title|position|role|title)[\:\s\-]+/i, '').trim();

  // 7. Role Category Detection
  const combinedRoleText = `${jobTitle} ${text}`.toLowerCase();
  if (
    combinedRoleText.includes('software') ||
    combinedRoleText.includes('engineer') ||
    combinedRoleText.includes('developer') ||
    combinedRoleText.includes('frontend') ||
    combinedRoleText.includes('backend') ||
    combinedRoleText.includes('fullstack') ||
    combinedRoleText.includes('full-stack') ||
    combinedRoleText.includes('devops') ||
    combinedRoleText.includes('sre') ||
    combinedRoleText.includes('qa') ||
    combinedRoleText.includes('cloud')
  ) {
    roleCategory = 'Software Engineering';
    extractedCount++;
  } else if (
    combinedRoleText.includes('product manager') ||
    combinedRoleText.includes('product owner') ||
    combinedRoleText.includes('product lead') ||
    combinedRoleText.includes('group product')
  ) {
    roleCategory = 'Product Management';
    extractedCount++;
  } else if (
    combinedRoleText.includes('design') ||
    combinedRoleText.includes('ui/ux') ||
    combinedRoleText.includes('ux') ||
    combinedRoleText.includes('ui') ||
    combinedRoleText.includes('graphic') ||
    combinedRoleText.includes('user research')
  ) {
    roleCategory = 'UI/UX Design';
    extractedCount++;
  } else if (
    combinedRoleText.includes('data scientist') ||
    combinedRoleText.includes('data analyst') ||
    combinedRoleText.includes('data engineer') ||
    combinedRoleText.includes('machine learning') ||
    combinedRoleText.includes('ai') ||
    combinedRoleText.includes('analytics')
  ) {
    roleCategory = 'Data & Analytics';
    extractedCount++;
  } else if (
    combinedRoleText.includes('marketing') ||
    combinedRoleText.includes('growth') ||
    combinedRoleText.includes('seo') ||
    combinedRoleText.includes('content') ||
    combinedRoleText.includes('social media')
  ) {
    roleCategory = 'Marketing & Growth';
    extractedCount++;
  } else if (
    combinedRoleText.includes('sales') ||
    combinedRoleText.includes('account executive') ||
    combinedRoleText.includes('bdr') ||
    combinedRoleText.includes('sdr') ||
    combinedRoleText.includes('business development')
  ) {
    roleCategory = 'Sales & BD';
    extractedCount++;
  } else if (
    combinedRoleText.includes('operations') ||
    combinedRoleText.includes('recruiter') ||
    combinedRoleText.includes('talent') ||
    combinedRoleText.includes('hr') ||
    combinedRoleText.includes('human resources')
  ) {
    roleCategory = 'Operations & HR';
    extractedCount++;
  } else if (
    combinedRoleText.includes('customer success') ||
    combinedRoleText.includes('support') ||
    combinedRoleText.includes('account manager')
  ) {
    roleCategory = 'Customer Success';
    extractedCount++;
  }

  // 8. Contact / Recruiter Information Detection
  // Email match:
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    contactInfo = emailMatch[1];
    extractedCount++;
  }

  // Recruiter / Contact Name: "Posted by: [Name]" or "Contact: [Name]" or "Recruiter: [Name]"
  const contactNameMatch = text.match(/(?:posted\s*by|contact|recruiter|hiring\s*manager)[\s\:\-\–]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
  if (contactNameMatch && contactNameMatch[1]) {
    contactName = contactNameMatch[1].trim();
    extractedCount++;
  }

  // 9. Job Requirements & Skills extraction
  // Look for section headers:
  const reqHeaderMatch = text.match(/(?:requirements|qualifications|what\s+you'?ll\s+need|what\s+we\s+look\s+for|what\s+you\s+bring|skills)[\s\:\-\–]*\n([\s\S]{50,1500}?)(?:\n\s*\n\s*[A-Z]|\n\s*(?:benefits|about\s+us|what\s+we\s+offer|compensation|how\s+to\s+apply|$))/i);
  if (reqHeaderMatch && reqHeaderMatch[1]) {
    jobRequirements = reqHeaderMatch[1].trim();
    extractedCount++;
  } else {
    // If no explicit requirements section, summarize the top bullet points or description
    const bulletLines = lines.filter((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l));
    if (bulletLines.length > 0) {
      jobRequirements = bulletLines.slice(0, 10).join('\n');
      extractedCount++;
    }
  }

  return {
    company: company || 'Company Name',
    jobTitle: jobTitle || 'Job Title / Position',
    location: location || 'Remote',
    employmentType,
    salary: salary || undefined,
    jobUrl: jobUrl || undefined,
    origin,
    roleCategory: roleCategory || undefined,
    contactName: contactName || undefined,
    contactInfo: contactInfo || undefined,
    jobRequirements: jobRequirements || undefined,
    notes: text.length > 2000 ? text.substring(0, 2000) + '...' : text,
    rawText: text,
    extractedCount,
  };
}
