import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
});

// 2. Next Best Action endpoint
app.post('/api/ai/next-action', async (req: Request, res: Response) => {
  try {
    const { tasks, habits, health, timeOfDay } = req.body;

    if (ai) {
      const prompt = `You are Araw AI, an intelligent 24/7 Life OS coach designed to optimize time, productivity, and protect against burnout.
Given this user state:
- Time of Day: ${timeOfDay || 'Daytime'}
- Screen Time today: ${health?.screenTimeMinutes || 0} minutes
- Continuous focus time without a break: ${health?.continuousWorkMinutes || 0} minutes
- Energy Level (1-5): ${health?.energyLevel || 3}
- Pending Tasks: ${JSON.stringify(tasks?.filter((t: any) => !t.completed)?.slice(0, 6) || [])}
- Incomplete Habits: ${JSON.stringify(habits?.filter((h: any) => !h.completedToday)?.slice(0, 5) || [])}

Rule 1: If continuous work is >= 75 minutes or screen time is high and energy is low (<=2), the user's next action MUST be a wellness break or hydration/walk. As Araw AI says: "Our AI doesn't just push you to do more. It learns you and protects you."
Rule 2: Otherwise, pick the single highest leverage task or habit for this exact moment.

Return JSON adhering to schema:
{
  "title": "string (clear action verb)",
  "category": "work" | "school" | "health" | "finance" | "rest",
  "actionType": "deep_work" | "study_review" | "wellness_break" | "habit_trigger" | "financial_check",
  "estimatedMinutes": number,
  "reason": "string (1-2 sentences explaining why now)",
  "urgency": "urgent" | "optimal" | "rejuvenating"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              actionType: { type: Type.STRING },
              estimatedMinutes: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              urgency: { type: Type.STRING },
            },
            required: ['title', 'category', 'actionType', 'estimatedMinutes', 'reason', 'urgency'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return res.json(parsed);
      }
    }

    // Heuristic fallback
    const continuous = health?.continuousWorkMinutes || 0;
    if (continuous >= 75) {
      return res.json({
        title: '5-Minute Screen Detox & Eye Rest',
        category: 'rest',
        actionType: 'wellness_break',
        estimatedMinutes: 5,
        reason: `You have been working continuously for ${continuous} minutes. Step away from display, drink water, and recalibrate before deep focus.`,
        urgency: 'rejuvenating',
      });
    }

    const uncompletedTasks = (tasks || []).filter((t: any) => !t.completed);
    const urgentTask = uncompletedTasks.find((t: any) => t.priority === 'urgent') || uncompletedTasks[0];

    if (urgentTask) {
      return res.json({
        title: urgentTask.title,
        category: urgentTask.category || 'work',
        actionType: 'deep_work',
        estimatedMinutes: urgentTask.estimatedMinutes || 30,
        reason: `Highest priority active item (${urgentTask.tag || 'Work/School'}). Energy level allows for a concentrated sprint.`,
        urgency: 'urgent',
      });
    }

    return res.json({
      title: 'Review Habits & Log Expenses',
      category: 'health',
      actionType: 'habit_trigger',
      estimatedMinutes: 10,
      reason: 'All critical milestones for this block are clear. Use this buffer to check habits and recharge.',
      urgency: 'optimal',
    });
  } catch (error) {
    console.error('Next-action error:', error);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

// 3. Life Insights & Balance Index
app.post('/api/ai/insights', async (req: Request, res: Response) => {
  try {
    const { tasks, habits, health, finances } = req.body;

    if (ai) {
      const prompt = `You are Araw AI, analyzing a user's multi-pillar life data (Work, School, Health, Financials, Habits).
State:
- Tasks: ${tasks?.length || 0} total, ${tasks?.filter((t: any) => t.completed)?.length || 0} completed
- Habits: ${habits?.length || 0} total, ${habits?.filter((h: any) => h.completedToday)?.length || 0} completed today
- Health: Screen time ${health?.screenTimeMinutes || 0}m, Continuous work ${health?.continuousWorkMinutes || 0}m, Sleep ${health?.sleepHours || 0}h, Water ${health?.waterGlasses || 0} glasses
- Financials: Daily budget ${finances?.dailyBudget || 0}, Current expenses today ${finances?.transactions?.filter((tr: any) => tr.type === 'expense')?.reduce((acc: number, c: any) => acc + c.amount, 0) || 0}

Generate:
1. 3 highly personalized, actionable insights. Each must have:
   - pillar: 'work' | 'school' | 'health' | 'finance' | 'mindfulness' | 'balance'
   - type: 'burnout_shield' | 'productivity_surge' | 'discipline_coach' | 'financial_alert' | 'smart_scheduling'
   - title: concise punchy title
   - rationale: why this pattern was identified
   - actionableStep: exact behavioral instruction
   - urgency: 'high' | 'medium' | 'low'
2. A calculated Life Balance Index:
   - overallScore (0-100)
   - workSchoolScore (0-100)
   - healthWellnessScore (0-100)
   - financialDisciplineScore (0-100)
   - habitConsistencyScore (0-100)
   - summary (1 sentence overview)
   - protectiveAdvice (1 sentence guardian tip)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pillar: { type: Type.STRING },
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    actionableStep: { type: Type.STRING },
                    urgency: { type: Type.STRING },
                  },
                  required: ['pillar', 'type', 'title', 'rationale', 'actionableStep', 'urgency'],
                },
              },
              balanceIndex: {
                type: Type.OBJECT,
                properties: {
                  overallScore: { type: Type.NUMBER },
                  workSchoolScore: { type: Type.NUMBER },
                  healthWellnessScore: { type: Type.NUMBER },
                  financialDisciplineScore: { type: Type.NUMBER },
                  habitConsistencyScore: { type: Type.NUMBER },
                  summary: { type: Type.STRING },
                  protectiveAdvice: { type: Type.STRING },
                },
                required: [
                  'overallScore',
                  'workSchoolScore',
                  'healthWellnessScore',
                  'financialDisciplineScore',
                  'habitConsistencyScore',
                  'summary',
                  'protectiveAdvice',
                ],
              },
            },
            required: ['insights', 'balanceIndex'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        // Stamp IDs and timestamps onto insights
        parsed.insights = parsed.insights.map((item: any, idx: number) => ({
          ...item,
          id: `ai-ins-${Date.now()}-${idx}`,
          timestamp: 'Just now',
        }));
        return res.json(parsed);
      }
    }

    // Heuristic fallback
    const compTasks = (tasks || []).filter((t: any) => t.completed).length;
    const totalTasks = (tasks || []).length || 1;
    const taskScore = Math.round((compTasks / totalTasks) * 100);

    const compHabits = (habits || []).filter((h: any) => h.completedToday).length;
    const totalHabits = (habits || []).length || 1;
    const habitScore = Math.round((compHabits / totalHabits) * 100);

    const screenTime = health?.screenTimeMinutes || 120;
    const healthScore = Math.max(30, Math.min(95, Math.round(100 - (screenTime / 300) * 40 + (health?.waterGlasses || 4) * 5)));
    const financeScore = 84;
    const overall = Math.round((taskScore * 0.3) + (habitScore * 0.25) + (healthScore * 0.25) + (financeScore * 0.2));

    return res.json({
      insights: [
        {
          id: `ins-${Date.now()}-1`,
          timestamp: 'Just now',
          pillar: 'health',
          type: 'burnout_shield',
          title: screenTime > 120 ? 'Screen Exposure Over Threshold' : 'Good Optical Rhythm',
          rationale: `Logged ${screenTime}m of screen usage today. Continuous exposure increases blue-light strain and reduces evening melatonin.`,
          actionableStep: 'Schedule a 10-minute walk outside or look 20 feet away for 20 seconds.',
          urgency: screenTime > 150 ? 'high' : 'medium',
        },
        {
          id: `ins-${Date.now()}-2`,
          timestamp: 'Just now',
          pillar: 'work',
          type: 'productivity_surge',
          title: 'Deep Work Pacing Analysis',
          rationale: `${compTasks} of ${totalTasks} key obligations completed. Momentum is strong for completing the remaining high-impact work.`,
          actionableStep: 'Group similar administrative tasks into a single 25-minute power block.',
          urgency: 'medium',
        },
        {
          id: `ins-${Date.now()}-3`,
          timestamp: 'Just now',
          pillar: 'finance',
          type: 'financial_alert',
          title: 'Daily Budget Trajectory',
          rationale: 'Expenses are within the expected velocity threshold for this time of day.',
          actionableStep: 'Maintain discipline on impulse delivery or snack spending to preserve your savings buffer.',
          urgency: 'low',
        },
      ],
      balanceIndex: {
        overallScore: overall,
        workSchoolScore: taskScore,
        healthWellnessScore: healthScore,
        financialDisciplineScore: financeScore,
        habitConsistencyScore: habitScore,
        summary: overall >= 80 ? 'Harmonious pace across work, health, and finances.' : 'Good progress, but wellness needs active replenishment.',
        protectiveAdvice: health?.continuousWorkMinutes > 60 ? 'Close the screen for 5 minutes. True discipline includes scheduled recovery.' : 'Maintain your hydration and focus rhythm.',
      },
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// 4. Goal Decomposer (Proposal: "It turns big goals into small daily actions")
app.post('/api/ai/decompose-goal', async (req: Request, res: Response) => {
  try {
    const { goalTitle, category, totalMinutes } = req.body;

    if (ai) {
      const prompt = `You are Araw AI's intelligent breakdown engine.
The user wants to achieve this goal: "${goalTitle}" (${category || 'General'}).
Total estimated time available: ${totalMinutes || 60} minutes.

Deconstruct this into 3 to 5 clear, sequenced, actionable subtasks that eliminate procrastination and make immediate execution frictionless.
Each subtask must have:
- title (action-oriented, e.g. "Draft outline", "Write introduction", "Solve problems 1-3")
- estimatedMinutes (number)
- tip (one quick tactical pro-tip for focus)

Return JSON:
{
  "summary": "1 sentence encouragement",
  "subtasks": [
    { "title": "string", "estimatedMinutes": number, "tip": "string" }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    estimatedMinutes: { type: Type.NUMBER },
                    tip: { type: Type.STRING },
                  },
                  required: ['title', 'estimatedMinutes', 'tip'],
                },
              },
            },
            required: ['summary', 'subtasks'],
          },
        },
      });

      if (response.text) {
        return res.json(JSON.parse(response.text.trim()));
      }
    }

    // Heuristic fallback
    return res.json({
      summary: `Structured execution plan for "${goalTitle}".`,
      subtasks: [
        {
          title: `Define exact scope and required inputs for ${goalTitle}`,
          estimatedMinutes: 10,
          tip: 'Clear desk and browser tabs to minimize visual friction.',
        },
        {
          title: `Execute core heavy lifting / first draft of ${goalTitle}`,
          estimatedMinutes: 30,
          tip: 'Do not edit while generating. Pure flow state.',
        },
        {
          title: `Review, polish, and verify completion criteria`,
          estimatedMinutes: 15,
          tip: 'Check against grading rubric or client specifications.',
        },
      ],
    });
  } catch (error) {
    console.error('Decompose error:', error);
    res.status(500).json({ error: 'Failed to decompose goal' });
  }
});

// 5. 24/7 AI Coach Chat & Consultation
app.post('/api/ai/ask-coach', async (req: Request, res: Response) => {
  try {
    const { userMessage, userContext } = req.body;

    if (ai) {
      const prompt = `You are Araw AI — The 24/7 Life OS Coach.
Your philosophy (from the founding proposal):
"Our AI doesn't just push you to do more. It learns you and protects you. We are the only company making money by helping people log off. We solve disorganization, the discipline crisis, and digital burnout."
Tone: Warm, grounded, highly actionable, concise, disciplined yet caring.
Current user state summary:
${JSON.stringify(userContext || {})}

User's message: "${userMessage}"

Respond with:
1. Direct, clear guidance in 2-3 short paragraphs max.
2. A single concrete "Immediate Next Micro-Step" (1 sentence).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      if (response.text) {
        return res.json({ reply: response.text });
      }
    }

    // Heuristic fallback
    return res.json({
      reply: `I hear you. As your Araw Life Guardian, remember that discipline is not about punishing yourself with endless hours—it is about clear boundaries and high-intent focus.

Pick your single most important deliverable right now. Set a strict 25-minute timer, silence notifications, and sprint. When that timer rings, step back and celebrate the clarity.

Immediate Next Micro-Step: Open your top priority task, hide secondary tabs, and commit to the first 5 minutes without distraction.`,
    });
  } catch (error) {
    console.error('Ask coach error:', error);
    res.status(500).json({ error: 'Failed to consult coach' });
  }
});

// Vite middleware in dev; static assets in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Araw AI Life OS server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
