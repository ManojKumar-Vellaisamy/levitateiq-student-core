// Smart Notifications utility
// Generates personalized, context-aware notification messages based on recent logs.
// Returns an array of objects: { icon, message, severity }

export const generateSmartNotifications = (logs = []) => {
  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const notifications = [];

  if (sorted.length === 0) return notifications;

  const latest = sorted[sorted.length - 1];

  const getNum = (obj, key, def) => {
    const val = obj[key];
    if (val === undefined || val === null) return def;
    const n = Number(val);
    return Number.isNaN(n) ? def : n;
  };

  const stress  = getNum(latest, 'stressLevel', 0);
  const sleep   = getNum(latest, 'sleepHours', 8);
  const study   = getNum(latest, 'studyHours', 0);
  const social  = getNum(latest, 'socialMediaUsage', 0);
  const pending = getNum(latest, 'pendingAssignments', 0);
  const score   = getNum(latest, 'gravityScore', getNum(latest, 'score', 0));

  // 1. High stress with low sleep — most critical combination
  if (stress >= 7 && sleep < 6) {
    notifications.push({
      icon: '🔥',
      message: `Your stress score is ${stress}/10 while sleep is only ${sleep}h. Take a short break and avoid overloading yourself today.`,
      severity: 'danger',
    });
  } else if (stress >= 7) {
    notifications.push({
      icon: '🧠',
      message: `Stress at ${stress}/10 detected. Try a 5-minute mindful break — even a short walk resets your cortisol levels.`,
      severity: 'warning',
    });
  }

  // 2. Low sleep warning
  if (sleep < 5) {
    notifications.push({
      icon: '😴',
      message: `Critical: only ${sleep}h of sleep. Memory consolidation is severely impacted. Prioritize sleep tonight — aim for 8+ hours.`,
      severity: 'danger',
    });
  } else if (sleep < 6) {
    notifications.push({
      icon: '😴',
      message: `Your sleep was ${sleep}h — below the 7h minimum. Sleep at least 7 hours tonight to restore focus and reduce your mental load.`,
      severity: 'warning',
    });
  }

  // 3. High social media usage
  if (social > 5) {
    notifications.push({
      icon: '📱',
      message: `${social}h of screen time logged today. High digital usage is amplifying stress and reducing deep focus capacity.`,
      severity: 'warning',
    });
  } else if (social > 3) {
    notifications.push({
      icon: '📱',
      message: `${social}h on social media. Try capping it at 2h tomorrow — set a timer on your phone apps.`,
      severity: 'info',
    });
  }

  // 4. Pending assignments pile-up
  if (pending > 3) {
    notifications.push({
      icon: '⚠️',
      message: `${pending} pending assignments detected. This backlog is silently increasing your stress level. Complete 1 task first to break the cycle.`,
      severity: 'danger',
    });
  } else if (pending > 0) {
    notifications.push({
      icon: '📋',
      message: `You have ${pending} pending task${pending > 1 ? 's' : ''}. Clearing them reduces cognitive clutter — start with the smallest one.`,
      severity: 'info',
    });
  }

  // 5. Rising gravity score for 3 consecutive days
  if (sorted.length >= 3) {
    const last3 = sorted.slice(-3);
    const scores = last3.map((l) => getNum(l, 'gravityScore', getNum(l, 'score', 0)));
    if (scores[0] < scores[1] && scores[1] < scores[2]) {
      notifications.push({
        icon: '📈',
        message: `Your mental load has been rising for ${last3.length} consecutive days (${scores[0]} → ${scores[1]} → ${scores[2]}). Act now before it escalates.`,
        severity: 'warning',
      });
    }
  }

  // 6. Recovery needed — high gravity score
  if (score >= 81) {
    notifications.push({
      icon: '🚨',
      message: `Gravity score is ${score}/100 — critical zone. Recovery should take priority over heavy study today. Rest is not laziness; it is strategy.`,
      severity: 'danger',
    });
  } else if (score >= 61) {
    notifications.push({
      icon: '⚠️',
      message: `Gravity score ${score}/100 indicates high pressure. Limit study to 2-hour blocks and take active breaks to prevent escalation.`,
      severity: 'warning',
    });
  }

  // 7. Low study hours — gentle nudge
  if (study === 0 && score < 60) {
    notifications.push({
      icon: '📚',
      message: `No study hours logged yet today. Even a single 25-minute Pomodoro session keeps momentum going — you can do it!`,
      severity: 'info',
    });
  }

  // 8. Positive reinforcement — great state
  if (score <= 25 && stress <= 4 && sleep >= 7) {
    notifications.push({
      icon: '🚀',
      message: `You are in peak condition! Low gravity (${score}), low stress (${stress}/10), great sleep (${sleep}h). This is your best window for deep work.`,
      severity: 'good',
    });
  }

  return notifications;
};
