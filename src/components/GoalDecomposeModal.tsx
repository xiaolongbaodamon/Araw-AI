import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  ListPlus,
  Lightbulb,
} from 'lucide-react';
import { TaskItem } from '../types';

interface GoalDecomposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubtasksAsTasks: (tasks: Omit<TaskItem, 'id'>[]) => void;
}

interface DecomposedStep {
  title: string;
  estimatedMinutes: number;
  tip: string;
}

export const GoalDecomposeModal: React.FC<GoalDecomposeModalProps> = ({
  isOpen,
  onClose,
  onAddSubtasksAsTasks,
}) => {
  const [goalTitle, setGoalTitle] = useState('');
  const [category, setCategory] = useState<'work' | 'school'>('school');
  const [totalMinutes, setTotalMinutes] = useState(90);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<DecomposedStep[]>([]);

  if (!isOpen) return null;

  const handleDecompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setIsDecomposing(true);
    setSubtasks([]);
    setSummary(null);

    try {
      const res = await fetch('/api/ai/decompose-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: goalTitle.trim(),
          category,
          totalMinutes: Number(totalMinutes) || 60,
        }),
      });

      const data = await res.json();
      setSummary(data.summary || 'Deconstructed into actionable daily micro-actions.');
      setSubtasks(data.subtasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleCommitToSchedule = () => {
    if (subtasks.length === 0) return;

    const newTasks: Omit<TaskItem, 'id'>[] = subtasks.map((step, idx) => ({
      title: step.title,
      category,
      tag: goalTitle.slice(0, 20),
      priority: idx === 0 ? 'high' : 'medium',
      dueDate: '2026-09-05',
      estimatedMinutes: step.estimatedMinutes,
      completed: false,
    }));

    onAddSubtasksAsTasks(newTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Break Down Goal
              </h3>
              <p className="text-xs text-stone-500">
                Split larger projects into smaller daily steps.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <div className="py-4 space-y-4 text-xs overflow-y-auto flex-1">
          <form onSubmit={handleDecompose} className="space-y-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Goal or Project Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sociology Research Paper or Q3 Financial Model"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                >
                  <option value="school">School Assignment</option>
                  <option value="work">Work Project</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Available Focus Block</label>
                <select
                  value={totalMinutes}
                  onChange={(e) => setTotalMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                >
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes (Deep Sprint)</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isDecomposing || !goalTitle.trim()}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isDecomposing ? 'animate-spin' : ''}`} />
              <span>{isDecomposing ? 'Deconstructing with Gemini...' : 'Deconstruct Into Daily Actions'}</span>
            </button>
          </form>

          {/* Results Display */}
          {summary && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 font-medium">
              {summary}
            </div>
          )}

          {subtasks.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="font-bold text-stone-800 text-xs flex items-center justify-between">
                <span>Action Sequence ({subtasks.length} steps):</span>
                <span className="text-[11px] text-stone-500 font-normal">
                  Total ~{subtasks.reduce((a, c) => a + c.estimatedMinutes, 0)} mins
                </span>
              </div>

              {subtasks.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{step.title}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-stone-600 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {step.estimatedMinutes}m
                    </span>
                  </div>

                  {step.tip && (
                    <div className="text-[11px] text-stone-600 flex items-start gap-1.5 pl-7">
                      <Lightbulb className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleCommitToSchedule}
                className="w-full py-2.5 mt-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <ListPlus className="w-4 h-4" />
                <span>Add All Steps to Work & School Hub</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
