export type PillarCategory = 'work' | 'school' | 'health' | 'finance' | 'mindfulness';

export interface TaskItem {
  id: string;
  title: string;
  category: 'work' | 'school';
  tag: string; // e.g., "CS 101", "Client Sprint", "Midterm Essay"
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  isFocusSessionActive?: boolean;
}

export interface HabitItem {
  id: string;
  title: string;
  category: PillarCategory;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  streak: number;
  bestStreak: number;
  completedToday: boolean;
  targetPerWeek: number;
  history: Record<string, boolean>; // e.g. '2026-09-05': true
}

export interface HealthState {
  screenTimeMinutes: number;
  continuousWorkMinutes: number;
  sleepHours: number;
  waterGlasses: number;
  targetWaterGlasses: number;
  energyLevel: 1 | 2 | 3 | 4 | 5; // 1 lowest, 5 peak
  lastBreakTime: number; // timestamp
  breaksTakenToday: number;
  activeTimerRunning: boolean;
  activeTimerSeconds: number;
}

export interface FinancialItem {
  id: string;
  date: string;
  type: 'expense' | 'income' | 'savings';
  category: 'Food' | 'Transport' | 'Study & Books' | 'Tools & Subscriptions' | 'Bills' | 'Leisure' | 'Savings';
  amount: number;
  note: string;
}

export interface FinancialState {
  currency: string;
  dailyBudget: number;
  monthlySavingsTarget: number;
  currentSavings: number;
  transactions: FinancialItem[];
}

export interface AiInsight {
  id: string;
  timestamp: string;
  pillar: PillarCategory | 'balance';
  type: 'burnout_shield' | 'productivity_surge' | 'discipline_coach' | 'financial_alert' | 'smart_scheduling';
  title: string;
  rationale: string;
  actionableStep: string;
  urgency: 'high' | 'medium' | 'low';
  actedUpon?: boolean;
}

export interface NextBestAction {
  title: string;
  category: PillarCategory | 'rest';
  actionType: 'deep_work' | 'study_review' | 'wellness_break' | 'habit_trigger' | 'financial_check';
  estimatedMinutes: number;
  reason: string;
  urgency: 'urgent' | 'optimal' | 'rejuvenating';
}

export interface LifeBalanceIndex {
  overallScore: number; // 0 - 100
  workSchoolScore: number;
  healthWellnessScore: number;
  financialDisciplineScore: number;
  habitConsistencyScore: number;
  summary: string;
  protectiveAdvice: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  role: 'student' | 'professional' | 'freelancer' | 'other';
  dailyWorkTargetMinutes: number;
  dailyBudget: number;
  monthlySavingsTarget: number;
  currency: string;
  wakeTime: string;
  bedTime: string;
  primaryGoal: string;
  onboardingCompleted: boolean;
  createdAt: string;
}
