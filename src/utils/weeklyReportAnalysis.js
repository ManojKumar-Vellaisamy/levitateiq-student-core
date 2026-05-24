import { getAssignments, getOverdueAssignments } from './assignmentStorage';
import { getUpcomingExams, getNearestExam } from './examStorage';
import { getAttendanceSummary, getAttendanceRecords } from './attendanceStorage';
import { getPomodoroStats } from './pomodoroStorage';
import { generateAchievements } from './achievements';

/** Get the past 7 days' boundary date */
export const getWeeklyDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const formatDate = (d) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  };

  return {
    start: sevenDaysAgo,
    end: today,
    formatted: `${formatDate(sevenDaysAgo)} - ${formatDate(today)}`,
  };
};

/**
 * Main weekly productivity report aggregator
 * @param {Array} logs - Array of all daily logs from useScore
 * @returns {object} The complete productivity analysis report
 */
export const analyzeWeeklyProductivity = (logs = []) => {
  const { start: sevenDaysAgo, end: todayBoundary } = getWeeklyDateRange();

  // 1. Filter Daily Logs for the last 7 calendar days
  const weeklyLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    return logDate >= sevenDaysAgo && logDate <= todayBoundary;
  });

  const hasLogs = weeklyLogs.length > 0;

  // 2. Study, Sleep, and Stress Metrics
  let totalStudyHours = 0;
  let totalSleepHours = 0;
  let totalStressScore = 0;
  let totalGravityScore = 0;
  const subjectStudyMap = {};

  weeklyLogs.forEach(log => {
    totalStudyHours += parseFloat(log.studyHours || 0);
    totalSleepHours += parseFloat(log.sleepHours || 0);
    totalStressScore += parseInt(log.stressLevel || 5, 10);
    totalGravityScore += parseFloat(log.gravityScore !== undefined ? log.gravityScore : (log.score || 0));

    const subj = log.subjectStudied?.trim();
    if (subj) {
      subjectStudyMap[subj] = (subjectStudyMap[subj] || 0) + parseFloat(log.studyHours || 0);
    }
  });

  const avgSleep = hasLogs ? parseFloat((totalSleepHours / weeklyLogs.length).toFixed(1)) : 0;
  const avgStress = hasLogs ? parseFloat((totalStressScore / weeklyLogs.length).toFixed(1)) : 0;
  const avgGravity = hasLogs ? parseFloat((totalGravityScore / weeklyLogs.length).toFixed(1)) : 0;

  // 3. Subject Study Analysis (Most Studied & Neglected)
  let mostStudiedSubject = '';
  let mostStudiedHours = 0;

  Object.entries(subjectStudyMap).forEach(([subj, hrs]) => {
    if (hrs > mostStudiedHours) {
      mostStudiedHours = hrs;
      mostStudiedSubject = subj;
    }
  });

  // Weak/Ignored subjects: Cross reference with Attendance Tracker's custom subjects
  const attendanceRecords = getAttendanceRecords();
  const allCustomSubjects = attendanceRecords.map(r => r.subjectName);
  
  const ignoredSubjects = [];
  let weakSubject = '';
  let minHours = Infinity;

  allCustomSubjects.forEach(subName => {
    const hours = subjectStudyMap[subName] || 0;
    if (hours === 0) {
      ignoredSubjects.push(subName);
    } else if (hours < minHours) {
      minHours = hours;
      weakSubject = subName;
    }
  });

  // 4. Assignments Summary
  const assignments = getAssignments();
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'Completed').length;
  const pendingAssignments = assignments.filter(a => a.status !== 'Completed').length;
  const overdueAssignments = getOverdueAssignments().length;

  // 5. Exam Summary
  const upcomingExams = getUpcomingExams();
  const nearestExam = getNearestExam();

  // 6. Attendance Warning
  const attendanceSummary = getAttendanceSummary();
  const shortageSubjects = attendanceRecords
    .filter(r => {
      const pct = r.totalClasses > 0 ? (r.attendedClasses / r.totalClasses) * 100 : 0;
      return pct < 75;
    })
    .map(r => ({
      name: r.subjectName,
      pct: r.totalClasses > 0 ? Math.round((r.attendedClasses / r.totalClasses) * 100) : 0
    }));

  // 7. Focus Sessions sum in last 7 days
  const pomodoroStats = getPomodoroStats();
  let totalFocusSessions = 0;
  let totalFocusMinutes = 0;

  Object.entries(pomodoroStats).forEach(([dateStr, stat]) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    if (d >= sevenDaysAgo && d <= todayBoundary) {
      totalFocusSessions += stat.completedSessions || 0;
      totalFocusMinutes += stat.totalMinutes || 0;
    }
  });

  // 8. Achievements
  const achievements = generateAchievements(logs, pomodoroStats);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // 9. Personalized suggestions (rule-based, no medical jargon, friendly)
  const suggestions = [];

  if (hasLogs) {
    if (avgSleep < 7) {
      suggestions.push({
        id: 'sleep',
        title: 'Rest & Recover',
        text: `Your sleep averaged ${avgSleep}h this week. Aim for at least 7 hours nightly to enhance focus and keep your memory sharp.`
      });
    }
    if (avgStress > 6) {
      suggestions.push({
        id: 'stress',
        title: 'Manage Your Load',
        text: `With an average stress rating of ${avgStress}/10, try chunking your tasks using the Pomodoro timer to prevent burnout.`
      });
    }
    if (totalStudyHours === 0) {
      suggestions.push({
        id: 'study_zero',
        title: 'Kickstart Your Studies',
        text: `No study hours logged this week. Schedule short, 25-minute study sessions to rebuild your momentum.`
      });
    }
  }

  // Ignored/weak subject advice
  if (ignoredSubjects.length > 0) {
    suggestions.push({
      id: 'ignored_subj',
      title: 'Neglected Subject Warning',
      text: `You haven't logged study hours for "${ignoredSubjects[0]}" this week. Dedicate a small 20-minute review block to it next week.`
    });
  } else if (weakSubject && minHours < 2) {
    suggestions.push({
      id: 'weak_subj',
      title: 'Subject Focus Tip',
      text: `"${weakSubject}" got only ${minHours.toFixed(1)}h of study this week. Try adding a revision block to strengthen your grasp.`
    });
  }

  // Attendance shortage advice
  if (shortageSubjects.length > 0) {
    suggestions.push({
      id: 'attendance_warning',
      title: 'Attendance Shortage Alert',
      text: `"${shortageSubjects[0].name}" is currently at ${shortageSubjects[0].pct}% (under the 75% limit). Prioritize attending upcoming classes.`
    });
  }

  // Assignments advice
  if (overdueAssignments > 0) {
    suggestions.push({
      id: 'assignments_overdue',
      title: 'Resolve Overdue Tasks',
      text: `You have ${overdueAssignments} overdue assignment${overdueAssignments > 1 ? 's' : ''}. Focus on completing the high priority ones first to clear your queue.`
    });
  }

  // Default fallback if no critical alerts
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'healthy',
      title: 'Maintain Momentum',
      text: 'Fantastic job maintaining balance! Continue logging your daily check-ins and completing focus sessions next week.'
    });
  }

  return {
    hasLogs,
    logCount: weeklyLogs.length,
    totalStudyHours,
    avgSleep,
    avgStress,
    avgGravity,
    mostStudiedSubject,
    mostStudiedHours,
    ignoredSubjects,
    weakSubject,
    weakSubjectHours: minHours === Infinity ? 0 : minHours,
    assignments: {
      total: totalAssignments,
      completed: completedAssignments,
      pending: pendingAssignments,
      overdue: overdueAssignments,
      hasData: totalAssignments > 0,
    },
    exams: {
      upcomingCount: upcomingExams.length,
      nearest: nearestExam,
      hasData: upcomingExams.length > 0,
    },
    attendance: {
      overallPercent: attendanceSummary.overallPercent,
      shortages: shortageSubjects,
      hasData: attendanceSummary.hasData,
    },
    focus: {
      sessionsCount: totalFocusSessions,
      minutesCount: totalFocusMinutes,
      hasData: totalFocusSessions > 0,
    },
    achievements: {
      unlockedCount,
    },
    suggestions,
  };
};
