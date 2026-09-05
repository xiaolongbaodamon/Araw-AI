import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  GraduationCap,
  Briefcase,
  Moon,
  Wallet,
  Flame,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Zap,
  Info,
} from 'lucide-react';
import { SystemDetectionRecommendation, PillarCategory } from '../types';

interface SystemDetectionBannerProps {
  detectionData?: SystemDetectionRecommendation;
  recommendation?: SystemDetectionRecommendation;
  currency?: string;
  onSelectAction?: (actionLabel: string) => void;
  onExecuteRecommendation?: (action: any) => void;
  onRefreshRecommendations?: () => void;
  isLoading?: boolean;
}

export const SystemDetectionBanner: React.FC<SystemDetectionBannerProps> = ({
  detectionData,
  recommendation,
  currency = '₱',
  onSelectAction,
  onExecuteRecommendation,
  onRefreshRecommendations,
  isLoading = false,
}) => {
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<'all' | PillarCategory>('all');
  const data = detectionData || recommendation;

  if (!data || !data.detections) {
    return null;
  }

  const { detections, recommendations = [], detectedAt } = data;

  const urgentDeadlines = detections.workSchool.imminentDeadlines.filter((d) => d.isUrgent);
  const sleepDeficit = detections.healthSleep.isDeficit;
  const isOverBudget = detections.financials.isOverDailyBudget;
  const filteredRecs = recommendations.filter((rec) => {
    if (selectedPillarFilter === 'all') return true;
    return rec.pillar === selectedPillarFilter;
  });

  return (
    <div className="rounded-2xl bg-[#1c3028] text-white p-5 lg:p-6 shadow-[0_14px_34px_rgba(28,48,40,0.14)] border border-[#29483a] space-y-5">
      {/* Top Header: System Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white tracking-tight">
            Daily Status & Suggestions
          </h2>
          <p className="text-xs text-[#b8cbbd]">
            Overview across deadlines, sleep, and spending based on your profile.
          </p>
        </div>

        {onRefreshRecommendations && (
          <button
            onClick={onRefreshRecommendations}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#d8e5da] text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {/* 4-Pillar Detection Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card 1: Schoolwork & Deadlines */}
        <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Deadlines Detected</span>
            </span>
            {urgentDeadlines.length > 0 ? (
              <span className="text-[10px] font-bold text-rose-300 bg-rose-900/50 px-1.5 py-0.5 rounded">
                {urgentDeadlines.length} Urgent
              </span>
            ) : (
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                Clear
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-white">
            {detections.workSchool.pendingTasks} Pending
          </div>
          <div className="text-[11px] text-stone-300 space-y-0.5">
            <div>
              • {detections.workSchool.schoolworkCount} Schoolworks / Assignments
            </div>
            <div>
              • {detections.workSchool.workCount} Work Tasks & Deliverables
            </div>
            {urgentDeadlines[0] && (
              <div className="text-amber-300 font-medium truncate pt-1">
                ⚠️ Closest: {urgentDeadlines[0].title} (due {urgentDeadlines[0].dueDate})
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Sleep & Health Hours */}
        <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Sleep & Recovery</span>
            </span>
            {sleepDeficit ? (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-900/50 px-1.5 py-0.5 rounded">
                -{detections.healthSleep.deficitAmount}h Deficit
              </span>
            ) : (
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                Well Rested
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-white">
            {detections.healthSleep.sleepHours} hrs slept
          </div>
          <div className="text-[11px] text-stone-300 space-y-0.5">
            <div>
              • Screen time: {Math.round(detections.healthSleep.screenTimeMinutes / 60 * 10) / 10}h today
            </div>
            <div>
              • Continuous work: {detections.healthSleep.continuousWorkMinutes}m uninterrupted
            </div>
            <div className="pt-1 text-stone-400">
              Cognitive battery: {detections.healthSleep.energyLevel >= 4 ? 'High' : detections.healthSleep.energyLevel === 3 ? 'Steady' : 'Low'}
            </div>
          </div>
        </div>

        {/* Card 3: Financials (Day/Week/Month) */}
        <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Spending Guard</span>
            </span>
            {isOverBudget ? (
              <span className="text-[10px] font-bold text-rose-300 bg-rose-900/50 px-1.5 py-0.5 rounded">
                Over Budget
              </span>
            ) : (
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                Under Limit
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-white">
            {currency}{detections.financials.dailySpend} today
          </div>
          <div className="text-[11px] text-stone-300 space-y-0.5">
            <div>
              • Daily: {currency}{detections.financials.dailySpend} of {currency}{detections.financials.dailyBudget}
            </div>
            <div>
              • Weekly: {currency}{detections.financials.weeklySpend} of {currency}{detections.financials.weeklyBudget}
            </div>
            <div>
              • Monthly: {currency}{detections.financials.monthlySpend} of {currency}{detections.financials.monthlyBudget}
            </div>
          </div>
        </div>

      </div>

      {/* Generated Actionable AI Recommendations */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Suggestions ({recommendations.length})
            </span>
          </div>

          {/* Quick Pillar Filter */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setSelectedPillarFilter('all')}
              className={`px-2 py-0.5 rounded ${
                selectedPillarFilter === 'all'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedPillarFilter('school')}
              className={`px-2 py-0.5 rounded ${
                selectedPillarFilter === 'school'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              School
            </button>
            <button
              onClick={() => setSelectedPillarFilter('work')}
              className={`px-2 py-0.5 rounded ${
                selectedPillarFilter === 'work'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Work
            </button>
            <button
              onClick={() => setSelectedPillarFilter('health')}
              className={`px-2 py-0.5 rounded ${
                selectedPillarFilter === 'health'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Health
            </button>
            <button
              onClick={() => setSelectedPillarFilter('finance')}
              className={`px-2 py-0.5 rounded ${
                selectedPillarFilter === 'finance'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Finance
            </button>
          </div>
        </div>

        {/* List of Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRecs.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl bg-stone-800/90 border border-stone-700 p-4 space-y-3 flex flex-col justify-between hover:border-stone-600 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      rec.priority === 'urgent'
                        ? 'bg-rose-900/60 text-rose-300 border border-rose-800/80'
                        : rec.priority === 'high'
                        ? 'bg-amber-900/60 text-amber-300 border border-amber-800/80'
                        : 'bg-blue-900/60 text-blue-300 border border-blue-800/80'
                    }`}
                  >
                    {rec.pillar.toUpperCase()} • {rec.priority.toUpperCase()}
                  </span>
                  {rec.estimatedMinutes && (
                    <span className="text-[11px] text-stone-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {rec.estimatedMinutes} mins
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white">{rec.headline}</h4>

                <p className="text-xs text-stone-300 leading-relaxed">
                  <span className="font-semibold text-stone-200">System Detected: </span>
                  {rec.detectedReason}
                </p>

                <div className="p-2.5 rounded-lg bg-stone-900/90 border border-stone-800 text-xs text-amber-200/90 font-medium">
                  <span className="font-bold text-amber-300">Prescription: </span>
                  {rec.actionableAdvice}
                </div>
              </div>

              {rec.suggestedActionLabel && (
                <button
                  onClick={() => {
                    if (onSelectAction) {
                      onSelectAction(rec.suggestedActionLabel!);
                    }
                    if (onExecuteRecommendation) {
                      onExecuteRecommendation(rec);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <span>{rec.suggestedActionLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
