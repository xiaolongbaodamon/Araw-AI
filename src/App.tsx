/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  INITIAL_TASKS,
  INITIAL_HABITS,
  INITIAL_HEALTH,
  INITIAL_FINANCE,
  INITIAL_INSIGHTS,
  INITIAL_NEXT_ACTION,
} from './utils/initialData';
import {
  TaskItem,
  HabitItem,
  HealthState,
  FinancialState,
  FinancialItem,
  AiInsight,
  NextBestAction,
  LifeBalanceIndex,
  UserProfile,
} from './types';
import { Header } from './components/Header';
import { NextBestActionCard } from './components/NextBestActionCard';
import { LifeBalanceOverview } from './components/LifeBalanceOverview';
import { WorkSchoolHub } from './components/WorkSchoolHub';
import { HealthGuardian } from './components/HealthGuardian';
import { FinancialTracker } from './components/FinancialTracker';
import { HabitTracker } from './components/HabitTracker';
import { AnalyticsAndInsights } from './components/AnalyticsAndInsights';
import { AiCoachDrawer } from './components/AiCoachDrawer';
import { GoalDecomposeModal } from './components/GoalDecomposeModal';
import { OnboardingModal } from './components/OnboardingModal';
import { FirebaseRulesModal } from './components/FirebaseRulesModal';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  handleFirestoreError,
  OperationType,
  testConnection,
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  LayoutDashboard,
  GraduationCap,
  HeartPulse,
  Wallet,
  Flame,
  BarChart3,
  CheckCircle,
  Lock,
  Sparkles,
  Shield,
  LogIn,
  UserCheck,
} from 'lucide-react';

