export const mockUser = {
  name: 'Manoj Kumar',
  email: 'manoj@levitateiq.com',
  avatar: 'MK',
  education: 'B.Tech Computer Science',
  institution: 'VIT University',
  semester: '5th Semester',
  age: 21,
};

export const mockDailyLog = {
  studyHours: 6,
  sleepHours: 7,
  stressLevel: 6,
  pendingAssignments: 3,
  mood: 'Focused',
  socialMediaUsage: 2,
};

export const mockGravityScore = {
  score: 45,
  breakdown: [
    { label: 'Study Load', value: 55, color: '#8b5cf6' },
    { label: 'Sleep Deprivation', value: 30, color: '#3b82f6' },
    { label: 'Stress Impact', value: 60, color: '#ec4899' },
    { label: 'Task Pressure', value: 45, color: '#f59e0b' },
    { label: 'Mood Volatility', value: 40, color: '#06b6d4' },
    { label: 'Digital Overload', value: 50, color: '#10b981' },
  ],
};

export const mockDashboard = {
  todayScore: 45,
  aiInsight: 'You have a solid 3-hour study block available this evening. Consider using the Pomodoro technique (25m work / 5m break) to avoid increasing your mental gravity.',
  quickStats: [
    { label: 'Study Hours', value: '6h', icon: 'BookOpen', trend: '+0.5h' },
    { label: 'Sleep Quality', value: '7h', icon: 'Moon', trend: '+1h' },
    { label: 'Stress Level', value: '6/10', icon: 'Activity', trend: '-1' },
    { label: 'Tasks Done', value: '5/8', icon: 'CheckCircle', trend: '+2' },
  ],
  weeklyTrend: [
    { day: 'Mon', score: 65 },
    { day: 'Tue', score: 70 },
    { day: 'Wed', score: 55 },
    { day: 'Thu', score: 45 },
    { day: 'Fri', score: 50 },
    { day: 'Sat', score: 35 },
    { day: 'Sun', score: 45 },
  ],
  streakCount: 12,
};

export const mockAIRecommendations = {
  bestStudyTime: {
    time: '9:00 AM - 11:00 AM',
    reason: 'Your past logs indicate highest focus and lowest stress during mid-morning. Try tackling your hardest assignment then.',
    confidence: 92,
  },
  focusToday: [
    {
      title: 'Data Structures Assignment',
      priority: 'High',
      reason: 'Due in 2 days. Requires ~2 hours of deep focus.',
      icon: 'Target',
    },
    {
      title: 'Review Machine Learning Notes',
      priority: 'Medium',
      reason: 'Quiz on Thursday. A quick 30-minute review is recommended.',
      icon: 'Brain',
    },
    {
      title: 'Practice Coding Problems',
      priority: 'Low',
      reason: 'Maintain your streak. 20 mins of casual practice.',
      icon: 'Code',
    },
  ],
  recoveryTip: {
    title: 'Take a Screen-Free Walk',
    description: 'Your screen time is slightly high today. A 15-minute walk outside without your phone can help lower your mental gravity before your next study block.',
    duration: '15 minutes',
    impact: 'High',
  },
};

export const mockWeeklyReport = {
  averageScore: 52,
  bestDay: { day: 'Saturday', score: 35 },
  worstDay: { day: 'Tuesday', score: 70 },
  weeklyTrend: [
    { day: 'Mon', score: 65, study: 5, sleep: 6 },
    { day: 'Tue', score: 70, study: 6, sleep: 5.5 },
    { day: 'Wed', score: 55, study: 7, sleep: 7 },
    { day: 'Thu', score: 45, study: 6, sleep: 8 },
    { day: 'Fri', score: 50, study: 5.5, sleep: 7 },
    { day: 'Sat', score: 35, study: 4, sleep: 8.5 },
    { day: 'Sun', score: 45, study: 6, sleep: 7 },
  ],
  aiWeeklySummary: 'Your mental gravity peaked early this week due to lower sleep and high study hours. However, balancing your schedule from Wednesday onwards helped significantly. Keep prioritizing 7+ hours of sleep to maintain lower gravity scores.',
  improvements: [
    { label: 'Sleep Consistency', change: '+12%', positive: true },
    { label: 'Social Media Reduction', change: '-10%', positive: true },
    { label: 'Study Efficiency', change: '+8%', positive: true },
    { label: 'Stress Management', change: '+5%', positive: false },
  ],
};

export const moodOptions = [
  { label: 'Happy', emoji: '😄' },
  { label: 'Focused', emoji: '🎯' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Anxious', emoji: '😰' },
  { label: 'Tired', emoji: '😫' },
  { label: 'Stressed', emoji: '🤯' }
];

export const mockNotifications = [
  {
    id: 1,
    title: 'Optimal Focus Window',
    message: 'Based on your logs, your focus peaks now. Try tackling your hardest assignment.',
    category: 'AI Insight',
    timestamp: '10 mins ago',
    read: false,
    icon: 'Brain',
  },
  {
    id: 2,
    title: 'High Mental Gravity',
    message: 'Take a 15-minute walk outside to lower your cognitive load before the next session.',
    category: 'Alert',
    timestamp: '2 hours ago',
    read: false,
    icon: 'Activity',
  },
  {
    id: 3,
    title: 'Consistency King',
    message: 'You have logged your data for 7 consecutive days!',
    category: 'Achievement',
    timestamp: '1 day ago',
    read: true,
    icon: 'Trophy',
  }
];
