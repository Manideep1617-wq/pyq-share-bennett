export const COLLEGE_NAME = "Bennett University";
export const APP_NAME = "Bennett PYQ Hub";
export const COLLEGE_EMAIL_DOMAIN = "bennett.edu.in";

/** Moderator accounts allowed to sign in even without a college address. */
export const ADMIN_EMAILS = ["manideep97018@gmail.com"];

export function isCollegeEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${COLLEGE_EMAIL_DOMAIN}`);
}

export function isAllowedEmail(email: string): boolean {
  const value = email.trim().toLowerCase();
  return isCollegeEmail(value) || ADMIN_EMAILS.includes(value);
}

export const COURSES = [
  "B.Tech CSE",
  "B.Tech CSE (AI/ML)",
  "B.Tech ECE",
  "B.Tech Mechanical",
  "B.Tech Civil",
  "B.Tech Biotechnology",
  "BBA",
  "B.Com (Hons)",
  "BA LLB",
  "BBA LLB",
  "B.Des",
  "BA Journalism & Mass Comm",
  "M.Tech",
  "MBA",
  "Other",
] as const;

export const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
] as const;

export const REPORT_REASONS = [
  { value: "spam", label: "Spam or irrelevant" },
  { value: "wrong_subject", label: "Wrong subject or course" },
  { value: "unreadable", label: "Unreadable / poor quality" },
  { value: "other", label: "Something else" },
] as const;

export const EXAM_YEARS = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i);

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
