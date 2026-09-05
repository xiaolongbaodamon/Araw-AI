import { TaskItem, HealthState, FinancialState, SystemDetectionRecommendation, UserProfile } from '../types';

function getSleepTargetHours(userProfile?: UserProfile | null): number {
  if (!userProfile?.wakeTime || !userProfile?.bedTime) return 7.5;

  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  };

  const wake = parseTime(userProfile.wakeTime);
  const bed = parseTime(userProfile.bedTime);
  let delta = wake - bed;

  if (delta <= 0) {
    delta += 24;
  }

  return Math.min(10, Math.max(6, Number(delta.toFixed(1))));
}

export function calculateSystemDetectionsAndRecommendations(
  tasks: TaskItem[],
  health: HealthState,
  finances: FinancialState,
  userProfile?: UserProfile | null
): SystemDetectionRecommendation {
  const now = new Date();
  const todayStr = '2026-09-05';
  const dailyBudget = userProfile?.dailyBudget ?? finances.dailyBudget ?? 500;
  const monthlySavingsTarget = userProfile?.monthlySavingsTarget ?? finances.monthlySavingsTarget ?? 5000;
  const roleLabel = userProfile?.role ?? 'professional';
  const sleepTargetHours = getSleepTargetHours(userProfile);

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
        subject: task.subject,
        taskType: task.taskType || (task.category === 'school' ? 'schoolwork' : 'work_task'),
      };
    })
    .sort((a, b) => a.hoursUntilDue - b.hoursUntilDue);

  // 2. HEALTH & SLEEP DETECTION
  const sleepHours = health.sleepHours && health.sleepHours > 0 ? health.sleepHours : sleepTargetHours;
  const isDeficit = sleepHours < sleepTargetHours;
  const deficitAmount = isDeficit ? Number((sleepTargetHours - sleepHours).toFixed(1)) : 0;

  let burnoutRisk: 'low' | 'moderate' | 'high' = 'low';
  if (health.continuousWorkMinutes >= 75 || (isDeficit && health.continuousWorkMinutes >= 50)) {
    burnoutRisk = 'high';
  } else if (health.continuousWorkMinutes >= 45 || isDeficit) {
    burnoutRisk = 'moderate';
  }

  // 3. FINANCIAL SPENDING DETECTION (Daily, Weekly, Monthly)
  const currency = userProfile?.currency || finances.currency || '₱';
  const transactions = finances.transactions || [];

  const dailySpend = transactions
    .filter((t) => t.type === 'expense' && (t.date === todayStr || !t.date))
    .reduce((sum, t) => sum + t.amount, 0);
  const dailyRemaining = dailyBudget - dailySpend;
  const isOverDailyBudget = dailySpend > dailyBudget;

  const weeklyBudget = finances.weeklyBudget || dailyBudget * 7;
  const weeklySpend = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const weeklyRemaining = weeklyBudget - weeklySpend;
  const isOverWeeklyBudget = weeklySpend > weeklyBudget;

  const monthlyBudget = finances.monthlyBudget || weeklyBudget * 4;
  const monthlySpend = weeklySpend;
  const monthlyRemaining = monthlyBudget - monthlySpend;

  // 4. GENERATE SYNTHESIZED ACTIONABLE RECOMMENDATIONS
  const recommendations: SystemDetectionRecommendation['recommendations'] = [];

  // Recommendation 1: Deadline & Sleep Interlock
  const closestDeadline = imminentDeadlines[0];
  if (closestDeadline && closestDeadline.hoursUntilDue <= 24) {
    const subjectLabel = closestDeadline.subject ? ` for ${closestDeadline.subject}` : '';
    if (isDeficit) {
      recommendations.push({
        id: 'rec-deadline-sleep',
        priority: 'urgent',
        pillar: closestDeadline.category,
        headline: `Urgent ${closestDeadline.category === 'school' ? 'Schoolwork' : 'Work'} Deadline${subjectLabel} (${closestDeadline.title})`,
        detectedReason: `Detected ${closestDeadline.category === 'school' ? 'schoolwork' : 'deliverable'} "${closestDeadline.title}"${subjectLabel} due soon while your recovery target is ${sleepTargetHours}h and your log is ${sleepHours}h (${deficitAmount}h deficit).`,
        actionableAdvice: `Keep the next ${Math.min(25, userProfile?.dailyWorkTargetMinutes ?? 180)} minutes tight and focused: complete the highest-impact part of "${closestDeadline.title}" first, then protect a short rest.`,
        suggestedActionLabel: 'Start Focus Sprint',
        estimatedMinutes: Math.min(25, userProfile?.dailyWorkTargetMinutes ?? 180),
      });
    } else {
      recommendations.push({
        id: 'rec-deadline-optimal',
        priority: 'urgent',
        pillar: closestDeadline.category,
        headline: `Focus on Upcoming Deadline${subjectLabel}: ${closestDeadline.title}`,
        detectedReason: `Detected deadline${subjectLabel} within ${Math.max(1, closestDeadline.hoursUntilDue)} hours. Your current profile targets ${sleepTargetHours}h sleep and ${userProfile?.dailyWorkTargetMinutes ?? 180} minutes of daily focus.`,
        actionableAdvice: `Allocate the next ${Math.min(45, userProfile?.dailyWorkTargetMinutes ?? 180)} minutes to finish "${closestDeadline.title}". You have enough focus buffer to finish this with room to recover after.`,
        suggestedActionLabel: 'Open Task Hub',
        estimatedMinutes: Math.min(45, userProfile?.dailyWorkTargetMinutes ?? 180),
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
        : `Sleep Recovery Strategy (${sleepHours}h Logged vs ${sleepTargetHours}h Target)`,
      detectedReason: health.continuousWorkMinutes >= 75
        ? `Your current profile indicates ${userProfile?.wakeTime ?? '07:00'} wake time and ${userProfile?.bedTime ?? '23:00'} bedtime, with ${health.continuousWorkMinutes}m continuous screen time without interruption.`
        : `Your target sleep window is ${sleepTargetHours}h, but your current log shows ${sleepHours}h.`,
      actionableAdvice: health.continuousWorkMinutes >= 75
        ? 'Step away from screen, hydrate with a glass of water, and perform the 1-minute box breathing reset.'
        : 'Protect a 15-minute rest window before the next work block and keep your bedtime routine consistent with your profile preference.',
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
      detectedReason: `You set a daily spending cap of ${currency}${dailyBudget}, and your current activity is ${currency}${dailySpend}. Weekly remaining is ${currency}${Math.max(0, weeklyRemaining)} and monthly savings target is ${currency}${monthlySavingsTarget}.`,
      actionableAdvice: `Freeze non-essential purchases for the rest of today and keep the remaining balance focused on your savings target.`,
      suggestedActionLabel: 'Review Transactions',
      estimatedMinutes: 5,
    });
  } else if (dailySpend >= dailyBudget * 0.8) {
    recommendations.push({
      id: 'rec-finance-warning',
      priority: 'medium',
      pillar: 'finance',
      headline: `Approaching Daily Spending Limit (${currency}${dailyRemaining} left)`,
      detectedReason: `Your profile cap is ${currency}${dailyBudget}. You have used ${currency}${dailySpend}, leaving ${currency}${dailyRemaining}.`,
      actionableAdvice: `Keep any nonessential purchases under ${currency}${dailyRemaining} to protect your target monthly savings.`,
      suggestedActionLabel: 'View Financial Hub',
      estimatedMinutes: 3,
    });
  } else {
    recommendations.push({
      id: 'rec-finance-healthy',
      priority: 'medium',
      pillar: 'finance',
      headline: `Healthy Spending Pace (${currency}${dailyRemaining} daily buffer left)`,
      detectedReason: `Your current profile sets a ${currency}${dailyBudget} daily cap and a ${currency}${monthlySavingsTarget} monthly target.`,
      actionableAdvice: `You are still inside your daily spending guard. Keep savings steady and reserve any surplus for your monthly target.`,
      suggestedActionLabel: 'Log Expense',
      estimatedMinutes: 2,
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
    },
    recommendations,
  };
}
