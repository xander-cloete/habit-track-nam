'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboardingStore';
import StepIndicator from '@/components/onboarding/StepIndicator';
import AIProcessing from '@/components/onboarding/AIProcessing';
import dynamic from 'next/dynamic';

// Lazy-load step components to keep the initial bundle small
const Step1Welcome       = dynamic(() => import('@/components/onboarding/steps/Step1Welcome'));
const Step2LifeAreas     = dynamic(() => import('@/components/onboarding/steps/Step2LifeAreas'));
const Step3CurrentHabits = dynamic(() => import('@/components/onboarding/steps/Step3CurrentHabits'));
const Step4TimeAudit     = dynamic(() => import('@/components/onboarding/steps/Step4TimeAudit'));
const Step5YearlyGoals   = dynamic(() => import('@/components/onboarding/steps/Step5YearlyGoals'));
const Step6MonthlyGoals  = dynamic(() => import('@/components/onboarding/steps/Step6MonthlyGoals'));
const Step7WeeklyGoals   = dynamic(() => import('@/components/onboarding/steps/Step7WeeklyGoals'));
const Step8DailyGoals    = dynamic(() => import('@/components/onboarding/steps/Step8DailyGoals'));
const Step9Review        = dynamic(() => import('@/components/onboarding/steps/Step9Review'));

const STEP_COMPONENTS = [
  Step1Welcome,
  Step2LifeAreas,
  Step3CurrentHabits,
  Step4TimeAudit,
  Step5YearlyGoals,
  Step6MonthlyGoals,
  Step7WeeklyGoals,
  Step8DailyGoals,
  Step9Review,
];

type GenerationState = 'idle' | 'generating' | 'done' | 'error';

interface GeneratePlanResult {
  success: boolean;
  welcomeMessage: string;
  insights: string;
  habitCount: number;
  goalCount: number;
  scheduleBlockCount: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { currentStep, totalSteps, data, reset } = useOnboardingStore();

  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [welcomeMessage, setWelcomeMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // When the user advances past the last step (step > 9), trigger AI generation
  useEffect(() => {
    if (currentStep > totalSteps && generationState === 'idle') {
      void triggerGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, totalSteps]);

  async function triggerGeneration() {
    setGenerationState('generating');
    setErrorMessage('');

    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Generation failed');
      }

      const result = (await res.json()) as GeneratePlanResult;
      setWelcomeMessage(result.welcomeMessage);
      setGenerationState('done');
    } catch (err) {
      console.error('[onboarding] generation error:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setGenerationState('error');
    }
  }

  function handleAIComplete() {
    reset();
    router.replace('/dashboard');
  }

  function handleRetry() {
    setGenerationState('idle');
    setErrorMessage('');
    void triggerGeneration();
  }

  // ── AI generation / processing screen ─────────────────────────────────────
  if (generationState === 'generating' || generationState === 'done') {
    return (
      <AIProcessing
        welcomeMessage={generationState === 'done' ? welcomeMessage : undefined}
        onComplete={handleAIComplete}
      />
    );
  }

  // ── Error screen ───────────────────────────────────────────────────────────
  if (generationState === 'error') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FDF8F0' }}
      >
        <div className="w-full max-w-md mx-auto px-6 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="font-hand text-2xl font-bold mb-3" style={{ color: '#1A1A1A' }}>
            Something went wrong
          </h2>
          <p className="font-body text-base mb-6" style={{ color: '#8B7355' }}>
            {errorMessage}
          </p>
          <button
            onClick={handleRetry}
            className="font-hand font-semibold px-8 py-3 rounded-lg transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: '#C4713A', color: '#FDF8F0' }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Wizard steps ───────────────────────────────────────────────────────────
  const clampedStep  = Math.min(Math.max(currentStep, 1), totalSteps);
  const StepComponent = STEP_COMPONENTS[clampedStep - 1];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF8F0' }}>
      {/* Sticky header with progress */}
      <header
        className="sticky top-0 z-10 px-6 py-4"
        style={{
          backgroundColor: 'rgba(253,248,240,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E8DCC8',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-hand text-xl font-bold" style={{ color: '#C4713A' }}>
              ✏️ Daily Journal
            </span>
            <span className="font-body text-xs" style={{ color: '#B8A890' }}>
              Setting up your habit coach
            </span>
          </div>
          <StepIndicator currentStep={clampedStep} totalSteps={totalSteps} />
        </div>
      </header>

      {/* Step content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {StepComponent ? (
          <StepComponent />
        ) : (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#C4713A', borderTopColor: 'transparent' }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
