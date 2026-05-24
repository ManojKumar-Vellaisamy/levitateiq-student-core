/**
 * Assignment Storage Utility
 *
 * Manages assignment data in localStorage.
 * Structured for easy future migration to Firebase:
 *   - All reads go through getAssignments()
 *   - All writes go through saveAssignment() / updateAssignment() / deleteAssignment()
 *   - Each assignment has a stable `id` field suitable as a Firestore document ID
 */

const STORAGE_KEY = 'levitateiq_assignments';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a simple unique ID (replace with nanoid/uuid or Firestore auto-ID later) */
const generateId = () =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Today's date string in YYYY-MM-DD format */
export const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

/** Returns true if a date string (YYYY-MM-DD) is strictly before today */
export const isOverdue = (dueDateStr, status) => {
  if (status === 'Completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

/** Returns true if due date is within `days` days from today (not yet overdue) */
export const isDueSoon = (dueDateStr, status, days = 3) => {
  if (status === 'Completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffMs = due - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

/** Retrieve all assignments from localStorage */
export const getAssignments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('assignmentStorage: read error', err);
    return [];
  }
};

/** Persist the full assignments array */
const _persist = (assignments) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (err) {
    console.error('assignmentStorage: write error', err);
  }
};

/**
 * Add a new assignment.
 * @param {object} data - { title, subject, dueDate, priority, status }
 * @returns {object} The created assignment record
 */
export const saveAssignment = (data) => {
  const assignments = getAssignments();
  const entry = {
    id: generateId(),
    title: data.title?.trim() || 'Untitled',
    subject: data.subject?.trim() || 'General',
    dueDate: data.dueDate || getTodayStr(),
    priority: data.priority || 'Medium',   // 'Low' | 'Medium' | 'High'
    status: data.status || 'Not Started',  // 'Not Started' | 'In Progress' | 'Completed'
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assignments.push(entry);
  _persist(assignments);
  return entry;
};

/**
 * Update an existing assignment by ID.
 * @param {string} id
 * @param {object} changes - Partial fields to update
 * @returns {object|null} Updated record or null if not found
 */
export const updateAssignment = (id, changes) => {
  const assignments = getAssignments();
  const idx = assignments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  assignments[idx] = {
    ...assignments[idx],
    ...changes,
    updatedAt: new Date().toISOString(),
  };
  _persist(assignments);
  return assignments[idx];
};

/**
 * Delete an assignment by ID.
 * @param {string} id
 */
export const deleteAssignment = (id) => {
  const assignments = getAssignments().filter((a) => a.id !== id);
  _persist(assignments);
};

/**
 * Mark an assignment as completed.
 * @param {string} id
 */
export const markCompleted = (id) => updateAssignment(id, { status: 'Completed' });

// ── Derived selectors (future Firebase: replace with Firestore queries) ────────

export const getUpcomingAssignments = () =>
  getAssignments()
    .filter((a) => a.status !== 'Completed' && !isOverdue(a.dueDate, a.status))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

export const getOverdueAssignments = () =>
  getAssignments()
    .filter((a) => isOverdue(a.dueDate, a.status))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

export const getCompletedAssignments = () =>
  getAssignments()
    .filter((a) => a.status === 'Completed')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
