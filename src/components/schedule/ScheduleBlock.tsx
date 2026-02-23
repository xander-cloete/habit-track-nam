import type { ReactElement } from 'react';

export interface ScheduleBlockData {
  id: string;
  title: string;
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  category: string | null;
  description: string | null;
  completedAt: string | null;
}

interface ScheduleBlockProps {
  block: ScheduleBlockData;
}

interface CategoryStyle {
  border: string;
  bg: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  habit:    { border: '#C4713A', bg: '#F0D9C8' },
  work:     { border: '#4A6A8A', bg: '#D0DCE8' },
  rest:     { border: '#5A7A4A', bg: '#D4E2CC' },
  social:   { border: '#9A5A7A', bg: '#E8D4E0' },
  personal: { border: '#8B8B7A', bg: '#E8E8D8' },
  learning: { border: '#7A5A9A', bg: '#E0D4E8' },
};

const DEFAULT_STYLE: CategoryStyle = { border: '#8B7355', bg: '#F5EDD8' };

function getCategoryStyle(category: string | null): CategoryStyle {
  return (category && CATEGORY_STYLES[category]) ? CATEGORY_STYLES[category]! : DEFAULT_STYLE;
}

export default function ScheduleBlock({ block }: ScheduleBlockProps): ReactElement {
  const { border, bg } = getCategoryStyle(block.category);

  return (
    <div
      className="flex items-start gap-3 rounded-r-md"
      style={{ borderLeft: `4px solid ${border}`, backgroundColor: bg, padding: '12px' }}
    >
      {/* Time column */}
      <div
        className="flex-shrink-0 flex flex-col items-end font-hand text-sm leading-tight"
        style={{ color: 'var(--color-ink-faint)', minWidth: '48px' }}
      >
        <span>{block.startTime}</span>
        <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>–</span>
        <span>{block.endTime}</span>
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-hand text-base" style={{ color: 'var(--color-ink)' }}>
            {block.title}
          </span>
          {block.completedAt && (
            <span
              className="inline-flex items-center justify-center rounded-full font-body"
              style={{
                width: '18px',
                height: '18px',
                backgroundColor: '#5A7A4A',
                color: '#ffffff',
                fontSize: '10px',
                flexShrink: 0,
              }}
              aria-label="Completed"
            >
              ✓
            </span>
          )}
        </div>
        {block.description && (
          <p
            className="font-body text-xs mt-0.5"
            style={{ color: 'var(--color-ink-light)' }}
          >
            {block.description}
          </p>
        )}
      </div>
    </div>
  );
}
