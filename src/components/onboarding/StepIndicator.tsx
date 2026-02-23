'use client';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = [
  'Welcome',
  'Life Areas',
  'Habits',
  'Your Day',
  'Yearly',
  'Monthly',
  'Weekly',
  'Daily',
  'Review',
];

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full">
      {/* Step label */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="font-hand text-sm"
          style={{ color: '#8B7355' }}
        >
          Step {currentStep} of {totalSteps}
        </span>
        <span
          className="font-hand text-sm font-semibold"
          style={{ color: '#C4713A' }}
        >
          {STEP_LABELS[currentStep - 1] ?? ''}
        </span>
      </div>

      {/* Progress track */}
      <div
        className="relative h-2 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: '#E8DCC8' }}
      >
        {/* Filled portion */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPct}%`,
            backgroundColor: '#C4713A',
          }}
        />
      </div>

      {/* Dot indicators (hidden on small screens, shown on md+) */}
      <div className="hidden md:flex items-center justify-between mt-2 px-0">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isDone = step < currentStep;
          const isCurrent = step === currentStep;
          return (
            <div key={step} className="flex flex-col items-center gap-1">
              <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isDone || isCurrent ? '#C4713A' : '#D4C4A8',
                  transform: isCurrent ? 'scale(1.5)' : 'scale(1)',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
