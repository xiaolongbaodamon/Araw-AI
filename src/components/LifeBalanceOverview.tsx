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
import { LifeBalanceIndex, TaskItem, HealthState, FinancialState } from '../types';

interface LifeBalanceOverviewProps {
  balanceIndex: LifeBalanceIndex;
  tasks: TaskItem[];
  health: HealthState;
  finances: FinancialState;
  onNavigateTab: (tab: string) => void;
}

export const LifeBalanceOverview: React.FC<LifeBalanceOverviewProps> = ({
  balanceIndex,
  tasks,
  health,
  finances,
  onNavigateTab,
}) => {
  const completedTasks = tasks.filter((t) => t.completed).length;

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
      <div className="dashboard-surface rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Radial score badge */}
            <div className="relative w-16 h-16 rounded-2xl bg-[#edf5ee] border border-[#d5e5d8] text-[#17352a] flex flex-col items-center justify-center shrink-0">
              <span className="data-number text-xl font-extrabold">
                {balanceIndex.overallScore}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#668273]">Score</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#17352a]">
                  Daily Balance Score
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#eef4ef] text-[#38604b]">
                  {balanceIndex.overallScore >= 80 ? 'Balanced' : 'Attention needed'}
                </span>
              </div>
              <p className="text-xs text-[#63756a] mt-0.5 max-w-xl leading-relaxed">
                {balanceIndex.summary}
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-[#f4f8f3] border border-[#dce8de] text-xs text-[#294638] flex items-start gap-2.5 max-w-md">
            <ShieldAlert className="w-4 h-4 text-[#bb7a22] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#17352a]">Recommendation: </span>
              <span className="text-[#63756a]">{balanceIndex.protectiveAdvice}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Pillar 1: Work & School */}
        <div
          onClick={() => onNavigateTab('work_school')}
          className="group cursor-pointer dashboard-surface rounded-xl hover:border-[#9fbaa5] p-4 transition-all shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="eyebrow">
                Work & School
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
          </div>
          <div className="pt-3 flex items-baseline justify-between">
            <span className="data-number text-2xl font-bold text-[#17352a]">
              {completedTasks}/{tasks.length}
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {balanceIndex.workSchoolScore}% Done
            </span>
          </div>
            <p className="text-[11px] text-[#63756a] mt-1">
            {tasks.filter((t) => !t.completed && t.priority === 'urgent').length} urgent deadline(s) remaining
          </p>
        </div>

        {/* Pillar 2: Health & Wellness Guardian */}
        <div
          onClick={() => onNavigateTab('health')}
          className="group cursor-pointer dashboard-surface rounded-xl hover:border-[#9fbaa5] p-4 transition-all shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="eyebrow">
                Health & Rest
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
          </div>
          <div className="pt-3 flex items-baseline justify-between">
            <span className="data-number text-2xl font-bold text-[#17352a]">
              {formatScreenTime(health.screenTimeMinutes)}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
              health.continuousWorkMinutes > 60 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {health.continuousWorkMinutes}m focus block
            </span>
          </div>
            <p className="text-[11px] text-[#63756a] mt-1">
            {health.waterGlasses}/{health.targetWaterGlasses} glasses water • {health.sleepHours}h sleep
          </p>
        </div>

        {/* Pillar 3: Financial Discipline */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="group cursor-pointer dashboard-surface rounded-xl hover:border-[#9fbaa5] p-4 transition-all shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="eyebrow">
                Financials
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
          </div>
          <div className="pt-3 flex items-baseline justify-between">
            <span className="data-number text-2xl font-bold text-[#17352a]">
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

      </div>
    </div>
  );
};
