// Burnout Risk Prediction Engine
// Analyzes student check-in trends over the last 7 logs to predict mental overload risk.

export const generateBurnoutPrediction = (logs = []) => {
  // Sort logs chronologically to ensure proper chronological calculations
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Retrieve up to the last 7 logs for our active window
  const activeLogs = sortedLogs.slice(-7);

  // We require at least 3 logs to calculate trends (consecutive days comparison)
  if (activeLogs.length < 3) {
    return { insufficient: true };
  }

  const latestLog = activeLogs[activeLogs.length - 1];
  const yesterdayLog = activeLogs[activeLogs.length - 2];
  const twoDaysAgoLog = activeLogs[activeLogs.length - 3];

  const scoreLatest = latestLog.gravityScore !== undefined ? latestLog.gravityScore : (latestLog.score || 0);
  const scoreYesterday = yesterdayLog.gravityScore !== undefined ? yesterdayLog.gravityScore : (yesterdayLog.score || 0);
  const scoreTwoDaysAgo = twoDaysAgoLog.gravityScore !== undefined ? twoDaysAgoLog.gravityScore : (twoDaysAgoLog.score || 0);

  const sleepLatest = latestLog.sleepHours || 8;
  const sleepYesterday = yesterdayLog.sleepHours || 8;
  const sleepTwoDaysAgo = twoDaysAgoLog.sleepHours || 8;

  const stressLatest = latestLog.stressLevel || 5;
  const stressYesterday = yesterdayLog.stressLevel || 5;
  const stressTwoDaysAgo = twoDaysAgoLog.stressLevel || 5;

  const socialLatest = latestLog.socialMediaUsage || 0;
  const socialTwoDaysAgo = twoDaysAgoLog.socialMediaUsage || 0;

  // 1. Calculate consecutive trend factors (over last 3 days)
  let scoreInc = 0;
  if (scoreLatest > scoreYesterday) scoreInc++;
  if (scoreYesterday > scoreTwoDaysAgo) scoreInc++;

  let sleepDec = 0;
  if (sleepLatest < sleepYesterday) sleepDec++;
  if (sleepYesterday < sleepTwoDaysAgo) sleepDec++;

  let stressInc = 0;
  if (stressLatest > stressYesterday) stressInc++;
  if (stressYesterday > stressTwoDaysAgo) stressInc++;

  // 2. Net differences (Latest log vs 2 check-ins ago)
  const scoreDiff = scoreLatest - scoreTwoDaysAgo;
  const sleepDiff = sleepLatest - sleepTwoDaysAgo;
  const stressDiff = stressLatest - stressTwoDaysAgo;
  const socialDiff = socialLatest - socialTwoDaysAgo;

  // 3. Assign trend directions
  const getTrendDirection = (diff) => {
    if (diff > 1) return 'up';
    if (diff < -1) return 'down';
    return 'stable';
  };

  const scoreTrend = getTrendDirection(scoreDiff);
  const sleepTrend = getTrendDirection(sleepDiff);
  const stressTrend = getTrendDirection(stressDiff);

  // 4. Calculate Risk Points
  let riskPoints = 1; // Default: Low

  // Base points on latest gravity score
  if (scoreLatest >= 81) {
    riskPoints = 4.0; // Critical zone base
  } else if (scoreLatest >= 61) {
    riskPoints = 3.0; // High zone base
  } else if (scoreLatest >= 31) {
    riskPoints = 2.0; // Medium zone base
  }

  // Adjustments based on 3-day consecutive trends
  if (scoreInc >= 2) riskPoints += 1.5;   // Score went up 2 days in a row
  if (stressInc >= 2) riskPoints += 1.0;  // Stress went up 2 days in a row
  if (sleepDec >= 2) riskPoints += 1.0;   // Sleep went down 2 days in a row

  // Adjustments based on extreme latest values
  if (stressLatest >= 8) riskPoints += 1.0;
  if (sleepLatest < 6.0) riskPoints += 1.0;
  if (socialDiff >= 2.0) riskPoints += 0.5; // Digital usage climbed by 2+ hours

  // 5. Determine Final Risk Details
  let level;
  let emoji;
  let colorClass;
  let bgClass;
  let reason;
  let preventionTips;
  let recommendations3Days;

  if (riskPoints >= 5.5) {
    level = 'Critical Risk';
    emoji = '🔴';
    colorClass = 'text-red-400';
    bgClass = 'bg-red-500/15';
    reason = `Critical risk predicted: Your mental gravity has surged continuously over the last few logs, compounded by high stress levels (${stressLatest}/10) and significant sleep loss (${sleepLatest}h). Your brain is running on low reserves.`;
    preventionTips = [
      'Implement an immediate 1-day screen curfew starting at 8:00 PM.',
      'Postpone any non-critical assignments and contact tutors if load feels unmanageable.',
      'Practice progressive muscle relaxation or deep breathing for 10 minutes to calm down your system.',
    ];
    recommendations3Days = 'For the next 3 days, prioritize active rest. Reduce study tasks to light reading for no more than 1 hour a day, and seek a full 8+ hours of sleep.';
  } else if (riskPoints >= 3.5) {
    level = 'High Risk';
    emoji = '🚨';
    colorClass = 'text-amber-500';
    bgClass = 'bg-amber-500/15';
    reason = `High risk predicted: Stress is climbing (${stressLatest}/10) and sleep has decreased from ${sleepTwoDaysAgo}h to ${sleepLatest}h. Your overall mental gravity indicates rising pressure.`;
    preventionTips = [
      'Take a mandatory 20-minute walk outdoors without your phone to decompress.',
      'Go to sleep 45 minutes earlier tonight to make up for the declining sleep trend.',
      'Organize your immediate checklist to focus only on tomorrow\'s top two priority tasks.',
    ];
    recommendations3Days = 'Over the next 3 days, scale back your study load. Limit focus periods to 2-hour blocks maximum and avoid starting heavy new topics.';
  } else if (riskPoints >= 2.0) {
    level = 'Moderate Risk';
    emoji = '⚠️';
    colorClass = 'text-purple-400';
    bgClass = 'bg-purple-500/15';
    reason = `Moderate risk predicted: Your metrics indicate a slight build-up of mental gravity. Sleep has dropped to ${sleepLatest}h and social media use has risen slightly.`;
    preventionTips = [
      'Set an app limit on social media to keep digital overstimulation low.',
      'Use 25-minute Pomodoro blocks with mandatory offline breaks to manage focus.',
      'Spend 5 minutes before bed writing down pending tasks to clear your mind.',
    ];
    recommendations3Days = 'For the next 3 days, focus on stability. Maintain a balanced study pattern and secure at least 7.5 hours of sleep to keep risk levels low.';
  } else {
    level = 'Low Risk';
    emoji = '✅';
    colorClass = 'text-emerald-400';
    bgClass = 'bg-emerald-500/15';
    reason = `Low risk predicted: Your sleep (${sleepLatest}h) and stress (${stressLatest}/10) trends are stable and healthy. Your cognitive load is well-managed.`;
    preventionTips = [
      'Maintain your current bedtime routine to sustain high focus levels.',
      'Continue drinking water and taking offline active breaks during study.',
      'Sustain your digital footprint balance by using timers on social apps.',
    ];
    recommendations3Days = 'Keep up the healthy habits! You are in an optimal state to tackle your current goals, study blocks, and projects.';
  }

  return {
    insufficient: false,
    level,
    emoji,
    colorClass,
    bgClass,
    reason,
    preventionTips,
    recommendations3Days,
    metrics: {
      scoreChange: Math.round(scoreDiff),
      sleepChange: parseFloat(sleepDiff.toFixed(1)),
      stressChange: Math.round(stressDiff),
      socialChange: parseFloat(socialDiff.toFixed(1)),
      scoreTrend,
      sleepTrend,
      stressTrend,
    },
  };
};
