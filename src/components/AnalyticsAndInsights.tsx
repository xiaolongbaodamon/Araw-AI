import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  PieChart,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { AiInsight, LifeBalanceIndex, TaskItem, HabitItem, HealthState, FinancialState } from '../types';

interface AnalyticsAndInsightsProps {
  insights: AiInsight[];
  balanceIndex: LifeBalanceIndex;
  tasks: TaskItem[];
  habits: HabitItem[];
  health: HealthState;
  finances: FinancialState;
  onRefreshAiInsights: () => Promise<void>;
  onActOnInsight: (id: string) => void;
}

export const AnalyticsAndInsights: React.FC<AnalyticsAndInsightsProps> = ({
  insights,
  balanceIndex,
  tasks,
  habits,
  health,
  finances,
  onRefreshAiInsights,
  onActOnInsight,
}) => {
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<string>('all');

  const handleRunDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      await onRefreshAiInsights();
    } finally {
      setIsDiagnosing(false);
    }
  };

  const filteredInsights = insights.filter((ins) => {
    if (selectedPillar === 'all') return true;
    return ins.pillar === selectedPillar;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Urgent Pivot
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-600" /> High Leverage
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
            Optimization
          </span>
        );
    }
  };

  const getPillarColor = (pillar: string) => {
    switch (pillar) {
      case 'health':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'work':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'school':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'finance':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-purple-700 bg-purple-50 border-purple-200';
    }
  };

  // Metric breakdown stats
  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskPercent = Math.round((completedTasks / totalTasks) * 100);

  const totalHabits = habits.length || 1;
  const completedHabits = habits.filter((h) => h.completedToday).length;
  const habitPercent = Math.round((completedHabits / totalHabits) * 100);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Pattern Detection & Time Optimizer</span>
              </span>
              <span className="text-xs text-stone-600">Free Tier Gemini Intelligence</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              Real-Time Life Analytics & Actionable Advice
            </h2>
            <p className="text-xs text-stone-600 max-w-xl">
              Araw AI analyzes your tasks, habit streaks, continuous screen exposure, and expenses to extract actionable daily prescriptions.
            </p>
          </div>

          <button
            onClick={handleRunDiagnosis}
            disabled={isDiagnosing}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isDiagnosing ? 'Analyzing Life Patterns...' : 'Run Live AI Diagnosis'}</span>
          </button>
        </div>
      </div>

      {/* Analytics Visual Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1 Bar */}
        <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700">Work & School Output</span>
            <span className="font-semibold text-blue-600">{taskPercent}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${taskPercent}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-stone-500 flex justify-between">
            <span>{completedTasks} of {tasks.length} items done</span>
            <span>{tasks.filter((t) => !t.completed).length} pending</span>
          </div>
        </div>

        {/* Pillar 2 Bar */}
        <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700">Health & Screen Shield</span>
            <span className="font-semibold text-emerald-600">{balanceIndex.healthWellnessScore}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${balanceIndex.healthWellnessScore}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-stone-500 flex justify-between">
            <span>{health.screenTimeMinutes}m total screen</span>
            <span>{health.continuousWorkMinutes}m continuous</span>
          </div>
        </div>

        {/* Pillar 3 Bar */}
        <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700">Financial Discipline</span>
            <span className="font-semibold text-amber-600">{balanceIndex.financialDisciplineScore}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${balanceIndex.financialDisciplineScore}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-stone-500 flex justify-between">
            <span>Budget ratio maintained</span>
            <span>Safe cushion active</span>
          </div>
        </div>

        {/* Pillar 4 Bar */}
        <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700">Habit Anchor Rate</span>
            <span className="font-semibold text-purple-600">{habitPercent}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all"
              style={{ width: `${habitPercent}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-stone-500 flex justify-between">
            <span>{completedHabits} of {habits.length} anchored</span>
            <span>Max streak: {Math.max(...habits.map((h) => h.streak), 0)}d</span>
          </div>
        </div>
      </div>

      {/* Recorded Insights Feed */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Recorded Life Insights & Optimization Prescriptions
            </h3>
            <p className="text-xs text-stone-500">
              Generated by Araw AI to protect focus and optimize health.
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setSelectedPillar('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedPillar === 'all' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600'
              }`}
            >
              All Pillars
            </button>
            <button
              onClick={() => setSelectedPillar('health')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedPillar === 'health' ? 'bg-white text-emerald-800 shadow-2xs font-semibold' : 'text-stone-600'
              }`}
            >
              Health
            </button>
            <button
              onClick={() => setSelectedPillar('school')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedPillar === 'school' ? 'bg-white text-indigo-800 shadow-2xs font-semibold' : 'text-stone-600'
              }`}
            >
              School
            </button>
            <button
              onClick={() => setSelectedPillar('work')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedPillar === 'work' ? 'bg-white text-blue-800 shadow-2xs font-semibold' : 'text-stone-600'
              }`}
            >
              Work
            </button>
            <button
              onClick={() => setSelectedPillar('finance')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedPillar === 'finance' ? 'bg-white text-amber-800 shadow-2xs font-semibold' : 'text-stone-600'
              }`}
            >
              Finance
            </button>
          </div>
        </div>

        {/* Insights cards */}
        <div className="space-y-3">
          {filteredInsights.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
              No insights in this pillar. Click "Run Live AI Diagnosis" to refresh.
            </div>
          ) : (
            filteredInsights.map((ins) => {
              return (
                <div
                  key={ins.id}
                  className={`rounded-xl border p-4 transition-all ${
                    ins.actedUpon
                      ? 'bg-stone-50/70 border-stone-200 opacity-60'
                      : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPillarColor(
                            ins.pillar
                          )}`}
                        >
                          {ins.pillar}
                        </span>

                        {getUrgencyBadge(ins.urgency)}

                        <span className="text-[11px] text-stone-500 font-medium">
                          {ins.timestamp}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-stone-900">
                        {ins.title}
                      </h4>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {ins.rationale}
                      </p>

                      {/* Actionable prescription callout */}
                      <div className="mt-2 p-3 rounded-lg bg-stone-50 border border-stone-200/80 text-xs flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-stone-900">Prescription: </span>
                          <span className="text-stone-700 font-medium">{ins.actionableStep}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="sm:shrink-0 flex items-center gap-2">
                      {ins.actedUpon ? (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Acted Upon
                        </span>
                      ) : (
                        <button
                          onClick={() => onActOnInsight(ins.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white transition-colors shadow-2xs"
                        >
                          Mark as Applied
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
