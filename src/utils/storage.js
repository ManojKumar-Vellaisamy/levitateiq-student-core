import { calculateGravityScore, getGravityStatus, generateBasicInsight } from './gravityLogic';

// Returns today's date string in YYYY-MM-DD format
export const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Retrieve all daily logs from localStorage
export const getAllLogs = () => {
  try {
    const saved = localStorage.getItem('gravityLogs');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to parse logs from localStorage:', error);
    return [];
  }
};

// Save a daily log and calculate gravityScore, status, and insight
export const saveDailyLog = (logData) => {
  const logs = getAllLogs();
  
  // Calculate stats
  const gravityScore = logData.gravityScore !== undefined 
    ? logData.gravityScore 
    : (logData.score !== undefined ? logData.score : calculateGravityScore(logData));
  const statusObj = getGravityStatus(gravityScore);
  const status = statusObj.label;
  const insight = logData.insight || generateBasicInsight(logData, gravityScore);
  const date = logData.date || getTodayStr();

  const entry = {
    date,
    studyHours: parseFloat(logData.studyHours || 0),
    sleepHours: parseFloat(logData.sleepHours || 0),
    stressLevel: parseInt(logData.stressLevel || 5, 10),
    pendingAssignments: parseInt(logData.pendingAssignments || 0, 10),
    subjectStudied: logData.subjectStudied || '',
    socialMediaUsage: parseFloat(logData.socialMediaUsage || 0),
    gravityScore,
    score: gravityScore, // Duplicate key for backward compatibility
    status,
    insight,
    timestamp: new Date().toISOString(),
  };

  // Replace today's log if it already exists, otherwise append
  const existingIndex = logs.findIndex((l) => l.date === date);
  if (existingIndex !== -1) {
    logs[existingIndex] = entry;
  } else {
    logs.push(entry);
  }

  // Sort logs chronologically by date ascending
  logs.sort((a, b) => new Date(a.date) - new Date(b.date));

  try {
    localStorage.setItem('gravityLogs', JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to write logs to localStorage:', error);
  }

  return entry;
};

// Get the latest log entry
export const getLatestLog = () => {
  const logs = getAllLogs();
  if (!logs || logs.length === 0) return null;
  return logs[logs.length - 1];
};

// Get logs from the last 7 calendar days (inclusive of today)
export const getLast7DaysLogs = () => {
  const logs = getAllLogs();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  return logs.filter((log) => {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    return logDate >= sevenDaysAgo && logDate <= today;
  });
};

// Calculate current streak of consecutive days logged
export const calculateStreak = (logsInput) => {
  const logs = logsInput || getAllLogs();
  if (!logs || logs.length === 0) return 0;

  // Get unique sorted dates in descending order (newest first)
  const logDates = [...new Set(logs.map((l) => l.date))].sort().reverse();
  let streak = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expected = new Date(today);

  for (const dateStr of logDates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    
    if (d.getTime() === expected.getTime()) {
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else if (streak === 0 && d.getTime() === expected.getTime() - 86400000) {
      // Allow streak starting yesterday
      expected = new Date(d);
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};
