/**
 * Attendance Storage Utility
 *
 * Manages attendance data in localStorage under key 'levitateiq_attendance'
 * and custom subjects under key 'levitateiq_custom_subjects'.
 * Structured for easy future Firebase migration.
 */

const ATTENDANCE_KEY = 'levitateiq_attendance';
const SUBJECTS_KEY = 'levitateiq_custom_subjects';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a simple unique ID */
const generateId = () =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Get the current local date as YYYY-MM-DD */
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ── Custom Subject Helpers ───────────────────────────────────────────────────

/** Retrieve the custom subjects list from localStorage */
export const getCustomSubjects = () => {
  try {
    const raw = localStorage.getItem(SUBJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('attendanceStorage: read custom subjects error', err);
    return [];
  }
};

/** Save the custom subjects list to localStorage */
const _persistSubjects = (subjects) => {
  try {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
  } catch (err) {
    console.error('attendanceStorage: write custom subjects error', err);
  }
};

/** Add a new custom subject to the list if it doesn't already exist */
export const addCustomSubject = (subjectName) => {
  if (!subjectName || !subjectName.trim()) return;
  const name = subjectName.trim();
  const subjects = getCustomSubjects();
  const lowerName = name.toLowerCase();
  
  if (!subjects.some(s => s.toLowerCase() === lowerName)) {
    subjects.push(name);
    _persistSubjects(subjects);
  }
};

// ── Attendance CRUD ─────────────────────────────────────────────────────────

/** Retrieve all attendance records from localStorage */
export const getAttendanceRecords = () => {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('attendanceStorage: read attendance error', err);
    return [];
  }
};

/** Save the attendance records to localStorage */
const _persistAttendance = (records) => {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('attendanceStorage: write attendance error', err);
  }
};

/**
 * Add a new subject attendance tracker
 * @param {object} data - { subjectName, totalClasses, attendedClasses }
 * @returns {object|null} The created record, or null if duplicate
 */
export const saveAttendanceRecord = (data) => {
  const name = data.subjectName?.trim() || '';
  if (!name) return null;

  const records = getAttendanceRecords();
  const lowerName = name.toLowerCase();

  // Prevent duplicates (case-insensitive)
  if (records.some(r => r.subjectName.toLowerCase() === lowerName)) {
    throw new Error(`Subject "${name}" already exists.`);
  }

  // Register in custom subjects pool
  addCustomSubject(name);

  const entry = {
    id: generateId(),
    subjectName: name,
    totalClasses: Math.max(0, parseInt(data.totalClasses) || 0),
    attendedClasses: Math.max(0, parseInt(data.attendedClasses) || 0),
    dailyLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  records.push(entry);
  _persistAttendance(records);
  return entry;
};

/**
 * Update an existing attendance record
 * @param {string} id
 * @param {object} changes - { subjectName, totalClasses, attendedClasses }
 * @returns {object|null} The updated record, or null
 */
export const updateAttendanceRecord = (id, changes) => {
  const records = getAttendanceRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;

  const current = records[idx];

  // If changing name, verify uniqueness
  if (changes.subjectName && changes.subjectName.trim() !== current.subjectName) {
    const newName = changes.subjectName.trim();
    const lowerNewName = newName.toLowerCase();
    
    if (records.some(r => r.id !== id && r.subjectName.toLowerCase() === lowerNewName)) {
      throw new Error(`Another subject named "${newName}" already exists.`);
    }

    current.subjectName = newName;
    addCustomSubject(newName);
  }

  if (changes.totalClasses !== undefined) {
    current.totalClasses = Math.max(0, parseInt(changes.totalClasses) || 0);
  }
  if (changes.attendedClasses !== undefined) {
    current.attendedClasses = Math.max(0, parseInt(changes.attendedClasses) || 0);
  }

  current.updatedAt = new Date().toISOString();
  records[idx] = current;
  _persistAttendance(records);
  return current;
};

/**
 * Delete an attendance record
 * @param {string} id
 */
export const deleteAttendanceRecord = (id) => {
  const records = getAttendanceRecords().filter(r => r.id !== id);
  _persistAttendance(records);
};

/**
 * Mark daily attendance (present or absent)
 * @param {string} id
 * @param {'present'|'absent'} status
 * @returns {object|null} The updated record
 */
export const markAttendance = (id, status) => {
  if (status !== 'present' && status !== 'absent') return null;

  const records = getAttendanceRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;

  const current = records[idx];
  const dateStr = getTodayStr();

  // Add entry to dailyLog (could support changing daily history later)
  // To keep it simple and robust, record daily marking history.
  current.dailyLog = current.dailyLog || [];
  current.dailyLog.push({
    date: dateStr,
    status: status,
    timestamp: new Date().toISOString()
  });

  // Automatically update totals
  current.totalClasses += 1;
  if (status === 'present') {
    current.attendedClasses += 1;
  }

  current.updatedAt = new Date().toISOString();
  records[idx] = current;
  _persistAttendance(records);
  return current;
};

// ── Attendance Calculations & Derived Selectors ─────────────────────────────

/**
 * Calculate attendance percentage for a record.
 * @param {object} record
 * @returns {number} Percentage (0-100)
 */
export const getAttendancePercentage = (record) => {
  if (!record || record.totalClasses === 0) return 0;
  return Math.round((record.attendedClasses / record.totalClasses) * 100);
};

/**
 * Calculate how many consecutive present classes are needed to reach 75%
 * Formula: Math.max(0, Math.ceil(3 * totalClasses - 4 * attendedClasses))
 * @param {object} record
 * @returns {number}
 */
export const classesNeededFor75 = (record) => {
  if (!record) return 0;
  const pct = getAttendancePercentage(record);
  if (pct >= 75) return 0;

  const total = record.totalClasses;
  const attended = record.attendedClasses;
  const needed = Math.ceil(3 * total - 4 * attended);
  return Math.max(0, needed);
};

/**
 * Get summary stats for the Dashboard Page.
 * @returns {object} { overallPercent, lowestSubjectName, lowestSubjectPercent, totalSubjects, hasData }
 */
export const getAttendanceSummary = () => {
  const records = getAttendanceRecords();
  if (records.length === 0) {
    return {
      overallPercent: 0,
      lowestSubjectName: '',
      lowestSubjectPercent: 0,
      totalSubjects: 0,
      hasData: false
    };
  }

  let grandTotal = 0;
  let grandAttended = 0;
  let lowestPercent = Infinity;
  let lowestSubject = null;

  records.forEach(r => {
    grandTotal += r.totalClasses;
    grandAttended += r.attendedClasses;

    const pct = getAttendancePercentage(r);
    if (pct < lowestPercent) {
      lowestPercent = pct;
      lowestSubject = r;
    }
  });

  const overallPercent = grandTotal > 0 ? Math.round((grandAttended / grandTotal) * 100) : 0;

  return {
    overallPercent,
    lowestSubjectName: lowestSubject ? lowestSubject.subjectName : '',
    lowestSubjectPercent: lowestSubject ? lowestPercent : 0,
    totalSubjects: records.length,
    hasData: true
  };
};
