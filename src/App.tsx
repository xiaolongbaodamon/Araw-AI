/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  INITIAL_HEALTH,
  INITIAL_NEXT_ACTION,
} from './utils/initialData';
import {
  TaskItem,
  HealthState,
  FinancialState,
  FinancialItem,
  AiInsight,
  NextBestAction,
  LifeBalanceIndex,
  UserProfile,
  SchoolSubject,
} from './types';
import { Header } from './components/Header';
import { NextBestActionCard } from './components/NextBestActionCard';
import { LifeBalanceOverview } from './components/LifeBalanceOverview';
import { WorkSchoolHub } from './components/WorkSchoolHub';
import { HealthGuardian } from './components/HealthGuardian';
import { FinancialTracker } from './components/FinancialTracker';
import { AnalyticsAndInsights } from './components/AnalyticsAndInsights';
import { SystemDetectionBanner } from './components/SystemDetectionBanner';
import { calculateSystemDetectionsAndRecommendations } from './services/recommendationEngine';
import { AiCoachDrawer } from './components/AiCoachDrawer';
import { GoalDecomposeModal } from './components/GoalDecomposeModal';
import { OnboardingModal } from './components/OnboardingModal';
import { FirebaseRulesModal } from './components/FirebaseRulesModal';
import { AuthScreen } from './components/AuthScreen';
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
  getDocs,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  waitForPendingWrites,
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
  ShieldCheck,
  ArrowRight,
  Sun,
} from 'lucide-react';

