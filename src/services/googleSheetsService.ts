import * as XLSX from 'xlsx';
import { Application, ContactItem, DataLists, ResumeItem } from '../types';
import { calculateKpis, calculatePipeline } from '../utils/calculations';

export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

// Color Palette Constants: ["#780000","#c1121f","#fdf0d5","#003049","#669bbc"]
export const PALETTE = {
  wine: '#780000',     // Deep Crimson / Wine
  ruby: '#c1121f',     // Radiant Ruby Red
  cream: '#fdf0d5',    // Warm Almond Cream / Ivory
  navy: '#003049',     // Deep Prussian Navy
  denim: '#669bbc',    // Soft Cerulean / Denim Blue
};

// Google Sheets Color Objects (RGB values normalized 0 to 1)
const GS_COLORS = {
  navy: { red: 0 / 255, green: 48 / 255, blue: 73 / 255 },        // #003049
  wine: { red: 120 / 255, green: 0 / 255, blue: 0 / 255 },        // #780000
  ruby: { red: 193 / 255, green: 18 / 255, blue: 31 / 255 },      // #c1121f
  cream: { red: 253 / 255, green: 240 / 255, blue: 213 / 255 },   // #fdf0d5
  denim: { red: 102 / 255, green: 155 / 255, blue: 188 / 255 },   // #669bbc
  white: { red: 1, green: 1, blue: 1 },
  creamWash: { red: 254 / 255, green: 248 / 255, blue: 236 / 255 },
  softGreen: { red: 234 / 255, green: 247 / 255, blue: 238 / 255 },
  darkGreen: { red: 30 / 255, green: 92 / 255, blue: 49 / 255 },
  softRed: { red: 253 / 255, green: 236 / 255, blue: 236 / 255 },
  softBlue: { red: 235 / 255, green: 243 / 255, blue: 248 / 255 },
};

