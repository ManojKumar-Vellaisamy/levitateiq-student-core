/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import {
  getAllLogs,
  saveDailyLog,
  calculateStreak,
} from '../utils/storage';

const ScoreContext = createContext();

export const useScore = () => useContext(ScoreContext);

// Days of the week labels
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Build last-7-days trend data for charts
const buildLast7DaysTrend = (logs) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = DAY_LABELS[d.getDay()];

    // Get the last log for this date
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const lastLog = dayLogs[dayLogs.length - 1];

    days.push({
      day: dayLabel,
      date: dateStr,
      score: lastLog ? (lastLog.gravityScore !== undefined ? lastLog.gravityScore : lastLog.score) : null,
      study: lastLog ? lastLog.studyHours : null,
      sleep: lastLog ? lastLog.sleepHours : null,
      hasData: !!lastLog,
    });
  }
  return days;
};

// Compute weekly report stats from saved logs
const computeWeeklyStats = (logs) => {
  if (!logs || logs.length === 0) return null;

  // Use last 7 days of logs only
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  let recentLogs = logs.filter((l) => {
    const d = new Date(l.date);
    d.setHours(0, 0, 0, 0);
    return d >= sevenDaysAgo && d <= today;
  });

  if (recentLogs.length === 0) {
    recentLogs = logs.slice(-7);
  }

  const avgScore = Math.round(
    recentLogs.reduce((sum, l) => sum + (l.gravityScore !== undefined ? l.gravityScore : l.score), 0) /
      recentLogs.length
  );

  const best = recentLogs.reduce(
    (min, l) =>
      (l.gravityScore !== undefined ? l.gravityScore : l.score) <
      (min.gravityScore !== undefined ? min.gravityScore : min.score)
        ? l
        : min,
    recentLogs[0]
  );
  const worst = recentLogs.reduce(
    (max, l) =>
      (l.gravityScore !== undefined ? l.gravityScore : l.score) >
      (max.gravityScore !== undefined ? max.gravityScore : max.score)
        ? l
        : max,
    recentLogs[0]
  );

  const bestDayLabel = DAY_LABELS[new Date(best.date).getDay()];
  const worstDayLabel = DAY_LABELS[new Date(worst.date).getDay()];

  return {
    averageScore: avgScore,
    bestDay: { day: bestDayLabel, score: best.gravityScore !== undefined ? best.gravityScore : best.score },
    worstDay: { day: worstDayLabel, score: worst.gravityScore !== undefined ? worst.gravityScore : worst.score },
    logCount: recentLogs.length,
  };
};

export const ScoreProvider = ({ children }) => {
  // Hydrate from localStorage on first mount
  const [logs, setLogs] = useState(() => getAllLogs());
  const [calculatedScore, setCalculatedScore] = useState(0);

  // Sync state if localStorage changes from elsewhere (optional but good practice)
  useEffect(() => {
    const handleStorageChange = () => {
      setLogs(getAllLogs());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Add a new log entry
  const addLog = (logData, score) => {
    const fullLog = saveDailyLog({ ...logData, score });
    setLogs(getAllLogs());
    if (fullLog.gravityScore !== undefined) {
      setCalculatedScore(fullLog.gravityScore);
    }
    return fullLog;
  };

  // Keep backward compat — still used by GravityScorePage / DashboardPage
  const updateScoreAndLog = (logData, score) => {
    return addLog(logData, score);
  };

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  const streak = calculateStreak(logs);
  const last7DaysTrend = buildLast7DaysTrend(logs);
  const weeklyStats = computeWeeklyStats(logs);

  return (
    <ScoreContext.Provider
      value={{
        logs,
        latestLog,
        calculatedScore: latestLog ? (latestLog.gravityScore !== undefined ? latestLog.gravityScore : latestLog.score) : calculatedScore,
        streak,
        last7DaysTrend,
        weeklyStats,
        addLog,
        updateScoreAndLog,
      }}
    >
      {children}
    </ScoreContext.Provider>
  );
};

