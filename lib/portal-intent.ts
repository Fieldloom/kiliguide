export interface PortalIntent {
  isPortalQuery: boolean;
  intentCategory: "fee_statement" | "unit_registration" | "exam_results" | "timetable" | "clearance" | "none";
  targetUrl: string;
  action: string;
}

/**
 * Detects whether a student query needs live student portal data (https://portal.dkut.ac.ke/)
 * and classifies the exact target portal module (Fee Statement, Unit Registration, Exam Results, etc.).
 */
export function detectPortalIntent(query: string): PortalIntent {
  if (!query || typeof query !== "string") {
    return { isPortalQuery: false, intentCategory: "none", targetUrl: "", action: "" };
  }

  const q = query.toLowerCase().trim();

  // 1. Fee & Financial Ledger Intent
  const feeKeywords = [
    "fee", "balance", "statement", "debit", "credit", "owed", "owing", "invoiced",
    "ada", "salio", "malipo", "stakabadhi", "receipt", "financial", "payment"
  ];
  if (feeKeywords.some(k => q.includes(k))) {
    return {
      isPortalQuery: true,
      intentCategory: "fee_statement",
      targetUrl: "https://portal.dkut.ac.ke/Financial/FeeStatementCard",
      action: "fee_statement"
    };
  }

  // 2. Unit & Course Registration Intent
  const unitKeywords = [
    "unit", "units", "registered unit", "course registration", "registered course",
    "masomo", "kozi", "somo", "niliyosajili", "enrolled subjects", "subject list"
  ];
  if (unitKeywords.some(k => q.includes(k))) {
    return {
      isPortalQuery: true,
      intentCategory: "unit_registration",
      targetUrl: "https://portal.dkut.ac.ke/Course/CourseRegistration",
      action: "unit_registration"
    };
  }

  // 3. Exam Results & Transcript Intent
  const resultKeywords = [
    "exam result", "provisional result", "transcript", "marks", "grade",
    "matokeo", "mtihani", "alama"
  ];
  if (resultKeywords.some(k => q.includes(k))) {
    return {
      isPortalQuery: true,
      intentCategory: "exam_results",
      targetUrl: "https://portal.dkut.ac.ke/ExamResults/ProvisionalResults",
      action: "exam_results"
    };
  }

  // 4. Personal Student Timetable Intent
  const timetableKeywords = [
    "my timetable", "my schedule", "my classes", "ratiba yangu", "darasa langu"
  ];
  if (timetableKeywords.some(k => q.includes(k))) {
    return {
      isPortalQuery: true,
      intentCategory: "timetable",
      targetUrl: "https://portal.dkut.ac.ke/Course/StudentTimeTable",
      action: "timetable"
    };
  }

  return {
    isPortalQuery: false,
    intentCategory: "none",
    targetUrl: "",
    action: ""
  };
}
