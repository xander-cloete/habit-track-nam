import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAnthropicClient, AI_MODEL } from '@/lib/ai/client';
import {
  buildOnboardingPrompt,
  COACHING_SYSTEM_PROMPT,
  type GeneratedPlan,
} from '@/lib/ai/prompts/onboarding';
import { db } from '@/lib/db';
import {
  lifeAreas,
  habits,
  scheduleBlocks,
  goals,
  goalMilestones,
  onboardingResponses,
  usersProfiles,
} from '@/lib/db/schema';
import { serverError } from '@/lib/utils/errors';
import type { OnboardingData } from '@/stores/onboardingStore';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as Partial<OnboardingData>;

    // ── Call Claude ────────────────────────────────────────────────────────
    const message = await getAnthropicClient().messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: COACHING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildOnboardingPrompt(body) }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // ── Parse JSON response ────────────────────────────────────────────────
    let plan: GeneratedPlan;
    try {
      plan = JSON.parse(responseText) as GeneratedPlan;
    } catch {
      // Try to extract JSON blob if Claude added any commentary
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Could not parse AI response:', responseText.slice(0, 200));
        return NextResponse.json(
          { error: 'AI returned an invalid response. Please try again.' },
          { status: 502 }
        );
      }
      plan = JSON.parse(jsonMatch[0]) as GeneratedPlan;
    }

    // ── Ensure user profile exists ─────────────────────────────────────────
    const existing = await db
      .select({ id: usersProfiles.id })
      .from(usersProfiles)
      .where(eq(usersProfiles.id, user.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(usersProfiles).values({
        id: user.id,
        displayName:
          body.displayName ??
          user.user_metadata?.display_name ??
          user.email?.split('@')[0] ??
          'Friend',
        timezone: body.timezone ?? 'UTC',
        wakeTime: body.wakeTime ?? '07:00',
        sleepTime: body.sleepTime ?? '23:00',
        motivationStyle: body.motivationStyle ?? 'balanced',
      });
    } else {
      await db
        .update(usersProfiles)
        .set({
          displayName:
            body.displayName ?? user.user_metadata?.display_name ?? 'Friend',
          timezone: body.timezone ?? 'UTC',
          wakeTime: body.wakeTime ?? '07:00',
          sleepTime: body.sleepTime ?? '23:00',
          motivationStyle: body.motivationStyle ?? 'balanced',
          onboardingCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(usersProfiles.id, user.id));
    }

    // ── Save raw onboarding response ───────────────────────────────────────
    await db
      .insert(onboardingResponses)
      .values({
        userId: user.id,
        step: 9,
        questionKey: 'complete_assessment',
        responseData: body as Record<string, unknown>,
      })
      .onConflictDoNothing();

    // ── Create life areas + build name→id map ─────────────────────────────
    const lifeAreaMap = new Map<string, string>(); // name → uuid

    for (const area of body.lifeAreas ?? []) {
      const [inserted] = await db
        .insert(lifeAreas)
        .values({
          userId: user.id,
          name: area.name,
          icon: area.icon,
          currentTimeAllocationPct: area.currentPct,
          targetTimeAllocationPct: area.targetPct,
          sortOrder: 0,
        })
        .returning({ id: lifeAreas.id });

      if (inserted) lifeAreaMap.set(area.name, inserted.id);
    }

    // Also add any life area names that appear in the plan but weren't in user's list
    for (const habit of plan.habits) {
      if (habit.lifeAreaName && !lifeAreaMap.has(habit.lifeAreaName)) {
        const [inserted] = await db
          .insert(lifeAreas)
          .values({
            userId: user.id,
            name: habit.lifeAreaName,
            icon: '📋',
            sortOrder: 99,
          })
          .returning({ id: lifeAreas.id });
        if (inserted) lifeAreaMap.set(habit.lifeAreaName, inserted.id);
      }
    }

    // ── Create habits ──────────────────────────────────────────────────────
    for (const habit of plan.habits) {
      const lifeAreaId = habit.lifeAreaName
        ? lifeAreaMap.get(habit.lifeAreaName) ?? null
        : null;

      await db.insert(habits).values({
        userId: user.id,
        lifeAreaId,
        title: habit.title,
        description: habit.description,
        frequency: habit.frequency,
        frequencyConfig: habit.frequencyConfig ?? {},
        targetCount: habit.targetCount ?? 1,
        icon: habit.icon,
        color: habit.color,
        aiGenerated: true,
        isActive: true,
        sortOrder: 0,
      });
    }

    // ── Create schedule blocks (recurring templates for today) ─────────────
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    for (const block of plan.scheduleBlocks) {
      await db.insert(scheduleBlocks).values({
        userId: user.id,
        title: block.title,
        startTime: block.startTime,
        endTime: block.endTime,
        category: block.category,
        description: block.description ?? null,
        blockDate: today,
        isRecurring: true,
        recurringConfig: { type: 'daily' },
        aiGenerated: true,
      });
    }

    // ── Create goals + milestones ──────────────────────────────────────────
    const timeframes = ['yearly', 'monthly', 'weekly', 'daily'] as const;

    for (const timeframe of timeframes) {
      const goalList = plan.goals[timeframe] ?? [];

      for (const goalItem of goalList) {
        const lifeAreaId = goalItem.lifeAreaName
          ? lifeAreaMap.get(goalItem.lifeAreaName) ?? null
          : null;

        const [insertedGoal] = await db
          .insert(goals)
          .values({
            userId: user.id,
            lifeAreaId,
            title: goalItem.title,
            description: goalItem.description,
            timeframe,
            aiGenerated: true,
            status: 'active',
            progressPct: 0,
            sortOrder: 0,
          })
          .returning({ id: goals.id });

        if (insertedGoal && goalItem.milestones?.length) {
          for (let i = 0; i < goalItem.milestones.length; i++) {
            await db.insert(goalMilestones).values({
              goalId: insertedGoal.id,
              userId: user.id,
              title: goalItem.milestones[i],
              sortOrder: i,
              aiGenerated: true,
            });
          }
        }
      }
    }

    // ── Mark onboarding complete in Supabase Auth metadata ─────────────────
    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });

    return NextResponse.json({
      success: true,
      welcomeMessage: plan.welcomeMessage,
      insights: plan.insights,
      habitCount: plan.habits.length,
      goalCount:
        (plan.goals.yearly?.length ?? 0) +
        (plan.goals.monthly?.length ?? 0) +
        (plan.goals.weekly?.length ?? 0) +
        (plan.goals.daily?.length ?? 0),
      scheduleBlockCount: plan.scheduleBlocks.length,
    });
  } catch (error) {
    console.error('[generate-plan] Error:', error);
    return serverError();
  }
}
