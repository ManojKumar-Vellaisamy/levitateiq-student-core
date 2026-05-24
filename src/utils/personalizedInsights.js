/**
 * Personalized AI Insights Generator
 * Reads real student log data and produces categorized insight objects.
 * Each insight has: category, emoji, title, message, action, severity
 * severity: 'good' | 'warning' | 'danger' | 'info'
 */

export const generatePersonalizedInsights = (logs = []) => {
  if (!logs || logs.length === 0) return [];

  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];

  const sleep   = parseFloat(latest.sleepHours)       || 0;
  const stress  = parseInt(latest.stressLevel, 10)    || 5;
  const study   = parseFloat(latest.studyHours)       || 0;
  const pending = parseInt(latest.pendingAssignments, 10) || 0;
  const social  = parseFloat(latest.socialMediaUsage) || 0;
  const score   = latest.gravityScore !== undefined
    ? latest.gravityScore
    : (latest.score || 0);

  // Compute a 3-day average for trend context (if enough data)
  const recent3 = sorted.slice(-3);
  const avgStress = recent3.length
    ? Math.round(recent3.reduce((s, l) => s + (parseInt(l.stressLevel, 10) || 5), 0) / recent3.length)
    : stress;
  const avgSleep = recent3.length
    ? parseFloat((recent3.reduce((s, l) => s + (parseFloat(l.sleepHours) || 0), 0) / recent3.length).toFixed(1))
    : sleep;

  const insights = [];

  // ─────────────────────────────────────────────────────────────
  // 1. 🔥 Burnout Risk
  // ─────────────────────────────────────────────────────────────
  if (stress >= 8 && sleep < 5) {
    insights.push({
      category: 'Burnout Risk',
      emoji: '🔥',
      title: 'Critical Burnout Risk',
      message: `Your stress score is ${stress}/10 while sleep is only ${sleep}h. This dangerous combination signals your brain is severely overloaded.`,
      action: 'Take a 10-minute reset break now. Avoid adding any new tasks today.',
      severity: 'danger',
    });
  } else if (stress >= 6 && sleep < 6.5) {
    insights.push({
      category: 'Burnout Risk',
      emoji: '🔥',
      title: 'Moderate Burnout Risk',
      message: `Stress at ${stress}/10 with only ${sleep}h of sleep — your recovery reserves are depleting. Average stress this week: ${avgStress}/10.`,
      action: 'Sleep at least 7 hours tonight and limit study to 2 focused hours max.',
      severity: 'warning',
    });
  } else {
    insights.push({
      category: 'Burnout Risk',
      emoji: '🔥',
      title: 'Burnout Risk Is Low',
      message: `Stress (${stress}/10) and sleep (${sleep}h) are at manageable levels. Your weekly average stress is ${avgStress}/10 — keep it up!`,
      action: 'Maintain your routine and schedule one short break every 90 minutes.',
      severity: 'good',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. 😴 Sleep Health
  // ─────────────────────────────────────────────────────────────
  if (sleep < 5) {
    insights.push({
      category: 'Sleep Health',
      emoji: '😴',
      title: 'Critical Sleep Deficit',
      message: `Only ${sleep}h of sleep detected — severely below the recommended 7–8h. Memory consolidation and focus are significantly impaired.`,
      action: 'Sleep at least 8 hours tonight. Avoid caffeine after 2 PM.',
      severity: 'danger',
    });
  } else if (sleep < 7) {
    insights.push({
      category: 'Sleep Health',
      emoji: '😴',
      title: 'Below Optimal Sleep',
      message: `You got ${sleep}h of sleep (avg this week: ${avgSleep}h). The optimal range is 7–8h for peak cognitive performance and memory retention.`,
      action: 'Sleep 30–45 minutes earlier tonight — set an alarm to remind yourself.',
      severity: 'warning',
    });
  } else {
    insights.push({
      category: 'Sleep Health',
      emoji: '😴',
      title: 'Healthy Sleep Pattern',
      message: `Excellent! You slept ${sleep}h last night. Your brain is well-rested and primed for focused learning and memory retention.`,
      action: 'Keep this schedule. Avoid screens 30 min before bed to sustain quality.',
      severity: 'good',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. 📚 Study Focus
  // ─────────────────────────────────────────────────────────────
  if (study >= 7) {
    insights.push({
      category: 'Study Focus',
      emoji: '📚',
      title: 'Very High Study Load',
      message: `${study}h of study logged today — that's intense! Studies show retention drops sharply without proper breaks beyond 6 hours.`,
      action: 'Use strict Pomodoro: 25 min study + 5 min break. No exceptions.',
      severity: 'warning',
    });
  } else if (study >= 3) {
    insights.push({
      category: 'Study Focus',
      emoji: '📚',
      title: 'Productive Study Session',
      message: `You completed ${study}h of focused study today — a solid and sustainable pace that supports long-term retention.`,
      action: 'Try 2 more Pomodoro sessions to close out today on a high note.',
      severity: 'good',
    });
  } else if (study > 0) {
    insights.push({
      category: 'Study Focus',
      emoji: '📚',
      title: 'Light Study Day',
      message: `Only ${study}h of study logged. Check if this aligns with your goals — small consistent sessions beat occasional cramming sessions.`,
      action: 'Start with one 25-minute Pomodoro session right now to build momentum.',
      severity: 'info',
    });
  } else {
    insights.push({
      category: 'Study Focus',
      emoji: '📚',
      title: 'No Study Logged Today',
      message: 'No study hours recorded yet. Even a 30-minute focused session builds consistency and prevents knowledge gaps.',
      action: 'Try 2 Pomodoro sessions today — small steps lead to big wins!',
      severity: 'warning',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. 🧠 Stress Pattern
  // ─────────────────────────────────────────────────────────────
  if (stress >= 8) {
    insights.push({
      category: 'Stress Pattern',
      emoji: '🧠',
      title: 'High Stress Alert',
      message: `Stress at ${stress}/10 significantly impairs focus, decision-making, and memory. Social media usage of ${social}h may be amplifying this.`,
      action: 'Try box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 3×.',
      severity: 'danger',
    });
  } else if (stress >= 5) {
    insights.push({
      category: 'Stress Pattern',
      emoji: '🧠',
      title: 'Moderate Stress Level',
      message: `Stress at ${stress}/10 — you are managing, but this is worth monitoring. Your 3-day average is ${avgStress}/10.`,
      action: 'A 5-minute outdoor walk reduces cortisol. Set a phone reminder for it.',
      severity: 'warning',
    });
  } else {
    insights.push({
      category: 'Stress Pattern',
      emoji: '🧠',
      title: 'Low Stress — Peak State',
      message: `Stress is low at ${stress}/10. Your mind is calm and primed for deep, focused work. This is your golden window.`,
      action: 'Use this mental clarity to tackle your hardest subject or assignment now.',
      severity: 'good',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 5. ✅ Productivity Win  or  ⚠️ Improvement Alert
  // ─────────────────────────────────────────────────────────────
  if (pending === 0 && study >= 3) {
    insights.push({
      category: 'Productivity Win',
      emoji: '✅',
      title: 'Productivity Champion!',
      message: `Zero pending tasks + ${study}h of study = an outstanding day! You are completely on top of your workload.`,
      action: 'Reward yourself — 20 minutes of guilt-free downtime is well earned!',
      severity: 'good',
    });
  } else if (pending > 3) {
    insights.push({
      category: 'Improvement Alert',
      emoji: '⚠️',
      title: `${pending} Tasks Piling Up`,
      message: `${pending} pending assignments are stacking up, adding invisible mental load even when you are not actively working on them.`,
      action: 'Complete 1 pending task first — just one. Breaking the backlog cycle matters.',
      severity: 'danger',
    });
  } else if (pending > 0) {
    insights.push({
      category: 'Improvement Alert',
      emoji: '⚠️',
      title: `${pending} Task${pending > 1 ? 's' : ''} Pending`,
      message: `You have ${pending} pending assignment${pending > 1 ? 's' : ''}. Addressing them promptly reduces future stress spikes and mental clutter.`,
      action: 'Start with the smallest task to build momentum and clear mental load.',
      severity: 'warning',
    });
  } else {
    insights.push({
      category: 'Productivity Win',
      emoji: '✅',
      title: 'All Tasks Cleared!',
      message: `No pending assignments detected. A clean task list reduces cognitive burden and improves the quality of focus.`,
      action: 'Use this momentum — start planning or previewing tomorrow\'s priorities.',
      severity: 'good',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 6. ✅ or ⚠️ — Overall Gravity / Gravity Score Insight
  // ─────────────────────────────────────────────────────────────
  if (score >= 81) {
    insights.push({
      category: 'Improvement Alert',
      emoji: '⚠️',
      title: 'Mental Load at Critical Level',
      message: `Your gravity score is ${score}/100 — the danger zone. Stress (${stress}/10), sleep (${sleep}h), and ${pending} pending tasks are compounding your overload.`,
      action: 'Pause heavy studying. Do one light activity and prioritize sleep recovery.',
      severity: 'danger',
    });
  } else if (score >= 61) {
    insights.push({
      category: 'Improvement Alert',
      emoji: '⚠️',
      title: 'Heavy Mental Load Detected',
      message: `Gravity score of ${score}/100 indicates high pressure. With ${pending} tasks pending and stress at ${stress}/10, careful balancing is needed.`,
      action: 'Take a 15-min digital detox break before continuing study sessions.',
      severity: 'warning',
    });
  } else if (score >= 31) {
    insights.push({
      category: 'Productivity Win',
      emoji: '✅',
      title: 'Balanced Mental State',
      message: `Gravity score of ${score}/100 shows a balanced workload. You are managing stress (${stress}/10) and sleep (${sleep}h) within healthy parameters.`,
      action: 'Maintain this balance — consider one proactive break every 2 hours.',
      severity: 'info',
    });
  } else {
    insights.push({
      category: 'Productivity Win',
      emoji: '✅',
      title: 'Peak Performance Zone',
      message: `Outstanding gravity score of ${score}/100! Stress (${stress}/10) and sleep (${sleep}h) are perfectly balanced for optimal learning and productivity.`,
      action: 'This is your peak window — tackle your most challenging tasks now.',
      severity: 'good',
    });
  }

  return insights;
};
