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

// ── Reschedule prompt (called after work schedule is saved) ───────────────────
export interface RescheduleInput {
  wakeTime:      string;                // HH:MM
  sleepTime:     string;                // HH:MM
  workType:      'Work' | 'School';
  workStart:     string;                // HH:MM
  workEnd:       string;                // HH:MM
  workDays:      number[];              // 0=Mon … 6=Sun
  commuteStart?: string;
  commuteEnd?:   string;
  habits:        Array<{ title: string; description: string | null; icon: string }>;
  existingBlocks: Array<{ title: string; startTime: string; endTime: string }>;
  displacedCount: number;
}

export function buildReschedulePrompt(input: RescheduleInput): string {
  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const workDayStr = input.workDays.map(d => DAY_NAMES[d]).join(', ');

  // Compute free windows on a work day
  const morningEnd   = input.commuteStart ?? input.workStart;
  const eveningStart = input.commuteEnd   ?? input.workEnd;
  const freeWindows: string[] = [];
  if (input.wakeTime < morningEnd)
    freeWindows.push(`Morning: ${input.wakeTime}–${morningEnd}`);
  if (eveningStart < input.sleepTime)
    freeWindows.push(`Evening: ${eveningStart}–${input.sleepTime}`);

  const commuteStr = (input.commuteStart && input.commuteEnd)
    ? `, commute ${input.commuteStart}–${input.commuteEnd}`
    : '';

  const existingStr = input.existingBlocks.length
    ? input.existingBlocks.map(b => `  ${b.startTime}–${b.endTime}  ${b.title}`).join('\n')
    : '  (none)';

  const habitsStr = input.habits.length
    ? input.habits.map(h => `  ${h.icon} ${h.title}${h.description ? ` — ${h.description}` : ''}`).join('\n')
    : '  (none listed)';

  const targetCount = Math.min(input.displacedCount + 2, 8);

  return `The user has just saved their ${input.workType} schedule: ${workDayStr}, ${input.workStart}–${input.workEnd}${commuteStr}.

${input.displacedCount} habit block(s) were removed because they fell inside those hours. Your job is to place ${targetCount} replacement blocks that fit in the FREE windows below.

HARD CONSTRAINTS — never place any block here:
  BLOCKED ${input.workStart}–${input.workEnd} (${input.workType})${input.commuteStart ? `\n  BLOCKED ${input.commuteStart}–${input.commuteEnd} (Commute)` : ''}

FREE WINDOWS on work days:
${freeWindows.length ? freeWindows.map(w => `  ✓ ${w}`).join('\n') : '  Very limited — pick the most impactful habits only'}

ALREADY SCHEDULED (do not overlap or duplicate):
${existingStr}

USER'S ACTIVE HABITS TO FIND TIME FOR:
${habitsStr}

RULES:
1. Every block MUST start and end within a free window listed above.
2. No block may overlap with any already-scheduled block.
3. Keep each block 15–90 minutes long.
4. Prioritise the habits listed; add a rest/transition block only if schedule feels packed.
5. Prefer morning blocks for high-focus tasks, evening for reflection or light activity.

Respond with ONLY this JSON (no markdown fences):
{
  "scheduleBlocks": [
    {
      "title": "string",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "category": "habit|rest|personal|learning|social",
      "description": "optional short string"
    }
  ]
}`;
}

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
2. Create a realistic daily schedule between their wake and sleep times with 8–12 time blocks. IMPORTANT: Cluster habit and personal blocks into the early morning (wake time → 09:00) and evening (17:00 → sleep time) windows by default. Leave the midday window (09:00–17:00) free unless the user has explicitly indicated that time is available — this preserves space for work, school, or other fixed commitments that may be added later.
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
