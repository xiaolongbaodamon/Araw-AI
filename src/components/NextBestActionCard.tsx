import React, { useState } from 'react';
import { Sparkles, Play, CheckCircle2, Coffee, BookOpen, Briefcase, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { NextBestAction, HealthState } from '../types';

interface NextBestActionCardProps {
  action: NextBestAction;
  health: HealthState;
  onRefreshAction: () => Promise<void>;
  onStartFocusSprint: (title: string, durationMinutes: number) => void;
  onMarkCompleted: () => void;
  onTakeBreak: () => void;
  isFocusRunning: boolean;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  action,
  health,
  onRefreshAction,
  onStartFocusSprint,
  onMarkCompleted,
  onTakeBreak,
  isFocusRunning,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshAction();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPillarIcon = (cat: string) => {
    switch (cat) {
      case 'work':
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      case 'school':
        return <BookOpen className="w-5 h-5 text-indigo-600" />;
      case 'health':
      case 'rest':
        return <Coffee className="w-5 h-5 text-emerald-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-600" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> High Priority
          </span>
        );
      case 'rejuvenating':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Break
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Focus
          </span>
        );
    }
  };

  const isWellnessBreak = action.actionType === 'wellness_break' || action.category === 'rest';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#17352a] border border-[#24513d] shadow-[0_16px_36px_rgba(23,53,42,0.16)] p-5 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-lime-300 text-[#17352a] flex items-center justify-center">
            {getPillarIcon(action.category)}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              Recommended Focus
            </h2>
            <p className="text-xs text-[#b8cbbd]">
              Live recommendation from your tasks, schedule, and recovery state
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getUrgencyBadge(action.urgency)}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-[#c0d1c3] hover:text-white hover:bg-white/10 border border-white/15 transition-colors cursor-pointer"
            title="Refresh recommendation"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-4 sm:flex items-start justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-lime-200 tracking-wide px-2 py-0.5 rounded bg-white/10">
              {action.category} • ~{action.estimatedMinutes} mins
            </span>
            {health.continuousWorkMinutes >= 75 && !isWellnessBreak && (
              <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                Notice: {health.continuousWorkMinutes}m continuous screen time
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {action.title}
          </h3>

          <p className="text-sm text-[#d0ded2] leading-relaxed max-w-3xl">
            {action.reason}
          </p>
        </div>

        {/* Action button trigger */}
        <div className="mt-4 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
          {isWellnessBreak ? (
            <button
              onClick={onTakeBreak}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Coffee className="w-4 h-4" />
              <span>Take 5m Reset</span>
            </button>
          ) : (
            <button
              onClick={() => onStartFocusSprint(action.title, action.estimatedMinutes || 25)}
              disabled={isFocusRunning}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
                isFocusRunning
                  ? 'bg-stone-200 text-stone-600 cursor-not-allowed'
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isFocusRunning ? 'Sprint In Progress' : 'Start Focus Sprint'}</span>
            </button>
          )}

          <button
            onClick={onMarkCompleted}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-[#d6e3d8] hover:text-white hover:bg-white/10 border border-white/15 flex items-center justify-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