export default function App() {
  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Application Data States
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [health, setHealth] = useState<HealthState>({
    screenTimeMinutes: 0,
    continuousWorkMinutes: 0,
    sleepHours: 0,
    waterGlasses: 0,
    targetWaterGlasses: 8,
    energyLevel: 3,
    lastBreakTime: Date.now(),
    breaksTakenToday: 0,
    activeTimerRunning: false,
    activeTimerSeconds: 0,
  });
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
    'overview' | 'work_school' | 'health' | 'finance' | 'analytics'
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
            setInsights((data as UserProfile & { latestInsights?: AiInsight[] }).latestInsights || []);
            const savedNextAction = (data as UserProfile & { latestNextAction?: NextBestAction }).latestNextAction;
            if (savedNextAction) setNextAction(savedNextAction);
            if (data.currency || data.dailyBudget) {
              setFinances((f) => ({
                ...f,
                currency: data.currency || '₱',
                dailyBudget: data.dailyBudget || 500,
                monthlySavingsTarget: data.monthlySavingsTarget || 5000,
                weeklyBudget: data.weeklyBudget || (data.dailyBudget || 500) * 7,
                monthlyBudget: data.monthlyBudget || (data.dailyBudget || 500) * 30,
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
        setInsights([]);
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

    // 2. Transactions listener
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

    // 3. Health log listener
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
    const totalT = tasks.length;
    const completedT = tasks.filter((t) => t.completed).length;
    const workScore = totalT === 0 ? 50 : Math.round((completedT / totalT) * 100);

    const screenPenalty = health.continuousWorkMinutes > 75 ? 20 : health.continuousWorkMinutes > 60 ? 10 : 0;
    const waterBonus = Math.min(20, (health.waterGlasses / (health.targetWaterGlasses || 8)) * 20);
    const sleepBonus = health.sleepHours >= 7 ? 15 : health.sleepHours > 0 ? 5 : 0;
    const healthScore = Math.max(25, Math.min(100, Math.round(50 + waterBonus + sleepBonus - screenPenalty)));

    const todayExpenses = finances.transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const budgetUsageRatio = todayExpenses / (finances.dailyBudget || 1);
    const financeScore = todayExpenses === 0
      ? 50
      : budgetUsageRatio <= 0.8 ? 80 : budgetUsageRatio <= 1.0 ? 65 : 35;

    const overall = Math.round(workScore * 0.4 + healthScore * 0.35 + financeScore * 0.25);

    let summary = 'Harmonious pace across work, health, and finances.';
    if (health.continuousWorkMinutes >= 75) {
      summary = 'High screen fatigue detected. Optical reset and screen break recommended.';
    } else if (workScore > 70 || healthScore > 70 || financeScore > 70) {
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
      summary,
      protectiveAdvice,
    };
  }, [tasks, health, finances]);

  // Live Cross-Pillar System Telemetry & Recommendation Engine
  const systemDetection = useMemo(() => {
    return calculateSystemDetectionsAndRecommendations(tasks, health, finances, userProfile);
  }, [tasks, health, finances, userProfile]);

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
      await waitForPendingWrites(db);
      await signOut(auth);
      showToast('Signed out.');
    } catch (err) {
      console.error(err);
    }
  };

  const clearLegacyWorkspaceData = async (uid: string) => {
    try {
      const taskRef = collection(db, 'users', uid, 'tasks');
      const tasksSnapshot = await getDocs(taskRef);

      await Promise.all(
        tasksSnapshot.docs.map((docSnap) => deleteDoc(doc(db, 'users', uid, 'tasks', docSnap.id)))
      );
    } catch (err) {
      console.error('Failed to clear legacy workspace data:', err);
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
    subjects: SchoolSubject[];
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
      subjects: info.subjects,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };

    const path = `users/${currentUser.uid}`;
    try {
      await clearLegacyWorkspaceData(currentUser.uid);
      await setDoc(doc(db, 'users', currentUser.uid), profileData);
      setUserProfile(profileData);
      setFinances({
        currency: info.currency,
        dailyBudget: info.dailyBudget,
        weeklyBudget: info.dailyBudget * 7,
        monthlyBudget: info.dailyBudget * 30,
        monthlySavingsTarget: info.monthlySavingsTarget,
        currentSavings: 0,
        transactions: [],
      });
      setTasks([]);
      setHealth({
        screenTimeMinutes: 0,
        continuousWorkMinutes: 0,
        sleepHours: Math.max(6, Math.min(9, 10 - Number((Number(info.wakeTime.split(':')[0]) - Number(info.bedTime.split(':')[0])).toFixed(1)))),
        waterGlasses: 0,
        targetWaterGlasses: 8,
        energyLevel: 3,
        lastBreakTime: Date.now(),
        breaksTakenToday: 0,
        activeTimerRunning: false,
        activeTimerSeconds: 0,
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
          health,
          subjects: userProfile?.subjects || [],
          timeOfDay: 'Morning / Focus block',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNextAction(data);
        if (currentUser) {
          await setDoc(
            doc(db, 'users', currentUser.uid),
            { latestNextAction: data },
            { merge: true }
          );
        }
        showToast('Araw AI updated your Next Best Action.');
      }
    } catch (e) {
      console.error(e);
    }
  }, [tasks, health, userProfile?.subjects]);

  const handleRefreshAiInsights = useCallback(async (taskOverride?: TaskItem[]) => {
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: taskOverride || tasks,
          health,
          finances,
          userProfile,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.insights) {
          setInsights(data.insights);
          if (currentUser) {
            await setDoc(
              doc(db, 'users', currentUser.uid),
              { latestInsights: data.insights },
              { merge: true }
            );
          }
        }
        showToast('Fresh AI Diagnostics recorded.');
      }
    } catch (e) {
      console.error(e);
    }
  }, [tasks, health, finances, userProfile, currentUser]);

  const handleAssistantContextChange = async (message: string) => {
    const normalizedMessage = message.toLowerCase();
    const matchingTask = tasks.find((task) => {
      const title = task.title.toLowerCase();
      return normalizedMessage.includes('complete') || normalizedMessage.includes('finished')
        ? normalizedMessage.includes(title)
        : false;
    });

    let updatedTasks = tasks;
    if (matchingTask && !matchingTask.completed) {
      await handleToggleTask(matchingTask.id);
      updatedTasks = tasks.map((task) => task.id === matchingTask.id ? { ...task, completed: true } : task);
    }

    await handleRefreshAiInsights(updatedTasks);
  };

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
      taskType: newTask.taskType || (newTask.category === 'school' ? 'assignment' : 'work_task'),
      dueTime: newTask.dueTime || '23:59',
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
          subject: item.subject,
          taskType: item.taskType,
          priority: item.priority || 'medium',
          tag: item.tag || 'General',
          estimatedMinutes: item.estimatedMinutes || 30,
          completed: false,
          dueDate: item.dueDate || '2026-09-05',
          dueTime: item.dueTime,
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

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const subtasks = task.subtasks?.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
    );
    setTasks((prev) => prev.map((item) => item.id === taskId ? { ...item, subtasks } : item));

    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid, 'tasks', taskId), { subtasks });
    }
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
          if (currentUser) {
            await updateDoc(doc(db, 'users', currentUser.uid, 'tasks', taskId), { subtasks: formatted });
          }
          showToast(`Deconstructed "${title}" into ${formatted.length} actionable steps.`);
        }
      }
    } catch (e) {
      console.error(e);
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
            sleepQuality: updated.sleepQuality || 'good',
            bedTime: updated.bedTime || '23:00',
            wakeTime: updated.wakeTime || '06:30',
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
      date: newTr.date || '2026-09-05',
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
          date: item.date || '2026-09-05',
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

  const handleUpdateBudget = async (
    dailyBudget: number,
    monthlySavingsTarget: number,
    weeklyBudget?: number,
    monthlyBudget?: number
  ) => {
    const wb = weeklyBudget || dailyBudget * 7;
    const mb = monthlyBudget || wb * 4;
    setFinances((prev) => ({
      ...prev,
      dailyBudget,
      monthlySavingsTarget,
      weeklyBudget: wb,
      monthlyBudget: mb,
    }));
    showToast('Updated daily, weekly, and monthly financial guardrails.');

    if (currentUser) {
      const path = `users/${currentUser.uid}`;
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          dailyBudget,
          monthlySavingsTarget,
          weeklyBudget: wb,
          monthlyBudget: mb,
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

  const handleResetData = async () => {
    if (!currentUser) return;

    const uid = currentUser.uid;
    const resetCollections = ['tasks', 'transactions'];
    try {
      await Promise.all(resetCollections.map(async (collectionName) => {
        const snapshot = await getDocs(collection(db, 'users', uid, collectionName));
        await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
      }));

      await deleteDoc(doc(db, 'users', uid, 'health', '2026-09-05'));
    } catch (err) {
      console.error('Failed to reset workspace records:', err);
      showToast('Workspace reset failed. Please try again.');
      return;
    }

    setTasks([]);
    setFinances({
      currency: userProfile?.currency || '₱',
      dailyBudget: userProfile?.dailyBudget || 0,
      weeklyBudget: (userProfile?.dailyBudget || 0) * 7,
      monthlyBudget: (userProfile?.dailyBudget || 0) * 30,
      monthlySavingsTarget: userProfile?.monthlySavingsTarget || 0,
      currentSavings: 0,
      transactions: [],
    });
    setHealth({
      screenTimeMinutes: 0,
      continuousWorkMinutes: 0,
      sleepHours: 0,
      waterGlasses: 0,
      targetWaterGlasses: 8,
      energyLevel: 3,
      lastBreakTime: Date.now(),
      breaksTakenToday: 0,
      activeTimerRunning: false,
      activeTimerSeconds: 0,
    });
    setInsights([]);
    setNextAction(INITIAL_NEXT_ACTION);
    setIsFocusRunning(false);
    setFocusTimerSeconds(25 * 60);
    await setDoc(
      doc(db, 'users', uid),
      { latestInsights: [], latestNextAction: INITIAL_NEXT_ACTION },
      { merge: true }
    );
    showToast('Workspace reset. Your profile is preserved and your balance starts at 50.');
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

      {/* Header with Firebase Auth */}
      <Header
        balanceIndex={balanceIndex}
        onOpenCoach={() => setIsCoachOpen(true)}
        onOpenDecomposer={() => setIsDecomposerOpen(true)}
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
        {/* State 1: Unauthenticated -> High-End Modern Auth Screen */}
        {!currentUser ? (
          <AuthScreen
            onSuccess={() => {
              showToast('Authentication successful. Welcome to Araw AI!');
            }}
          />
        ) : !userProfile?.onboardingCompleted ? (
          /* State 2: Authenticated but Parameters Needed -> Clean Setup Prompt */
          <div className="rounded-3xl bg-white border border-stone-200 p-8 sm:p-12 text-center shadow-lg space-y-6 max-w-xl mx-auto my-12 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto shadow-md">
              <Sun className="w-8 h-8 text-amber-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                Welcome to Araw
              </h2>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                Configure your daily schedule and preferences to get started.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setUserProfile(null);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Complete Setup</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={handleSignOut}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* State 3: UNLOCKED MAIN SCREEN FEATURES */
          <>
            {/* Hero: Next Best Action Card */}
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

            {/* LIVE CROSS-PILLAR DETECTION & RECOMMENDATION ENGINE */}
            <SystemDetectionBanner
              detectionData={systemDetection}
              recommendation={systemDetection}
              currency={finances.currency || '₱'}
              onSelectAction={(actionLabel) => {
                const lower = actionLabel.toLowerCase();
                if (lower.includes('sprint') || lower.includes('timer')) {
                  handleStartFocus('Priority Sprint', 25);
                } else if (lower.includes('break') || lower.includes('water') || lower.includes('stretch')) {
                  handleTakeScreenBreak();
                } else if (lower.includes('expense') || lower.includes('budget') || lower.includes('savings')) {
                  setActiveTab('finance');
                } else if (lower.includes('sleep') || lower.includes('rest') || lower.includes('health')) {
                  setActiveTab('health');
                } else {
                  setActiveTab('work_school');
                }
              }}
              onExecuteRecommendation={(action) => {
                if (action.actionType === 'start_focus') {
                  handleStartFocus(action.targetTitle || 'Priority Task Sprint', 25);
                } else if (action.actionType === 'break') {
                  handleTakeScreenBreak();
                } else if (action.targetPillar) {
                  setActiveTab(action.targetPillar as any);
                } else if (action.pillar) {
                  const target = action.pillar === 'work_school' ? 'work_school' : action.pillar === 'health' ? 'health' : 'finance';
                  setActiveTab(target);
                }
              }}
            />

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-stone-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('work_school')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'work_school'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Tasks ({tasks.filter((t) => !t.completed).length})</span>
              </button>

              <button
                onClick={() => setActiveTab('health')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'health'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                <span>Health & Sleep</span>
              </button>

              <button
                onClick={() => setActiveTab('finance')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'finance'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Finances</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </div>

            {/* Tab Content Display */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <LifeBalanceOverview
                  balanceIndex={balanceIndex}
                  tasks={tasks}
                  health={health}
                  finances={finances}
                  onNavigateTab={(tab) => setActiveTab(tab as any)}
                />

                {/* Quick Glimpse: Top Tasks */}
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
                subjects={userProfile?.subjects || []}
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

            {activeTab === 'analytics' && (
              <AnalyticsAndInsights
                insights={insights}
                balanceIndex={balanceIndex}
                tasks={tasks}
                health={health}
                finances={finances}
                onRefreshAiInsights={handleRefreshAiInsights}
                onActOnInsight={(id) => {
                  const updatedInsights = insights.map((ins) => (ins.id === id ? { ...ins, actedUpon: true } : ins));
                  setInsights(updatedInsights);
                  if (currentUser) {
                    setDoc(doc(db, 'users', currentUser.uid), { latestInsights: updatedInsights }, { merge: true })
                      .catch((error) => console.error('Failed to persist insight action:', error));
                  }
                  showToast('Insight applied to today’s schedule.');
                }}
              />
            )}
          </>
        )}
      </main>

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
        onContextChange={handleAssistantContextChange}
        userContext={{
          userName: userProfile?.name,
          role: userProfile?.role,
          profile: userProfile,
          tasksCount: tasks.length,
          pendingTasksCount: tasks.filter((t) => !t.completed).length,
          screenTimeMinutes: health.screenTimeMinutes,
          continuousWorkMinutes: health.continuousWorkMinutes,
          waterGlasses: health.waterGlasses,
          sleepHours: health.sleepHours,
          dailyBudget: finances.dailyBudget,
          currency: finances.currency,
          balanceScore: balanceIndex.overallScore,
          subjects: userProfile?.subjects || [],
          pendingSchoolwork: tasks
            .filter((task) => task.category === 'school' && !task.completed)
            .map((task) => ({ title: task.title, subject: task.subject, dueDate: task.dueDate, dueTime: task.dueTime })),
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
