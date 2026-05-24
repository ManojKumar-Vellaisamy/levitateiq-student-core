/**
 * Exam Storage Utility
 *
 * Manages exam data in localStorage under the key 'levitateiq_exams'.
 * Structured for easy future Firebase migration:
 *   - All reads via getExams()
 *   - All writes via saveExam() / updateExam() / deleteExam()
 *   - Each exam has a stable `id` field (suitable as Firestore doc ID)
 */

const STORAGE_KEY = 'levitateiq_exams';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a simple unique ID */
const generateId = () =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Today at midnight (local) */
const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Days until exam from today (negative = past).
 * @param {string} examDateStr YYYY-MM-DD
 */
export const daysUntil = (examDateStr) => {
  const today = todayMidnight();
  const exam = new Date(examDateStr);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
};

/** True if exam is in the past */
export const isPastExam = (examDateStr) => daysUntil(examDateStr) < 0;

/** True if exam is within `days` days (inclusive of today) and not past */
export const isExamSoon = (examDateStr, days = 3) => {
  const d = daysUntil(examDateStr);
  return d >= 0 && d <= days;
};

/**
 * Human-readable countdown string.
 * e.g. "in 5 days", "Today!", "Tomorrow", "3 days ago"
 */
export const countdownText = (examDateStr) => {
  const d = daysUntil(examDateStr);
  if (d === 0) return 'Today!';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return '1 day ago';
  if (d > 1) return `in ${d} days`;
  return `${Math.abs(d)} days ago`;
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

/** Retrieve all exams from localStorage */
export const getExams = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('examStorage: read error', err);
    return [];
  }
};

const _persist = (exams) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
  } catch (err) {
    console.error('examStorage: write error', err);
  }
};

/**
 * Add a new exam.
 * @param {object} data - { subject, examDate, syllabus, prepStatus }
 * @returns {object} The created exam record
 */
export const saveExam = (data) => {
  const exams = getExams();
  const entry = {
    id: generateId(),
    subject: data.subject?.trim() || 'General',
    examDate: data.examDate || '',
    syllabus: data.syllabus?.trim() || '',
    prepStatus: data.prepStatus || 'Not Started', // 'Not Started' | 'Revising' | 'Almost Ready' | 'Ready'
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  exams.push(entry);
  _persist(exams);
  return entry;
};

/**
 * Update an existing exam by ID.
 * @param {string} id
 * @param {object} changes - Partial fields
 * @returns {object|null} Updated record or null
 */
export const updateExam = (id, changes) => {
  const exams = getExams();
  const idx = exams.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  exams[idx] = { ...exams[idx], ...changes, updatedAt: new Date().toISOString() };
  _persist(exams);
  return exams[idx];
};

/**
 * Delete an exam by ID.
 * @param {string} id
 */
export const deleteExam = (id) => {
  _persist(getExams().filter((e) => e.id !== id));
};

// ── Derived selectors ─────────────────────────────────────────────────────────

/** Upcoming exams sorted by nearest date first (excludes past) */
export const getUpcomingExams = () =>
  getExams()
    .filter((e) => daysUntil(e.examDate) >= 0)
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate));

/** Past exams sorted by most recent first */
export const getPastExams = () =>
  getExams()
    .filter((e) => daysUntil(e.examDate) < 0)
    .sort((a, b) => new Date(b.examDate) - new Date(a.examDate));

/** The single nearest upcoming exam (for Dashboard widget) */
export const getNearestExam = () => getUpcomingExams()[0] || null;
