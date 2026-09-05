import { TaskItem, HealthState, FinancialState, AiInsight, NextBestAction } from '../types';

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 't-1',
    title: 'Complete Software Architecture Diagram',
    category: 'work',
    tag: 'Client Deliverable',
    priority: 'high',
    dueDate: '2026-09-05',
    dueTime: '15:00',
    estimatedMinutes: 45,
    completed: false,
    subtasks: [
      { id: 'st-1', title: 'Export system context model', completed: true },
      { id: 'st-2', title: 'Clarify API gateway proxy specs', completed: false },
      { id: 'st-3', title: 'Review with tech lead', completed: false },
    ],
  },
  {
    id: 't-2',
    title: 'Calculus III Problem Set 4 (Multivariate)',
    category: 'school',
    tag: 'Math 302',
    priority: 'urgent',
    dueDate: '2026-09-05',
    dueTime: '18:00',
    estimatedMinutes: 60,
    completed: false,
    subtasks: [
      { id: 'st-4', title: 'Solve questions 1-5 (Lagrange multipliers)', completed: true },
      { id: 'st-5', title: 'Type solutions in LaTeX', completed: false },
    ],
  },
  {
    id: 't-3',
    title: 'Research Database Indexing Patterns',
    category: 'school',
    tag: 'CS 401',
    priority: 'medium',
    dueDate: '2026-09-06',
    estimatedMinutes: 30,
    completed: true,
    completedAt: '2026-09-05T09:15:00',
  },
  {
    id: 't-4',
    title: 'Prepare Weekly Sprint Retrospective Notes',
    category: 'work',
    tag: 'Team Sync',
    priority: 'low',
    dueDate: '2026-09-07',
    estimatedMinutes: 25,
    completed: false,
  },
];

export const INITIAL_HEALTH: HealthState = {
  screenTimeMinutes: 135, // 2h 15m
  continuousWorkMinutes: 75,
  sleepHours: 7.2,
  waterGlasses: 5,
  targetWaterGlasses: 8,
  energyLevel: 4,
  lastBreakTime: Date.now() - 75 * 60 * 1000,
  breaksTakenToday: 2,
  activeTimerRunning: false,
  activeTimerSeconds: 0,
};

export const INITIAL_FINANCE: FinancialState = {
  currency: '₱', // Philippine Peso from the proposal, with option to toggle
  dailyBudget: 650,
  weeklyBudget: 4550,
  monthlyBudget: 19500,
  monthlySavingsTarget: 8000,
  currentSavings: 5400,
  transactions: [
    {
      id: 'f-1',
      date: '2026-09-05',
      type: 'expense',
      category: 'Food',
      amount: 140,
      note: 'Nutritious lunch bowl & coconut water',
    },
    {
      id: 'f-2',
      date: '2026-09-05',
      type: 'expense',
      category: 'Transport',
      amount: 45,
      note: 'Commuter transit card reload',
    },
    {
      id: 'f-3',
      date: '2026-09-04',
      type: 'savings',
      category: 'Savings',
      amount: 500,
      note: 'Weekly automated emergency fund deposit',
    },
    {
      id: 'f-4',
      date: '2026-09-04',
      type: 'expense',
      category: 'Study & Books',
      amount: 280,
      note: 'Algorithms study guide PDF',
    },
  ],
};

export const INITIAL_INSIGHTS: AiInsight[] = [
  {
    id: 'ins-1',
    timestamp: '10 mins ago',
    pillar: 'health',
    type: 'burnout_shield',
    title: 'Screen Fatigue Threshold Detected',
    rationale: 'You have been on continuous screen work for 75 minutes without an optical reset. Continuous focal distance impairs recall and increases afternoon fatigue by 38%.',
    actionableStep: 'Step away from screen for 5 minutes. Hydrate with 1 glass of water and look at an object 20+ feet away.',
    urgency: 'high',
  },
  {
    id: 'ins-2',
    timestamp: '45 mins ago',
    pillar: 'school',
    type: 'productivity_surge',
    title: 'Optimal Peak Focus Window: Calculus III',
    rationale: 'Historical data indicates your analytical cognitive peak is between 09:30 and 11:30. Problem Set 4 is due today at 18:00.',
    actionableStep: 'Initiate a 45-minute Deep Work sprint on Problem Set 4 right now while brain glucose and alertness are at peak.',
    urgency: 'high',
  },
  {
    id: 'ins-3',
    timestamp: '2 hours ago',
    pillar: 'finance',
    type: 'financial_alert',
    title: 'Daily Spend Pacing: Safe Zone',
    rationale: 'Current spend is ₱185 out of your ₱650 daily allocation (28%). You have ₱465 cushion remaining for dinner and essentials.',
    actionableStep: 'Keep dinner under ₱250 to bank ₱215 into your monthly savings target.',
    urgency: 'low',
  },
];

export const INITIAL_NEXT_ACTION: NextBestAction = {
  title: 'Choose your first priority',
  category: 'work',
  actionType: 'deep_work',
  estimatedMinutes: 25,
  reason: 'Your workspace is clear. Add a task or schoolwork item to receive a personalized focus recommendation.',
  urgency: 'optimal',
};