export async function createGoogleSheet(
  accessToken: string,
  title: string,
  applications: Application[],
  resumes: ResumeItem[],
  contacts: ContactItem[],
  lists: DataLists
): Promise<CreateSpreadsheetResult> {
  // Step 1: Create Spreadsheet with 6 specifically styled Pinterest/Notion tabs
  const createPayload = {
    properties: {
      title: title || 'JOB SEARCH HQ — Career Command Center',
      defaultFormat: {
        textFormat: {
          fontFamily: 'Arial',
          fontSize: 10,
        },
      },
    },
    sheets: [
      {
        properties: {
          sheetId: 0,
          title: 'JOB SEARCH HQ',
          index: 0,
          tabColor: GS_COLORS.navy,
          gridProperties: {
            rowCount: 40,
            columnCount: 12,
            hideGridlines: false,
          },
        },
      },
      {
        properties: {
          sheetId: 1,
          title: 'APPLICATIONS',
          index: 1,
          tabColor: GS_COLORS.wine,
          gridProperties: {
            frozenRowCount: 1,
            frozenColumnCount: 4,
            rowCount: Math.max(applications.length + 50, 100),
            columnCount: 26,
            hideGridlines: false,
          },
        },
      },
      {
        properties: {
          sheetId: 2,
          title: 'FOLLOW-UP',
          index: 2,
          tabColor: GS_COLORS.ruby,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: Math.max(applications.length + 30, 60),
            columnCount: 10,
            hideGridlines: false,
          },
        },
      },
      {
        properties: {
          sheetId: 3,
          title: 'RESUME LIBRARY',
          index: 3,
          tabColor: GS_COLORS.denim,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: Math.max(resumes.length + 20, 50),
            columnCount: 10,
            hideGridlines: false,
          },
        },
      },
      {
        properties: {
          sheetId: 4,
          title: 'NETWORKING',
          index: 4,
          tabColor: GS_COLORS.navy,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: Math.max(contacts.length + 20, 50),
            columnCount: 11,
            hideGridlines: false,
          },
        },
      },
      {
        properties: {
          sheetId: 5,
          title: 'LISTS',
          index: 5,
          tabColor: GS_COLORS.cream,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 40,
            columnCount: 8,
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

  // Step 2: Prepare 100% accurate batch values for all tabs
  const kpis = calculateKpis(applications);
  const pipeline = calculatePipeline(applications);

  // Tab 1: JOB SEARCH HQ Dashboard
  const dashboardValues = [
    ['JOB SEARCH HQ — CAREER COMMAND CENTER', '', '', '', '', '', ''],
    ['Pinterest-Inspired Productivity & Job Search HQ Template (Color Palette: #780000 | #c1121f | #fdf0d5 | #003049 | #669bbc)', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['═══ LIVE CAREER METRICS & KPIS ═══', '', '', '', '', '', ''],
    [
      'Total Applications',
      'Applied (Past 7 Days)',
      'Active Interviews',
      'Offers Received',
      'Awaiting Response',
      'Closed / Rejected',
      'Live Response Rate',
    ],
    [
      '=COUNTA(APPLICATIONS!C2:C)',
      '=COUNTIFS(APPLICATIONS!B2:B, ">="&TODAY()-7, APPLICATIONS!B2:B, "<="&TODAY())',
      '=COUNTIF(APPLICATIONS!K2:K, "*Interview*")',
      '=COUNTIF(APPLICATIONS!K2:K, "Offer") + COUNTIF(APPLICATIONS!K2:K, "Accepted")',
      '=COUNTIF(APPLICATIONS!K2:K, "Applied") + COUNTIF(APPLICATIONS!K2:K, "Screening") + COUNTIF(APPLICATIONS!K2:K, "Application Viewed")',
      '=COUNTIF(APPLICATIONS!K2:K, "Rejected") + COUNTIF(APPLICATIONS!K2:K, "Ghosted") + COUNTIF(APPLICATIONS!K2:K, "Withdrawn")',
      '=IF(COUNTA(APPLICATIONS!C2:C)>0, TEXT((COUNTIF(APPLICATIONS!K2:K, "*Interview*") + COUNTIF(APPLICATIONS!K2:K, "Offer") + COUNTIF(APPLICATIONS!K2:K, "Accepted") + COUNTIF(APPLICATIONS!K2:K, "Rejected") + COUNTIF(APPLICATIONS!K2:K, "Screening")) / COUNTA(APPLICATIONS!C2:C), "0.0%"), "0.0%")',
    ],
    ['', '', '', '', '', '', ''],
    ['═══ APPLICATION PIPELINE STAGES ═══', '', '', '', '', '', ''],
    [
      'Wishlist & Prep',
      'Applied',
      'Screening',
      'Interviewing',
      'Final Round',
      'Offer Extended',
      'Accepted 🎉',
    ],
    [
      '=COUNTIF(APPLICATIONS!K2:K, "Wishlist") + COUNTIF(APPLICATIONS!K2:K, "Preparing")',
      '=COUNTIF(APPLICATIONS!K2:K, "Applied") + COUNTIF(APPLICATIONS!K2:K, "Application Viewed")',
      '=COUNTIF(APPLICATIONS!K2:K, "Screening")',
      '=COUNTIF(APPLICATIONS!K2:K, "Interview") + COUNTIF(APPLICATIONS!K2:K, "Technical Interview")',
      '=COUNTIF(APPLICATIONS!K2:K, "Final Interview")',
      '=COUNTIF(APPLICATIONS!K2:K, "Offer")',
      '=COUNTIF(APPLICATIONS!K2:K, "Accepted")',
    ],
    ['', '', '', '', '', '', ''],
    ['═══ WORKBOOK ARCHITECTURE & TABS ═══', '', '', '', '', '', ''],
    ['Tab Name', 'Theme Accent', 'Purpose & Features', '', '', '', ''],
    ['APPLICATIONS', 'Deep Crimson (#780000)', 'Master Application Tracker with 26 fields, auto-filters, smart days calculation & data validation dropdowns', '', '', '', ''],
    ['FOLLOW-UP', 'Ruby Red (#c1121f)', 'Dedicated Action Center showing overdue dates, next steps, and recruiter outreach schedule', '', '', '', ''],
    ['RESUME LIBRARY', 'Soft Denim (#669bbc)', 'Targeted resume versions, skills inventory, and direct Google Drive file links', '', '', '', ''],
    ['NETWORKING', 'Deep Navy (#003049)', 'Professional contacts, relationship status, LinkedIn handles, and conversation notes', '', '', '', ''],
    ['LISTS', 'Warm Almond (#fdf0d5)', 'Master data validation reference lists keeping statuses and entries 100% standardized', '', '', '', ''],
  ];

  // Tab 2: APPLICATIONS table (26 detailed columns)
  const applicationHeaders = [
    'Date Added',
    'Date Applied',
    'Company',
    'Job Title / Post',
    'Job URL',
    'Location',
    'Employment Type',
    'Salary',
    'Resume Used',
    'Cover Letter',
    'Status',
    'Origin',
    'Contact Name',
    'Contact Role',
    'Contact Method',
    'Contact Email/URL',
    'Last Contact',
    'Next Follow-up',
    'Follow-up Status',
    'Days Since Applied',
    'Days Until Follow-up',
    'Job Requirements',
    'Why I Applied',
    'Interview Notes',
    'Next Action',
    'Notes',
  ];

  const applicationRows = applications.map((app, index) => {
    const rowNum = index + 2;
    // Robust, 100% accurate date formulas handling both dates and strings safely
    const daysSinceAppliedFormula = `=IF(ISBLANK(B${rowNum}), "", IF(ISNUMBER(B${rowNum}), INT(TODAY()-B${rowNum}), INT(TODAY()-DATEVALUE(B${rowNum}))))`;
    const daysUntilFollowUpFormula = `=IF(ISBLANK(R${rowNum}), "", IF(ISNUMBER(R${rowNum}), INT(R${rowNum}-TODAY()), INT(DATEVALUE(R${rowNum})-TODAY())))`;

    return [
      app.dateAdded || '',
      app.dateApplied || '',
      app.company || '',
      app.jobTitle || '',
      app.jobUrl || '',
      app.location || '',
      app.employmentType || '',
      app.salary || '',
      app.resumeUsed || '',
      app.coverLetter || '',
      app.status || '',
      app.origin || '',
      app.contactName || '',
      app.contactRole || '',
      app.contactMethod || '',
      app.contactInfo || '',
      app.lastContact || '',
      app.nextFollowUp || '',
      app.followUpStatus || '',
      daysSinceAppliedFormula,
      daysUntilFollowUpFormula,
      app.jobRequirements || '',
      app.whyIApplied || '',
      app.interviewNotes || '',
      app.nextAction || '',
      app.notes || '',
    ];
  });

  // Tab 3: FOLLOW-UP table
  const followUpHeaders = [
    'Company',
    'Position',
    'Contact Name',
    'Contact Info',
    'Last Contact',
    'Follow-up Date',
    'Status',
    'Next Action',
    'Notes',
  ];

  const followUpRows = applications
    .filter(
      (a) =>
        a.nextFollowUp &&
        !['Rejected', 'Withdrawn', 'Ghosted'].includes(a.status)
    )
    .map((app) => [
      app.company,
      app.jobTitle,
      app.contactName || '—',
      app.contactInfo || '—',
      app.lastContact || '—',
      app.nextFollowUp || '—',
      app.followUpStatus || 'Scheduled',
      app.nextAction || '',
      app.notes || '',
    ]);

  // Tab 4: RESUME LIBRARY
  const resumeHeaders = [
    'Resume Name',
    'Target Role',
    'Version',
    'Date Created',
    'Last Updated',
    'Used For',
    'File / Link',
    'Skills',
    'Notes',
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
    res.notes || '',
  ]);

  // Tab 5: NETWORKING & CONTACTS
  const contactHeaders = [
    'Name',
    'Company',
    'Role',
    'Relationship',
    'LinkedIn',
    'Email',
    'Phone',
    'Last Contact',
    'Next Follow-up',
    'Notes',
  ];

  const contactRows = contacts.map((c) => [
    c.name,
    c.company,
    c.role,
    c.relationship,
    c.linkedIn || '',
    c.email || '',
    c.phone || '',
    c.lastContact || '',
    c.nextFollowUp || '',
    c.notes || '',
  ]);

  // Tab 6: LISTS (Data Validation Sources)
  const maxListLength = Math.max(
    lists.statuses.length,
    lists.resumes.length,
    lists.origins.length,
    lists.employmentTypes.length,
    lists.contactMethods.length,
    lists.followUpStatuses.length
  );

  const listHeaders = [
    'Status',
    'Resume Used',
    'Origin',
    'Employment Type',
    'Contact Method',
    'Follow-up Status',
  ];

  const listRows: string[][] = [];
  for (let i = 0; i < maxListLength; i++) {
    listRows.push([
      lists.statuses[i] || '',
      lists.resumes[i] || '',
      lists.origins[i] || '',
      lists.employmentTypes[i] || '',
      lists.contactMethods[i] || '',
      lists.followUpStatuses[i] || '',
    ]);
  }

  // Step 3: Write all data into sheets
  const data = [
    {
      range: "'JOB SEARCH HQ'!A1",
      values: dashboardValues,
    },
    {
      range: "'APPLICATIONS'!A1",
      values: [applicationHeaders, ...applicationRows],
    },
    {
      range: "'FOLLOW-UP'!A1",
      values: [followUpHeaders, ...followUpRows],
    },
    {
      range: "'RESUME LIBRARY'!A1",
      values: [resumeHeaders, ...resumeRows],
    },
    {
      range: "'NETWORKING'!A1",
      values: [contactHeaders, ...contactRows],
    },
    {
      range: "'LISTS'!A1",
      values: [listHeaders, ...listRows],
    },
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data,
      }),
    }
  );

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    console.warn('Failed to batch update values to Google Sheet:', errorText);
  }

  // Step 4: Apply Pinterest Aesthetic Formatting via batchUpdate (Colors: #780000, #c1121f, #fdf0d5, #003049, #669bbc)
  try {
    const formatRequests: any[] = [];

    // 1. Style Header Rows across all data sheets (Navy #003049 background, Cream #fdf0d5 bold text)
    const sheetsWithHeader = [1, 2, 3, 4, 5];
    for (const sId of sheetsWithHeader) {
      formatRequests.push({
        repeatCell: {
          range: {
            sheetId: sId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: GS_COLORS.navy,
              textFormat: {
                foregroundColor: GS_COLORS.cream,
                bold: true,
                fontSize: 10,
              },
              verticalAlignment: 'MIDDLE',
              wrapStrategy: 'CLIP',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,wrapStrategy)',
        },
      });

      // Set header row height to spacious 38px
      formatRequests.push({
        updateDimensionProperties: {
          range: {
            sheetId: sId,
            dimension: 'ROWS',
            startIndex: 0,
            endIndex: 1,
          },
          properties: {
            pixelSize: 38,
          },
          fields: 'pixelSize',
        },
      });

      // Enable Google Sheets Basic Filter on headers
      formatRequests.push({
        setBasicFilter: {
          filter: {
            range: {
              sheetId: sId,
              startRowIndex: 0,
              endRowIndex: 500,
            },
          },
        },
      });
    }

    // 2. Format Sheet 0 (JOB SEARCH HQ Dashboard) with Luxury Pinterest Styling
    // Title Banner
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 7,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.navy,
            textFormat: {
              foregroundColor: GS_COLORS.cream,
              bold: true,
              fontSize: 14,
            },
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)',
      },
    });

    formatRequests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'ROWS',
          startIndex: 0,
          endIndex: 1,
        },
        properties: {
          pixelSize: 42,
        },
        fields: 'pixelSize',
      },
    });

    // KPI Metric Header Row in JOB SEARCH HQ (Wine #780000)
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 4,
          endRowIndex: 5,
          startColumnIndex: 0,
          endColumnIndex: 7,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.wine,
            textFormat: {
              foregroundColor: GS_COLORS.cream,
              bold: true,
              fontSize: 10,
            },
            verticalAlignment: 'MIDDLE',
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,horizontalAlignment)',
      },
    });

    // KPI Values Row in JOB SEARCH HQ (Cream #fdf0d5 with Navy #003049 Bold Numbers)
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 5,
          endRowIndex: 6,
          startColumnIndex: 0,
          endColumnIndex: 7,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.cream,
            textFormat: {
              foregroundColor: GS_COLORS.navy,
              bold: true,
              fontSize: 14,
            },
            verticalAlignment: 'MIDDLE',
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,horizontalAlignment)',
      },
    });

    formatRequests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'ROWS',
          startIndex: 5,
          endIndex: 6,
        },
        properties: {
          pixelSize: 45,
        },
        fields: 'pixelSize',
      },
    });

    // Pipeline Header Row in JOB SEARCH HQ (Denim #669bbc)
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 8,
          endRowIndex: 9,
          startColumnIndex: 0,
          endColumnIndex: 7,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.denim,
            textFormat: {
              foregroundColor: GS_COLORS.white,
              bold: true,
              fontSize: 10,
            },
            verticalAlignment: 'MIDDLE',
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,horizontalAlignment)',
      },
    });

    // Pipeline Counts Row (Soft Almond #fdf0d5)
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 9,
          endRowIndex: 10,
          startColumnIndex: 0,
          endColumnIndex: 7,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: GS_COLORS.cream,
            textFormat: {
              foregroundColor: GS_COLORS.navy,
              bold: true,
              fontSize: 13,
            },
            verticalAlignment: 'MIDDLE',
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,horizontalAlignment)',
      },
    });

    // 3. Set tailored column widths for APPLICATIONS sheet
    const appColWidths = [
      { start: 0, end: 1, width: 100 }, // Date Added
      { start: 1, end: 2, width: 105 }, // Date Applied
      { start: 2, end: 3, width: 160 }, // Company
      { start: 3, end: 4, width: 180 }, // Job Title
      { start: 4, end: 5, width: 110 }, // Job URL
      { start: 5, end: 6, width: 130 }, // Location
      { start: 6, end: 7, width: 120 }, // Type
      { start: 7, end: 8, width: 115 }, // Salary
      { start: 8, end: 9, width: 140 }, // Resume Used
      { start: 9, end: 10, width: 95 }, // Cover Letter
      { start: 10, end: 11, width: 140 }, // Status
      { start: 11, end: 12, width: 120 }, // Origin
      { start: 12, end: 13, width: 130 }, // Contact Name
      { start: 13, end: 14, width: 120 }, // Contact Role
      { start: 14, end: 15, width: 110 }, // Contact Method
      { start: 15, end: 16, width: 140 }, // Contact Info
      { start: 16, end: 17, width: 105 }, // Last Contact
      { start: 17, end: 18, width: 115 }, // Next Follow-up
      { start: 18, end: 19, width: 120 }, // Follow-up Status
      { start: 19, end: 20, width: 125 }, // Days Since Applied
      { start: 20, end: 21, width: 135 }, // Days Until Follow-up
      { start: 21, end: 22, width: 180 }, // Job Requirements
      { start: 22, end: 23, width: 180 }, // Why I Applied
      { start: 23, end: 24, width: 200 }, // Interview Notes
      { start: 24, end: 25, width: 180 }, // Next Action
      { start: 25, end: 26, width: 220 }, // Notes
    ];

    for (const w of appColWidths) {
      formatRequests.push({
        updateDimensionProperties: {
          range: {
            sheetId: 1,
            dimension: 'COLUMNS',
            startIndex: w.start,
            endIndex: w.end,
          },
          properties: {
            pixelSize: w.width,
          },
          fields: 'pixelSize',
        },
      });
    }

    // 4. Data Validation Dropdowns linked to LISTS tab
    // Status Column (Col 10)
    formatRequests.push({
      setDataValidation: {
        range: {
          sheetId: 1,
          startRowIndex: 1,
          endRowIndex: 500,
          startColumnIndex: 10,
          endColumnIndex: 11,
        },
        rule: {
          condition: {
            type: 'ONE_OF_RANGE',
            values: [{ userEnteredValue: "='LISTS'!$A$2:$A$20" }],
          },
          strict: false,
          showCustomUi: true,
        },
      },
    });

    // Resume Used Column (Col 8)
    formatRequests.push({
      setDataValidation: {
        range: {
          sheetId: 1,
          startRowIndex: 1,
          endRowIndex: 500,
          startColumnIndex: 8,
          endColumnIndex: 9,
        },
        rule: {
          condition: {
            type: 'ONE_OF_RANGE',
            values: [{ userEnteredValue: "='LISTS'!$B$2:$B$20" }],
          },
          strict: false,
          showCustomUi: true,
        },
      },
    });

    // Origin Column (Col 11)
    formatRequests.push({
      setDataValidation: {
        range: {
          sheetId: 1,
          startRowIndex: 1,
          endRowIndex: 500,
          startColumnIndex: 11,
          endColumnIndex: 12,
        },
        rule: {
          condition: {
            type: 'ONE_OF_RANGE',
            values: [{ userEnteredValue: "='LISTS'!$C$2:$C$20" }],
          },
          strict: false,
          showCustomUi: true,
        },
      },
    });

    // Employment Type Column (Col 6)
    formatRequests.push({
      setDataValidation: {
        range: {
          sheetId: 1,
          startRowIndex: 1,
          endRowIndex: 500,
          startColumnIndex: 6,
          endColumnIndex: 7,
        },
        rule: {
          condition: {
            type: 'ONE_OF_RANGE',
            values: [{ userEnteredValue: "='LISTS'!$D$2:$D$20" }],
          },
          strict: false,
          showCustomUi: true,
        },
      },
    });

    // 5. Conditional Formatting for Pinterest Aesthetics
    // Highlight Offers in Soft Green
    formatRequests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [
            {
              sheetId: 1,
              startRowIndex: 1,
              endRowIndex: 500,
              startColumnIndex: 10,
              endColumnIndex: 11,
            },
          ],
          booleanRule: {
            condition: {
              type: 'TEXT_EQ',
              values: [{ userEnteredValue: 'Offer' }],
            },
            format: {
              backgroundColor: GS_COLORS.softGreen,
              textFormat: { foregroundColor: GS_COLORS.darkGreen, bold: true },
            },
          },
        },
        index: 0,
      },
    });

    // Highlight Interviews in Soft Denim Blue
    formatRequests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [
            {
              sheetId: 1,
              startRowIndex: 1,
              endRowIndex: 500,
              startColumnIndex: 10,
              endColumnIndex: 11,
            },
          ],
          booleanRule: {
            condition: {
              type: 'TEXT_CONTAINS',
              values: [{ userEnteredValue: 'Interview' }],
            },
            format: {
              backgroundColor: GS_COLORS.softBlue,
              textFormat: { foregroundColor: GS_COLORS.navy, bold: true },
            },
          },
        },
        index: 1,
      },
    });

    // Highlight Overdue Follow-ups in Soft Ruby Red
    formatRequests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [
            {
              sheetId: 1,
              startRowIndex: 1,
              endRowIndex: 500,
              startColumnIndex: 20,
              endColumnIndex: 21,
            },
          ],
          booleanRule: {
            condition: {
              type: 'NUMBER_LESS',
              values: [{ userEnteredValue: '0' }],
            },
            format: {
              backgroundColor: GS_COLORS.softRed,
              textFormat: { foregroundColor: GS_COLORS.wine, bold: true },
            },
          },
        },
        index: 2,
      },
    });

    // Execute format requests
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: formatRequests }),
    });
  } catch (fmtErr) {
    console.warn('Non-fatal Google Sheets styling warning:', fmtErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: title || 'JOB SEARCH HQ — Career Command Center',
  };
}

