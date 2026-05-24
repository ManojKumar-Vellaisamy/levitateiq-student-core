// Helper: safely get subjects from a log as an array
// Handles both new subjectsStudied[] array and legacy subjectStudied string
export const getSubjectsFromLog = (log) => {
  if (log.subjectsStudied && Array.isArray(log.subjectsStudied) && log.subjectsStudied.length > 0) {
    return log.subjectsStudied;
  }
  if (log.subjectStudied && log.subjectStudied.trim()) {
    return [log.subjectStudied.trim()];
  }
  return [];
};

export const generateSubjectStressAnalysis = (logs = []) => {
  // Need at least 2 logs with subjects to provide insight
  const logsWithSubject = logs.filter((log) => getSubjectsFromLog(log).length > 0);
  if (logsWithSubject.length < 2) {
    return { insufficient: true };
  }

  // Group by subject — each log may have multiple subjects
  const groups = {};
  logsWithSubject.forEach((log) => {
    const subjects = getSubjectsFromLog(log);
    const score = log.gravityScore !== undefined ? log.gravityScore : (log.score || 0);
    subjects.forEach((subj) => {
      if (!groups[subj]) {
        groups[subj] = { totalScore: 0, count: 0 };
      }
      groups[subj].totalScore += score;
      groups[subj].count += 1;
    });
  });

  if (Object.keys(groups).length === 0) {
    return { insufficient: true };
  }

  // Compute average scores per subject
  const perSubject = Object.entries(groups).map(([subject, { totalScore, count }]) => ({
    subject,
    avgScore: Math.round(totalScore / count),
    count,
  }));

  // Identify highest and lowest average score subjects
  const sorted = [...perSubject].sort((a, b) => a.avgScore - b.avgScore);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];

  const recommendation =
    highest.subject === lowest.subject
      ? `Keep studying ${highest.subject} consistently. Log more subjects to get a full picture.`
      : `Focus on balancing your study load for ${highest.subject}. Try lighter tasks or extra breaks for it, and keep your good habits for ${lowest.subject}.`;

  return {
    insufficient: false,
    perSubject,
    highest,
    lowest,
    recommendation,
  };
};
