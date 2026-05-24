/**
 * Achievements & Badges — gamification engine
 * Key: levitateiq_achievements
 * Shape: { [badgeId]: { unlockedAt: ISO string } }
 */

const STORAGE_KEY = 'levitateiq_achievements';

// ── Badge Definitions ────────────────────────────────────────────────────────
const BADGE_DEFINITIONS = [
  // Consistency
  {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Complete daily check-ins for 3 consecutive days.',
    category: 'Consistency',
    icon: '🔥',
    maxProgress: 3,
    check: (logs, _pom, streak) => ({ current: Math.min(streak, 3), unlocked: streak >= 3 }),
  },
  {
    id: 'streak_7',
    title: '7-Day Champion',
    description: 'Complete daily check-ins for 7 consecutive days.',
    category: 'Consistency',
    icon: '🏆',
    maxProgress: 7,
    check: (logs, _pom, streak) => ({ current: Math.min(streak, 7), unlocked: streak >= 7 }),
  },
  {
    id: 'streak_14',
    title: '14-Day Legend',
    description: 'Complete daily check-ins for 14 consecutive days.',
    category: 'Consistency',
    icon: '👑',
    maxProgress: 14,
    check: (logs, _pom, streak) => ({ current: Math.min(streak, 14), unlocked: streak >= 14 }),
  },
  {
    id: 'first_log',
    title: 'First Step',
    description: 'Complete your very first daily check-in.',
    category: 'Consistency',
    icon: '🌟',
    maxProgress: 1,
    check: (logs) => ({ current: Math.min(logs.length, 1), unlocked: logs.length >= 1 }),
  },

  // Focus (Pomodoro)
  {
    id: 'focus_starter',
    title: 'Focus Starter',
    description: 'Complete your first Pomodoro focus session.',
    category: 'Focus',
    icon: '🎯',
    maxProgress: 1,
    check: (_logs, pomStats) => {
      const total = getTotalPomodoroSessions(pomStats);
      return { current: Math.min(total, 1), unlocked: total >= 1 };
    },
  },
  {
    id: 'deep_focus',
    title: 'Deep Focus',
    description: 'Complete 5 Pomodoro sessions in a single day.',
    category: 'Focus',
    icon: '🧠',
    maxProgress: 5,
    check: (_logs, pomStats) => {
      const best = getBestDaySessions(pomStats);
      return { current: Math.min(best, 5), unlocked: best >= 5 };
    },
  },
  {
    id: 'focus_10',
    title: 'Focus Master',
    description: 'Complete 10 total Pomodoro focus sessions.',
    category: 'Focus',
    icon: '⚡',
    maxProgress: 10,
    check: (_logs, pomStats) => {
      const total = getTotalPomodoroSessions(pomStats);
      return { current: Math.min(total, 10), unlocked: total >= 10 };
    },
  },

  // Sleep
  {
    id: 'sleep_guardian_3',
    title: 'Sleep Guardian',
    description: 'Sleep 7+ hours for 3 consecutive days.',
    category: 'Sleep',
    icon: '🌙',
    maxProgress: 3,
    check: (logs) => {
      const consecutive = getConsecutiveSleepDays(logs, 7);
      return { current: Math.min(consecutive, 3), unlocked: consecutive >= 3 };
    },
  },
  {
    id: 'sleep_guardian_7',
    title: 'Sleep Hero',
    description: 'Sleep 7+ hours for 7 consecutive days.',
    category: 'Sleep',
    icon: '😴',
    maxProgress: 7,
    check: (logs) => {
      const consecutive = getConsecutiveSleepDays(logs, 7);
      return { current: Math.min(consecutive, 7), unlocked: consecutive >= 7 };
    },
  },

  // Recovery
  {
    id: 'recovery_hero',
    title: 'Recovery Hero',
    description: 'Improve your gravity score compared to the previous day.',
    category: 'Recovery',
    icon: '💪',
    maxProgress: 1,
    check: (logs) => {
      if (logs.length < 2) return { current: 0, unlocked: false };
      const latest = getScore(logs[logs.length - 1]);
      const prev = getScore(logs[logs.length - 2]);
      const improved = latest < prev;
      return { current: improved ? 1 : 0, unlocked: improved };
    },
  },
  {
    id: 'zero_gravity_day',
    title: 'Zero Gravity Day',
    description: 'Achieve a gravity score below 30 on any day.',
    category: 'Recovery',
    icon: '🚀',
    maxProgress: 1,
    check: (logs) => {
      const has = logs.some((l) => getScore(l) <= 30);
      return { current: has ? 1 : 0, unlocked: has };
    },
  },

  // Balance
  {
    id: 'balanced_3',
    title: 'Balanced Student',
    description: 'Maintain a gravity score below 60 for 3 consecutive days.',
    category: 'Balance',
    icon: '⚖️',
    maxProgress: 3,
    check: (logs) => {
      const consecutive = getConsecutiveBalancedDays(logs, 60);
      return { current: Math.min(consecutive, 3), unlocked: consecutive >= 3 };
    },
  },
  {
    id: 'balanced_5',
    title: 'Balanced Scholar',
    description: 'Maintain a gravity score below 60 for 5 consecutive days.',
    category: 'Balance',
    icon: '🎓',
    maxProgress: 5,
    check: (logs) => {
      const consecutive = getConsecutiveBalancedDays(logs, 60);
      return { current: Math.min(consecutive, 5), unlocked: consecutive >= 5 };
    },
  },
];

