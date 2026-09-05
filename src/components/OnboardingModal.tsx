import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  Wallet,
  Clock,
  User,
  GraduationCap,
  Briefcase,
  Laptop,
} from 'lucide-react';
import { SchoolDay, SchoolSubject } from '../types';

const schoolDays: SchoolDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface OnboardingModalProps {
  isOpen: boolean;
  userEmail?: string | null;
  onSubmit: (info: {
    name: string;
    role: 'student' | 'professional' | 'freelancer' | 'other';
    dailyWorkTargetMinutes: number;
    dailyBudget: number;
    monthlySavingsTarget: number;
    currency: string;
    wakeTime: string;
    bedTime: string;
    primaryGoal: string;
    subjects: SchoolSubject[];
  }) => Promise<void>;
  onSignOut: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  userEmail,
  onSubmit,
  onSignOut,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'professional' | 'freelancer' | 'other'>('student');
  const [dailyWorkTargetMinutes, setDailyWorkTargetMinutes] = useState(180);
  const [currency, setCurrency] = useState('₱');
  const [dailyBudget, setDailyBudget] = useState(500);
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState(5000);
  const [wakeTime, setWakeTime] = useState('07:00');
  const [bedTime, setBedTime] = useState('23:00');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [subjects, setSubjects] = useState<SchoolSubject[]>([
    { id: 'subject-1', name: '', classTime: '07:00', classDays: [] },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }

    if (role === 'student' && subjects.some((subject) => subject.name.trim() && subject.classDays.length === 0)) {
      setError('Choose at least one class day for each subject you add.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        role,
        dailyWorkTargetMinutes: Number(dailyWorkTargetMinutes) || 180,
        dailyBudget: Number(dailyBudget) || 500,
        monthlySavingsTarget: Number(monthlySavingsTarget) || 5000,
        currency,
        wakeTime,
        bedTime,
        primaryGoal: primaryGoal.trim() || 'Achieve balanced daily focus and avoid burnout.',
        subjects: role === 'student'
          ? subjects.filter((subject) => subject.name.trim()).map((subject) => ({
              ...subject,
              name: subject.name.trim(),
            }))
          : [],
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save profile. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Set Up Your Profile
              </h2>
              <p className="text-xs text-stone-500">
                Configure your daily targets and preferences.
              </p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-xs text-stone-500 hover:text-stone-900 cursor-pointer"
          >
            Sign out
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Identity & Primary Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Your Full Name / Preferred Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maria Santos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Primary Daily Focus Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="student">University / High School Student</option>
                <option value="professional">Employed Working Professional</option>
                <option value="freelancer">Freelancer / Independent Builder</option>
                <option value="other">General Life Optimizer</option>
              </select>
            </div>
          </div>

          {/* Section 2: Work Target & Hours */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-stone-800">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Time Management & Work Capacity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Daily Deep Work Goal
                </label>
                <select
                  value={dailyWorkTargetMinutes}
                  onChange={(e) => setDailyWorkTargetMinutes(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                >
                  <option value={120}>2 hours (120 mins)</option>
                  <option value={180}>3 hours (180 mins)</option>
                  <option value={240}>4 hours (240 mins)</option>
                  <option value={360}>6 hours (360 mins)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1 flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-500" /> Target Wake Time
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1 flex items-center gap-1">
                  <Moon className="w-3 h-3 text-purple-500" /> Target Bed Time
                </label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                />
              </div>
            </div>
          </div>

          {role === 'student' && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-indigo-950">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Your Subjects & Class Schedule</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSubjects((current) => [...current, { id: `subject-${Date.now()}`, name: '', classTime: '07:00', classDays: [] }])}
                  className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-950"
                >
                  + Add subject
                </button>
              </div>
              <p className="text-[11px] text-indigo-800/80">
                Add each subject's class time and the days it meets so Araw can understand your school schedule.
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_8rem_auto] gap-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-800/70">
                  <span>Subject</span>
                  <span>Class time</span>
                  <span aria-hidden="true"></span>
                </div>
                {subjects.map((subject, index) => (
                  <div key={subject.id} className="grid grid-cols-[1fr_8rem_auto] gap-2 items-center">
                    <input
                      type="text"
                      required={index === 0}
                      placeholder="Subject name, e.g. Calculus"
                      value={subject.name}
                      onChange={(e) => setSubjects((current) => current.map((item) => item.id === subject.id ? { ...item, name: e.target.value } : item))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white"
                    />
                    <input
                      type="time"
                      required={index === 0}
                      value={subject.classTime}
                      onChange={(e) => setSubjects((current) => current.map((item) => item.id === subject.id ? { ...item, classTime: e.target.value } : item))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white"
                      aria-label={`${subject.name || 'Subject'} class time`}
                    />
                    <button
                      type="button"
                      onClick={() => setSubjects((current) => current.length === 1 ? current : current.filter((item) => item.id !== subject.id))}
                      className="px-2 py-1.5 text-indigo-700 hover:text-rose-700"
                      title="Remove subject"
                    >
                      Remove
                    </button>
                    <div className="col-span-3 flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-semibold text-indigo-800/70 mr-1">Class days:</span>
                      {schoolDays.map((day) => {
                        const selected = subject.classDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setSubjects((current) => current.map((item) => item.id === subject.id
                              ? { ...item, classDays: selected ? item.classDays.filter((itemDay) => itemDay !== day) : [...item.classDays, day] }
                              : item))}
                            className={`px-2 py-1 rounded-md border text-[10px] font-semibold ${selected ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-indigo-800 border-indigo-200'}`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Financial Guardrails */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-stone-800">
                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                <span>Financial Peace Boundaries</span>
              </div>
              <div className="flex items-center gap-1">
                {['₱', '$', '€'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      currency === c
                        ? 'bg-amber-500 text-stone-950 shadow-2xs'
                        : 'bg-white border border-stone-200 text-stone-600'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Daily Spending Cap ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Monthly Savings Target ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={monthlySavingsTarget}
                  onChange={(e) => setMonthlySavingsTarget(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Primary Goal */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              What is your single highest-priority goal for this month?
            </label>
            <input
              type="text"
              placeholder="e.g. Master Calculus exams, ship client MVP, or establish 7-hour sleep routine"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Saving Profile...' : 'Save & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
