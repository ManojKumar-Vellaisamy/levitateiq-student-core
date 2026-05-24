export const generateRecoveryPlan = (log) => {
  if (!log) return null;

  const score = log.gravityScore !== undefined ? log.gravityScore : (log.score || 0);
  const {
    studyHours = 0,
    sleepHours = 8,
    stressLevel = 5,
    pendingAssignments = 0,
    socialMediaUsage = 0,
  } = log;

  let planName;
  let study;
  let sleep;
  let stress;
  let socialMedia;
  let tomorrowFocus;

  if (score <= 30) {
    planName = 'Maintain Balance Plan';
    
    // Study recommendation
    if (studyHours > 8) {
      study = `You completed a massive ${studyHours}h study session today while keeping your stress low. Excellent work, but remember to schedule a lighter load tomorrow to prevent sudden fatigue.`;
    } else if (studyHours < 2) {
      study = `You had a light study day (${studyHours}h). Since your cognitive energy is high, tomorrow is a great opportunity to tackle your most complex study topics.`;
    } else {
      study = `Great rhythm! Your ${studyHours}h study block is highly efficient. Continue working in structured 50-minute blocks with 10-minute active offline breaks.`;
    }

    // Sleep recommendation
    if (sleepHours < 7) {
      sleep = `Your sleep was slightly short (${sleepHours}h). Try to get an extra 30-60 minutes tonight to sustain your excellent mental performance tomorrow.`;
    } else {
      sleep = `Fantastic sleep routine (${sleepHours}h). Keep this consistency by reading to wind down and avoiding late-night screens.`;
    }

    // Stress reduction tip
    if (stressLevel > 4) {
      stress = `Even though your overall score is great, you logged a stress level of ${stressLevel}/10. Try a 5-minute deep breathing exercise before wrapping up your day.`;
    } else {
      stress = `Your stress is in a perfect zone (${stressLevel}/10). Keep it up by doing a quick gratitude log or some light physical stretching today.`;
    }

    // Social media control tip
    if (socialMediaUsage > 3) {
      socialMedia = `You spent ${socialMediaUsage}h on social media today. Try setting a visual app timer for tomorrow to keep digital distractions low.`;
    } else {
      socialMedia = `Excellent digital discipline today (${socialMediaUsage}h). Your brain is getting the high-quality rest it needs to focus.`;
    }

    // Tomorrow focus suggestion
    tomorrowFocus = pendingAssignments > 0
      ? `Allocate your peak focus window tomorrow to resolve at least one of your ${pendingAssignments} pending assignments.`
      : 'Explore advanced topics or start a new personal project tomorrow while your mental clarity is high.';

  } else if (score <= 60) {
    planName = 'Normal Recovery Plan';

    // Study recommendation
    if (studyHours > 6) {
      study = `You studied ${studyHours}h today. With a medium load building, switch to 25-minute Pomodoro sessions with mandatory 5-minute offline breaks tomorrow.`;
    } else {
      study = `Keep your learning session structured. Aim for 3-4 hours of highly focused work tomorrow, separated by active walking breaks.`;
    }

    // Sleep recommendation
    if (sleepHours < 7) {
      sleep = `Your sleep (${sleepHours}h) is slightly low. Aim for at least 7.5 hours tonight to help your brain process today's learning.`;
    } else {
      sleep = `Good sleep of ${sleepHours}h. Maintain this by keeping devices away from your bed and setting a consistent wind-down routine.`;
    }

    // Stress reduction tip
    stress = `Stress is at ${stressLevel}/10. Give your mind a break: try a 10-minute mindfulness exercise or listen to an ambient playlist to unwind.`;

    // Social media control tip
    if (socialMediaUsage > 2.5) {
      socialMedia = `You logged ${socialMediaUsage}h of social media. Try restricting social app usage to specific 15-minute blocks after dinner.`;
    } else {
      socialMedia = `Nice job keeping digital noise to ${socialMediaUsage}h. This helps prevent digital fatigue and keeps focus sharp.`;
    }

    // Tomorrow focus suggestion
    tomorrowFocus = pendingAssignments > 0
      ? `Prioritize your most urgent assignment tomorrow. Break it into three small, clear milestones to build momentum.`
      : 'Begin tomorrow by reviewing your notes for 15 minutes to leverage spaced repetition benefits.';

  } else if (score <= 80) {
    planName = 'High Load Recovery Plan';

    // Study recommendation
    study = `High load detected. Limit study sessions to 1.5 - 2 hours max tomorrow. Focus only on high-priority deadlines and postpone non-essential tasks.`;

    // Sleep recommendation
    if (sleepHours < 6.5) {
      sleep = `With only ${sleepHours}h of sleep, sleep debt is elevating your load. Prioritize getting at least 8 hours of sleep tonight. Sleep is your best cognitive fuel.`;
    } else {
      sleep = `You slept ${sleepHours}h, which is decent, but your high load suggests your brain needs deep rest. Try an early bedtime tonight with no electronic devices.`;
    }

    // Stress reduction tip
    stress = `Stress level is high (${stressLevel}/10). Step away from all academic work for at least 1 hour. Take a 15-minute nature walk or talk with a friend to decompress.`;

    // Social media control tip
    if (socialMediaUsage > 1.5) {
      socialMedia = `Digital footprint is ${socialMediaUsage}h. Reduce cognitive load by putting your phone on 'Do Not Disturb' mode for the rest of the evening.`;
    } else {
      socialMedia = `Good job limiting digital noise to ${socialMediaUsage}h. Your brain needs this quiet time to recover from high stress.`;
    }

    // Tomorrow focus suggestion
    tomorrowFocus = `With ${pendingAssignments} pending assignments, only focus on the single most critical task tomorrow. Postpone the rest to manage your load.`;

  } else {
    planName = 'Danger Zone Recovery Plan';

    // Study recommendation
    study = `Critical load detected. Pause all heavy studying today. If you must study tomorrow, do a maximum of 1 hour of light review, then stop.`;

    // Sleep recommendation
    sleep = `Sleep recovery is your top priority. You need at least 8.5 hours of sleep tonight. Consider taking a 20-minute power nap in the afternoon if you feel exhausted.`;

    // Stress reduction tip
    stress = `Stress is critical (${stressLevel}/10). Unplug completely. Do a screen-free wind-down: practice progressive muscle relaxation or sit quietly in a calm space.`;

    // Social media control tip
    socialMedia = `Digital detox recommended. Keep your phone out of reach for the rest of the day. Screen stimulation is amplifying your current mental load.`;

    // Tomorrow focus suggestion
    tomorrowFocus = `Ignore the ${pendingAssignments} pending tasks for now. Tomorrow, focus entirely on self-care and mental recovery. Only do minor things if you feel up to it.`;
  }

  return {
    planName,
    study,
    sleep,
    stress,
    socialMedia,
    tomorrowFocus,
  };
};
