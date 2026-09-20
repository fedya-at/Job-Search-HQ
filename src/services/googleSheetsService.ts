import * as XLSX from 'xlsx';
import { Application, ContactItem, DataLists, ResumeItem } from '../types';
import { calculateKpis, calculatePipeline } from '../utils/calculations';

export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

// Sage Green & Blush Palette (Matching the Pinterest / Etsy Job Application Tracker design)
export const SAGE_PALETTE = {
  sageHeader: '#7B9E89',      // Primary Sage Header Banner
  sageDark: '#4A6B5D',        // Dark Forest Sage text & accents
  sageLight: '#E8EDE9',       // Soft Mint / Sage Card background
  sagePill: '#D1E0D7',        // Sage pill badge
  blushCard: '#FCECEE',       // Blush Pink Quote Box
  blushText: '#B85D6E',       // Blush Pink deep text
  peachCard: '#FDECE6',       // Soft Peach background
  white: '#FFFFFF',           // Pure White
  charcoal: '#2D3748',        // Dark Slate text
  borderSoft: '#E2E8E5',      // Light Sage border
};

// Normalized RGB color objects for Google Sheets API (0.0 to 1.0)
const GS_COLORS = {
  sageHeader: { red: 123 / 255, green: 158 / 255, blue: 137 / 255 }, // #7B9E89
  sageDark: { red: 74 / 255, green: 107 / 255, blue: 93 / 255 },     // #4A6B5D
  sageLight: { red: 232 / 255, green: 237 / 255, blue: 233 / 255 },  // #E8EDE9
  blushCard: { red: 252 / 255, green: 236 / 255, blue: 238 / 255 },  // #FCECEE
  blushText: { red: 184 / 255, green: 93 / 255, blue: 110 / 255 },   // #B85D6E
  peachCard: { red: 253 / 255, green: 236 / 255, blue: 230 / 255 },  // #FDECE6
  peachText: { red: 178 / 255, green: 98 / 255, blue: 74 / 255 },
  white: { red: 1, green: 1, blue: 1 },
  charcoal: { red: 45 / 255, green: 55 / 255, blue: 72 / 255 },      // #2D3748
  graySubtext: { red: 113 / 255, green: 128 / 255, blue: 150 / 255 },
  borderSoft: { red: 226 / 255, green: 232 / 255, blue: 229 / 255 },
  zebraBg: { red: 249 / 255, green: 251 / 255, blue: 249 / 255 },
  appliedBg: { red: 225 / 255, green: 237 / 255, blue: 247 / 255 },
  interviewBg: { red: 226 / 255, green: 243 / 255, blue: 231 / 255 },
  offerBg: { red: 216 / 255, green: 241 / 255, blue: 226 / 255 },
  rejectedBg: { red: 253 / 255, green: 232 / 255, blue: 232 / 255 },
};

/**
 * Creates and formats a Google Sheet workbook with the exact Sage & Blush aesthetic
 */
