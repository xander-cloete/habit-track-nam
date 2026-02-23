'use client';

import { useState } from 'react';
import XMarkButton from './XMarkButton';

interface HabitCardProps {
  habit: {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    frequency: string;
    targetCount: number;
  };
  isCompleted: boolean;
  isLoading: boolean;
  onToggle: (habitId: string, completed: boolean) => void;
  date: string;
}

export default function HabitCard({
  habit,
  isCompleted,
  isLoading,
  onToggle,
  date,
}: HabitCardProps) {
  const [animating, setAnimating] = useState(false);
  const dotColor = habit.color ?? '#C4713A';

  function handleToggle(completed: boolean) {
    if (completed) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 350);
    }
    onToggle(habit.id, completed);
  }

  return (
    <div
      className="paper-card p-4 flex items-center gap-3"
      style={{
        transform: animating ? 'scale(1.025)' : 'scale(1)',
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Color dot */}
      <span
        className="flex-shrink-0 rounded-full"
        style={{ width: '8px', height: '8px', backgroundColor: dotColor }}
      />

      {/* Icon */}
      {habit.icon && (
        <span className="flex-shrink-0 text-xl leading-none" aria-hidden="true">
          {habit.icon}
        </span>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div
          className="font-hand text-lg leading-snug"
          style={{
            color: 'var(--color-ink)',
            textDecoration: isCompleted ? 'line-through' : 'none',
            opacity: isCompleted ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {habit.title}
        </div>
        {habit.description && (
          <div
            className="font-body text-sm truncate mt-0.5"
            style={{ color: 'var(--color-ink-faint)' }}
          >
            {habit.description}
          </div>
        )}
      </div>

      {/* X-mark toggle */}
      <div className="flex-shrink-0">
        <XMarkButton
          habitId={habit.id}
          date={date}
          isCompleted={isCompleted}
          isLoading={isLoading}
          size="md"
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}