// ── Helper Functions ─────────────────────────────────────────────────────────
function getScore(log) {
  return log.gravityScore !== undefined ? log.gravityScore : log.score;
}

function getTotalPomodoroSessions(pomStats) {
  if (!pomStats || typeof pomStats !== 'object') return 0;
  return Object.values(pomStats).reduce(
    (sum, day) => sum + (day.completedSessions || 0),
    0
  );
}

function getBestDaySessions(pomStats) {
  if (!pomStats || typeof pomStats !== 'object') return 0;
  return Object.values(pomStats).reduce(
    (max, day) => Math.max(max, day.completedSessions || 0),
    0
  );
}

function getConsecutiveSleepDays(logs, minHours) {
  if (!logs || logs.length === 0) return 0;
  let maxStreak = 0;
  let current = 0;
  // Logs are sorted chronologically ascending
  for (const log of logs) {
    if ((log.sleepHours || 0) >= minHours) {
      current++;
      maxStreak = Math.max(maxStreak, current);
    } else {
      current = 0;
    }
  }
  return maxStreak;
}

function getConsecutiveBalancedDays(logs, threshold) {
  if (!logs || logs.length === 0) return 0;
  let maxStreak = 0;
  let current = 0;
  for (const log of logs) {
    if (getScore(log) < threshold) {
      current++;
      maxStreak = Math.max(maxStreak, current);
    } else {
      current = 0;
    }
  }
  return maxStreak;
}

function calculateStreak(logs) {
  if (!logs || logs.length === 0) return 0;
  const dates = [...new Set(logs.map((l) => l.date))].sort().reverse();
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let expected = new Date(today);

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === expected.getTime()) {
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else if (streak === 0 && d.getTime() === expected.getTime() - 86400000) {
      expected = new Date(d);
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ── localStorage Persistence ─────────────────────────────────────────────────
function getSavedAchievements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAchievements(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail
  }
}

// ── Main Export ──────────────────────────────────────────────────────────────
export function generateAchievements(logs, pomodoroStats) {
  const saved = getSavedAchievements();
  const streak = calculateStreak(logs);

  const results = BADGE_DEFINITIONS.map((badge) => {
    const { current, unlocked } = badge.check(logs || [], pomodoroStats || {}, streak);
    const progress = badge.maxProgress > 0 ? Math.round((current / badge.maxProgress) * 100) : 0;

    // Persist unlock date on first unlock
    let unlockedAt = saved[badge.id]?.unlockedAt || null;
    if (unlocked && !unlockedAt) {
      unlockedAt = new Date().toISOString();
      saved[badge.id] = { unlockedAt };
    }

    return {
      id: badge.id,
      title: badge.title,
      description: badge.description,
      category: badge.category,
      icon: badge.icon,
      unlocked,
      progress: Math.min(progress, 100),
      current,
      maxProgress: badge.maxProgress,
      unlockedAt,
    };
  });

  // Persist any new unlocks
  saveAchievements(saved);

  return results;
}

// ── Get Latest Unlocked Achievement ──────────────────────────────────────────
export function getLatestAchievement(logs, pomodoroStats) {
  const achievements = generateAchievements(logs, pomodoroStats);
  const unlocked = achievements.filter((a) => a.unlocked && a.unlockedAt);
  if (unlocked.length === 0) return null;
  unlocked.sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
  return unlocked[0];
}

// ── Category List ────────────────────────────────────────────────────────────
export const CATEGORIES = ['Consistency', 'Focus', 'Sleep', 'Recovery', 'Balance'];