export default function App() {
  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Application Data States
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [health, setHealth] = useState<HealthState>(INITIAL_HEALTH);
  const [finances, setFinances] = useState<FinancialState>({
    currency: '₱',
    dailyBudget: 500,
    monthlySavingsTarget: 5000,
    currentSavings: 0,
    transactions: [],
  });
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [nextAction, setNextAction] = useState<NextBestAction>(INITIAL_NEXT_ACTION);

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<
    'overview' | 'work_school' | 'health' | 'finance' | 'habits' | 'analytics'
  >('overview');
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isDecomposerOpen, setIsDecomposerOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Focus Timer state
  const [focusTimerSeconds, setFocusTimerSeconds] = useState(25 * 60);
  const [isFocusRunning, setIsFocusRunning] = useState(false);
  const [activeFocusTaskTitle, setActiveFocusTaskTitle] = useState<string>('General Deep Work');

  // Flash notification helper
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Test Firestore connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // Fetch user profile from Firestore
        const userDocPath = `users/${user.uid}`;
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            if (data.currency || data.dailyBudget) {
              setFinances((f) => ({
                ...f,
                currency: data.currency || '₱',
                dailyBudget: data.dailyBudget || 500,
                monthlySavingsTarget: data.monthlySavingsTarget || 5000,
              }));
            }
          } else {
            setUserProfile(null);
          }
        } catch (err) {
          console.error('Failed to load user document:', err);
          handleFirestoreError(err, OperationType.GET, userDocPath);
        }
      } else {
        setUserProfile(null);
        setTasks([]);
        setHabits([]);
        setFinances({
          currency: '₱',
          dailyBudget: 500,
          monthlySavingsTarget: 5000,
          currentSavings: 0,
          transactions: [],
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Subscriptions when user is onboarded
  useEffect(() => {
    if (!currentUser || !userProfile?.onboardingCompleted) return;

    const uid = currentUser.uid;

    // 1. Tasks listener
    const tasksColRef = collection(db, 'users', uid, 'tasks');
    const unsubTasks = onSnapshot(
      tasksColRef,
      (snapshot) => {
        const loadedTasks: TaskItem[] = [];
        snapshot.forEach((d) => {
          loadedTasks.push({ id: d.id, ...d.data() } as TaskItem);
        });
        setTasks(loadedTasks);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/tasks`)
    );

    // 2. Habits listener
    const habitsColRef = collection(db, 'users', uid, 'habits');
    const unsubHabits = onSnapshot(
      habitsColRef,
      (snapshot) => {
        const loadedHabits: HabitItem[] = [];
        snapshot.forEach((d) => {
          loadedHabits.push({ id: d.id, ...d.data() } as HabitItem);
        });
        setHabits(loadedHabits);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/habits`)
    );

    // 3. Transactions listener
    const transColRef = collection(db, 'users', uid, 'transactions');
    const unsubTrans = onSnapshot(
      transColRef,
      (snapshot) => {
        const loadedTrans: FinancialItem[] = [];
        let savingsTotal = 0;
        snapshot.forEach((d) => {
          const item = { id: d.id, ...d.data() } as FinancialItem;
          loadedTrans.push(item);
          if (item.type === 'savings') savingsTotal += item.amount;
        });
        setFinances((f) => ({
          ...f,
          transactions: loadedTrans,
          currentSavings: savingsTotal,
        }));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/transactions`)
    );

    // 4. Health log listener
    const healthDocRef = doc(db, 'users', uid, 'health', '2026-09-05');
    const unsubHealth = onSnapshot(
      healthDocRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setHealth((h) => ({
            ...h,
            screenTimeMinutes: d.screenTimeMinutes ?? h.screenTimeMinutes,
            continuousWorkMinutes: d.continuousWorkMinutes ?? h.continuousWorkMinutes,
            waterGlasses: d.waterGlasses ?? h.waterGlasses,
            sleepHours: d.sleepHours ?? h.sleepHours,
            breaksTakenToday: d.breaksTakenToday ?? h.breaksTakenToday,
          }));
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/health/2026-09-05`)
    );

    return () => {
      unsubTasks();
      unsubHabits();
      unsubTrans();
      unsubHealth();
    };
  }, [currentUser, userProfile?.onboardingCompleted]);

  // Focus Sprint Clock
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFocusRunning && focusTimerSeconds > 0) {
      interval = setInterval(() => {
        setFocusTimerSeconds((prev) => prev - 1);

        if (focusTimerSeconds % 60 === 0) {
          setHealth((h) => {
            const nextScreen = h.screenTimeMinutes + 1;
            const nextContinuous = h.continuousWorkMinutes + 1;

            if (currentUser && userProfile?.onboardingCompleted) {
              setDoc(
                doc(db, 'users', currentUser.uid, 'health', '2026-09-05'),
                {
                  userId: currentUser.uid,
                  date: '2026-09-05',
                  screenTimeMinutes: nextScreen,
                  continuousWorkMinutes: nextContinuous,
                },
                { merge: true }
              ).catch((e) => console.error(e));
            }

            return {
              ...h,
              screenTimeMinutes: nextScreen,
              continuousWorkMinutes: nextContinuous,
            };
          });
        }
      }, 1000);
    } else if (isFocusRunning && focusTimerSeconds === 0) {
      setIsFocusRunning(false);
      setNotification('🎉 Focus Sprint Completed! Take a 5-minute restorative walk.');
    }
    return () => clearInterval(interval);
  }, [isFocusRunning, focusTimerSeconds, currentUser, userProfile?.onboardingCompleted]);

  // Dynamic Life Balance Score Computation
  const balanceIndex: LifeBalanceIndex = useMemo(() => {
    const totalT = tasks.length || 1;
    const completedT = tasks.filter((t) => t.completed).length;
    const workScore = tasks.length === 0 ? 80 : Math.round((completedT / totalT) * 100);

    const totalH = habits.length || 1;
    const completedH = habits.filter((h) => h.completedToday).length;
    const habitScore = habits.length === 0 ? 75 : Math.round((completedH / totalH) * 100);

    const screenPenalty = health.continuousWorkMinutes > 75 ? 20 : health.continuousWorkMinutes > 60 ? 10 : 0;
    const waterBonus = Math.min(20, (health.waterGlasses / (health.targetWaterGlasses || 8)) * 20);
    const sleepBonus = health.sleepHours >= 7 ? 20 : 10;
    const healthScore = Math.max(25, Math.min(100, Math.round(55 + waterBonus + sleepBonus - screenPenalty)));

    const todayExpenses = finances.transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const budgetUsageRatio = todayExpenses / (finances.dailyBudget || 1);
    const financeScore = budgetUsageRatio <= 0.8 ? 95 : budgetUsageRatio <= 1.0 ? 80 : 50;

    const overall = Math.round(workScore * 0.3 + healthScore * 0.25 + habitScore * 0.25 + financeScore * 0.2);

    let summary = 'Harmonious pace across work, health, and finances.';
    if (health.continuousWorkMinutes >= 75) {
      summary = 'High screen fatigue detected. Optical reset and screen break recommended.';
    } else if (workScore > 70 && habitScore > 70) {
      summary = 'Exceptional discipline today. Remember to protect evening wind-down.';
    }

    const protectiveAdvice =
      health.continuousWorkMinutes >= 75
        ? 'You have been on screen for over 75m. Go walk outside. Your mind needs renewal.'
        : workScore >= 80
        ? 'You hit your key goals today. Give yourself permission to log off and rest.'
        : 'Stay locked into your current micro-sprint. Next break is earned shortly.';

    return {
      overallScore: overall,
      workSchoolScore: workScore,
      healthWellnessScore: healthScore,
      financialDisciplineScore: financeScore,
      habitConsistencyScore: habitScore,
      summary,
      protectiveAdvice,
    };
  }, [tasks, habits, health, finances]);

  // Auth Operations
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Signed in successfully.');
    } catch (err: any) {
      console.error(err);
      showToast('Sign-in cancelled or failed: ' + (err.message || ''));
    }
  };

  const handleGuestSignIn = async () => {
    try {
      await signInAnonymously(auth);
      showToast('Started guest session.');
    } catch (err: any) {
      console.error(err);
      showToast('Guest sign-in failed: ' + (err.message || ''));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out.');
    } catch (err) {
      console.error(err);
    }
  };

  // Onboarding Submission (Unlocks the app!)
  const handleOnboardingSubmit = async (info: {
    name: string;
    role: 'student' | 'professional' | 'freelancer' | 'other';
    dailyWorkTargetMinutes: number;
    dailyBudget: number;
    monthlySavingsTarget: number;
    currency: string;
    wakeTime: string;
    bedTime: string;
    primaryGoal: string;
  }) => {
    if (!currentUser) return;

    const profileData: UserProfile = {
      userId: currentUser.uid,
      name: info.name,
      role: info.role,
      dailyWorkTargetMinutes: info.dailyWorkTargetMinutes,
      dailyBudget: info.dailyBudget,
      monthlySavingsTarget: info.monthlySavingsTarget,
      currency: info.currency,
      wakeTime: info.wakeTime,
      bedTime: info.bedTime,
      primaryGoal: info.primaryGoal,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };

    const path = `users/${currentUser.uid}`;
    try {
      await setDoc(doc(db, 'users', currentUser.uid), profileData);
      setUserProfile(profileData);
      setFinances((f) => ({
        ...f,
        currency: info.currency,
        dailyBudget: info.dailyBudget,
        monthlySavingsTarget: info.monthlySavingsTarget,
      }));

      // Create foundational anchor habit based on user profile
      const habitId = `h-${Date.now()}`;
      await setDoc(doc(db, 'users', currentUser.uid, 'habits', habitId), {
        userId: currentUser.uid,
        title: info.role === 'student' ? 'Daily Review & Problem Solving' : 'Morning Focus & Deep Work Block',
        category: info.role === 'student' ? 'school' : 'work',
        timeOfDay: 'morning',
        streak: 1,
        bestStreak: 1,
        completedToday: false,
        targetPerWeek: 7,
      });

      // Create primary goal task
      const taskId = `task-${Date.now()}`;
      await setDoc(doc(db, 'users', currentUser.uid, 'tasks', taskId), {
        userId: currentUser.uid,
        title: info.primaryGoal,
        category: info.role === 'student' ? 'school' : 'work',
        priority: 'high',
        tag: 'Primary Goal',
        estimatedMinutes: 60,
        completed: false,
        dueDate: '2026-09-05',
        createdAt: new Date().toISOString(),
      });

      showToast(`Welcome, ${info.name}! All Araw AI features are unlocked.`);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // AI Actions
  const handleRefreshNextAction = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/next-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          habits,
          health,
          timeOfDay: 'Morning / Focus block',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNextAction(data);
        showToast('Araw AI updated your Next Best Action.');
      }
    } catch (e) {
      console.error(e);
    }
  }, [tasks, habits, health]);

  const handleRefreshAiInsights = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          habits,
          health,
          finances,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.insights) setInsights(data.insights);
        showToast('Fresh AI Diagnostics recorded.');
      }
    } catch (e) {
      console.error(e);
    }
  }, [tasks, habits, health, finances]);

  // Firestore Tasks Operations
  const handleToggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextCompleted = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    );

    if (currentUser) {
      const path = `users/${currentUser.uid}/tasks/${id}`;
      try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'tasks', id), {
          completed: nextCompleted,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const handleAddTask = async (newTask: Omit<TaskItem, 'id'>) => {
    const taskId = `task-${Date.now()}`;
    const item: TaskItem = {
      ...newTask,
      id: taskId,
    };
    setTasks((prev) => [item, ...prev]);
    showToast(`Added: ${item.title}`);

    if (currentUser) {
      const path = `users/${currentUser.uid}/tasks/${taskId}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'tasks', taskId), {
          userId: currentUser.uid,
          title: item.title,
          category: item.category,
          priority: item.priority || 'medium',
          tag: item.tag || 'General',
          estimatedMinutes: item.estimatedMinutes || 30,
          completed: false,
          dueDate: item.dueDate || '2026-09-05',
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (currentUser) {
      const path = `users/${currentUser.uid}/tasks/${id}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'tasks', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks?.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subtasks };
      })
    );
  };

  const handleDecomposeTaskWithAi = async (taskId: string, title: string, category: string) => {
    try {
      const res = await fetch('/api/ai/decompose-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalTitle: title, category, totalMinutes: 60 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subtasks) {
          const formatted = data.subtasks.map((st: any, idx: number) => ({
            id: `st-${taskId}-${idx}`,
            title: `${st.title} (${st.estimatedMinutes}m)`,
            completed: false,
          }));
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, subtasks: formatted } : t))
          );
          showToast(`Deconstructed "${title}" into ${formatted.length} actionable steps.`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Firestore Habits Operations
  const handleToggleHabit = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    const nextDone = !habit.completedToday;
    const newStreak = nextDone ? habit.streak + 1 : Math.max(0, habit.streak - 1);

    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, completedToday: nextDone, streak: newStreak } : h
      )
    );

    if (currentUser) {
      const path = `users/${currentUser.uid}/habits/${id}`;
      try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'habits', id), {
          completedToday: nextDone,
          streak: newStreak,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const handleAddHabit = async (newHabit: any) => {
    const habitId = `h-${Date.now()}`;
    const item: HabitItem = {
      ...newHabit,
      id: habitId,
      streak: 1,
      bestStreak: 1,
      completedToday: false,
      history: {},
    };
    setHabits((prev) => [...prev, item]);
    showToast(`Locked in habit: ${item.title}`);

    if (currentUser) {
      const path = `users/${currentUser.uid}/habits/${habitId}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'habits', habitId), {
          userId: currentUser.uid,
          title: item.title,
          category: item.category,
          timeOfDay: item.timeOfDay,
          streak: 1,
          bestStreak: 1,
          completedToday: false,
          targetPerWeek: item.targetPerWeek || 7,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const handleDeleteHabit = async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    if (currentUser) {
      const path = `users/${currentUser.uid}/habits/${id}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'habits', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  // Firestore Health Operations
  const handleUpdateHealth = async (updates: Partial<HealthState>) => {
    setHealth((prev) => {
      const updated = { ...prev, ...updates };
      if (currentUser) {
        setDoc(
          doc(db, 'users', currentUser.uid, 'health', '2026-09-05'),
          {
            userId: currentUser.uid,
            date: '2026-09-05',
            screenTimeMinutes: updated.screenTimeMinutes,
            continuousWorkMinutes: updated.continuousWorkMinutes,
            waterGlasses: updated.waterGlasses,
            sleepHours: updated.sleepHours,
            breaksTakenToday: updated.breaksTakenToday,
          },
          { merge: true }
        ).catch((e) => console.error(e));
      }
      return updated;
    });
  };

  const handleTakeScreenBreak = () => {
    handleUpdateHealth({
      continuousWorkMinutes: 0,
      breaksTakenToday: health.breaksTakenToday + 1,
      lastBreakTime: Date.now(),
    });
    showToast('Screen break recorded. Optical strain reset!');
  };

  // Firestore Financial Operations
  const handleAddTransaction = async (newTr: any) => {
    const trId = `tr-${Date.now()}`;
    const item: FinancialItem = {
      ...newTr,
      id: trId,
      date: '2026-09-05',
    };

    setFinances((prev) => ({
      ...prev,
      transactions: [item, ...prev.transactions],
      currentSavings:
        newTr.type === 'savings' ? prev.currentSavings + newTr.amount : prev.currentSavings,
    }));
    showToast(`Logged ${item.type}: ${finances.currency}${item.amount}`);

    if (currentUser) {
      const path = `users/${currentUser.uid}/transactions/${trId}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'transactions', trId), {
          userId: currentUser.uid,
          amount: item.amount,
          type: item.type,
          category: item.category,
          note: item.note || '',
          date: '2026-09-05',
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setFinances((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));

    if (currentUser) {
      const path = `users/${currentUser.uid}/transactions/${id}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const handleUpdateBudget = async (dailyBudget: number, monthlySavingsTarget: number) => {
    setFinances((prev) => ({ ...prev, dailyBudget, monthlySavingsTarget }));
    showToast('Updated financial guardrails.');

    if (currentUser) {
      const path = `users/${currentUser.uid}`;
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          dailyBudget,
          monthlySavingsTarget,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const handleChangeCurrency = async (currency: string) => {
    setFinances((prev) => ({ ...prev, currency }));
    if (currentUser) {
      const path = `users/${currentUser.uid}`;
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { currency });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  // Focus Timer controls
  const handleStartFocus = (taskTitle: string, minutes: number) => {
    setActiveFocusTaskTitle(taskTitle);
    setFocusTimerSeconds(minutes * 60);
    setIsFocusRunning(true);
    showToast(`Initiated ${minutes}-minute sprint: ${taskTitle}`);
  };

  const handlePauseFocus = () => {
    setIsFocusRunning(false);
  };

  const handleResetFocus = () => {
    setIsFocusRunning(false);
    setFocusTimerSeconds(25 * 60);
  };

  // Preset Switcher (allowed for exploration)
  const handleSelectPreset = (preset: 'student' | 'freelancer' | 'professional') => {
    if (preset === 'student') {
      setTasks([
        {
          id: 't-s1',
          title: 'Calculus III Problem Set 4 (Multivariate)',
          category: 'school',
          tag: 'Math 302',
          priority: 'urgent',
          dueDate: '2026-09-05',
          estimatedMinutes: 60,
          completed: false,
          subtasks: [
            { id: 'st-1', title: 'Solve questions 1-5', completed: true },
            { id: 'st-2', title: 'Type solutions in LaTeX', completed: false },
          ],
        },
        {
          id: 't-s2',
          title: 'Organic Chemistry Lab Synthesis Report',
          category: 'school',
          tag: 'Chem 220',
          priority: 'high',
          dueDate: '2026-09-06',
          estimatedMinutes: 45,
          completed: false,
        },
      ]);
      setFinances((prev) => ({
        ...prev,
        currency: '₱',
        dailyBudget: 450,
        monthlySavingsTarget: 4000,
        currentSavings: 2800,
      }));
      setHealth((prev) => ({
        ...prev,
        screenTimeMinutes: 160,
        continuousWorkMinutes: 80,
        waterGlasses: 4,
        sleepHours: 6.5,
      }));
      showToast('Loaded University Student Preset.');
    } else if (preset === 'freelancer') {
      setTasks([
        {
          id: 't-f1',
          title: 'Deliver Cloud Run Microservice API Specs',
          category: 'work',
          tag: 'Client Alpha',
          priority: 'urgent',
          dueDate: '2026-09-05',
          estimatedMinutes: 50,
          completed: false,
        },
        {
          id: 't-f2',
          title: 'Send Invoice #1084 & Contract Milestone',
          category: 'work',
          tag: 'Client Beta',
          priority: 'high',
          dueDate: '2026-09-05',
          estimatedMinutes: 15,
          completed: true,
        },
      ]);
      setFinances((prev) => ({
        ...prev,
        currency: '$',
        dailyBudget: 45,
        monthlySavingsTarget: 1500,
        currentSavings: 1100,
      }));
      setHealth((prev) => ({
        ...prev,
        screenTimeMinutes: 220,
        continuousWorkMinutes: 95,
        waterGlasses: 6,
        sleepHours: 7.5,
      }));
      showToast('Loaded Freelance Developer Preset.');
    } else {
      setTasks(INITIAL_TASKS);
      setFinances(INITIAL_FINANCE);
      setHealth(INITIAL_HEALTH);
      setHabits(INITIAL_HABITS);
      showToast('Loaded Working Professional Preset.');
    }
  };

  const handleResetData = () => {
    setTasks([]);
    setHabits([]);
    setFinances({
      currency: userProfile?.currency || '₱',
      dailyBudget: userProfile?.dailyBudget || 500,
      monthlySavingsTarget: userProfile?.monthlySavingsTarget || 5000,
      currentSavings: 0,
      transactions: [],
    });
    showToast('Cleaned records. Ready for your actual daily tracking.');
  };

  // Determine if main features are locked
  const isFeaturesLocked = !currentUser || !userProfile?.onboardingCompleted;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col selection:bg-amber-200">
      {/* Top Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold shadow-lg border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header with Firebase Auth & Rules triggers */}
      <Header
        balanceIndex={balanceIndex}
        onOpenCoach={() => setIsCoachOpen(true)}
        onOpenDecomposer={() => setIsDecomposerOpen(true)}
        onOpenRules={() => setShowRulesModal(true)}
        onSelectPreset={handleSelectPreset}
        onResetData={handleResetData}
        activeFocusTaskTitle={activeFocusTaskTitle}
        focusTimerSeconds={focusTimerSeconds}
        isFocusRunning={isFocusRunning}
        userName={userProfile?.name}
        userEmail={currentUser?.email || (currentUser?.isAnonymous ? 'Guest User' : null)}
        isAuthenticated={!!currentUser}
        onSignIn={handleGoogleSignIn}
        onTryGuest={handleGuestSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* If user is not authenticated or hasn't filled info: Locked Gate Banner */}
        {isFeaturesLocked ? (
          <div className="rounded-3xl bg-white border border-stone-200 p-8 sm:p-12 text-center shadow-xs space-y-6 max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto shadow-2xs">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Connected to arawai-5bf06</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                Sign In to Unlock Araw AI Daily OS
              </h2>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                As configured, the main screen features unlock once you fill in what the system needs to know (your role, work targets, sleep rhythm, and financial limits). No mock examples—this is your real, private daily operating system.
              </p>
            </div>

            {/* Auth Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleGoogleSignIn}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>

              <button
                onClick={handleGuestSignIn}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Try Instant Guest Mode</span>
              </button>

              <button
                onClick={() => setShowRulesModal(true)}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Shield className="w-4 h-4 text-stone-500" />
                <span>View Firebase Rules</span>
              </button>
            </div>

            <div className="text-[11px] text-stone-500 pt-4 border-t border-stone-100 flex items-center justify-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Strict Firestore zero-trust security rules active. Your data belongs to you.</span>
            </div>
          </div>
        ) : (
          /* UNLOCKED MAIN SCREEN FEATURES */
          <>
            {/* Hero: Next Best Action Card (Proposal core promise) */}
            <NextBestActionCard
              action={nextAction}
              health={health}
              onRefreshAction={handleRefreshNextAction}
              onStartFocusSprint={(title, duration) => handleStartFocus(title, duration)}
              onMarkCompleted={() => {
                showToast(`Marked "${nextAction.title}" completed.`);
                handleRefreshNextAction();
              }}
              onTakeBreak={handleTakeScreenBreak}
              isFocusRunning={isFocusRunning}
            />

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-stone-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'overview'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Daily Pulse Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('work_school')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'work_school'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Work & School ({tasks.filter((t) => !t.completed).length})</span>
              </button>

              <button
                onClick={() => setActiveTab('health')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'health'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                <span>Health Guardian & Rest</span>
              </button>

              <button
                onClick={() => setActiveTab('finance')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'finance'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Financials ({finances.currency}{finances.dailyBudget})</span>
              </button>

              <button
                onClick={() => setActiveTab('habits')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'habits'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Habits & Streaks</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Real-time Analytics & AI Insights</span>
              </button>
            </div>

            {/* Tab Content Display */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <LifeBalanceOverview
                  balanceIndex={balanceIndex}
                  tasks={tasks}
                  habits={habits}
                  health={health}
                  finances={finances}
                  onNavigateTab={(tab) => setActiveTab(tab as any)}
                />

                {/* Quick Glimpse: Top Tasks & Active Habits */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Pending Work & School */}
                  <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span>Immediate Work & Academic Priorities</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('work_school')}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        View Hub →
                      </button>
                    </div>
                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <p className="text-xs text-stone-500 py-3 text-center border border-dashed border-stone-200 rounded-xl">
                          No tasks recorded yet. Click "Work & School" to add your first assignment!
                        </p>
                      ) : (
                        tasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className="p-3 rounded-xl border border-stone-100 hover:bg-stone-50 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleToggleTask(task.id)}
                                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                              />
                              <span
                                className={`font-semibold ${
                                  task.completed ? 'line-through text-stone-400' : 'text-stone-900'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500 font-medium">{task.tag}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: Daily Habit Anchor */}
                  <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>Today's Habit Discipline</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('habits')}
                        className="text-xs font-semibold text-purple-600 hover:underline"
                      >
                        View All Streaks →
                      </button>
                    </div>
                    <div className="space-y-2">
                      {habits.length === 0 ? (
                        <p className="text-xs text-stone-500 py-3 text-center border border-dashed border-stone-200 rounded-xl">
                          No habits configured yet. Go to "Habits & Streaks" to set up atomic habits.
                        </p>
                      ) : (
                        habits.slice(0, 3).map((habit) => (
                          <div
                            key={habit.id}
                            className="p-3 rounded-xl border border-stone-100 hover:bg-stone-50 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={habit.completedToday}
                                onChange={() => handleToggleHabit(habit.id)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <span
                                className={`font-semibold ${
                                  habit.completedToday ? 'text-stone-500' : 'text-stone-900'
                                }`}
                              >
                                {habit.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                              🔥 {habit.streak}d
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'work_school' && (
              <WorkSchoolHub
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onToggleSubtask={handleToggleSubtask}
                onDecomposeTaskWithAi={handleDecomposeTaskWithAi}
                focusTimerSeconds={focusTimerSeconds}
                isFocusRunning={isFocusRunning}
                activeFocusTaskTitle={activeFocusTaskTitle}
                onStartFocus={handleStartFocus}
                onPauseFocus={handlePauseFocus}
                onResetFocus={handleResetFocus}
              />
            )}

            {activeTab === 'health' && (
              <HealthGuardian
                health={health}
                onUpdateHealth={handleUpdateHealth}
                onTakeScreenBreak={handleTakeScreenBreak}
              />
            )}

            {activeTab === 'finance' && (
              <FinancialTracker
                finances={finances}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onUpdateBudget={handleUpdateBudget}
                onChangeCurrency={handleChangeCurrency}
              />
            )}

            {activeTab === 'habits' && (
              <HabitTracker
                habits={habits}
                onToggleHabit={handleToggleHabit}
                onAddHabit={handleAddHabit}
                onDeleteHabit={handleDeleteHabit}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsAndInsights
                insights={insights}
                balanceIndex={balanceIndex}
                tasks={tasks}
                habits={habits}
                health={health}
                finances={finances}
                onRefreshAiInsights={handleRefreshAiInsights}
                onActOnInsight={(id) => {
                  setInsights((prev) =>
                    prev.map((ins) => (ins.id === id ? { ...ins, actedUpon: true } : ins))
                  );
                  showToast('Insight applied to today’s schedule.');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-stone-900">Araw AI</span> • Powered by Firebase Project{' '}
            <span className="font-mono font-semibold text-stone-800">arawai-5bf06</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-600">
            <button
              onClick={() => setShowRulesModal(true)}
              className="hover:text-stone-900 underline font-medium"
            >
              Firestore Security Rules
            </button>
            <span>•</span>
            <span>Work & School</span>
            <span>•</span>
            <span>Health & Rest</span>
            <span>•</span>
            <span>Financials</span>
          </div>
        </div>
      </footer>

      {/* Onboarding Modal (Required to unlock features) */}
      <OnboardingModal
        isOpen={!!currentUser && !userProfile?.onboardingCompleted}
        userEmail={currentUser?.email}
        onSubmit={handleOnboardingSubmit}
        onSignOut={handleSignOut}
      />

      {/* Firebase Rules Modal */}
      <FirebaseRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* 24/7 AI Coach Drawer */}
      <AiCoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        userContext={{
          userName: userProfile?.name,
          role: userProfile?.role,
          tasksCount: tasks.length,
          pendingTasksCount: tasks.filter((t) => !t.completed).length,
          habitsCount: habits.length,
          completedHabitsToday: habits.filter((h) => h.completedToday).length,
          screenTimeMinutes: health.screenTimeMinutes,
          continuousWorkMinutes: health.continuousWorkMinutes,
          waterGlasses: health.waterGlasses,
          sleepHours: health.sleepHours,
          dailyBudget: finances.dailyBudget,
          currency: finances.currency,
          balanceScore: balanceIndex.overallScore,
        }}
      />

      {/* Goal Decompose Modal */}
      <GoalDecomposeModal
        isOpen={isDecomposerOpen}
        onClose={() => setIsDecomposerOpen(false)}
        onAddSubtasksAsTasks={(subtasks) => {
          subtasks.forEach((st) => handleAddTask(st));
        }}
      />
    </div>
  );
}
