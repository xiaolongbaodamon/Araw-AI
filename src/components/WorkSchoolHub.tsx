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
  AlertCircle,
  Calendar,
  BookOpen,
  Filter,
} from 'lucide-react';
import { SchoolSubject, TaskItem, TaskType } from '../types';

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
  subjects: SchoolSubject[];
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
  subjects,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'school' | 'work' | 'deadlines'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [isDecomposingId, setIsDecomposingId] = useState<string | null>(null);

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'work' | 'school'>('school');
  const [newTaskType, setNewTaskType] = useState<TaskType>('assignment');
  const [newTag, setNewTag] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [newDueDate, setNewDueDate] = useState('2026-09-05');
  const [newDueTime, setNewDueTime] = useState('23:59');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(45);

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
      subject: newCategory === 'school' ? newSubject : undefined,
      taskType: newTaskType,
      tag: newTag.trim() || (newCategory === 'work' ? 'Work Project' : 'Course Work'),
      priority: newPriority,
      dueDate: newDueDate,
      dueTime: newDueTime,
      estimatedMinutes: Number(newEstimatedMinutes) || 30,
      completed: false,
      subtasks: [],
    });

    setNewTitle('');
    setNewTag('');
    setNewSubject('');
    setShowAddModal(false);
  };

  const openAddModalWithDefaults = (category: 'work' | 'school', type?: TaskType) => {
    setNewCategory(category);
    if (type) {
      setNewTaskType(type);
    } else {
      setNewTaskType(category === 'school' ? 'assignment' : 'work_task');
    }
    setShowAddModal(true);
  };

  // Helper for deadline calculations
  const now = new Date();
  const getDeadlineStatus = (dueDateStr: string, dueTimeStr?: string) => {
    const fullDateStr = dueTimeStr ? `${dueDateStr}T${dueTimeStr}:00` : `${dueDateStr}T23:59:00`;
    const targetDate = new Date(fullDateStr);
    if (isNaN(targetDate.getTime())) {
      return { text: `Due ${dueDateStr}`, urgency: 'normal', hoursLeft: 48 };
    }
    const diffMs = targetDate.getTime() - now.getTime();
    const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));

    if (hoursLeft < 0) {
      return { text: `Overdue by ${Math.abs(hoursLeft)}h`, urgency: 'overdue', hoursLeft };
    } else if (hoursLeft <= 4) {
      return { text: `Due in ${hoursLeft} hrs (${dueTimeStr || 'Today'})`, urgency: 'critical', hoursLeft };
    } else if (hoursLeft <= 24) {
      return { text: `Due Today at ${dueTimeStr || 'EOD'}`, urgency: 'today', hoursLeft };
    } else if (hoursLeft <= 48) {
      return { text: `Due Tomorrow`, urgency: 'tomorrow', hoursLeft };
    } else {
      const days = Math.round(hoursLeft / 24);
      return { text: `Due in ${days} days (${dueDateStr})`, urgency: 'upcoming', hoursLeft };
    }
  };

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'school') return t.category === 'school';
    if (activeTab === 'work') return t.category === 'work';
    return true;
  });

  // For Deadlines Timeline view, sort by hoursLeft ascending
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (activeTab === 'deadlines') {
      const statusA = getDeadlineStatus(a.dueDate, a.dueTime);
      const statusB = getDeadlineStatus(b.dueDate, b.dueTime);
      return statusA.hoursLeft - statusB.hoursLeft;
    }
    return 0;
  });

  // Imminent deadline badge at top
  const pendingTasks = tasks.filter((t) => !t.completed);
  const imminentTasks = pendingTasks
    .map((t) => ({ task: t, status: getDeadlineStatus(t.dueDate, t.dueTime) }))
    .sort((a, b) => a.status.hoursLeft - b.status.hoursLeft);
  const nextImminent = imminentTasks[0];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const schoolworkCount = tasks.filter((t) => t.category === 'school').length;
  const workCount = tasks.filter((t) => t.category === 'work').length;
  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Deep Work Timer & Imminent Deadline Spotlight */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 flex-1">
            <h2 className="text-base font-bold text-stone-900">
              Tasks & Deadlines
            </h2>
            <p className="text-xs text-stone-500 max-w-xl">
              Manage work deliverables, school assignments, and focus sprints.
            </p>

            {/* Imminent Deadline Pill */}
            {nextImminent && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-medium text-stone-800 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Upcoming: <strong>{nextImminent.task.title}</strong> ({nextImminent.status.text})
                  </span>
                </span>
                {!nextImminent.task.completed && (
                  <button
                    onClick={() => onStartFocus(nextImminent.task.title, nextImminent.task.estimatedMinutes)}
                    className="text-[11px] font-semibold text-stone-700 hover:text-stone-900 underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Start timer</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Integrated Focus Sprint Timer */}
          <div className="w-full lg:w-auto p-4 rounded-xl bg-stone-900 text-white flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="text-center sm:text-left">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                <span>Focus Timer</span>
              </div>
              <div className="text-3xl font-mono font-bold tracking-tight mt-0.5">
                {formatTimer(focusTimerSeconds)}
              </div>
              <div className="text-[10px] text-stone-400 truncate max-w-[200px]">
                {activeFocusTaskTitle || 'Ready to focus'}
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
                      activeFocusTaskTitle || nextImminent?.task.title || 'General Deep Focus',
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

      {/* Tabs & Dedicated Add Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Pillar Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Items ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('school')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'school'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Schoolworks ({schoolworkCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('work')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'work'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span>Work To-Dos ({workCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('deadlines')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'deadlines'
                ? 'bg-white text-amber-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Deadlines Radar</span>
          </button>
        </div>

        {/* Quick Add Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddModalWithDefaults('school')}
            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />
            <span>+ Add Schoolwork</span>
          </button>
          <button
            onClick={() => openAddModalWithDefaults('work')}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Work Task</span>
          </button>
        </div>
      </div>

      {/* Task List / Deadlines Grid */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500 text-xs space-y-2">
            <div>No items currently listed under this view.</div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => openAddModalWithDefaults('school')}
                className="text-indigo-600 font-semibold underline"
              >
                Add an assignment or exam
              </button>
              <span>•</span>
              <button
                onClick={() => openAddModalWithDefaults('work')}
                className="text-blue-600 font-semibold underline"
              >
                Add a work task
              </button>
            </div>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const isExpanded = expandedTasks[task.id];
            const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
            const totalSubtasks = task.subtasks?.length || 0;
            const deadlineInfo = getDeadlineStatus(task.dueDate, task.dueTime);

            return (
              <div
                key={task.id}
                className={`rounded-xl border transition-all ${
                  task.completed
                    ? 'bg-stone-50/70 border-stone-200 opacity-60'
                    : deadlineInfo.urgency === 'critical' || deadlineInfo.urgency === 'overdue'
                    ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                    : 'bg-white border-stone-200 shadow-2xs hover:border-stone-300'
                }`}
              >
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-stone-400 hover:text-emerald-600 transition-colors"
                      title={task.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-stone-300 hover:border-emerald-500"></div>
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Category badge */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                            task.category === 'school'
                              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {task.category === 'school' ? (
                            <GraduationCap className="w-3 h-3" />
                          ) : (
                            <Briefcase className="w-3 h-3" />
                          )}
                          {task.category === 'school' ? 'Schoolwork' : 'Work'}
                        </span>

                        {/* Tag/Course */}
                        <span className="text-[11px] text-stone-600 flex items-center gap-1 font-medium bg-stone-100 px-2 py-0.5 rounded">
                          <Tag className="w-3 h-3 text-stone-400" />
                          {task.subject || task.tag}
                        </span>

                        {/* Priority */}
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

                        {/* Deadline badge */}
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ml-auto ${
                            deadlineInfo.urgency === 'critical'
                              ? 'bg-rose-100 text-rose-900 border border-rose-200 font-bold animate-pulse'
                              : deadlineInfo.urgency === 'today'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          <Clock className="w-3 h-3 text-stone-500" />
                          <span>{deadlineInfo.text}</span>
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-semibold tracking-tight ${
                          task.completed ? 'line-through text-stone-400' : 'text-stone-900'
                        }`}
                      >
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-stone-500">
                        <span>Est: {task.estimatedMinutes}m</span>
                        {task.subject && <span>• {task.subject}</span>}
                        {task.dueTime && <span>• Deadline Time: {task.dueTime}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-1">
                    {!task.completed && (
                      <button
                        onClick={() => onStartFocus(task.title, task.estimatedMinutes)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                        title="Start focus sprint on this item"
                      >
                        <Play className="w-4 h-4 fill-emerald-600" />
                      </button>
                    )}

                    {/* AI Decompose Button */}
                    <button
                      onClick={() => handleDecompose(task.id, task.title, task.category)}
                      disabled={isDecomposingId === task.id}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1 transition-colors"
                      title="Turn big assignment or project into small sub-tasks"
                    >
                      <Sparkles className={`w-3 h-3 text-amber-600 ${isDecomposingId === task.id ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Breakdown</span>
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

      {/* Add Task / Schoolwork Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Add Work Deadline or Schoolwork
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Enter what you need to do, the course or project, and the exact deadline so the system can calculate your schedule and insights.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              {/* Pillar Category Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setNewCategory('school');
                    setNewTaskType('assignment');
                  }}
                  className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    newCategory === 'school'
                      ? 'bg-white text-indigo-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Schoolwork</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewCategory('work');
                    setNewTaskType('work_task');
                  }}
                  className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    newCategory === 'work'
                      ? 'bg-white text-blue-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Work To-Do</span>
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  {newCategory === 'school' ? 'Schoolwork Title (Assignment / Exam)' : 'Work Task / Deliverable Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    newCategory === 'school'
                      ? 'e.g. Calculus Problem Set #4, Biology Lab Report, History Midterm Study'
                      : 'e.g. Client Pitch Deck, Q3 Roadmap Review, Code Refactor Sprint'
                  }
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Specific Task Type & Course / Tag */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {newCategory === 'school' ? 'Schoolwork Type' : 'Work Type'}
                  </label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {newCategory === 'school' ? (
                      <>
                        <option value="assignment">Homework / Assignment</option>
                        <option value="project">Course Project</option>
                        <option value="exam_prep">Midterm / Final Exam Prep</option>
                        <option value="deliverable">Research Paper / Essay</option>
                        <option value="other">Reading & Lecture Review</option>
                      </>
                    ) : (
                      <>
                        <option value="work_task">General Work Deliverable</option>
                        <option value="project">Project Milestone</option>
                        <option value="deliverable">Client Deliverable</option>
                        <option value="other">Meeting Prep & Operations</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {newCategory === 'school' ? 'Subject' : 'Client / Project Tag'}
                  </label>
                  {newCategory === 'school' ? (
                    <select
                      required
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Choose a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.name}>{subject.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Client Acme, Product Sprint"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              </div>

              {/* Deadlines: Date and Time */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Exact Deadline Requirement</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Deadline Date</label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Deadline Time</label>
                    <input
                      type="time"
                      value={newDueTime}
                      onChange={(e) => setNewDueTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Priority & Est. Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Priority / Urgency</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="urgent">Urgent (Immediate)</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Est. Focus Minutes</label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={newEstimatedMinutes}
                    onChange={(e) => setNewEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs"
                >
                  Save Deadline Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
