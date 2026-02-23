'use client';

import { useEffect, useState } from 'react';

interface AIProcessingProps {
  welcomeMessage?: string;
  onComplete: () => void;
}

const PROCESSING_STEPS = [
  { icon: '🔍', text: 'Analysing your goals and life areas…', duration: 2000 },
  { icon: '🧠', text: 'Crafting your personalised habit plan…', duration: 3000 },
  { icon: '📅', text: 'Building your ideal daily schedule…', duration: 2500 },
  { icon: '🎯', text: 'Setting up your goal hierarchy…', duration: 2000 },
  { icon: '✨', text: 'Adding the finishing touches…', duration: 1500 },
];

export default function AIProcessing({ welcomeMessage, onComplete }: AIProcessingProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dots, setDots] = useState('');

  // Animate the processing steps
  useEffect(() => {
    if (welcomeMessage) return; // plan is done, skip step animation

    let stepIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    function advanceStep() {
      if (stepIndex >= PROCESSING_STEPS.length) return;
      setCurrentStepIdx(stepIndex);
      timeoutId = setTimeout(() => {
        stepIndex++;
        advanceStep();
      }, PROCESSING_STEPS[stepIndex].duration);
    }

    advanceStep();
    return () => clearTimeout(timeoutId);
  }, [welcomeMessage]);

  // Animated dots
  useEffect(() => {
    if (welcomeMessage) return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(id);
  }, [welcomeMessage]);

  // Typewriter effect for welcome message
  useEffect(() => {
    if (!welcomeMessage) return;
    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const id = setInterval(() => {
      if (i < welcomeMessage.length) {
        setDisplayedText(welcomeMessage.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(id);
        // Redirect after a short pause so user can read the message
        setTimeout(onComplete, 2500);
      }
    }, 28);
    return () => clearInterval(id);
  }, [welcomeMessage, onComplete]);

  const currentProcessingStep = PROCESSING_STEPS[currentStepIdx];

  return (
    <div
      className="min-h-screen flex items-center justify-center graph-paper-bg"
      style={{ backgroundColor: '#FDF8F0' }}
    >
      <div className="w-full max-w-lg mx-auto px-6 py-16 text-center">

        {!welcomeMessage ? (
          /* ── Processing state ── */
          <>
            {/* Animated quill icon */}
            <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full"
              style={{ backgroundColor: '#F0E8D8', border: '2px dashed #C4713A' }}>
              <span className="text-4xl animate-bounce">
                {currentProcessingStep?.icon ?? '✨'}
              </span>
            </div>

            <h1
              className="font-hand text-3xl font-bold mb-4"
              style={{ color: '#1A1A1A' }}
            >
              Crafting your journal{dots}
            </h1>

            <p
              className="font-body text-lg mb-10"
              style={{ color: '#8B7355' }}
            >
              {currentProcessingStep?.text}
            </p>

            {/* Step progress */}
            <div className="flex items-center justify-center gap-3 mb-10">
              {PROCESSING_STEPS.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm transition-all duration-500"
                  style={{
                    backgroundColor: i <= currentStepIdx ? '#C4713A' : '#E8DCC8',
                    color: i <= currentStepIdx ? '#FDF8F0' : '#8B7355',
                    transform: i === currentStepIdx ? 'scale(1.25)' : 'scale(1)',
                  }}
                >
                  {i < currentStepIdx ? '✓' : step.icon}
                </div>
              ))}
            </div>

            <p
              className="font-body text-sm"
              style={{ color: '#B8A890' }}
            >
              This usually takes 10–20 seconds
            </p>
          </>
        ) : (
          /* ── Welcome message typewriter state ── */
          <>
            <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full"
              style={{ backgroundColor: '#F0E8D8', border: '2px solid #C4713A' }}>
              <span className="text-4xl">🌟</span>
            </div>

            <h1
              className="font-hand text-3xl font-bold mb-6"
              style={{ color: '#1A1A1A' }}
            >
              Your plan is ready!
            </h1>

            <div
              className="paper-card text-left p-6 mb-6"
              style={{
                backgroundColor: '#FFFEF9',
                border: '1px solid #D4C4A8',
                borderRadius: '8px',
                boxShadow: '2px 3px 8px rgba(139,115,85,0.1)',
              }}
            >
              <p
                className="font-body text-base leading-relaxed"
                style={{ color: '#1A1A1A', minHeight: '3rem' }}
              >
                {displayedText}
                {isTyping && (
                  <span
                    className="inline-block w-0.5 h-5 ml-0.5 animate-pulse align-middle"
                    style={{ backgroundColor: '#C4713A' }}
                  />
                )}
              </p>
            </div>

            <p
              className="font-body text-sm"
              style={{ color: '#8B7355' }}
            >
              Taking you to your dashboard…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
