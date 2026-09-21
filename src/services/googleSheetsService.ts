import * as XLSX from "xlsx";
import { Application, ContactItem, DataLists, ResumeItem } from "../types";
import { calculateKpis, calculatePipeline } from "../utils/calculations";

export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

// Pinterest-inspired sage, cream, blush and ink palette.
// Designed for visual hierarchy first: generous whitespace, short labels, clear sections.
export const SAGE_PALETTE = {
  sage: "#789783",
  sageDark: "#3F5D50",
  sageSoft: "#EAF0EC",
  sagePale: "#F5F8F6",
  blush: "#F7E4E8",
  blushDark: "#A85468",
  peach: "#F8E9DF",
  peachDark: "#A9684D",
  cream: "#FBF8F3",
  white: "#FFFFFF",
  charcoal: "#27332E",
  muted: "#718078",
  border: "#DDE5E0",
  blueSoft: "#E7EEF4",
  blueDark: "#526E82",
  greenSoft: "#E3F0E7",
  greenDark: "#4F765C",
  redSoft: "#F8E5E5",
  redDark: "#A85C5C",
  yellowSoft: "#F8F0D8",
  yellowDark: "#8A7334",
};

const GS_COLORS = {
  sage: { red: 120 / 255, green: 151 / 255, blue: 131 / 255 },
  sageDark: { red: 63 / 255, green: 93 / 255, blue: 80 / 255 },
  sageSoft: { red: 234 / 255, green: 240 / 255, blue: 236 / 255 },
  sagePale: { red: 245 / 255, green: 248 / 255, blue: 246 / 255 },
  blush: { red: 247 / 255, green: 228 / 255, blue: 232 / 255 },
  blushDark: { red: 168 / 255, green: 84 / 255, blue: 104 / 255 },
  peach: { red: 248 / 255, green: 233 / 255, blue: 223 / 255 },
  peachDark: { red: 169 / 255, green: 104 / 255, blue: 77 / 255 },
  cream: { red: 251 / 255, green: 248 / 255, blue: 243 / 255 },
  white: { red: 1, green: 1, blue: 1 },
  charcoal: { red: 39 / 255, green: 51 / 255, blue: 46 / 255 },
  muted: { red: 113 / 255, green: 128 / 255, blue: 120 / 255 },
  border: { red: 221 / 255, green: 229 / 255, blue: 224 / 255 },
  blueSoft: { red: 231 / 255, green: 238 / 255, blue: 244 / 255 },
  blueDark: { red: 82 / 255, green: 110 / 255, blue: 130 / 255 },
  greenSoft: { red: 227 / 255, green: 240 / 255, blue: 231 / 255 },
  greenDark: { red: 79 / 255, green: 118 / 255, blue: 92 / 255 },
  redSoft: { red: 248 / 255, green: 229 / 255, blue: 229 / 255 },
  redDark: { red: 168 / 255, green: 92 / 255, blue: 92 / 255 },
  yellowSoft: { red: 248 / 255, green: 240 / 255, blue: 216 / 255 },
  yellowDark: { red: 138 / 255, green: 115 / 255, blue: 52 / 255 },
};

const SHEET_FONT = "Montserrat";

function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function range(
  sheetId: number,
  r1: number,
  r2: number,
  c1: number,
  c2: number,
) {
  return {
    sheetId,
    startRowIndex: r1,
    endRowIndex: r2,
    startColumnIndex: c1,
    endColumnIndex: c2,
  };
}

function cellFormat(
  sheetId: number,
  r1: number,
  r2: number,
  c1: number,
  c2: number,
  format: any,
  fields: string,
) {
  return {
    repeatCell: {
      range: range(sheetId, r1, r2, c1, c2),
      cell: { userEnteredFormat: format },
      fields: `userEnteredFormat(${fields})`,
    },
  };
}

/**
 * Creates a Google Sheet workbook with a Pinterest/Etsy-style visual system:
 * cream canvas, sage section bars, soft cards, pill-like status colors,
 * compact tracker tables, and a dashboard that reads like a planner rather than a database.
 */
