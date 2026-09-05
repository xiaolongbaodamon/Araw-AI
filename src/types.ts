export type PillarCategory = 'work' | 'school' | 'health' | 'finance' | 'mindfulness';

export type TaskType = 'work_task' | 'schoolwork' | 'assignment' | 'project' | 'exam_prep' | 'deliverable' | 'other';

export interface SchoolSubject {
  id: string;
  name: string;
  weeklyMinutes: number;
}

export interface TaskItem {
  id: string;
  title: string;
  category: 'work' | 'school';
  subject?: string;
  taskType?: TaskType;
  tag: string; // e.g., "CS 101", "Client Sprint", "Midterm Essay"
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  isFocusSessionActive?: boolean;
}

export interface HealthState {
  screenTimeMinutes: number;
  continuousWorkMinutes: number;
  sleepHours: number; // Hours slept
  sleepQuality?: 'poor' | 'fair' | 'good' | 'optimal';
  bedTime?: string;
  wakeTime?: string;
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
  weeklyBudget: number;
  monthlyBudget: number;
  monthlySavingsTarget: number;
  currentSavings: number;
  transactions: FinancialItem[];
}

export interface SystemDetectionRecommendation {
  detectedAt: string;
  detections: {
    workSchool: {
      totalTasks: number;
      pendingTasks: number;
      schoolworkCount: number;
      workCount: number;
      imminentDeadlines: {
        title: string;
        dueDate: string;
        dueTime?: string;
        hoursUntilDue: number;
        isUrgent: boolean;
        category: 'work' | 'school';
        subject?: string;
        taskType?: string;
      }[];
    };
    healthSleep: {
      sleepHours: number;
      isDeficit: boolean;
      deficitAmount: number;
      screenTimeMinutes: number;
      continuousWorkMinutes: number;
      energyLevel: number;
      burnoutRisk: 'low' | 'moderate' | 'high';
    };
    financials: {
      dailySpend: number;
      dailyBudget: number;
      dailyRemaining: number;
      weeklySpend: number;
      weeklyBudget: number;
      weeklyRemaining: number;
      monthlySpend: number;
      monthlyBudget: number;
      monthlyRemaining: number;
      isOverDailyBudget: boolean;
      isOverWeeklyBudget: boolean;
    };
  };
  recommendations: {
    id: string;
    priority: 'urgent' | 'high' | 'medium';
    pillar: PillarCategory | 'balance';
    headline: string;
    detectedReason: string;
    actionableAdvice: string;
    suggestedActionLabel?: string;
    estimatedMinutes?: number;
  }[];
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
  actionType: 'deep_work' | 'study_review' | 'wellness_break' | 'financial_check';
  estimatedMinutes: number;
  reason: string;
  urgency: 'urgent' | 'optimal' | 'rejuvenating';
}

export interface LifeBalanceIndex {
  overallScore: number; // 0 - 100
  workSchoolScore: number;
  healthWellnessScore: number;
  financialDisciplineScore: number;
  summary: string;
  protectiveAdvice: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  role: 'student' | 'professional' | 'freelancer' | 'other';
  dailyWorkTargetMinutes: number;
  dailyBudget: number;
  weeklyBudget?: number;
  monthlyBudget?: number;
  monthlySavingsTarget: number;
  currency: string;
  wakeTime: string;
  bedTime: string;
  primaryGoal: string;
  subjects: SchoolSubject[];
  onboardingCompleted: boolean;
  createdAt: string;
}
