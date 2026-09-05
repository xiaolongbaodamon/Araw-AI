import React, { useState } from 'react';
import {
  Flame,
  Check,
  Plus,
  Trash2,
  Calendar,
  Sun,
  Sunset,
  Moon,
  Clock,
  Briefcase,
  GraduationCap,
  Heart,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { HabitItem, PillarCategory } from '../types';

interface HabitTrackerProps {
  habits: HabitItem[];
  onToggleHabit: (id: string) => void;
  onAddHabit: (habit: Omit<HabitItem, 'id' | 'streak' | 'bestStreak' | 'completedToday' | 'history'>) => void;
  onDeleteHabit: (id: string) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
}) => {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New habit form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PillarCategory>('health');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('morning');
  const [newTargetPerWeek, setNewTargetPerWeek] = useState(7);

  // Last 7 days helper
  const pastDays = [
    { dateStr: '2026-08-30', label: 'Sun' },
    { dateStr: '2026-08-31', label: 'Mon' },
    { dateStr: '2026-09-01', label: 'Tue' },
    { dateStr: '2026-09-02', label: 'Wed' },
    { dateStr: '2026-09-03', label: 'Thu' },
    { dateStr: '2026-09-04', label: 'Fri' },
    { dateStr: '2026-09-05', label: 'Sat' },
  ];

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddHabit({
      title: newTitle.trim(),
      category: newCategory,
      timeOfDay: newTimeOfDay,
      targetPerWeek: Number(newTargetPerWeek) || 7,
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  const filteredHabits = habits.filter((h) => {
    if (selectedTimeFilter === 'all') return true;
    return h.timeOfDay === selectedTimeFilter;
  });

  const getPillarBadge = (cat: PillarCategory) => {
    switch (cat) {
      case 'health':
        return <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">Health</span>;
      case 'work':
        return <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">Work</span>;
      case 'school':
        return <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">School</span>;
      case 'finance':
        return <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">Finance</span>;
      default:
        return <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">Mind</span>;
    }
  };

  const getTimeIcon = (time: string) => {
    switch (time) {
      case 'morning':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'afternoon':
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
      case 'evening':
        return <Sunset className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-stone-400" />;
    }
  };

  const completedTodayCount = habits.filter((h) => h.completedToday).length;

  return (
    <div className="space-y-6">
      {/* Discipline Crisis Header */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Discipline Engine</span>
              </span>
              <span className="text-xs text-stone-600">Eliminating the February Goal Drop-Off</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              Personalized Habit Architecture
            </h2>
            <p className="text-xs text-stone-600 max-w-xl">
              "Over 80% fail their goals because they lack a system and feedback. Araw AI turns grand ambitions into atomic, daily actions."
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-900">
              Today: {completedTodayCount} of {habits.length} Anchored
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Habit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Time Filter Pills */}
      <div className="flex items-center gap-2 text-xs font-medium">
        <button
          onClick={() => setSelectedTimeFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition-colors ${
            selectedTimeFilter === 'all'
              ? 'bg-stone-900 text-white font-semibold shadow-2xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
          }`}
        >
          All Times ({habits.length})
        </button>
        <button
          onClick={() => setSelectedTimeFilter('morning')}
          className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
            selectedTimeFilter === 'morning'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          Morning
        </button>
        <button
          onClick={() => setSelectedTimeFilter('afternoon')}
          className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
            selectedTimeFilter === 'afternoon'
              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Afternoon
        </button>
        <button
          onClick={() => setSelectedTimeFilter('evening')}
          className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
            selectedTimeFilter === 'evening'
              ? 'bg-purple-600 text-white font-semibold shadow-2xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
          }`}
        >
          <Sunset className="w-3.5 h-3.5" />
          Evening
        </button>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredHabits.map((habit) => {
          return (
            <div
              key={habit.id}
              className={`rounded-xl border p-4 transition-all ${
                habit.completedToday
                  ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                  : 'bg-white border-stone-200 shadow-2xs hover:border-stone-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Big Checkbox */}
                  <button
                    onClick={() => onToggleHabit(habit.id)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                      habit.completedToday
                        ? 'bg-emerald-600 text-white shadow-2xs scale-105'
                        : 'border-2 border-stone-300 hover:border-emerald-500 bg-white text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getPillarBadge(habit.category)}
                      <span className="text-[11px] text-stone-500 capitalize flex items-center gap-1">
                        {getTimeIcon(habit.timeOfDay)}
                        {habit.timeOfDay}
                      </span>
                    </div>

                    <h4
                      className={`text-sm font-semibold tracking-tight ${
                        habit.completedToday ? 'text-stone-800' : 'text-stone-900'
                      }`}
                    >
                      {habit.title}
                    </h4>
                  </div>
                </div>

                {/* Streak Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{habit.streak}d</span>
                  </div>

                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    className="p-1 text-stone-300 hover:text-rose-600 transition-colors"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 7-Day Consistency Dots */}
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
                <span className="font-medium text-stone-600">Past 7 Days Consistency</span>
                <div className="flex items-center gap-1.5">
                  {pastDays.map((day) => {
                    const isDone = habit.history[day.dateStr];
                    return (
                      <div
                        key={day.dateStr}
                        className="flex flex-col items-center gap-0.5"
                        title={`${day.label} (${day.dateStr}): ${isDone ? 'Completed' : 'Missed'}`}
                      >
                        <span className="text-[9px] text-stone-500">{day.label[0]}</span>
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                            isDone ? 'bg-emerald-500 text-white' : 'bg-stone-200'
                          }`}
                        >
                          {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-4">
              Add High-Leverage Habit
            </h3>
            <form onSubmit={handleCreateHabit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Habit Action Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15m Morning Walk or Read 20 pages"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Pillar Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="health">Health & Physical Vigor</option>
                  <option value="work">Work & Deep Focus</option>
                  <option value="school">School & Academic Mastery</option>
                  <option value="finance">Financial Discipline</option>
                  <option value="mindfulness">Mindfulness & Rest</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Optimal Time of Day</label>
                <select
                  value={newTimeOfDay}
                  onChange={(e) => setNewTimeOfDay(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="morning">Morning Routine (Awakening)</option>
                  <option value="afternoon">Afternoon Focus</option>
                  <option value="evening">Evening Wind-Down</option>
                  <option value="anytime">Anytime / Flexible</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Weekly Target</label>
                <select
                  value={newTargetPerWeek}
                  onChange={(e) => setNewTargetPerWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={7}>7 days / week (Daily anchor)</option>
                  <option value={5}>5 days / week (Weekdays)</option>
                  <option value={3}>3 days / week</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold"
                >
                  Lock In Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