export async function createGoogleSheet(
  accessToken: string,
  title: string,
  applications: Application[],
  resumes: ResumeItem[],
  contacts: ContactItem[],
  lists: DataLists,
): Promise<CreateSpreadsheetResult> {
  const createPayload = {
    properties: {
      title: title || "Job Search Planner ♡",
      defaultFormat: {
        backgroundColor: GS_COLORS.cream,
        textFormat: {
          fontFamily: SHEET_FONT,
          fontSize: 10,
          foregroundColor: GS_COLORS.charcoal,
        },
      },
    },
    sheets: [
      {
        properties: {
          sheetId: 0,
          title: "DASHBOARD",
          index: 0,
          tabColor: GS_COLORS.sage,
          gridProperties: {
            rowCount: 45,
            columnCount: 12,
            hideGridlines: true,
          },
        },
      },
      {
        properties: {
          sheetId: 1,
          title: "APPLICATIONS",
          index: 1,
          tabColor: GS_COLORS.sage,
          gridProperties: {
            frozenRowCount: 3,
            rowCount: Math.max(applications.length + 10, 100),
            columnCount: 11,
            hideGridlines: true,
          },
        },
      },
      {
        properties: {
          sheetId: 2,
          title: "INTERVIEWS",
          index: 2,
          tabColor: GS_COLORS.sageDark,
          gridProperties: {
            frozenRowCount: 3,
            rowCount: Math.max(applications.length + 10, 60),
            columnCount: 7,
            hideGridlines: true,
          },
        },
      },
      {
        properties: {
          sheetId: 3,
          title: "FOLLOW UPS",
          index: 3,
          tabColor: GS_COLORS.blushDark,
          gridProperties: {
            frozenRowCount: 3,
            rowCount: Math.max(applications.length + 10, 60),
            columnCount: 7,
            hideGridlines: true,
          },
        },
      },
      {
        properties: {
          sheetId: 4,
          title: "RESUME LIBRARY",
          index: 4,
          tabColor: GS_COLORS.sageSoft,
          gridProperties: {
            frozenRowCount: 3,
            rowCount: Math.max(resumes.length + 10, 50),
            columnCount: 10,
            hideGridlines: true,
          },
        },
      },
      {
        properties: {
          sheetId: 5,
          title: "CONTACTS",
          index: 5,
          tabColor: GS_COLORS.peachDark,
          gridProperties: {
            frozenRowCount: 3,
            rowCount: Math.max(contacts.length + 10, 50),
            columnCount: 7,
            hideGridlines: true,
          },
        },
      },
    ],
  };

  const createRes = await fetch(
    "https://sheets.googleapis.com/v4/spreadsheets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    },
  );

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(
      `Failed to create spreadsheet: ${createRes.status} ${errorText}`,
    );
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const kpis = calculateKpis(applications);
  const pipeline = calculatePipeline(applications);
  const total = applications.length;

  // DASHBOARD — intentionally spaced into visual "cards".
  const dashboardValues = [
    [
      "JOB SEARCH PLANNER ♡",
      "",
      "",
      "",
      "A little progress every day.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "TRACK • APPLY • FOLLOW UP • GROW",
      "",
      "",
      "",
      "You are building momentum.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", ""],
    [
      "YOUR PROGRESS",
      "",
      "",
      "",
      "APPLICATION PIPELINE",
      "",
      "",
      "",
      "THIS WEEK",
      "",
      "",
      "",
    ],
    [
      "Applications",
      total,
      "↗",
      "Interviews",
      kpis.interviews,
      "Offers",
      kpis.offers,
      "Pending",
      kpis.applied + kpis.screening,
      "Follow-ups",
      applications.filter((a) => a.nextFollowUp).length,
      "",
      "",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", ""],
    [
      "STATUS SNAPSHOT",
      "",
      "",
      "",
      "MONTHLY RHYTHM",
      "",
      "",
      "",
      "INTERVIEW STAGES",
      "",
      "",
      "",
    ],
    [
      "Applied",
      kpis.applied,
      "",
      "Jan",
      0,
      "",
      "Initial Interview",
      pipeline.find((p) => p.status === "Interview")?.count || 0,
      "",
      "",
      "",
      "",
    ],
    [
      "Screening",
      kpis.screening,
      "",
      "Feb",
      0,
      "",
      "Technical Interview",
      pipeline.find((p) => p.status === "Technical Interview")?.count || 0,
      "",
      "",
      "",
      "",
    ],
    [
      "Interview",
      kpis.interviews,
      "",
      "Mar",
      0,
      "",
      "Final Interview",
      pipeline.find((p) => p.status === "Final Interview")?.count || 0,
      "",
      "",
      "",
      "",
    ],
    [
      "Offer",
      kpis.offers,
      "",
      "Apr",
      0,
      "",
      "Waiting for Feedback",
      applications.filter(
        (a) => a.interviewNotes && /waiting/i.test(a.interviewNotes),
      ).length,
      "",
      "",
      "",
      "",
    ],
    ["Rejected", kpis.rejected, "", "May", 0, "", "", "", "", "", "", ""],
    [
      "Not Interested",
      applications.filter((a) => ["Ghosted", "Withdrawn"].includes(a.status))
        .length,
      "",
      "Jun",
      0,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["", "", "", "Jul–Dec", 0, "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", ""],
    ["QUICK REMINDERS", "", "", "", "", "", "", "", "", "", "", ""],
    [
      "→ Keep your tracker updated after every application.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "→ Follow up when a date is due — not when you remember.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "→ Save each tailored CV version in the Resume Library.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", ""],
    ["TODAY", "CHECK", "NEXT ACTION", "", "", "", "", "", "", "", "", ""],
    [
      "□",
      "Applications",
      "Add any applications you sent today.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "□",
      "Follow-ups",
      "Check anything due in the next 3 days.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "□",
      "Resume",
      "Keep your strongest role-specific version ready.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
  ];

  const appHeaders = [
    ["APPLICATIONS", "", "", "", "", "", "", "", "", "", ""],
    [
      "Your main job-search log — keep one row per application.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Date Applied",
      "Company",
      "Job Title",
      "Status",
      "Interview Date",
      "Follow Up",
      "Salary Range",
      "Post / URL",
      "Resume Used",
      "Source",
      "Notes",
    ],
  ];
  const appRows = applications.map((a: any) => [
    a.dateApplied || a.dateAdded || "",
    a.company || "",
    a.jobTitle || "",
    a.status || "",
    a.lastContact && String(a.status || "").includes("Interview")
      ? a.lastContact
      : a.status === "Interview"
        ? a.lastContact || "-"
        : "-",
    a.nextFollowUp || "-",
    a.salary || "",
    a.url || a.postUrl || a.jobUrl || "",
    a.resumeUsed || a.resume || "",
    a.source || a.origin || "",
    a.notes || a.nextAction || "",
  ]);

  const interviewHeaders = [
    ["INTERVIEWS", "", "", "", "", "", ""],
    ["Prepare • attend • record outcome • learn.", "", "", "", "", "", ""],
    [
      "Company",
      "Job Title",
      "Interview Date",
      "Interview Type",
      "Outcome",
      "Contact",
      "Notes",
    ],
  ];
  const interviewRows = applications
    .filter(
      (a) =>
        a.status.includes("Interview") ||
        a.status === "Offer" ||
        a.interviewNotes,
    )
    .map((a: any) => [
      a.company || "",
      a.jobTitle || "",
      a.lastContact || a.nextFollowUp || "",
      a.status === "Technical Interview"
        ? "Technical Interview"
        : a.status === "Final Interview"
          ? "Final Interview"
          : "Initial Interview",
      a.status === "Offer"
        ? "Offer Received"
        : a.status === "Rejected"
          ? "Not Selected"
          : "Scheduled / Completed",
      a.contact || a.contactName || "",
      a.interviewNotes || a.notes || "",
    ]);

  const followUpHeaders = [
    ["FOLLOW UPS", "", "", "", "", "", ""],
    [
      "Never lose a follow-up because it lived in your memory.",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Company",
      "Date Applied",
      "Follow Up Date",
      "Status",
      "Contact",
      "Method",
      "Next Action",
    ],
  ];
  const followUpRows = applications.map((a: any) => [
    a.company || "",
    a.dateApplied || a.dateAdded || "",
    a.nextFollowUp || "—",
    a.followUpStatus ||
      (["Rejected", "Accepted", "Withdrawn"].includes(a.status)
        ? "Completed"
        : "Pending"),
    a.contact || a.contactName || "",
    a.followUpMethod || "Email",
    a.nextAction || a.notes || "Follow up",
  ]);

  const resumeHeaders = [
    ["RESUME LIBRARY", "", "", "", "", "", "", "", "", ""],
    [
      "Keep your tailored versions organised and easy to reuse.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Resume Name",
      "Target Role",
      "Version",
      "Date Created",
      "Last Updated",
      "Used For",
      "File / Link",
      "Skills",
      "Notes",
      "ATS / Keywords",
    ],
  ];
  const resumeRows = resumes.map((res: any) => [
    res.name || "",
    res.targetRole || "",
    res.version || "",
    res.dateCreated || "",
    res.lastUpdated || "",
    res.usedFor || "",
    res.fileLink || "",
    (res.skills || []).join(", "),
    res.notes || "",
    res.keywords || "",
  ]);

  const contactHeaders = [
    ["CONTACTS", "", "", "", "", "", ""],
    [
      "Recruiters • hiring managers • referrals • networking.",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Name",
      "Company",
      "Role",
      "Email / LinkedIn",
      "Relationship",
      "Last Contact",
      "Notes",
    ],
  ];
  const contactRows = contacts.map((c: any) => [
    c.name || "",
    c.company || "",
    c.role || c.title || "",
    c.email || c.linkedin || c.url || "",
    c.relationship || c.type || "",
    c.lastContact || "",
    c.notes || "",
  ]);

  const batchData = [
    { range: "'DASHBOARD'!A1", values: dashboardValues },
    { range: "'APPLICATIONS'!A1", values: [...appHeaders, ...appRows] },
    {
      range: "'INTERVIEWS'!A1",
      values: [...interviewHeaders, ...interviewRows],
    },
    { range: "'FOLLOW UPS'!A1", values: [...followUpHeaders, ...followUpRows] },
    { range: "'RESUME LIBRARY'!A1", values: [...resumeHeaders, ...resumeRows] },
    { range: "'CONTACTS'!A1", values: [...contactHeaders, ...contactRows] },
  ];

  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: batchData,
      }),
    },
  );
  if (!valuesRes.ok)
    throw new Error(
      `Failed to write spreadsheet values: ${valuesRes.status} ${await valuesRes.text()}`,
    );

  const formatRequests: any[] = [
    // Global canvas
    cellFormat(
      0,
      0,
      45,
      0,
      12,
      {
        backgroundColor: GS_COLORS.cream,
        textFormat: {
          fontFamily: SHEET_FONT,
          fontSize: 10,
          foregroundColor: GS_COLORS.charcoal,
        },
        verticalAlignment: "MIDDLE",
      },
      "backgroundColor,textFormat,verticalAlignment",
    ),

    // Dashboard title + subtitle
    cellFormat(
      0,
      0,
      1,
      0,
      12,
      {
        backgroundColor: GS_COLORS.sage,
        textFormat: {
          bold: true,
          fontSize: 20,
          foregroundColor: GS_COLORS.white,
          fontFamily: SHEET_FONT,
        },
        verticalAlignment: "MIDDLE",
      },
      "backgroundColor,textFormat,verticalAlignment",
    ),
    cellFormat(
      0,
      1,
      2,
      0,
      4,
      {
        backgroundColor: GS_COLORS.sageSoft,
        textFormat: {
          bold: true,
          fontSize: 9,
          foregroundColor: GS_COLORS.sageDark,
          fontFamily: SHEET_FONT,
        },
        verticalAlignment: "MIDDLE",
      },
      "backgroundColor,textFormat,verticalAlignment",
    ),
    cellFormat(
      0,
      0,
      2,
      4,
      8,
      {
        backgroundColor: GS_COLORS.blush,
        textFormat: {
          italic: true,
          bold: true,
          fontSize: 11,
          foregroundColor: GS_COLORS.blushDark,
          fontFamily: SHEET_FONT,
        },
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE",
      },
      "backgroundColor,textFormat,horizontalAlignment,verticalAlignment",
    ),

    // Dashboard section labels
    ...[3, 6, 15, 20].map((r) =>
      cellFormat(
        0,
        r,
        r + 1,
        0,
        12,
        {
          backgroundColor: GS_COLORS.sageDark,
          textFormat: {
            bold: true,
            fontSize: 10,
            foregroundColor: GS_COLORS.white,
            fontFamily: SHEET_FONT,
          },
          verticalAlignment: "MIDDLE",
        },
        "backgroundColor,textFormat,verticalAlignment",
      ),
    ),

    // Dashboard KPI row
    cellFormat(
      0,
      4,
      5,
      0,
      10,
      {
        backgroundColor: GS_COLORS.white,
        textFormat: {
          bold: true,
          fontSize: 12,
          foregroundColor: GS_COLORS.sageDark,
          fontFamily: SHEET_FONT,
        },
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE",
        borders: {
          top: { style: "SOLID", color: GS_COLORS.border },
          bottom: { style: "SOLID", color: GS_COLORS.border },
          left: { style: "SOLID", color: GS_COLORS.border },
          right: { style: "SOLID", color: GS_COLORS.border },
        },
      },
      "backgroundColor,textFormat,horizontalAlignment,verticalAlignment,borders",
    ),

    // Dashboard content cards
    cellFormat(
      0,
      7,
      14,
      0,
      3,
      {
        backgroundColor: GS_COLORS.white,
        textFormat: {
          fontSize: 10,
          foregroundColor: GS_COLORS.charcoal,
          fontFamily: SHEET_FONT,
        },
        borders: { bottom: { style: "SOLID", color: GS_COLORS.border } },
      },
      "backgroundColor,textFormat,borders",
    ),
    cellFormat(
      0,
      7,
      14,
      3,
      5,
      {
        backgroundColor: GS_COLORS.sagePale,
        textFormat: {
          fontSize: 10,
          foregroundColor: GS_COLORS.charcoal,
          fontFamily: SHEET_FONT,
        },
        borders: { bottom: { style: "SOLID", color: GS_COLORS.border } },
      },
      "backgroundColor,textFormat,borders",
    ),
    cellFormat(
      0,
      7,
      14,
      6,
      9,
      {
        backgroundColor: GS_COLORS.white,
        textFormat: {
          fontSize: 10,
          foregroundColor: GS_COLORS.charcoal,
          fontFamily: SHEET_FONT,
        },
        borders: { bottom: { style: "SOLID", color: GS_COLORS.border } },
      },
      "backgroundColor,textFormat,borders",
    ),
    cellFormat(
      0,
      21,
      24,
      0,
      3,
      {
        backgroundColor: GS_COLORS.white,
        textFormat: {
          fontSize: 10,
          foregroundColor: GS_COLORS.charcoal,
          fontFamily: SHEET_FONT,
        },
      },
      "backgroundColor,textFormat",
    ),

    // Tracker sheets: title, subtitle, headers
    ...[
      { id: 1, cols: 11, color: GS_COLORS.sage },
      { id: 2, cols: 7, color: GS_COLORS.sageDark },
      { id: 3, cols: 7, color: GS_COLORS.blushDark },
      { id: 4, cols: 10, color: GS_COLORS.sage },
      { id: 5, cols: 7, color: GS_COLORS.peachDark },
    ].flatMap(({ id, cols, color }) => [
      cellFormat(
        id,
        0,
        1,
        0,
        cols,
        {
          backgroundColor: color,
          textFormat: {
            bold: true,
            fontSize: 16,
            foregroundColor: GS_COLORS.white,
            fontFamily: SHEET_FONT,
          },
          verticalAlignment: "MIDDLE",
        },
        "backgroundColor,textFormat,verticalAlignment",
      ),
      cellFormat(
        id,
        1,
        2,
        0,
        cols,
        {
          backgroundColor: GS_COLORS.cream,
          textFormat: {
            italic: true,
            fontSize: 9,
            foregroundColor: GS_COLORS.muted,
            fontFamily: SHEET_FONT,
          },
          verticalAlignment: "MIDDLE",
        },
        "backgroundColor,textFormat,verticalAlignment",
      ),
      cellFormat(
        id,
        2,
        3,
        0,
        cols,
        {
          backgroundColor: GS_COLORS.sageSoft,
          textFormat: {
            bold: true,
            fontSize: 9,
            foregroundColor: GS_COLORS.sageDark,
            fontFamily: SHEET_FONT,
          },
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE",
          borders: { bottom: { style: "SOLID_MEDIUM", color: GS_COLORS.sage } },
        },
        "backgroundColor,textFormat,horizontalAlignment,verticalAlignment,borders",
      ),
      cellFormat(
        id,
        3,
        100,
        0,
        cols,
        {
          backgroundColor: GS_COLORS.white,
          textFormat: {
            fontSize: 10,
            foregroundColor: GS_COLORS.charcoal,
            fontFamily: SHEET_FONT,
          },
          verticalAlignment: "MIDDLE",
          wrapStrategy: "WRAP",
        },
        "backgroundColor,textFormat,verticalAlignment,wrapStrategy",
      ),
    ]),

    // Row sizing
    ...[
      {
        id: 0,
        rows: [
          { r: 0, h: 34 },
          { r: 1, h: 22 },
          { r: 3, h: 24 },
          { r: 6, h: 24 },
          { r: 15, h: 24 },
          { r: 20, h: 24 },
        ],
      },
      {
        id: 1,
        rows: [
          { r: 0, h: 30 },
          { r: 1, h: 22 },
          { r: 2, h: 30 },
        ],
      },
      {
        id: 2,
        rows: [
          { r: 0, h: 30 },
          { r: 1, h: 22 },
          { r: 2, h: 30 },
        ],
      },
      {
        id: 3,
        rows: [
          { r: 0, h: 30 },
          { r: 1, h: 22 },
          { r: 2, h: 30 },
        ],
      },
      {
        id: 4,
        rows: [
          { r: 0, h: 30 },
          { r: 1, h: 22 },
          { r: 2, h: 30 },
        ],
      },
      {
        id: 5,
        rows: [
          { r: 0, h: 30 },
          { r: 1, h: 22 },
          { r: 2, h: 30 },
        ],
      },
    ].flatMap(({ id, rows }) =>
      rows.map(({ r, h }) => ({
        updateDimensionProperties: {
          range: {
            sheetId: id,
            dimension: "ROWS",
            startIndex: r,
            endIndex: r + 1,
          },
          properties: { pixelSize: h },
          fields: "pixelSize",
        },
      })),
    ),

    // Column widths
    ...[
      { id: 0, widths: [120, 75, 28, 110, 75, 80, 75, 100, 70, 100, 20, 20] },
      {
        id: 1,
        widths: [105, 170, 190, 120, 125, 110, 125, 220, 135, 100, 260],
      },
      { id: 2, widths: [170, 190, 120, 145, 150, 150, 260] },
      { id: 3, widths: [170, 110, 125, 120, 150, 120, 270] },
      { id: 4, widths: [170, 150, 85, 110, 110, 150, 220, 240, 250, 180] },
      { id: 5, widths: [150, 150, 150, 230, 130, 120, 280] },
    ].flatMap(({ id, widths }) =>
      widths.map((px, i) => ({
        updateDimensionProperties: {
          range: {
            sheetId: id,
            dimension: "COLUMNS",
            startIndex: i,
            endIndex: i + 1,
          },
          properties: { pixelSize: px },
          fields: "pixelSize",
        },
      })),
    ),

    // Alternating rows for tracker readability
    ...[1, 2, 3, 4, 5].map((id) => ({
      addBanding: {
        bandedRange: {
          range: {
            sheetId: id,
            startRowIndex: 3,
            endRowIndex: 100,
            startColumnIndex: 0,
            endColumnIndex: id === 1 ? 11 : id === 4 ? 10 : 7,
          },
          rowProperties: {
            headerColor: GS_COLORS.sageSoft,
            firstBandColor: GS_COLORS.white,
            secondBandColor: GS_COLORS.sagePale,
          },
        },
      },
    })),

    // Status conditional formatting — makes the tracker scannable at a glance.
    {
      addConditionalFormatRule: {
        rule: {
          ranges: [range(1, 3, 100, 3, 4)],
          booleanRule: {
            condition: {
              type: "TEXT_EQ",
              values: [{ userEnteredValue: "Applied" }],
            },
            format: {
              backgroundColor: GS_COLORS.blueSoft,
              textFormat: { foregroundColor: GS_COLORS.blueDark, bold: true },
            },
          },
        },
        index: 0,
      },
    },
    {
      addConditionalFormatRule: {
        rule: {
          ranges: [range(1, 3, 100, 3, 4)],
          booleanRule: {
            condition: {
              type: "TEXT_CONTAINS",
              values: [{ userEnteredValue: "Interview" }],
            },
            format: {
              backgroundColor: GS_COLORS.greenSoft,
              textFormat: { foregroundColor: GS_COLORS.greenDark, bold: true },
            },
          },
        },
        index: 0,
      },
    },
    {
      addConditionalFormatRule: {
        rule: {
          ranges: [range(1, 3, 100, 3, 4)],
          booleanRule: {
            condition: {
              type: "TEXT_CONTAINS",
              values: [{ userEnteredValue: "Offer" }],
            },
            format: {
              backgroundColor: GS_COLORS.sageSoft,
              textFormat: { foregroundColor: GS_COLORS.sageDark, bold: true },
            },
          },
        },
        index: 0,
      },
    },
    {
      addConditionalFormatRule: {
        rule: {
          ranges: [range(1, 3, 100, 3, 4)],
          booleanRule: {
            condition: {
              type: "TEXT_EQ",
              values: [{ userEnteredValue: "Rejected" }],
            },
            format: {
              backgroundColor: GS_COLORS.redSoft,
              textFormat: { foregroundColor: GS_COLORS.redDark, bold: true },
            },
          },
        },
        index: 0,
      },
    },
    {
      addConditionalFormatRule: {
        rule: {
          ranges: [range(3, 3, 100, 3, 4)],
          booleanRule: {
            condition: {
              type: "TEXT_EQ",
              values: [{ userEnteredValue: "Pending" }],
            },
            format: {
              backgroundColor: GS_COLORS.yellowSoft,
              textFormat: { foregroundColor: GS_COLORS.yellowDark, bold: true },
            },
          },
        },
        index: 0,
      },
    },
  ];

  // Merges for visual title bars and dashboard cards.
  formatRequests.push(
    ...[
      [0, 0, 1, 0, 4],
      [0, 0, 2, 4, 8],
      [0, 3, 4, 0, 12],
      [0, 6, 7, 0, 12],
      [0, 15, 16, 0, 12],
      [0, 20, 21, 0, 12],
      [1, 0, 1, 0, 11],
      [1, 1, 2, 0, 11],
      [2, 0, 1, 0, 7],
      [2, 1, 2, 0, 7],
      [3, 0, 1, 0, 7],
      [3, 1, 2, 0, 7],
      [4, 0, 1, 0, 10],
      [4, 1, 2, 0, 10],
      [5, 0, 1, 0, 7],
      [5, 1, 2, 0, 7],
    ].map(([sheetId, r1, r2, c1, c2]) => ({
      mergeCells: {
        range: range(sheetId, r1, r2, c1, c2),
        mergeType: "MERGE_ALL",
      },
    })),
  );

  const formatRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests: formatRequests }),
    },
  );
  if (!formatRes.ok)
    throw new Error(
      `Failed to style spreadsheet: ${formatRes.status} ${await formatRes.text()}`,
    );

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: createPayload.properties.title,
  };
}