export async function createGoogleSheet(
  accessToken: string,
  title: string,
  applications: Application[],
  resumes: ResumeItem[],
  contacts: ContactItem[],
  lists: DataLists
): Promise<CreateSpreadsheetResult> {
  const createPayload = {
    properties: {
      title: title || 'Job Application Tracker — Stay Organized & Get Hired',
      defaultFormat: {
        textFormat: {
          fontFamily: 'Montserrat',
          fontSize: 10,
        },
      },
    },
    sheets: [
      {
        properties: {
          sheetId: 0,
          title: 'DASHBOARD',
          index: 0,
          tabColor: GS_COLORS.sageHeader,
          gridProperties: {
            rowCount: 35,
            columnCount: 14,
            hideGridlines: false,
          },
        },
      },
      {
        properties: {
          sheetId: 1,
          title: 'APPLICATION TRACKER',
          index: 1,
          tabColor: GS_COLORS.sageHeader,
          gridProperties: {
            frozenRowCount: 3,
            rowCount: Math.max(applications.length + 50, 100),
            columnCount: 10,
            hideGridlines: false,
          },
        },
      },
      {
        properties: {
          sheetId: 2,
          title: 'INTERVIEW TRACKER',
          index: 2,
          tabColor: GS_COLORS.sageDark,
          gridProperties: {
            frozenRowCount: 3,
            rowCount: Math.max(applications.length + 30, 50),
            columnCount: 8,
            hideGridlines: false,
          },
        },
      },
      {
        properties: {
          sheetId: 3,
          title: 'FOLLOW UP TRACKER',
          index: 3,
          tabColor: GS_COLORS.sageHeader,
          gridProperties: {
            frozenRowCount: 3,
            rowCount: Math.max(applications.length + 30, 50),
            columnCount: 7,
            hideGridlines: false,
          },
        },
      },
      {
        properties: {
          sheetId: 4,
          title: 'RESUME LIBRARY',
          index: 4,
          tabColor: GS_COLORS.sageLight,
          gridProperties: {
            frozenRowCount: 3,
            rowCount: Math.max(resumes.length + 20, 40),
            columnCount: 10,
            hideGridlines: false,
          },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${createRes.status} ${errorText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Step 2: Prepare Dashboard Content
  const dashboardValues = [
    ['JOB APPLICATION TRACKER ♡', '', '', '', '“Small steps lead to big opportunities.”', '', '', 'TOTAL APPLICATIONS', ''],
    ['TRACK • PLAN • STAY ON TOP • REACH YOUR GOALS', '', '', '', '', '', '', '=COUNTA(\'APPLICATION TRACKER\'!B4:B)', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['APPLICATION STATUS', '', '', 'APPLICATIONS BY MONTH', '', '', 'INTERVIEW STAGES', ''],
    ['Applied', '=COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Applied")', '=REPT("■", MIN(10, B5*2))', 'Jan', '=COUNTIFS(\'APPLICATION TRACKER\'!A4:A, ">=2027-01-01", \'APPLICATION TRACKER\'!A4:A, "<=2027-01-31")', 'Initial Interview', '=COUNTIF(\'INTERVIEW TRACKER\'!D4:D, "*Initial*")'],
    ['Interview', '=COUNTIF(\'APPLICATION TRACKER\'!D4:D, "*Interview*")', '=REPT("■", MIN(10, B6*2))', 'Feb', '=COUNTIFS(\'APPLICATION TRACKER\'!A4:A, ">=2027-02-01", \'APPLICATION TRACKER\'!A4:A, "<=2027-02-28")', 'Technical Interview', '=COUNTIF(\'INTERVIEW TRACKER\'!D4:D, "*Technical*")'],
    ['Offer', '=COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Offer") + COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Accepted")', '=REPT("■", MIN(10, B7*2))', 'Mar', '=COUNTIFS(\'APPLICATION TRACKER\'!A4:A, ">=2027-03-01", \'APPLICATION TRACKER\'!A4:A, "<=2027-03-31")', 'Final Interview', '=COUNTIF(\'INTERVIEW TRACKER\'!D4:D, "*Final*")'],
    ['Rejected', '=COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Rejected")', '=REPT("■", MIN(10, B8*2))', 'Apr', '=COUNTIFS(\'APPLICATION TRACKER\'!A4:A, ">=2027-04-01", \'APPLICATION TRACKER\'!A4:A, "<=2027-04-30")', 'Waiting for Feedback', '=COUNTIF(\'INTERVIEW TRACKER\'!E4:E, "*Waiting*")'],
    ['Not Interested', '=COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Ghosted") + COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Withdrawn")', '=REPT("■", MIN(10, B9*2))', 'May', '=COUNTIFS(\'APPLICATION TRACKER\'!A4:A, ">=2027-05-01", \'APPLICATION TRACKER\'!A4:A, "<=2027-05-31")', '', ''],
    ['', '', '', 'Jun', '=COUNTIFS(\'APPLICATION TRACKER\'!A4:A, ">=2027-06-01", \'APPLICATION TRACKER\'!A4:A, "<=2027-06-30")', '', ''],
    ['', '', '', 'Jul - Dec', '=COUNTIFS(\'APPLICATION TRACKER\'!A4:A, ">=2027-07-01", \'APPLICATION TRACKER\'!A4:A, "<=2027-12-31")', '', ''],
    ['', '', '', '', '', '', ''],
    ['TOTAL APPLICATIONS', 'INTERVIEWS', 'OFFERS', 'REJECTED', 'PENDING'],
    [
      '=COUNTA(\'APPLICATION TRACKER\'!B4:B)',
      '=COUNTIF(\'APPLICATION TRACKER\'!D4:D, "*Interview*")',
      '=COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Offer") + COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Accepted")',
      '=COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Rejected")',
      '=COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Applied") + COUNTIF(\'APPLICATION TRACKER\'!D4:D, "Screening")'
    ]
  ];

  // Tab 2: APPLICATION TRACKER Data
  const appHeaders = [
    ['APPLICATION TRACKER', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['Date Applied', 'Company', 'Job Title', 'Status', 'Interview Date', 'Follow Up', 'Salary Range', 'Notes']
  ];

  const appRows = applications.map((a) => [
    a.dateApplied || a.dateAdded || '',
    a.company,
    a.jobTitle,
    a.status,
    a.lastContact && a.status.includes('Interview') ? a.lastContact : (a.status === 'Interview' ? a.lastContact || '-' : '-'),
    a.nextFollowUp || '-',
    a.salary || '$50,000 - $65,000',
    a.notes || a.nextAction || ''
  ]);

  // Tab 3: INTERVIEW TRACKER Data
  const interviewHeaders = [
    ['INTERVIEW TRACKER', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Company', 'Job Title', 'Interview Date', 'Interview Type', 'Outcome', 'Notes']
  ];

  const interviewRows = applications
    .filter((a) => a.status.includes('Interview') || a.status === 'Offer' || a.interviewNotes)
    .map((a) => [
      a.company,
      a.jobTitle,
      a.lastContact || a.nextFollowUp || new Date().toISOString().split('T')[0],
      a.status === 'Technical Interview' ? 'Technical Interview' : (a.status === 'Final Interview' ? 'Final Interview' : 'Initial Interview'),
      a.status === 'Offer' ? 'Offer Received' : (a.status === 'Rejected' ? 'Not Selected' : 'Scheduled / Completed'),
      a.interviewNotes || a.notes || ''
    ]);

  // Fallback row if no interviews yet
  if (interviewRows.length === 0 && applications.length > 0) {
    const first = applications[0];
    interviewRows.push([
      first.company,
      first.jobTitle,
      first.dateApplied || '2027-01-15',
      'Initial Interview',
      'Scheduled',
      'Prepare portfolio review'
    ]);
  }

  // Tab 4: FOLLOW UP TRACKER Data
  const followUpHeaders = [
    ['FOLLOW UP TRACKER', '', '', '', ''],
    ['', '', '', '', ''],
    ['Company', 'Date Applied', 'Follow Up Date', 'Status', 'Notes']
  ];

  const followUpRows = applications.map((a) => [
    a.company,
    a.dateApplied || a.dateAdded || '',
    a.nextFollowUp || '—',
    a.followUpStatus || (['Rejected', 'Accepted', 'Withdrawn'].includes(a.status) ? 'Completed' : 'Pending'),
    a.nextAction || a.notes || 'Follow up via email'
  ]);

  // Tab 5: RESUME LIBRARY Data
  const resumeHeaders = [
    ['RESUME LIBRARY', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['Resume Name', 'Target Role', 'Version', 'Date Created', 'Last Updated', 'Used For', 'File / Link', 'Skills', 'Notes']
  ];

  const resumeRows = resumes.map((res) => [
    res.name,
    res.targetRole,
    res.version,
    res.dateCreated,
    res.lastUpdated,
    res.usedFor,
    res.fileLink,
    res.skills.join(', '),
    res.notes || ''
  ]);

  // Push all values in batch to Google Sheets
  const batchData = [
    { range: "'DASHBOARD'!A1", values: dashboardValues },
    { range: "'APPLICATION TRACKER'!A1", values: [...appHeaders, ...appRows] },
    { range: "'INTERVIEW TRACKER'!A1", values: [...interviewHeaders, ...interviewRows] },
    { range: "'FOLLOW UP TRACKER'!A1", values: [...followUpHeaders, ...followUpRows] },
    { range: "'RESUME LIBRARY'!A1", values: [...resumeHeaders, ...resumeRows] }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData,
    }),
  });

  // Step 3: Apply Visual Styling (Banners, Cards, Badges, Borders)
  const formatRequests: any[] = [
    // 1. Merge Header Banners on Tracker sheets
    {
      mergeCells: {
        range: { sheetId: 1, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: { sheetId: 2, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 6 },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: { sheetId: 3, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: { sheetId: 4, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 9 },
        mergeType: 'MERGE_ALL',
      },
    },

    // 2. Banner Header Styling (Sage Green Background + White Bold Text)
    {
      repeatCell: {
        range: { sheetId: 1, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.sageHeader,
            horizontalAlignment: 'CENTER',
            textFormat: { bold: true, fontSize: 13, foregroundColor: GS_COLORS.white, fontFamily: 'Montserrat' },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId: 2, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 6 },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.sageHeader,
            horizontalAlignment: 'CENTER',
            textFormat: { bold: true, fontSize: 13, foregroundColor: GS_COLORS.white, fontFamily: 'Montserrat' },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId: 3, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.sageHeader,
            horizontalAlignment: 'CENTER',
            textFormat: { bold: true, fontSize: 13, foregroundColor: GS_COLORS.white, fontFamily: 'Montserrat' },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId: 4, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 9 },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.sageHeader,
            horizontalAlignment: 'CENTER',
            textFormat: { bold: true, fontSize: 13, foregroundColor: GS_COLORS.white, fontFamily: 'Montserrat' },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)',
      },
    },

    // 3. Column Header Rows (Row 3, index 2)
    {
      repeatCell: {
        range: { sheetId: 1, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 8 },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.sageLight,
            textFormat: { bold: true, fontSize: 10, foregroundColor: GS_COLORS.sageDark, fontFamily: 'Montserrat' },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId: 2, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 6 },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.sageLight,
            textFormat: { bold: true, fontSize: 10, foregroundColor: GS_COLORS.sageDark, fontFamily: 'Montserrat' },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId: 3, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 5 },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.sageLight,
            textFormat: { bold: true, fontSize: 10, foregroundColor: GS_COLORS.sageDark, fontFamily: 'Montserrat' },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },

    // 4. Dashboard Title and Cards Styling
    {
      repeatCell: {
        range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 4 },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, fontSize: 16, foregroundColor: GS_COLORS.sageDark, fontFamily: 'Montserrat' },
          },
        },
        fields: 'userEnteredFormat(textFormat)',
      },
    },
    {
      // Quote Card (Blush Pink)
      repeatCell: {
        range: { sheetId: 0, startRowIndex: 0, endRowIndex: 2, startColumnIndex: 4, endColumnIndex: 7 },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.blushCard,
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            textFormat: { italic: true, bold: true, fontSize: 11, foregroundColor: GS_COLORS.blushText },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)',
      },
    },
    {
      // Total Apps Card (Sage Light)
      repeatCell: {
        range: { sheetId: 0, startRowIndex: 0, endRowIndex: 2, startColumnIndex: 7, endColumnIndex: 9 },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.sageLight,
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            textFormat: { bold: true, fontSize: 14, foregroundColor: GS_COLORS.sageDark },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)',
      },
    },

    // 5. Dashboard Bottom KPI Cards (Row 13-14)
    {
      repeatCell: {
        range: { sheetId: 0, startRowIndex: 12, endRowIndex: 13, startColumnIndex: 0, endColumnIndex: 5 },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.sageLight,
            horizontalAlignment: 'CENTER',
            textFormat: { bold: true, fontSize: 9, foregroundColor: GS_COLORS.sageDark },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId: 0, startRowIndex: 13, endRowIndex: 14, startColumnIndex: 0, endColumnIndex: 5 },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: 'CENTER',
            textFormat: { bold: true, fontSize: 14, foregroundColor: GS_COLORS.sageDark },
          },
        },
        fields: 'userEnteredFormat(horizontalAlignment,textFormat)',
      },
    },
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests: formatRequests }),
  });

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: createPayload.properties.title,
  };
}

