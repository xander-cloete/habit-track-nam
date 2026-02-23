'use client';

interface XMarkButtonProps {
  habitId: string;
  date: string;
  isCompleted: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onToggle: (completed: boolean) => void;
}

const sizeMap = { sm: 28, md: 36, lg: 44 } as const;

export default function XMarkButton({
  habitId,
  date,
  isCompleted,
  isLoading = false,
  size = 'md',
  onToggle,
}: XMarkButtonProps) {
  const px = sizeMap[size];

  return (
    <button
      className={[
        'x-mark-btn',
        isCompleted ? 'checked' : '',
        isLoading ? 'opacity-50 cursor-wait' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: `${px}px`, height: `${px}px` }}
      onClick={() => {
        if (!isLoading) onToggle(!isCompleted);
      }}
      disabled={isLoading}
      aria-label={isCompleted ? 'Mark habit as incomplete' : 'Mark habit as complete'}
      aria-pressed={isCompleted}
      data-habit-id={habitId}
      data-date={date}
    />
  );
}
