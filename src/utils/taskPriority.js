export const generateTaskPriority = (log) => {
  if (!log) return [];

  const score = log.gravityScore !== undefined ? log.gravityScore : (log.score || 0);
  const {
    sleepHours = 8,
    stressLevel = 5,
    pendingAssignments = 0,
    socialMediaUsage = 0,
  } = log;

  const tasks = [];

  if (score <= 30) {
    // 0-30: Zero Gravity
    tasks.push({
      priority: 1,
      title: 'Deep Work: Complex Topics',
      reason: `With a Zero Gravity score of ${score}, your cognitive energy is peak. Dedicate this block to your hardest coding, algorithms, or complex theories.`,
      duration: '90 - 120 mins',
      difficulty: 'Hard',
    });

    if (pendingAssignments > 0) {
      tasks.push({
        priority: 2,
        title: 'Clear Assignment Backlog',
        reason: `You have ${pendingAssignments} pending assignments. Knock out the most difficult homework milestone while your focus is optimized.`,
        duration: '60 mins',
        difficulty: 'Medium',
      });
    }

    tasks.push({
      priority: tasks.length + 1,
      title: 'Explore a New Framework or Concept',
      reason: `Your stress level is low (${stressLevel}/10). Perfect opportunity to learn a new programming language feature or start a fresh side project.`,
      duration: '45 mins',
      difficulty: 'Hard',
    });

    tasks.push({
      priority: tasks.length + 1,
      title: 'Active Skill Coding Practice',
      reason: 'Maintain your programming muscle memory with hands-on practice, code challenges, or syntax puzzles.',
      duration: '30 mins',
      difficulty: 'Medium',
    });

  } else if (score <= 60) {
    // 31-60: Medium Gravity
    tasks.push({
      priority: 1,
      title: 'Structured Study Session',
      reason: `Moderate load detected. Work in two 25-minute Pomodoro blocks with a strict 5-minute offline break in between.`,
      duration: '50 mins',
      difficulty: 'Medium',
    });

    if (pendingAssignments > 0) {
      tasks.push({
        priority: 2,
        title: 'Draft Pending Homework Milestone',
        reason: `Resolve chunks of your ${pendingAssignments} assignments. Focus on writing outlines or drafts before cognitive fatigue sets in.`,
        duration: '45 mins',
        difficulty: 'Medium',
      });
    }

    tasks.push({
      priority: tasks.length + 1,
      title: 'Reinforce Recent Lectures',
      reason: 'Read through summary notes from earlier in the week to reinforce knowledge retention without causing stress.',
      duration: '30 mins',
      difficulty: 'Easy',
    });

    if (socialMediaUsage > 2.5 || stressLevel > 5) {
      tasks.push({
        priority: tasks.length + 1,
        title: 'Recharge: Offline Walk',
        reason: `You logged ${socialMediaUsage}h of social media and a stress level of ${stressLevel}/10. Step outside for fresh air to sustain your energy.`,
        duration: '15 mins',
        difficulty: 'Easy',
      });
    }

  } else if (score <= 80) {
    // 61-80: High Gravity
    tasks.push({
      priority: 1,
      title: 'Light Concept Revision Only',
      reason: 'Your mental load is heavy. Avoid studying brand new topics today. Stick to reviewing flashcards or read summary briefs.',
      duration: '30 mins',
      difficulty: 'Easy',
    });

    tasks.push({
      priority: 2,
      title: 'Administrative Clean-up',
      reason: 'Organize files, update your project schedule, or clean up your desktop inbox to stay organized without high cognitive strain.',
      duration: '20 mins',
      difficulty: 'Easy',
    });

    if (pendingAssignments > 0) {
      tasks.push({
        priority: 3,
        title: 'Draft Assignment Plan',
        reason: `With ${pendingAssignments} pending assignments, spend a short session listing steps and deadlines rather than doing heavy work.`,
        duration: '25 mins',
        difficulty: 'Easy',
      });
    }

    if (sleepHours < 7) {
      tasks.push({
        priority: tasks.length + 1,
        title: 'Rest & Cognitive Recovery',
        reason: `Your sleep of ${sleepHours}h is creating a high load. Close your computer, rest your eyes, and drink plenty of water.`,
        duration: '30 mins',
        difficulty: 'Easy',
      });
    }

  } else {
    // 81-100: Danger Zone
    tasks.push({
      priority: 1,
      title: 'Passive Review Session',
      reason: 'Danger Zone mental load. Avoid learning new topics today. Spend a maximum of 15 minutes reviewing cheat sheets if absolutely necessary.',
      duration: '15 mins',
      difficulty: 'Easy',
    });

    if (sleepHours < 6.5) {
      tasks.push({
        priority: 2,
        title: 'Urgent Nap & Body Rest',
        reason: `Your sleep of ${sleepHours}h is critically low. Take a 20-30 minute power nap to help your nervous system recover.`,
        duration: '30 mins',
        difficulty: 'Easy',
      });
    }

    if (socialMediaUsage > 1.5) {
      tasks.push({
        priority: 3,
        title: 'Screen-Free Digital Detox',
        reason: `You spent ${socialMediaUsage}h on screens today. Prevent screen fatigue by putting your phone on silent and placing it away.`,
        duration: '20 mins',
        difficulty: 'Easy',
      });
    }

    tasks.push({
      priority: tasks.length + 1,
      title: 'Decompress: Relaxing Walk or Breathing',
      reason: `Your stress is critical at ${stressLevel}/10. Practice box-breathing or take a gentle screen-free walk in a quiet spot.`,
      duration: '15 mins',
      difficulty: 'Easy',
    });
  }

  return tasks;
};