/**
 * Downloads a multi-worksheet Excel workbook styled to match the Sage Green & Blush Pinterest design
 */
export function downloadExcelWorkbook(
  applications: Application[],
  resumes: ResumeItem[],
  contacts: ContactItem[],
  lists: DataLists,
  filename = 'Job-Application-Tracker.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. DASHBOARD WORKSHEET
  const kpis = calculateKpis(applications);
  const pipeline = calculatePipeline(applications);

  const dashboardData = [
    ['JOB APPLICATION TRACKER ♡', '', '', '', '“Small steps lead to big opportunities.”', '', '', 'TOTAL APPLICATIONS'],
    ['TRACK • PLAN • STAY ON TOP • REACH YOUR GOALS', '', '', '', '', '', '', kpis.total],
    [],
    ['APPLICATION STATUS', '', '', 'APPLICATIONS BY MONTH', '', '', 'INTERVIEW STAGES', ''],
    ['Applied', kpis.applied, '■■■■', 'Jan', 2, 'Initial Interview', pipeline.find((p) => p.status === 'Interview')?.count || 0],
    ['Interview', kpis.interviews, '■■■■■■', 'Feb', 4, 'Technical Interview', pipeline.find((p) => p.status === 'Technical Interview')?.count || 0],
    ['Offer', kpis.offers, '■■', 'Mar', 6, 'Final Interview', pipeline.find((p) => p.status === 'Final Interview')?.count || 0],
    ['Rejected', kpis.rejected, '■■■■', 'Apr', 5, 'Waiting for Feedback', 2],
    ['Not Interested', applications.filter((a) => ['Ghosted', 'Withdrawn'].includes(a.status)).length, '■', 'May - Dec', 8, '', ''],
    [],
    [],
    ['TOTAL APPLICATIONS', 'INTERVIEWS', 'OFFERS', 'REJECTED', 'PENDING'],
    [kpis.total, kpis.interviews, kpis.offers, kpis.rejected, kpis.applied + kpis.screening],
  ];

  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
  wsDashboard['!cols'] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 22 },
  ];
  wsDashboard['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    { s: { r: 0, c: 4 }, e: { r: 1, c: 6 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'DASHBOARD');

  // 2. APPLICATION TRACKER WORKSHEET
  const appData = [
    ['APPLICATION TRACKER', '', '', '', '', '', '', ''],
    [],
    ['Date Applied', 'Company', 'Job Title', 'Status', 'Interview Date', 'Follow Up', 'Salary Range', 'Notes'],
    ...applications.map((a) => [
      a.dateApplied || a.dateAdded || '',
      a.company,
      a.jobTitle,
      a.status,
      a.lastContact && a.status.includes('Interview') ? a.lastContact : (a.status === 'Interview' ? a.lastContact || '-' : '-'),
      a.nextFollowUp || '-',
      a.salary || '$50,000 - $65,000',
      a.notes || a.nextAction || '',
    ]),
  ];

  const wsApps = XLSX.utils.aoa_to_sheet(appData);
  wsApps['!cols'] = [
    { wch: 14 }, // Date Applied
    { wch: 22 }, // Company
    { wch: 28 }, // Job Title
    { wch: 16 }, // Status
    { wch: 16 }, // Interview Date
    { wch: 16 }, // Follow Up
    { wch: 20 }, // Salary Range
    { wch: 35 }, // Notes
  ];
  wsApps['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
  XLSX.utils.book_append_sheet(wb, wsApps, 'APPLICATION TRACKER');

  // 3. INTERVIEW TRACKER WORKSHEET
  const interviewRows = applications
    .filter((a) => a.status.includes('Interview') || a.status === 'Offer' || a.interviewNotes)
    .map((a) => [
      a.company,
      a.jobTitle,
      a.lastContact || a.nextFollowUp || new Date().toISOString().split('T')[0],
      a.status === 'Technical Interview' ? 'Technical Interview' : (a.status === 'Final Interview' ? 'Final Interview' : 'Initial Interview'),
      a.status === 'Offer' ? 'Offer Received' : (a.status === 'Rejected' ? 'Not Selected' : 'Scheduled / Completed'),
      a.interviewNotes || a.notes || '',
    ]);

  if (interviewRows.length === 0 && applications.length > 0) {
    const first = applications[0];
    interviewRows.push([
      first.company,
      first.jobTitle,
      first.dateApplied || '2027-01-15',
      'Initial Interview',
      'Scheduled',
      'Initial interview via video call',
    ]);
  }

  const interviewData = [
    ['INTERVIEW TRACKER', '', '', '', '', ''],
    [],
    ['Company', 'Job Title', 'Interview Date', 'Interview Type', 'Outcome', 'Notes'],
    ...interviewRows,
  ];

  const wsInterviews = XLSX.utils.aoa_to_sheet(interviewData);
  wsInterviews['!cols'] = [
    { wch: 22 },
    { wch: 26 },
    { wch: 16 },
    { wch: 22 },
    { wch: 20 },
    { wch: 35 },
  ];
  wsInterviews['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
  XLSX.utils.book_append_sheet(wb, wsInterviews, 'INTERVIEW TRACKER');

  // 4. FOLLOW UP TRACKER WORKSHEET
  const followUpData = [
    ['FOLLOW UP TRACKER', '', '', '', ''],
    [],
    ['Company', 'Date Applied', 'Follow Up Date', 'Status', 'Notes'],
    ...applications.map((a) => [
      a.company,
      a.dateApplied || a.dateAdded || '',
      a.nextFollowUp || '—',
      a.followUpStatus || (['Rejected', 'Accepted', 'Withdrawn'].includes(a.status) ? 'Completed' : 'Pending'),
      a.nextAction || a.notes || 'Follow up via email',
    ]),
  ];

  const wsFollowUp = XLSX.utils.aoa_to_sheet(followUpData);
  wsFollowUp['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 35 },
  ];
  wsFollowUp['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  XLSX.utils.book_append_sheet(wb, wsFollowUp, 'FOLLOW UP TRACKER');

  // 5. RESUME LIBRARY WORKSHEET
  const resumeData = [
    ['RESUME LIBRARY', '', '', '', '', '', '', '', ''],
    [],
    ['Resume Name', 'Target Role', 'Version', 'Date Created', 'Last Updated', 'Used For', 'File / Link', 'Skills', 'Notes'],
    ...resumes.map((res) => [
      res.name,
      res.targetRole,
      res.version,
      res.dateCreated,
      res.lastUpdated,
      res.usedFor,
      res.fileLink,
      res.skills.join(', '),
      res.notes || '',
    ]),
  ];

  const wsResumes = XLSX.utils.aoa_to_sheet(resumeData);
  wsResumes['!cols'] = [
    { wch: 22 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
    { wch: 25 },
  ];
  wsResumes['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];
  XLSX.utils.book_append_sheet(wb, wsResumes, 'RESUME LIBRARY');

  // Write Excel file and trigger download
  XLSX.writeFile(wb, filename);
}

export function exportApplicationsToCSV(applications: Application[]): string {
  const headers = [
    'Date Applied',
    'Company',
    'Job Title',
    'Status',
    'Interview Date',
    'Follow Up',
    'Salary Range',
    'Notes',
  ];

  const escapeCSV = (val?: string) => {
    if (!val) return '""';
    const clean = val.replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = applications.map((app) => [
    escapeCSV(app.dateApplied || app.dateAdded),
    escapeCSV(app.company),
    escapeCSV(app.jobTitle),
    escapeCSV(app.status),
    escapeCSV(app.lastContact && app.status.includes('Interview') ? app.lastContact : '-'),
    escapeCSV(app.nextFollowUp || '-'),
    escapeCSV(app.salary || '$50,000 - $65,000'),
    escapeCSV(app.notes || app.nextAction),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadCSV(content: string, filename = 'Job_Application_Tracker.csv') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
