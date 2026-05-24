export const calculateGravityScore = (logData) => {
  const { stressLevel = 0, sleepHours = 8, pendingAssignments = 0, socialMediaUsage = 0 } = logData;

  const stressScore = stressLevel * 10;
  const sleepDeficit = Math.max(0, 8 - sleepHours) * 12.5;
  const assignmentScore = Math.min(pendingAssignments * 20, 100);
  const socialScore = Math.min(socialMediaUsage * 20, 100);

  const gravityScore = 
    (stressScore * 0.40) + 
    (sleepDeficit * 0.25) + 
    (assignmentScore * 0.20) + 
    (socialScore * 0.15);

  const finalScore = Math.round(gravityScore);
  return Math.min(Math.max(finalScore, 0), 100);
};

export const generateBasicInsight = (logData, score) => {
  const {
    stressLevel = 0,
    sleepHours = 8,
    studyHours = 0,
    pendingAssignments = 0,
    socialMediaUsage = 0,
  } = logData;

  if (score >= 81) {
    return `Your mental load is critical (${score}/100). With stress at ${stressLevel}/10 and only ${sleepHours}h of sleep, your brain needs recovery — not more study. Rest is your priority today.`;
  }
  if (stressLevel >= 7 && sleepHours < 6) {
    return `Stress is ${stressLevel}/10 and sleep is only ${sleepHours}h — a high-risk combination. Stick to light revision today and make sleep your #1 goal tonight.`;
  }
  if (score <= 30) {
    return `Excellent state! Low gravity (${score}/100), manageable stress (${stressLevel}/10), and ${sleepHours}h of sleep. You are primed for difficult topics and deep work today.`;
  }
  if (sleepHours < 6) {
    return `Only ${sleepHours}h of sleep detected. Cognitive performance drops sharply below 6h. Aim for 7–8h tonight to keep your gravity score healthy.`;
  }
  if (sleepHours < 7) {
    return `Sleep at ${sleepHours}h — slightly below the 7h target. Consider going to bed 30 minutes earlier tonight to reduce mental gravity tomorrow.`;
  }
  if (socialMediaUsage > 4) {
    return `High digital footprint — ${socialMediaUsage}h of screen time logged. This is increasing cognitive noise. A 30-minute screen-free break will help lower your mental load.`;
  }
  if (pendingAssignments > 2) {
    return `${pendingAssignments} pending assignments are adding invisible stress to your day. Complete at least one today to reduce mental clutter and lower your gravity score.`;
  }
  if (studyHours >= 6) {
    return `Solid ${studyHours}h study session today! Make sure you are taking structured breaks — your stress level is ${stressLevel}/10. Avoid over-extending to protect tomorrow's energy.`;
  }
  return `Your mental gravity is balanced at ${score}/100. Stress (${stressLevel}/10) and sleep (${sleepHours}h) are in check. Maintain your routine and take regular short breaks.`;
};

export const getGravityStatus = (score) => {
  if (score <= 30) {
    return {
      label: 'Zero Gravity',
      emoji: '🚀',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/15',
      strokeColor: '#10b981',
      message: 'Excellent balance! You are floating through your tasks effortlessly.',
    };
  }
  if (score <= 60) {
    return {
      label: 'Medium Gravity',
      emoji: '⚖️',
      colorClass: 'text-purple-400',
      bgClass: 'bg-purple-500/15',
      strokeColor: '#8b5cf6',
      message: 'Good balance. You feel some pull, but it is manageable.',
    };
  }
  if (score <= 80) {
    return {
      label: 'High Gravity',
      emoji: '🏋️',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/15',
      strokeColor: '#f59e0b',
      message: 'Things are getting heavy. Consider taking a break soon.',
    };
  }
  return {
    label: 'Danger Zone',
    emoji: '🚨',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/15',
    strokeColor: '#ef4444',
    message: 'Critical mental load! Prioritize recovery and self-care immediately.',
  };
};
