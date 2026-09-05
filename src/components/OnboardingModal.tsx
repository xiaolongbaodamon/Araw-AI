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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name.');
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
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Setup Required
              </span>
              <h2 className="text-lg font-bold text-stone-900">
                Unlock Your Araw AI Life OS
              </h2>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-xs text-stone-600 hover:text-stone-900 underline"
          >
            Switch Account
          </button>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed mb-6">
          To build your personalized, real-time life tracking experience and unlock the dashboard, Araw AI needs to learn your core rhythm across <strong>work, school, health, and financials</strong>. No mock examples—this will be your real life data.
        </p>

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
              className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Configuring Your Life OS...' : 'Save & Unlock Araw AI Features'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
