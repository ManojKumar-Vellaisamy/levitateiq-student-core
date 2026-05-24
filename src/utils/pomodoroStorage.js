/**
 * Pomodoro Timer — localStorage helpers
 * Key: levitateiq_pomodoro_stats
 * Shape: { [dateStr]: { focusSessions, totalMinutes, completedSessions } }
 */

const STORAGE_KEY = 'levitateiq_pomodoro_stats';

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getPomodoroStats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getTodayStats = () => {
  const all = getPomodoroStats();
  const today = getTodayStr();
  return all[today] || { focusSessions: 0, totalMinutes: 0, completedSessions: 0 };
};

export const recordCompletedSession = (durationMinutes) => {
  const all = getPomodoroStats();
  const today = getTodayStr();

  if (!all[today]) {
    all[today] = { focusSessions: 0, totalMinutes: 0, completedSessions: 0 };
  }

  all[today].focusSessions += 1;
  all[today].totalMinutes += durationMinutes;
  all[today].completedSessions += 1;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all[today];
};

export const recordStartedSession = () => {
  const all = getPomodoroStats();
  const today = getTodayStr();

  if (!all[today]) {
    all[today] = { focusSessions: 0, totalMinutes: 0, completedSessions: 0 };
  }

  // focusSessions tracks total started, completedSessions tracks finished
  all[today].focusSessions += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all[today];
};
