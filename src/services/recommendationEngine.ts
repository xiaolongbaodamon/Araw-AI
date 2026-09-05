import { TaskItem, HabitItem, HealthState, FinancialState, SystemDetectionRecommendation, PillarCategory, UserProfile } from '../types';

export function calculateSystemDetectionsAndRecommendations(
  tasks: TaskItem[],
  habits: HabitItem[],
  health: HealthState,
  finances: FinancialState,
  userProfile?: UserProfile | null
): SystemDetectionRecommendation {
  const now = new Date();
  const todayStr = '2026-09-05';

  // 1. WORK & SCHOOLWORK DETECTION
  const pendingTasks = tasks.filter((t) => !t.completed);
  const schoolworks = tasks.filter((t) => t.category === 'school');
  const workTasks = tasks.filter((t) => t.category === 'work');

  // Calculate imminent deadlines
  const imminentDeadlines = pendingTasks
    .map((task) => {
      let hoursUntilDue = 48; // default
      if (task.dueDate) {
        const dueDateTimeStr = task.dueTime ? `${task.dueDate}T${task.dueTime}` : `${task.dueDate}T23:59:00`;
        const dueDateObj = new Date(dueDateTimeStr);
        if (!isNaN(dueDateObj.getTime())) {
          hoursUntilDue = Math.round((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60));
        } else if (task.dueDate === todayStr) {
          hoursUntilDue = 8;
        } else if (task.dueDate < todayStr) {
          hoursUntilDue = -1; // overdue
        }
      }

      return {
        title: task.title,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        hoursUntilDue,
        isUrgent: task.priority === 'urgent' || hoursUntilDue <= 24,
        category: task.category,
        taskType: task.taskType || (task.category === 'school' ? 'schoolwork' : 'work_task'),
      };
    })
    .sort((a, b) => a.hoursUntilDue - b.hoursUntilDue);

  // 2. HEALTH & SLEEP DETECTION
  const sleepHours = health.sleepHours || 7;
  const isDeficit = sleepHours < 7.0;
  const deficitAmount = isDeficit ? Math.round((7.5 - sleepHours) * 10) / 10 : 0;
  
  let burnoutRisk: 'low' | 'moderate' | 'high' = 'low';
  if (health.continuousWorkMinutes >= 75 || (isDeficit && health.continuousWorkMinutes >= 50)) {
    burnoutRisk = 'high';
  } else if (health.continuousWorkMinutes >= 45 || isDeficit) {
    burnoutRisk = 'moderate';
  }

  // 3. FINANCIAL SPENDING DETECTION (Daily, Weekly, Monthly)
  const currency = finances.currency || '₱';
  const transactions = finances.transactions || [];

  // Daily spend (Today)
  const dailySpend = transactions
    .filter((t) => t.type === 'expense' && (t.date === todayStr || !t.date))
    .reduce((sum, t) => sum + t.amount, 0);
  const dailyBudget = finances.dailyBudget || 500;
  const dailyRemaining = dailyBudget - dailySpend;
  const isOverDailyBudget = dailySpend > dailyBudget;

  // Weekly spend (last 7 days or matching week)
  const weeklyBudget = finances.weeklyBudget || dailyBudget * 7;
  // Compute weekly spend from all expense transactions
  const weeklySpend = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0); // In prototyping, all current transactions form weekly cohort
  const weeklyRemaining = weeklyBudget - weeklySpend;
  const isOverWeeklyBudget = weeklySpend > weeklyBudget;

  // Monthly spend
  const monthlyBudget = finances.monthlyBudget || weeklyBudget * 4;
  const monthlySpend = weeklySpend; // baseline
  const monthlyRemaining = monthlyBudget - monthlySpend;

  // 4. HABITS & DURATION DETECTION
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter((h) => h.completedToday).length;
  const pendingHabitsList = habits.filter((h) => !h.completedToday);
  const pendingHabitsCount = pendingHabitsList.length;

  const totalPlannedDurationMinutes = habits.reduce(
    (sum, h) => sum + (h.durationMinutes || 20),
    0
  );
  const pendingDurationMinutes = pendingHabitsList.reduce(
    (sum, h) => sum + (h.durationMinutes || 20),
    0
  );

  // 5. GENERATE SYNTHESIZED ACTIONABLE RECOMMENDATIONS
  const recommendations: SystemDetectionRecommendation['recommendations'] = [];

  // Recommendation 1: Deadline & Sleep Interlock
  const closestDeadline = imminentDeadlines[0];
  if (closestDeadline && closestDeadline.hoursUntilDue <= 24) {
    if (isDeficit) {
      recommendations.push({
        id: 'rec-deadline-sleep',
        priority: 'urgent',
        pillar: closestDeadline.category,
        headline: `Urgent ${closestDeadline.category === 'school' ? 'Schoolwork' : 'Work'} Deadline (${closestDeadline.title})`,
        detectedReason: `Detected ${closestDeadline.category === 'school' ? 'schoolwork' : 'deliverable'} "${closestDeadline.title}" due soon (${closestDeadline.dueTime ? `at ${closestDeadline.dueTime}` : 'today'}), while your sleep log shows ${sleepHours}h (${deficitAmount}h deficit).`,
        actionableAdvice: `Do not attempt marathon study/work with sleep deprivation. Engage in a single 25-minute Pomodoro focus sprint right now to complete the core requirements, then rest.`,
        suggestedActionLabel: 'Start 25m Focus Sprint',
        estimatedMinutes: 25,
      });
    } else {
      recommendations.push({
        id: 'rec-deadline-optimal',
        priority: 'urgent',
        pillar: closestDeadline.category,
        headline: `Focus on Upcoming Deadline: ${closestDeadline.title}`,
        detectedReason: `Detected deadline within ${Math.max(1, closestDeadline.hoursUntilDue)} hours. You logged a healthy ${sleepHours}h of sleep, so your cognitive focus is high.`,
        actionableAdvice: `Allocate the next 45 minutes to finish "${closestDeadline.title}". You have sufficient energy reserves to complete this ahead of time.`,
        suggestedActionLabel: 'Open Task Hub',
        estimatedMinutes: 45,
      });
    }
  }

  // Recommendation 2: Health & Rest
  if (health.continuousWorkMinutes >= 60 || isDeficit) {
    recommendations.push({
      id: 'rec-health-rest',
      priority: health.continuousWorkMinutes >= 75 ? 'urgent' : 'high',
      pillar: 'health',
      headline: health.continuousWorkMinutes >= 75
        ? 'Digital Burnout Warning: Screen Break Required'
        : `Sleep Deficit Recovery Strategy (${sleepHours}h Logged)`,
      detectedReason: health.continuousWorkMinutes >= 75
        ? `System detected ${health.continuousWorkMinutes}m continuous screen time without interruption.`
        : `You recorded ${sleepHours} hours of sleep last night (target: 7.5h).`,
      actionableAdvice: health.continuousWorkMinutes >= 75
        ? 'Step away from screen, hydrate with a glass of water, and perform the 1-minute box breathing reset.'
        : 'Schedule a 15-minute restorative power recharge before 3:00 PM, and limit high-stimulant caffeine intake.',
      suggestedActionLabel: 'Launch Breathing Reset',
      estimatedMinutes: 5,
    });
  }

  // Recommendation 3: Financial Spending Guidance (Daily / Weekly / Monthly)
  if (isOverDailyBudget) {
    recommendations.push({
      id: 'rec-finance-over',
      priority: 'high',
      pillar: 'finance',
      headline: `Daily Budget Exceeded (${currency}${dailySpend} spent vs ${currency}${dailyBudget} limit)`,
      detectedReason: `You have spent ${currency}${dailySpend}, exceeding your daily threshold by ${currency}${dailySpend - dailyBudget}. Weekly budget remaining is ${currency}${Math.max(0, weeklyRemaining)}.`,
      actionableAdvice: `Freeze non-essential purchases for the remainder of today to prevent spilling into your weekly savings reserve.`,
      suggestedActionLabel: 'Review Transactions',
      estimatedMinutes: 5,
    });
  } else if (dailySpend >= dailyBudget * 0.8) {
    recommendations.push({
      id: 'rec-finance-warning',
      priority: 'medium',
      pillar: 'finance',
      headline: `Approaching Daily Spending Limit (${currency}${dailyRemaining} left)`,
      detectedReason: `You've utilized ${Math.round((dailySpend / dailyBudget) * 100)}% of your daily budget (${currency}${dailySpend} of ${currency}${dailyBudget}).`,
      actionableAdvice: `Keep any dinner or evening coffee purchases under ${currency}${dailyRemaining} to maintain your daily discipline streak.`,
      suggestedActionLabel: 'View Financial Hub',
      estimatedMinutes: 3,
    });
  } else {
    recommendations.push({
      id: 'rec-finance-healthy',
      priority: 'medium',
      pillar: 'finance',
      headline: `Healthy Spending Pace (${currency}${dailyRemaining} daily buffer left)`,
      detectedReason: `Daily spend is ${currency}${dailySpend} of ${currency}${dailyBudget}. Weekly spend is ${currency}${weeklySpend} of ${currency}${weeklyBudget}.`,
      actionableAdvice: `You are on track with your monthly savings target of ${currency}${finances.monthlySavingsTarget}. Consider allocating any daily surplus toward your emergency fund.`,
      suggestedActionLabel: 'Log Expense',
      estimatedMinutes: 2,
    });
  }

  // Recommendation 4: Habit Routine & Duration Optimization
  if (pendingHabitsCount > 0) {
    const nextHabit = pendingHabitsList[0];
    const duration = nextHabit.durationMinutes || 20;
    recommendations.push({
      id: 'rec-habit-time',
      priority: 'medium',
      pillar: nextHabit.category,
      headline: `Pending Habit Window: "${nextHabit.title}" (${duration} mins)`,
      detectedReason: `Detected ${pendingHabitsCount} pending habits requiring a total of ${pendingDurationMinutes} minutes of focused activity today.`,
      actionableAdvice: `Take a break from digital work and anchor your "${nextHabit.title}" habit now for ${duration} minutes. Consistent execution will build your streak.`,
      suggestedActionLabel: `Start ${duration}m Habit Timer`,
      estimatedMinutes: duration,
    });
  }

  return {
    detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    detections: {
      workSchool: {
        totalTasks: tasks.length,
        pendingTasks: pendingTasks.length,
        schoolworkCount: schoolworks.length,
        workCount: workTasks.length,
        imminentDeadlines,
      },
      healthSleep: {
        sleepHours,
        isDeficit,
        deficitAmount,
        screenTimeMinutes: health.screenTimeMinutes,
        continuousWorkMinutes: health.continuousWorkMinutes,
        energyLevel: health.energyLevel,
        burnoutRisk,
      },
      financials: {
        dailySpend,
        dailyBudget,
        dailyRemaining,
        weeklySpend,
        weeklyBudget,
        weeklyRemaining,
        monthlySpend,
        monthlyBudget,
        monthlyRemaining,
        isOverDailyBudget,
        isOverWeeklyBudget,
      },
      habits: {
        totalHabits,
        completedTodayCount,
        pendingHabitsCount,
        totalPlannedDurationMinutes,
        pendingDurationMinutes,
        pendingHabits: pendingHabitsList.map((h) => ({
          title: h.title,
          durationMinutes: h.durationMinutes || 20,
          category: h.category,
        })),
      },
    },
    recommendations,
  };
}
