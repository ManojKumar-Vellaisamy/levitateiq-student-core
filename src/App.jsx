import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import AuthPage from './pages/AuthPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DailyLogPage from './pages/DailyLogPage';
import GravityScorePage from './pages/GravityScorePage';
import DashboardPage from './pages/DashboardPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import WeeklyReportPage from './pages/WeeklyReportPage';
import PomodoroPage from './pages/PomodoroPage';
import AchievementsPage from './pages/AchievementsPage';
import AssignmentTrackerPage from './pages/AssignmentTrackerPage';
import ExamCountdownPage from './pages/ExamCountdownPage';
import AttendanceTrackerPage from './pages/AttendanceTrackerPage';

const AppLayoutWithTitle = () => {
  const location = useLocation();

  const getTitleForPath = (path) => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/daily-log': 'Daily Log',
      '/ai-recommendations': 'AI Recommendations',
      '/weekly-report': 'Weekly Report',
      '/pomodoro': 'Pomodoro Timer',
      '/achievements': 'Achievements',
      '/assignments': 'Assignment Tracker',
      '/exams': 'Exam Countdown',
      '/attendance': 'Attendance Tracker',
    };
    return titles[path] || 'Dashboard';
  };

  return <AppLayout title={getTitleForPath(location.pathname)} />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Standalone Pages (no sidebar) */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/gravity-score" element={<GravityScorePage />} />

        {/* Dashboard Pages (with sidebar) */}
        <Route element={<AppLayoutWithTitle />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/daily-log" element={<DailyLogPage />} />
          <Route path="/ai-recommendations" element={<AIRecommendationsPage />} />
          <Route path="/weekly-report" element={<WeeklyReportPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/assignments" element={<AssignmentTrackerPage />} />
          <Route path="/exams" element={<ExamCountdownPage />} />
          <Route path="/attendance" element={<AttendanceTrackerPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
