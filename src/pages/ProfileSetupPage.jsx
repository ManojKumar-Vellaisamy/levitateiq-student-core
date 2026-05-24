import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Calendar, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    education: '',
    institution: '',
    semester: '',
    currentClass: '',
    goals: [],
  });

  const goalOptions = [
    'Improve Focus',
    'Better Sleep',
    'Reduce Stress',
    'Time Management',
    'Academic Excellence',
    'Work-Life Balance',
  ];

  const handleGoalToggle = (goal) => {
    setProfile((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const handleSubmit = () => {
    localStorage.setItem('levitateiq_user_profile', JSON.stringify({
      ...profile,
      profileCompleted: true,
    }));
    navigate('/daily-log');
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-accent-purple/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -left-32 w-80 h-80 bg-accent-blue/8 rounded-full blur-3xl" />

      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue mb-4 shadow-glow-purple">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Set Up Your Profile</h1>
          <p className="text-gray-400 text-sm">Help us personalize your experience</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step
                  ? 'bg-gradient-to-r from-accent-purple to-accent-blue'
                  : 'bg-dark-600'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
              <div>
                <label className="label-text">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="input-field pl-11"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label-text">Age</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    placeholder="Your age"
                    className="input-field pl-11"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-4">Academic Details</h3>
              <div>
                <label className="label-text">Education Level</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    className="input-field pl-11 appearance-none"
                    value={profile.education}
                    onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  >
                    <option value="">Select education level</option>
                    <option value="High School">High School</option>
                    <option value="College">College</option>
                  </select>
                </div>
              </div>

              {profile.education === 'High School' && (
                <div className="animate-fade-in">
                  <label className="label-text">Current Class</label>
                  <select
                    className="input-field appearance-none"
                    value={profile.currentClass}
                    onChange={(e) => setProfile({ ...profile, currentClass: e.target.value })}
                  >
                    <option value="">Select current class</option>
                    <option value="9th">9th</option>
                    <option value="10th">10th</option>
                    <option value="11th">11th</option>
                    <option value="12th">12th</option>
                  </select>
                </div>
              )}

              {profile.education === 'College' && (
                <div className="animate-fade-in">
                  <label className="label-text">Current Semester</label>
                  <select
                    className="input-field appearance-none"
                    value={profile.semester}
                    onChange={(e) => setProfile({ ...profile, semester: e.target.value })}
                  >
                    <option value="">Select current semester</option>
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-2">Your Goals</h3>
              <p className="text-sm text-gray-400 mb-6">Select what matters most to you</p>
              <div className="grid grid-cols-2 gap-3">
                {goalOptions.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => handleGoalToggle(goal)}
                    className={`p-4 rounded-xl text-sm font-medium transition-all duration-300 border ${
                      profile.goals.includes(goal)
                        ? 'bg-accent-purple/15 border-accent-purple/40 text-white shadow-glow-purple/20'
                        : 'bg-dark-800 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : navigate('/'))}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => (step < 3 ? setStep(step + 1) : handleSubmit())}
              className="btn-primary flex items-center gap-2 group"
            >
              {step < 3 ? 'Continue' : 'Get Started'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