/**
 * Downloads a clean, planner-style Excel workbook.
 *
 * NOTE: SheetJS community edition does not reliably persist rich cell styling.
 * The structural design below still makes the workbook readable in Excel:
 * dedicated dashboard sections, short columns, merged title bars, sensible widths,
 * filters-friendly headers, and separated workflows.
 */
export function downloadExcelWorkbook(
  applications: Application[],
  resumes: ResumeItem[],
  contacts: ContactItem[],
  lists: DataLists,
  filename = "Job-Application-Tracker.xlsx",
) {
  const wb = XLSX.utils.book_new();
  const kpis = calculateKpis(applications);
  const pipeline = calculatePipeline(applications);

  const dashboardData = [
    [
      "JOB SEARCH PLANNER ♡",
      "",
      "",
      "",
      "A little progress every day.",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "TRACK • APPLY • FOLLOW UP • GROW",
      "",
      "",
      "",
      "You are building momentum.",
      "",
      "",
      "",
      "",
      "",
    ],
    [],
    [
      "YOUR PROGRESS",
      "",
      "",
      "",
      "APPLICATION PIPELINE",
      "",
      "",
      "",
      "QUICK VIEW",
      "",
    ],
    [
      "Applications",
      applications.length,
      "Interviews",
      kpis.interviews,
      "Offers",
      kpis.offers,
      "Pending",
      kpis.applied + kpis.screening,
      "Follow-ups",
      applications.filter((a) => a.nextFollowUp).length,
    ],
    [],
    [
      "STATUS SNAPSHOT",
      "",
      "",
      "MONTHLY RHYTHM",
      "",
      "",
      "INTERVIEW STAGES",
      "",
      "",
      "",
    ],
    [
      "Applied",
      kpis.applied,
      "",
      "Jan",
      0,
      "",
      "Initial Interview",
      pipeline.find((p) => p.status === "Interview")?.count || 0,
      "",
      "",
    ],
    [
      "Screening",
      kpis.screening,
      "",
      "Feb",
      0,
      "",
      "Technical Interview",
      pipeline.find((p) => p.status === "Technical Interview")?.count || 0,
      "",
      "",
    ],
    [
      "Interview",
      kpis.interviews,
      "",
      "Mar",
      0,
      "",
      "Final Interview",
      pipeline.find((p) => p.status === "Final Interview")?.count || 0,
      "",
      "",
    ],
    [
      "Offer",
      kpis.offers,
      "",
      "Apr",
      0,
      "",
      "Waiting for Feedback",
      applications.filter(
        (a) => a.interviewNotes && /waiting/i.test(a.interviewNotes),
      ).length,
      "",
      "",
    ],
    ["Rejected", kpis.rejected, "", "May", 0, "", "", "", "", ""],
    [
      "Not Interested",
      applications.filter((a) => ["Ghosted", "Withdrawn"].includes(a.status))
        .length,
      "",
      "Jun",
      0,
      "",
      "",
      "",
      "",
      "",
    ],
    ["", "", "", "Jul–Dec", 0, "", "", "", "", ""],
    [],
    ["QUICK REMINDERS", "", "", "", "", "", "", "", "", ""],
    [
      "→ Update your tracker after every application.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["→ Follow up when the date is due.", "", "", "", "", "", "", "", "", ""],
    [
      "→ Keep tailored CV versions in Resume Library.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [],
    ["TODAY", "CHECK", "NEXT ACTION", "", "", "", "", "", "", ""],
    [
      "□",
      "Applications",
      "Add applications sent today.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["□", "Follow-ups", "Check anything due soon.", "", "", "", "", "", "", ""],
    [
      "□",
      "Resume",
      "Keep your strongest targeted CV ready.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
  ];
  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
  wsDashboard["!cols"] = [18, 13, 18, 18, 13, 13, 13, 13, 16, 18].map(
    (wch) => ({ wch }),
  );
  wsDashboard["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 0, c: 4 }, e: { r: 1, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 8 } },
    { s: { r: 15, c: 0 }, e: { r: 15, c: 8 } },
    { s: { r: 20, c: 0 }, e: { r: 20, c: 8 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsDashboard, "DASHBOARD");

  const appData = [
    ["APPLICATIONS", "", "", "", "", "", "", "", "", "", ""],
    [
      "One row per job application. Keep URLs and the exact resume version you used.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Date Applied",
      "Company",
      "Job Title",
      "Status",
      "Interview Date",
      "Follow Up",
      "Salary Range",
      "Post / URL",
      "Resume Used",
      "Source",
      "Notes",
    ],
    ...applications.map((a: any) => [
      a.dateApplied || a.dateAdded || "",
      a.company || "",
      a.jobTitle || "",
      a.status || "",
      a.lastContact && String(a.status || "").includes("Interview")
        ? a.lastContact
        : a.status === "Interview"
          ? a.lastContact || "-"
          : "-",
      a.nextFollowUp || "-",
      a.salary || "",
      a.url || a.postUrl || a.jobUrl || "",
      a.resumeUsed || a.resume || "",
      a.source || a.origin || "",
      a.notes || a.nextAction || "",
    ]),
  ];
  const wsApps = XLSX.utils.aoa_to_sheet(appData);
  wsApps["!cols"] = [14, 22, 28, 16, 16, 15, 20, 35, 20, 14, 38].map((wch) => ({
    wch,
  }));
  wsApps["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
  ];
  wsApps["!autofilter"] = {
    ref: `A3:K${Math.max(3 + applications.length, 3)}`,
  };
  XLSX.utils.book_append_sheet(wb, wsApps, "APPLICATIONS");

  const interviewRows = applications
    .filter(
      (a) =>
        a.status.includes("Interview") ||
        a.status === "Offer" ||
        a.interviewNotes,
    )
    .map((a: any) => [
      a.company || "",
      a.jobTitle || "",
      a.lastContact || a.nextFollowUp || "",
      a.status === "Technical Interview"
        ? "Technical Interview"
        : a.status === "Final Interview"
          ? "Final Interview"
          : "Initial Interview",
      a.status === "Offer"
        ? "Offer Received"
        : a.status === "Rejected"
          ? "Not Selected"
          : "Scheduled / Completed",
      a.contact || a.contactName || "",
      a.interviewNotes || a.notes || "",
    ]);
  const interviewData = [
    ["INTERVIEWS", "", "", "", "", "", ""],
    ["Prepare • attend • record outcome • learn.", "", "", "", "", "", ""],
    [
      "Company",
      "Job Title",
      "Interview Date",
      "Interview Type",
      "Outcome",
      "Contact",
      "Notes",
    ],
    ...interviewRows,
  ];
  const wsInterviews = XLSX.utils.aoa_to_sheet(interviewData);
  wsInterviews["!cols"] = [22, 28, 17, 22, 20, 20, 40].map((wch) => ({ wch }));
  wsInterviews["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
  ];
  wsInterviews["!autofilter"] = {
    ref: `A3:G${Math.max(3 + interviewRows.length, 3)}`,
  };
  XLSX.utils.book_append_sheet(wb, wsInterviews, "INTERVIEWS");

  const followUpData = [
    ["FOLLOW UPS", "", "", "", "", "", ""],
    [
      "Never lose a follow-up because it lived in your memory.",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Company",
      "Date Applied",
      "Follow Up Date",
      "Status",
      "Contact",
      "Method",
      "Next Action",
    ],
    ...applications.map((a: any) => [
      a.company || "",
      a.dateApplied || a.dateAdded || "",
      a.nextFollowUp || "—",
      a.followUpStatus ||
        (["Rejected", "Accepted", "Withdrawn"].includes(a.status)
          ? "Completed"
          : "Pending"),
      a.contact || a.contactName || "",
      a.followUpMethod || "Email",
      a.nextAction || a.notes || "Follow up",
    ]),
  ];
  const wsFollowUp = XLSX.utils.aoa_to_sheet(followUpData);
  wsFollowUp["!cols"] = [22, 17, 18, 16, 20, 15, 40].map((wch) => ({ wch }));
  wsFollowUp["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
  ];
  wsFollowUp["!autofilter"] = {
    ref: `A3:G${Math.max(3 + applications.length, 3)}`,
  };
  XLSX.utils.book_append_sheet(wb, wsFollowUp, "FOLLOW UPS");

  const resumeData = [
    ["RESUME LIBRARY", "", "", "", "", "", "", "", "", ""],
    [
      "Keep every tailored version easy to find and reuse.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Resume Name",
      "Target Role",
      "Version",
      "Date Created",
      "Last Updated",
      "Used For",
      "File / Link",
      "Skills",
      "Notes",
      "ATS / Keywords",
    ],
    ...resumes.map((res: any) => [
      res.name || "",
      res.targetRole || "",
      res.version || "",
      res.dateCreated || "",
      res.lastUpdated || "",
      res.usedFor || "",
      res.fileLink || "",
      (res.skills || []).join(", "),
      res.notes || "",
      res.keywords || "",
    ]),
  ];
  const wsResumes = XLSX.utils.aoa_to_sheet(resumeData);
  wsResumes["!cols"] = [22, 22, 12, 15, 15, 20, 30, 35, 30, 30].map((wch) => ({
    wch,
  }));
  wsResumes["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
  ];
  wsResumes["!autofilter"] = { ref: `A3:J${Math.max(3 + resumes.length, 3)}` };
  XLSX.utils.book_append_sheet(wb, wsResumes, "RESUME LIBRARY");

  const contactData = [
    ["CONTACTS", "", "", "", "", "", ""],
    [
      "Recruiters • hiring managers • referrals • networking.",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Name",
      "Company",
      "Role",
      "Email / LinkedIn",
      "Relationship",
      "Last Contact",
      "Notes",
    ],
    ...contacts.map((c: any) => [
      c.name || "",
      c.company || "",
      c.role || c.title || "",
      c.email || c.linkedin || c.url || "",
      c.relationship || c.type || "",
      c.lastContact || "",
      c.notes || "",
    ]),
  ];
  const wsContacts = XLSX.utils.aoa_to_sheet(contactData);
  wsContacts["!cols"] = [22, 22, 22, 34, 20, 16, 40].map((wch) => ({ wch }));
  wsContacts["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
  ];
  wsContacts["!autofilter"] = {
    ref: `A3:G${Math.max(3 + contacts.length, 3)}`,
  };
  XLSX.utils.book_append_sheet(wb, wsContacts, "CONTACTS");

  XLSX.writeFile(wb, filename);
}

export function exportApplicationsToCSV(applications: Application[]): string {
  const headers = [
    "Date Applied",
    "Company",
    "Job Title",
    "Status",
    "Interview Date",
    "Follow Up",
    "Salary Range",
    "Notes",
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
    escapeCSV(
      app.lastContact && app.status.includes("Interview")
        ? app.lastContact
        : "-",
    ),
    escapeCSV(app.nextFollowUp || "-"),
    escapeCSV(app.salary || "$50,000 - $65,000"),
    escapeCSV(app.notes || app.nextAction),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadCSV(
  content: string,
  filename = "Job_Application_Tracker.csv",
) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
