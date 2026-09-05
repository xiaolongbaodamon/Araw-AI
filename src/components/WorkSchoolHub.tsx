import React, { useState } from 'react';
import {
  Briefcase,
  GraduationCap,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  Timer,
} from 'lucide-react';
import { TaskItem } from '../types';

interface WorkSchoolHubProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Omit<TaskItem, 'id'>) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDecomposeTaskWithAi: (taskId: string, title: string, category: string) => Promise<void>;
  // Focus sprint timer controls
  focusTimerSeconds: number;
  isFocusRunning: boolean;
  activeFocusTaskTitle?: string;
  onStartFocus: (taskTitle: string, minutes: number) => void;
  onPauseFocus: () => void;
  onResetFocus: () => void;
}

export const WorkSchoolHub: React.FC<WorkSchoolHubProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onToggleSubtask,
  onDecomposeTaskWithAi,
  focusTimerSeconds,
  isFocusRunning,
  activeFocusTaskTitle,
  onStartFocus,
  onPauseFocus,
  onResetFocus,
}) => {
  const [filter, setFilter] = useState<'all' | 'work' | 'school' | 'urgent'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [isDecomposingId, setIsDecomposingId] = useState<string | null>(null);

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'work' | 'school'>('work');
  const [newTag, setNewTag] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newDueDate, setNewDueDate] = useState('2026-09-05');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(30);

  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDecompose = async (taskId: string, title: string, category: string) => {
    setIsDecomposingId(taskId);
    try {
      await onDecomposeTaskWithAi(taskId, title, category);
      setExpandedTasks((prev) => ({ ...prev, [taskId]: true }));
    } finally {
      setIsDecomposingId(null);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      category: newCategory,
      tag: newTag.trim() || (newCategory === 'work' ? 'Work Project' : 'Course Work'),
      priority: newPriority,
      dueDate: newDueDate,
      estimatedMinutes: Number(newEstimatedMinutes) || 30,
      completed: false,
      subtasks: [],
    });

    setNewTitle('');
    setNewTag('');
    setShowAddModal(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'work') return t.category === 'work';
    if (filter === 'school') return t.category === 'school';
    if (filter === 'urgent') return t.priority === 'urgent' || t.priority === 'high';
    return true;
  });

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Deep Work Timer & Philosophy */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Unified Flow Engine
              </span>
              <span className="text-xs text-stone-600">Solving Context-Switching & App Clutter</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              Work Deadlines & Academic Hub
            </h2>
            <p className="text-xs text-stone-600 max-w-xl">
              Eliminate app jumping. All assignments, client deliverables, and study sprints stay in one calm, unified source of truth.
            </p>
          </div>

          {/* Integrated Focus Sprint Timer */}
          <div className="w-full lg:w-auto p-4 rounded-xl bg-stone-900 text-white flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="text-center sm:text-left">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                <span>Deep Work Focus Sprint</span>
              </div>
              <div className="text-3xl font-mono font-bold tracking-tight mt-0.5">
                {formatTimer(focusTimerSeconds)}
              </div>
              <div className="text-[10px] text-stone-400 truncate max-w-[200px]">
                {activeFocusTaskTitle || 'Select task to start'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isFocusRunning ? (
                <button
                  onClick={onPauseFocus}
                  className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              ) : (
                <button
                  onClick={() =>
                    onStartFocus(
                      activeFocusTaskTitle || tasks.find((t) => !t.completed)?.title || 'General Focus',
                      25
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Start 25m
                </button>
              )}
              <button
                onClick={onResetFocus}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Filters and New Task Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-stone-200/70 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Items ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('work')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
              filter === 'work' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3 h-3 text-blue-600" />
            Work ({tasks.filter((t) => t.category === 'work').length})
          </button>
          <button
            onClick={() => setFilter('school')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
              filter === 'school' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GraduationCap className="w-3 h-3 text-indigo-600" />
            School ({tasks.filter((t) => t.category === 'school').length})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'urgent' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Urgent ({tasks.filter((t) => t.priority === 'urgent' || t.priority === 'high').length})
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task / Assignment</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500 text-xs">
            No tasks found matching current filter. Add one above!
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isExpanded = expandedTasks[task.id];
            const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
            const totalSubtasks = task.subtasks?.length || 0;

            return (
              <div
                key={task.id}
                className={`rounded-xl border transition-all ${
                  task.completed
                    ? 'bg-stone-50/70 border-stone-200 opacity-60'
                    : 'bg-white border-stone-200 shadow-2xs hover:border-stone-300'
                }`}
              >
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-stone-400 hover:text-emerald-600 transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-stone-300 hover:border-emerald-500"></div>
                      )}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            task.category === 'work'
                              ? 'bg-blue-50 text-blue-800'
                              : 'bg-indigo-50 text-indigo-800'
                          }`}
                        >
                          {task.category}
                        </span>

                        <span className="text-[11px] text-stone-600 flex items-center gap-1 font-medium">
                          <Tag className="w-3 h-3 text-stone-400" />
                          {task.tag}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {task.priority}
                        </span>

                        <span className="text-[11px] text-stone-600 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {task.estimatedMinutes}m • Due {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-semibold tracking-tight ${
                          task.completed ? 'line-through text-stone-400' : 'text-stone-900'
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-1">
                    {!task.completed && (
                      <button
                        onClick={() => onStartFocus(task.title, task.estimatedMinutes)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="Start focus timer on this item"
                      >
                        <Play className="w-4 h-4 text-stone-700" />
                      </button>
                    )}

                    {/* AI Decompose Button */}
                    <button
                      onClick={() => handleDecompose(task.id, task.title, task.category)}
                      disabled={isDecomposingId === task.id}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1 transition-colors"
                      title="Turn big assignment into small daily actions"
                    >
                      <Sparkles className={`w-3 h-3 text-amber-600 ${isDecomposingId === task.id ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">AI Breakdown</span>
                    </button>

                    {/* Subtasks dropdown toggle */}
                    {totalSubtasks > 0 && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="p-1 rounded-lg text-stone-500 hover:bg-stone-100 text-xs flex items-center gap-0.5"
                      >
                        <span className="text-[10px] text-stone-500 font-medium">
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtasks List */}
                {isExpanded && totalSubtasks > 0 && (
                  <div className="bg-stone-50/80 border-t border-stone-100 px-10 py-3 space-y-2 rounded-b-xl">
                    <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      Micro-Milestones:
                    </div>
                    {task.subtasks?.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2.5 text-xs">
                        <button
                          onClick={() => onToggleSubtask(task.id, subtask.id)}
                          className="text-stone-400 hover:text-emerald-600"
                        >
                          {subtask.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <div className="w-4 h-4 rounded border border-stone-300"></div>
                          )}
                        </button>
                        <span
                          className={`${
                            subtask.completed ? 'line-through text-stone-400' : 'text-stone-700'
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-4">
              Add New Work Deadline or Assignment
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Task or Assignment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Midterm Lab Report or Client Pitch Deck"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Pillar Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as 'work' | 'school')}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="work">Work Project</option>
                    <option value="school">School / University</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Course / Client Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. BIO 201, Client Sprint"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={newEstimatedMinutes}
                    onChange={(e) => setNewEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
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
                  Save to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
