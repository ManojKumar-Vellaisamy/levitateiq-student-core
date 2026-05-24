/**
 * Notification Engine
 * Reads all existing localStorage data and generates structured notifications.
 * No AI API or Firebase — pure local data only.
 *
 * Each notification: { id, emoji, title, message, category, severity, timestamp, read }
 * severity: 'danger' | 'warning' | 'info' | 'good'
 * category: 'Burnout' | 'Sleep' | 'Study' | 'Stress' | 'Attendance' | 'Tasks' | 'Focus' | 'Productivity'
 */

import { getAttendanceSummary, getAttendanceRecords, getAttendancePercentage } from './attendanceStorage';
import { getPomodoroStats } from './pomodoroStorage';
import { getAssignments, isOverdue } from './assignmentStorage';

// ── Helpers ────────────────────────────────────────────────────────────────────

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getSevenDaysAgo = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6);
  return d;
};

const relativeTime = (dateStr) => {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1)  return 'Yesterday';
  return `${diffD}d ago`;
};

// ── Main Generator ─────────────────────────────────────────────────────────────

export const generateAllNotifications = (logs = []) => {
  const notifs = [];
  let idCounter = 1;

  const push = (obj) => {
    notifs.push({ id: idCounter++, read: false, ...obj });
  };

  const today = getTodayStr();
  const sevenDaysAgo = getSevenDaysAgo();

  // Sort logs chronologically
  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest  = sorted[sorted.length - 1] || null;

  // Last 7 days of logs
  const weeklyLogs = sorted.filter(l => {
    const d = new Date(l.date);
    d.setHours(0, 0, 0, 0);
    return d >= sevenDaysAgo;
  });

  const getNum = (obj, key, def) => {
    if (!obj) return def;
    const n = Number(obj[key]);
    return Number.isNaN(n) ? def : n;
  };

  // ── 1. BURNOUT RISK (from latest log) ──────────────────────────────────────
  if (latest) {
    const stress  = getNum(latest, 'stressLevel', 5);
    const sleep   = getNum(latest, 'sleepHours', 8);
    const score   = getNum(latest, 'gravityScore', getNum(latest, 'score', 0));

    if (stress >= 8 && sleep < 5) {
      push({
        emoji: '🔥',
        title: 'Burnout Risk Increasing',
        message: `Stress is ${stress}/10 and sleep only ${sleep}h — a critical combination. Your gravity score is ${score}. Take a break now.`,
        category: 'Burnout',
        severity: 'danger',
        timestamp: relativeTime(latest.timestamp || today),
      });
    } else if (stress >= 7 || score >= 70) {
      push({
        emoji: '🔥',
        title: 'Burnout Risk Elevated',
        message: `Stress at ${stress}/10 with gravity score ${score}/100. Monitor your load and rest adequately tonight.`,
        category: 'Burnout',
        severity: 'warning',
        timestamp: relativeTime(latest.timestamp || today),
      });
    }

    // ── 2. SLEEP HEALTH ───────────────────────────────────────────────────────
    if (sleep < 5) {
      push({
        emoji: '😴',
        title: 'Critical Low Sleep Detected',
        message: `Only ${sleep}h of sleep last night. Memory and focus are severely impacted. Sleep 8+ hours tonight.`,
        category: 'Sleep',
        severity: 'danger',
        timestamp: relativeTime(latest.timestamp || today),
      });
    } else if (sleep < 6.5) {
      push({
        emoji: '😴',
        title: 'Low Sleep Detected',
        message: `You slept ${sleep}h — below the 7h recommended. Sleep debt is accumulating. Try sleeping 30 min earlier tonight.`,
        category: 'Sleep',
        severity: 'warning',
        timestamp: relativeTime(latest.timestamp || today),
      });
    }

    // ── 3. STRESS LEVEL ────────────────────────────────────────────────────────
    if (stress >= 8) {
      push({
        emoji: '🧠',
        title: 'Stress Level High Today',
        message: `Stress at ${stress}/10. Take a 10-minute mindful break. Box breathing (4-4-4-4) helps reset your cortisol levels.`,
        category: 'Stress',
        severity: 'danger',
        timestamp: relativeTime(latest.timestamp || today),
      });
    } else if (stress >= 6) {
      push({
        emoji: '🧠',
        title: 'Moderate Stress Detected',
        message: `Stress is ${stress}/10 today. A short walk or screen break can reduce tension before it escalates.`,
        category: 'Stress',
        severity: 'warning',
        timestamp: relativeTime(latest.timestamp || today),
      });
    }
  }

  // ── 4. RISING GRAVITY TREND (3 consecutive days) ───────────────────────────
  if (sorted.length >= 3) {
    const last3 = sorted.slice(-3);
    const s = last3.map(l => getNum(l, 'gravityScore', getNum(l, 'score', 0)));
    if (s[0] < s[1] && s[1] < s[2]) {
      push({
        emoji: '📈',
        title: 'Mental Load Rising 3 Days',
        message: `Your gravity score rose consecutively: ${s[0]} → ${s[1]} → ${s[2]}. Intervene before it becomes critical.`,
        category: 'Burnout',
        severity: 'warning',
        timestamp: relativeTime(sorted[sorted.length - 1]?.timestamp),
      });
    }
  }

  // ── 5. PENDING TASKS ────────────────────────────────────────────────────────
  try {
    const assignments = getAssignments();
    const pending = assignments.filter(a => a.status !== 'Completed');
    const overdue = pending.filter(a => isOverdue(a.dueDate, a.status));

    if (overdue.length > 0) {
      push({
        emoji: '⚠️',
        title: `${overdue.length} Overdue Task${overdue.length > 1 ? 's' : ''}`,
        message: `"${overdue[0].title}" is overdue${overdue.length > 1 ? ` and ${overdue.length - 1} more` : ''}. Submit immediately to prevent further stress build-up.`,
        category: 'Tasks',
        severity: 'danger',
        timestamp: 'Today',
      });
    } else if (pending.length > 3) {
      push({
        emoji: '⚠️',
        title: 'Pending Tasks Increasing',
        message: `${pending.length} assignments are unfinished. Complete at least 1 today to reduce your invisible mental load.`,
        category: 'Tasks',
        severity: 'warning',
        timestamp: 'Today',
      });
    } else if (pending.length > 0) {
      push({
        emoji: '📋',
        title: `${pending.length} Task${pending.length > 1 ? 's' : ''} Pending`,
        message: `You have ${pending.length} assignment${pending.length > 1 ? 's' : ''} to complete. Starting with the smallest one builds momentum.`,
        category: 'Tasks',
        severity: 'info',
        timestamp: 'Today',
      });
    }
  } catch (err) {
    console.warn('Failed to load assignments in notification engine:', err);
  }

  // ── 6. ATTENDANCE ──────────────────────────────────────────────────────────
  try {
    const attendanceSummary = getAttendanceSummary();
    const attendanceRecords = getAttendanceRecords();

    if (attendanceSummary.hasData) {
      const shortage = attendanceRecords.filter(r => {
        const pct = getAttendancePercentage(r);
        return pct < 75;
      });

      if (shortage.length > 0) {
        const worst = shortage.reduce((min, r) =>
          getAttendancePercentage(r) < getAttendancePercentage(min) ? r : min, shortage[0]);
        const worstPct = getAttendancePercentage(worst);
        push({
          emoji: '📉',
          title: 'Attendance Below 75%',
          message: `"${worst.subjectName}" attendance is at ${worstPct}% — below the required 75%. Attend all upcoming classes to recover your standing.`,
          category: 'Attendance',
          severity: 'danger',
          timestamp: 'Today',
        });
      } else if (attendanceSummary.overallPercent >= 90) {
        push({
          emoji: '✅',
          title: 'Attendance Excellent!',
          message: `Overall attendance is ${attendanceSummary.overallPercent}%. Great discipline! Keep maintaining this to stay worry-free.`,
          category: 'Attendance',
          severity: 'good',
          timestamp: 'Today',
        });
      } else if (attendanceSummary.overallPercent >= 75) {
        push({
          emoji: '✅',
          title: 'Attendance Improved',
          message: `Overall attendance is ${attendanceSummary.overallPercent}%. You are above the 75% threshold. Keep it up!`,
          category: 'Attendance',
          severity: 'good',
          timestamp: 'Today',
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load attendance in notification engine:', err);
  }

  // ── 7. FOCUS SESSIONS ─────────────────────────────────────────────────────
  try {
    const pomodoroStats = getPomodoroStats();
    let weeklyFocusSessions = 0;
    let weeklyFocusMinutes  = 0;
    const todayStats = pomodoroStats[today] || null;

    Object.entries(pomodoroStats).forEach(([dateStr, stat]) => {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      if (d >= sevenDaysAgo) {
        weeklyFocusSessions += stat.completedSessions || 0;
        weeklyFocusMinutes  += stat.totalMinutes     || 0;
      }
    });

    if (todayStats && todayStats.completedSessions >= 4) {
      push({
        emoji: '🎯',
        title: 'Great Focus Streak Today!',
        message: `You completed ${todayStats.completedSessions} Pomodoro sessions (${todayStats.totalMinutes} min) today. Exceptional focus discipline!`,
        category: 'Focus',
        severity: 'good',
        timestamp: 'Today',
      });
    } else if (weeklyFocusSessions >= 10) {
      push({
        emoji: '🎯',
        title: `${weeklyFocusSessions} Focus Sessions This Week`,
        message: `You completed ${weeklyFocusSessions} Pomodoro sessions (${Math.round(weeklyFocusMinutes / 60)}h) this week. Excellent consistency!`,
        category: 'Focus',
        severity: 'good',
        timestamp: 'This week',
      });
    } else if (weeklyFocusSessions === 0 && weeklyLogs.length >= 3) {
      push({
        emoji: '⏱️',
        title: 'No Focus Sessions Logged',
        message: 'You haven\'t completed any Pomodoro sessions this week. Even 2 sessions a day builds strong study habits.',
        category: 'Focus',
        severity: 'warning',
        timestamp: 'This week',
      });
    }
  } catch (err) {
    console.warn('Failed to load pomodoro stats in notification engine:', err);
  }

  // ── 8. STUDY CONSISTENCY ────────────────────────────────────────────────────
  if (weeklyLogs.length >= 5) {
    const totalStudy = weeklyLogs.reduce((s, l) => s + getNum(l, 'studyHours', 0), 0);
    const avgStudy   = totalStudy / weeklyLogs.length;
    if (avgStudy >= 4) {
      push({
        emoji: '📚',
        title: 'Great Study Consistency!',
        message: `Averaging ${avgStudy.toFixed(1)}h/day over ${weeklyLogs.length} days this week. Keep this momentum — it compounds over time.`,
        category: 'Study',
        severity: 'good',
        timestamp: 'This week',
      });
    } else if (avgStudy < 1 && weeklyLogs.length >= 3) {
      push({
        emoji: '📚',
        title: 'Low Study Hours This Week',
        message: `Only ${avgStudy.toFixed(1)}h/day average this week. Schedule at least 2 focused hours daily to stay on track.`,
        category: 'Study',
        severity: 'warning',
        timestamp: 'This week',
      });
    }
  }

  // ── 9. WEEKLY PRODUCTIVITY WIN ─────────────────────────────────────────────
  if (weeklyLogs.length >= 5) {
    const avgStress = weeklyLogs.reduce((s, l) => s + getNum(l, 'stressLevel', 5), 0) / weeklyLogs.length;
    const avgSleep  = weeklyLogs.reduce((s, l) => s + getNum(l, 'sleepHours', 0), 0) / weeklyLogs.length;
    const avgGravity = weeklyLogs.reduce((s, l) => s + getNum(l, 'gravityScore', getNum(l, 'score', 0)), 0) / weeklyLogs.length;

    if (avgStress <= 4 && avgSleep >= 7 && avgGravity <= 40) {
      push({
        emoji: '🏆',
        title: 'Peak Weekly Productivity!',
        message: `Avg stress ${avgStress.toFixed(1)}/10, avg sleep ${avgSleep.toFixed(1)}h, avg gravity ${avgGravity.toFixed(0)}/100 — you had an outstanding week!`,
        category: 'Productivity',
        severity: 'good',
        timestamp: 'This week',
      });
    }
  }

  // Sort: danger first, then warning, then info, then good
  const severityOrder = { danger: 0, warning: 1, info: 2, good: 3 };
  notifs.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

  // Re-assign sequential IDs after sort
  return notifs.map((n, i) => ({ ...n, id: i + 1 }));
};