/**
 * Downloads a genuine multi-worksheet Excel workbook (.xlsx)
 * styled according to the user's Pinterest palette:
 * ["#780000","#c1121f","#fdf0d5","#003049","#669bbc"]
 */
export function downloadExcelWorkbook(
  applications: Application[],
  resumes: ResumeItem[],
  contacts: ContactItem[],
  lists: DataLists,
  filename = 'Job-Search-HQ-Career-Dashboard.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. Dashboard Sheet (JOB SEARCH HQ)
  const kpis = calculateKpis(applications);
  const pipeline = calculatePipeline(applications);

  const dashboardData = [
    ['JOB SEARCH HQ — CAREER COMMAND CENTER'],
    ['Pinterest-Inspired Productivity Dashboard (Palette: #780000 | #c1121f | #fdf0d5 | #003049 | #669bbc)'],
    [],
    ['KEY PERFORMANCE INDICATORS'],
    ['Metric', 'Current Value', 'Target / Status'],
    ['Total Applications Tracked', kpis.total, 'Active Database'],
    ['Applied Past 7 Days', kpis.appliedThisWeek, 'Weekly Momentum'],
    ['Active Interviews', kpis.interviews, 'Interview Stage'],
    ['Offers Received', kpis.offers, 'Offers & Accepted'],
    ['Awaiting Response', kpis.awaitingResponse, 'In Review'],
    ['Closed / Rejected', kpis.rejected, 'Closed Out'],
    ['Response Rate', `${kpis.responseRate}%`, 'Industry Avg ~10-15%'],
    [],
    ['APPLICATION PIPELINE BREAKDOWN'],
    ['Pipeline Stage', 'Count', 'Share of Total'],
    ...pipeline.map((p) => [
      p.label,
      p.count,
      kpis.total > 0 ? `${Math.round((p.count / kpis.total) * 100)}%` : '0%',
    ]),
  ];
  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
  wsDashboard['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'JOB SEARCH HQ');

  // 2. Applications Sheet
  const appHeaders = [
    'Date Added',
    'Date Applied',
    'Company',
    'Job Title',
    'Job URL',
    'Location',
    'Employment Type',
    'Salary',
    'Resume Used',
    'Cover Letter',
    'Status',
    'Origin',
    'Contact Name',
    'Contact Role',
    'Contact Method',
    'Contact Info',
    'Last Contact',
    'Next Follow-up',
    'Follow-up Status',
    'Job Requirements',
    'Why I Applied',
    'Interview Notes',
    'Next Action',
    'Notes',
  ];

  const appRows = applications.map((a) => [
    a.dateAdded || '',
    a.dateApplied || '',
    a.company || '',
    a.jobTitle || '',
    a.jobUrl || '',
    a.location || '',
    a.employmentType || '',
    a.salary || '',
    a.resumeUsed || '',
    a.coverLetter || '',
    a.status || '',
    a.origin || '',
    a.contactName || '',
    a.contactRole || '',
    a.contactMethod || '',
    a.contactInfo || '',
    a.lastContact || '',
    a.nextFollowUp || '',
    a.followUpStatus || '',
    a.jobRequirements || '',
    a.whyIApplied || '',
    a.interviewNotes || '',
    a.nextAction || '',
    a.notes || '',
  ]);

  const wsApps = XLSX.utils.aoa_to_sheet([appHeaders, ...appRows]);
  wsApps['!cols'] = [
    { wch: 12 }, // Date Added
    { wch: 12 }, // Date Applied
    { wch: 20 }, // Company
    { wch: 24 }, // Job Title
    { wch: 25 }, // Job URL
    { wch: 16 }, // Location
    { wch: 14 }, // Employment Type
    { wch: 14 }, // Salary
    { wch: 20 }, // Resume Used
    { wch: 12 }, // Cover Letter
    { wch: 16 }, // Status
    { wch: 16 }, // Origin
    { wch: 16 }, // Contact Name
    { wch: 16 }, // Contact Role
    { wch: 14 }, // Contact Method
    { wch: 20 }, // Contact Info
    { wch: 12 }, // Last Contact
    { wch: 14 }, // Next Follow-up
    { wch: 14 }, // Follow-up Status
    { wch: 24 }, // Requirements
    { wch: 24 }, // Why Applied
    { wch: 28 }, // Interview Notes
    { wch: 24 }, // Next Action
    { wch: 30 }, // Notes
  ];
  XLSX.utils.book_append_sheet(wb, wsApps, 'APPLICATIONS');

  // 3. Follow-up Sheet
  const followUpHeaders = [
    'Company',
    'Position',
    'Contact Name',
    'Contact Info',
    'Last Contact',
    'Follow-up Date',
    'Status',
    'Next Action',
    'Notes',
  ];
  const followUpRows = applications
    .filter(
      (a) =>
        a.nextFollowUp &&
        !['Rejected', 'Withdrawn', 'Ghosted'].includes(a.status)
    )
    .map((app) => [
      app.company,
      app.jobTitle,
      app.contactName || '—',
      app.contactInfo || '—',
      app.lastContact || '—',
      app.nextFollowUp || '—',
      app.followUpStatus || 'Scheduled',
      app.nextAction || '',
      app.notes || '',
    ]);

  const wsFollowUp = XLSX.utils.aoa_to_sheet([followUpHeaders, ...followUpRows]);
  wsFollowUp['!cols'] = [
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsFollowUp, 'FOLLOW-UP');

  // 4. Resume Library Sheet
  const resumeHeaders = [
    'Resume Name',
    'Target Role',
    'Version',
    'Date Created',
    'Last Updated',
    'Used For',
    'File / Link',
    'Skills',
    'Notes',
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
    res.notes || '',
  ]);
  const wsResumes = XLSX.utils.aoa_to_sheet([resumeHeaders, ...resumeRows]);
  wsResumes['!cols'] = [
    { wch: 22 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsResumes, 'RESUME LIBRARY');

  // 5. Networking Sheet
  const contactHeaders = [
    'Name',
    'Company',
    'Role',
    'Relationship',
    'LinkedIn',
    'Email',
    'Phone',
    'Last Contact',
    'Next Follow-up',
    'Notes',
  ];
  const contactRows = contacts.map((c) => [
    c.name,
    c.company,
    c.role,
    c.relationship,
    c.linkedIn || '',
    c.email || '',
    c.phone || '',
    c.lastContact || '',
    c.nextFollowUp || '',
    c.notes || '',
  ]);
  const wsContacts = XLSX.utils.aoa_to_sheet([contactHeaders, ...contactRows]);
  wsContacts['!cols'] = [
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 25 },
    { wch: 25 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsContacts, 'NETWORKING');

  // 6. Lists Sheet (Validation lists)
  const maxListLength = Math.max(
    lists.statuses.length,
    lists.resumes.length,
    lists.origins.length,
    lists.employmentTypes.length,
    lists.contactMethods.length,
    lists.followUpStatuses.length
  );
  const listHeaders = [
    'Status',
    'Resume Used',
    'Origin',
    'Employment Type',
    'Contact Method',
    'Follow-up Status',
  ];
  const listRows: string[][] = [];
  for (let i = 0; i < maxListLength; i++) {
    listRows.push([
      lists.statuses[i] || '',
      lists.resumes[i] || '',
      lists.origins[i] || '',
      lists.employmentTypes[i] || '',
      lists.contactMethods[i] || '',
      lists.followUpStatuses[i] || '',
    ]);
  }
  const wsLists = XLSX.utils.aoa_to_sheet([listHeaders, ...listRows]);
  wsLists['!cols'] = [
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLists, 'LISTS');

  // Write Excel file and trigger download
  XLSX.writeFile(wb, filename);
}

export function exportApplicationsToCSV(applications: Application[]): string {
  const headers = [
    'Date Added',
    'Date Applied',
    'Company',
    'Job Title',
    'Job URL',
    'Location',
    'Employment Type',
    'Salary',
    'Resume Used',
    'Cover Letter',
    'Status',
    'Origin',
    'Contact Name',
    'Contact Role',
    'Contact Method',
    'Contact Info',
    'Last Contact',
    'Next Follow-up',
    'Follow-up Status',
    'Job Requirements',
    'Why I Applied',
    'Interview Notes',
    'Next Action',
    'Notes',
  ];

  const escapeCSV = (val?: string) => {
    if (!val) return '""';
    const clean = val.replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = applications.map((app) => [
    escapeCSV(app.dateAdded),
    escapeCSV(app.dateApplied),
    escapeCSV(app.company),
    escapeCSV(app.jobTitle),
    escapeCSV(app.jobUrl),
    escapeCSV(app.location),
    escapeCSV(app.employmentType),
    escapeCSV(app.salary),
    escapeCSV(app.resumeUsed),
    escapeCSV(app.coverLetter),
    escapeCSV(app.status),
    escapeCSV(app.origin),
    escapeCSV(app.contactName),
    escapeCSV(app.contactRole),
    escapeCSV(app.contactMethod),
    escapeCSV(app.contactInfo),
    escapeCSV(app.lastContact),
    escapeCSV(app.nextFollowUp),
    escapeCSV(app.followUpStatus),
    escapeCSV(app.jobRequirements),
    escapeCSV(app.whyIApplied),
    escapeCSV(app.interviewNotes),
    escapeCSV(app.nextAction),
    escapeCSV(app.notes),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadCSV(content: string, filename = 'job-search-hq.csv') {
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
