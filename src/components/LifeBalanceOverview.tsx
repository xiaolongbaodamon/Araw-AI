import React from 'react';
import {
  GraduationCap,
  HeartPulse,
  Wallet,
  CheckCheck,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { LifeBalanceIndex, TaskItem, HabitItem, HealthState, FinancialState } from '../types';

interface LifeBalanceOverviewProps {
  balanceIndex: LifeBalanceIndex;
  tasks: TaskItem[];
  habits: HabitItem[];
  health: HealthState;
  finances: FinancialState;
  onNavigateTab: (tab: string) => void;
}

export const LifeBalanceOverview: React.FC<LifeBalanceOverviewProps> = ({
  balanceIndex,
  tasks,
  habits,
  health,
  finances,
  onNavigateTab,
}) => {
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completedHabits = habits.filter((h) => h.completedToday).length;

  const todayExpenses = finances.transactions
    .filter((tr) => tr.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const budgetRatio = Math.min(100, Math.round((todayExpenses / (finances.dailyBudget || 1)) * 100));

  const formatScreenTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Overall Score & Protective Advice */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Radial score badge */}
            <div className="relative w-16 h-16 rounded-2xl bg-stone-900 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
              <span className="text-xl font-extrabold tracking-tight">
                {balanceIndex.overallScore}
              </span>
              <span className="text-[10px] uppercase font-semibold text-amber-400">Score</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">
                  Daily Balance Score
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-800">
                  {balanceIndex.overallScore >= 80 ? 'Balanced' : 'Attention needed'}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5 max-w-xl leading-relaxed">
                {balanceIndex.summary}
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 flex items-start gap-2.5 max-w-md">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-900">Recommendation: </span>
              <span className="text-stone-600">{balanceIndex.protectiveAdvice}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pillar 1: Work & School */}
        <div
          onClick={() => onNavigateTab('work_school')}
          className="group cursor-pointer rounded-xl bg-white border border-stone-200 hover:border-stone-400 p-4 transition-all shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Work & School
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
          </div>
          <div className="pt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">
              {completedTasks}/{tasks.length}
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {balanceIndex.workSchoolScore}% Done
            </span>
          </div>
          <p className="text-[11px] text-stone-600 mt-1">
            {tasks.filter((t) => !t.completed && t.priority === 'urgent').length} urgent deadline(s) remaining
          </p>
        </div>

        {/* Pillar 2: Health & Wellness Guardian */}
        <div
          onClick={() => onNavigateTab('health')}
          className="group cursor-pointer rounded-xl bg-white border border-stone-200 hover:border-stone-400 p-4 transition-all shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Health & Rest
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
          </div>
          <div className="pt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">
              {formatScreenTime(health.screenTimeMinutes)}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
              health.continuousWorkMinutes > 60 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {health.continuousWorkMinutes}m focus block
            </span>
          </div>
          <p className="text-[11px] text-stone-600 mt-1">
            {health.waterGlasses}/{health.targetWaterGlasses} glasses water • {health.sleepHours}h sleep
          </p>
        </div>

        {/* Pillar 3: Financial Discipline */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="group cursor-pointer rounded-xl bg-white border border-stone-200 hover:border-stone-400 p-4 transition-all shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Financials
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
          </div>
          <div className="pt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">
              {finances.currency}{todayExpenses}
            </span>
            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
              of {finances.currency}{finances.dailyBudget}
            </span>
          </div>
          <div className="mt-1.5 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetRatio > 90 ? 'bg-rose-500' : budgetRatio > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetRatio}%` }}
            ></div>
          </div>
        </div>

        {/* Pillar 4: Habit Consistency */}
        <div
          onClick={() => onNavigateTab('habits')}
          className="group cursor-pointer rounded-xl bg-white border border-stone-200 hover:border-stone-400 p-4 transition-all shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <CheckCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Habit Streaks
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
          </div>
          <div className="pt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">
              {completedHabits}/{habits.length}
            </span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {balanceIndex.habitConsistencyScore}% Done
            </span>
          </div>
          <p className="text-[11px] text-stone-600 mt-1">
            Top streak: {Math.max(...habits.map((h) => h.streak), 0)} days on morning walk
          </p>
        </div>
      </div>
    </div>
  );
};
