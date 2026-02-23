import type { OnboardingData } from '@/stores/onboardingStore';

// ── Output schema Claude must produce ────────────────────────────────────────
export interface GeneratedPlan {
  welcomeMessage: string;
  insights: string;
  habits: GeneratedHabit[];
  scheduleBlocks: GeneratedScheduleBlock[];
  goals: GeneratedGoals;
}

export interface GeneratedHabit {
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  frequencyConfig?: {
    daysOfWeek?: number[];
  };
  targetCount: number;
  icon: string;
  color: string;
  lifeAreaName: string;
  category: string;
}

export interface GeneratedScheduleBlock {
  title: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  category: 'habit' | 'work' | 'rest' | 'social' | 'personal' | 'learning';
  description?: string;
}

export interface GeneratedGoals {
  yearly: GeneratedGoalItem[];
  monthly: GeneratedGoalItem[];
  weekly: GeneratedGoalItem[];
  daily: GeneratedGoalItem[];
}

export interface GeneratedGoalItem {
  title: string;
  description: string;
  lifeAreaName: string;
  milestones: string[];
}

// ── Shared system prompt ──────────────────────────────────────────────────────
export const COACHING_SYSTEM_PROMPT = `You are a compassionate, practical life coaching assistant embedded in a habit tracking journal app.

Your tone is warm, encouraging, and direct — like a trusted mentor who knows when to push and when to comfort. You understand behaviour change science: habit loops, implementation intentions, identity-based habits, and the importance of starting small.

You never give generic advice. You always reference the user's specific goals, current habits, and situation.

When generating structured data, you ALWAYS respond with valid JSON exactly matching the schema provided. No markdown code fences, no commentary outside the JSON — pure JSON only.`;

// ── Plan generation prompt ────────────────────────────────────────────────────
export function buildOnboardingPrompt(data: Partial<OnboardingData>): string {
  const sanitize = (s: string) => s.replace(/\[INST\]|\[\/INST\]|<s>|<\/s>/g, '').trim().slice(0, 300);

  return `The user "${sanitize(data.displayName ?? 'there')}" has just completed their onboarding assessment. Generate a personalised habit and schedule plan based on their responses.

USER PROFILE:
- Name: ${sanitize(data.displayName ?? 'Unknown')}
- Timezone: ${data.timezone ?? 'UTC'}
- Wake time: ${data.wakeTime ?? '07:00'}, Sleep time: ${data.sleepTime ?? '23:00'}
- Preferred coaching style: ${data.motivationStyle ?? 'balanced'}

LIFE AREAS THEY TRACK:
${(data.lifeAreas ?? []).map(a => `- ${sanitize(a.name)} (currently ${a.currentPct}% of time → target ${a.targetPct}%)`).join('\n') || '- Not specified'}

HABITS THEY ALREADY DO:
${(data.currentHabits ?? []).map(h => `- ${sanitize(h)}`).join('\n') || '- None listed (start fresh)'}

THEIR GOALS:
Yearly: ${(data.yearlyGoals ?? []).map(sanitize).join('; ') || 'Not specified'}
Monthly: ${(data.monthlyGoals ?? []).map(sanitize).join('; ') || 'Not specified'}
Weekly: ${(data.weeklyGoals ?? []).map(sanitize).join('; ') || 'Not specified'}
Daily: ${(data.dailyGoals ?? []).map(sanitize).join('; ') || 'Not specified'}

INSTRUCTIONS:
1. Generate 5–8 specific, achievable habits that directly support their stated goals. Don't duplicate habits they already do.
2. Create a realistic daily schedule between their wake and sleep times with 8–12 time blocks.
3. Organise their stated goals into a hierarchy (yearly → monthly → weekly → daily) with 2–3 milestones each.
4. Write a short, personal welcome message (2–3 sentences) that references something specific from their profile.
5. Write a brief insight paragraph (3–4 sentences) about what you noticed about their situation and what the key leverage points are.

Respond with ONLY this JSON structure (no markdown fences):
{
  "welcomeMessage": "string — personal 2-3 sentence welcome referencing their name and a specific goal",
  "insights": "string — 3-4 sentence coaching insight about their situation",
  "habits": [
    {
      "title": "string",
      "description": "string — one sentence explaining why this habit matters for their goals",
      "frequency": "daily|weekly|monthly",
      "frequencyConfig": { "daysOfWeek": [0,1,2,3,4,5,6] },
      "targetCount": 1,
      "icon": "single emoji",
      "color": "hex color like #5A7A4A",
      "lifeAreaName": "must match one of their life area names",
      "category": "string"
    }
  ],
  "scheduleBlocks": [
    {
      "title": "string",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "category": "habit|work|rest|social|personal|learning",
      "description": "optional string"
    }
  ],
  "goals": {
    "yearly": [{ "title": "string", "description": "string", "lifeAreaName": "string", "milestones": ["string", "string", "string"] }],
    "monthly": [{ "title": "string", "description": "string", "lifeAreaName": "string", "milestones": ["string", "string"] }],
    "weekly": [{ "title": "string", "description": "string", "lifeAreaName": "string", "milestones": ["string"] }],
    "daily": [{ "title": "string", "description": "string", "lifeAreaName": "string", "milestones": [] }]
  }
}`;
}
