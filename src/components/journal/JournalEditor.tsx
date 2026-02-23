'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import EntryCalendar from './EntryCalendar';
import type { JournalEntry } from '@/lib/db/schema';

// ── Constants ─────────────────────────────────────────────────────────────────
const LINE_HEIGHT = 34; // px — must match CSS background-size

const MOODS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '😔', label: 'Low'     },
  { value: 2, emoji: '😐', label: 'Okay'    },
  { value: 3, emoji: '🙂', label: 'Good'    },
  { value: 4, emoji: '😊', label: 'Great'   },
  { value: 5, emoji: '🤩', label: 'Amazing' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toYMD(d);
}

function formatDateHeader(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

// ── Prompts shown when page is blank ─────────────────────────────────────────
const WRITING_PROMPTS = [
  'What went well today?',
  'What are you grateful for right now?',
  'What challenged you, and what did you learn?',
  'What do you want to remember about today?',
  'How did your habits feel today?',
  'What would make tomorrow even better?',
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function JournalEditor() {
  const today = toYMD(new Date());

  const [date, setDate]               = useState(today);
  const [content, setContent]         = useState('');
  const [mood, setMood]               = useState<number | null>(null);
  const [saveStatus, setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLoading, setIsLoading]     = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [promptIndex]                 = useState(() => Math.floor(Math.random() * WRITING_PROMPTS.length));

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved   = useRef<{ content: string; mood: number | null }>({ content: '', mood: null });

  // ── Load entry for the selected date ────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    setSaveStatus('idle');
    fetch(`/api/journal?date=${date}`)
      .then((r) => r.json() as Promise<{ entry: JournalEntry | null }>)
      .then(({ entry }) => {
        const c = entry?.content ?? '';
        const m = entry?.mood ?? null;
        setContent(c);
        setMood(m);
        lastSaved.current = { content: c, mood: m };
      })
      .catch(() => { setContent(''); setMood(null); })
      .finally(() => setIsLoading(false));
  }, [date]);

  // ── Debounced auto-save ──────────────────────────────────────────────────────
  const save = useCallback(async (c: string, m: number | null) => {
    // Skip if nothing changed
    if (c === lastSaved.current.content && m === lastSaved.current.mood) return;
    setSaveStatus('saving');
    try {
      await fetch(`/api/journal?date=${date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: c, mood: m ?? undefined }),
      });
      lastSaved.current = { content: c, mood: m };
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [date]);

  function scheduleAutoSave(c: string, m: number | null) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus('idle');
    saveTimer.current = setTimeout(() => void save(c, m), 1200);
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    scheduleAutoSave(val, mood);
  }

  function handleMoodChange(val: number) {
    const next = mood === val ? null : val; // toggle off
    setMood(next);
    scheduleAutoSave(content, next);
  }

  // Save on unmount / date change
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        void save(content, mood);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const isToday   = date === today;
  const isFuture  = date > today;
  const words     = wordCount(content);
  const prompt    = WRITING_PROMPTS[promptIndex] ?? WRITING_PROMPTS[0]!;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      {/* ── Left: writing area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-3 gap-4"
          style={{ borderBottom: '1px solid var(--color-paper-ruled)' }}
        >
          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate((d) => addDays(d, -1))}
              className="font-hand text-xl px-2 py-1 rounded"
              style={{ color: 'var(--color-ink-faint)' }}
              aria-label="Previous day"
            >
              ‹
            </button>

            <button
              onClick={() => setShowCalendar((v) => !v)}
              className="font-hand text-lg leading-tight text-center px-2 py-1 rounded transition-colors"
              style={{
                color: isToday ? 'var(--color-accent)' : 'var(--color-ink)',
                backgroundColor: showCalendar ? 'var(--color-accent-light)' : 'transparent',
              }}
            >
              {formatDateHeader(date)}
            </button>

            <button
              onClick={() => setDate((d) => addDays(d, 1))}
              disabled={isToday}
              className="font-hand text-xl px-2 py-1 rounded"
              style={{ color: isToday ? 'var(--color-paper-ruled)' : 'var(--color-ink-faint)' }}
              aria-label="Next day"
            >
              ›
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            {!isToday && (
              <button
                onClick={() => setDate(today)}
                className="font-body text-xs px-3 py-1 rounded-full"
                style={{
                  backgroundColor: 'var(--color-accent-light)',
                  color: 'var(--color-accent)',
                  border: '1px solid var(--color-accent)',
                }}
              >
                Today
              </button>
            )}
            {/* Save status */}
            <span className="font-body text-xs" style={{ color: 'var(--color-ink-faint)', minWidth: '48px' }}>
              {saveStatus === 'saving' ? '✏️ Saving…' :
               saveStatus === 'saved'  ? '✓ Saved'   :
               saveStatus === 'error'  ? '⚠ Error'   : ''}
            </span>
          </div>
        </div>

        {/* Calendar dropdown (opens below top bar) */}
        {showCalendar && (
          <div
            className="absolute z-30 mt-14 ml-6 shadow-lg"
            style={{ top: 'auto' }}
          >
            <EntryCalendar
              selectedDate={date}
              onSelect={(d) => { setDate(d); setShowCalendar(false); }}
            />
          </div>
        )}

        {/* The journal page itself */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">

            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-3 animate-pulse">
                {[100, 85, 93, 70, 88].map((w, i) => (
                  <div
                    key={i}
                    className="rounded"
                    style={{ height: '22px', width: `${w}%`, backgroundColor: 'var(--color-paper-ruled)' }}
                  />
                ))}
              </div>
            )}

            {/* The writing surface */}
            {!isLoading && (
              <div className="relative">
                {/* Red margin line (left, like a real notebook) */}
                <div
                  className="absolute top-0 bottom-0"
                  style={{
                    left: '44px',
                    width: '1px',
                    backgroundColor: 'rgba(192,57,43,0.25)',
                    pointerEvents: 'none',
                  }}
                  aria-hidden="true"
                />

                {/* Placeholder prompt when empty */}
                {content === '' && !isFuture && (
                  <p
                    className="absolute pointer-events-none font-hand"
                    style={{
                      top: '4px',
                      left: '52px',
                      color: 'var(--color-ink-faint)',
                      fontSize: '20px',
                      lineHeight: `${LINE_HEIGHT}px`,
                      fontStyle: 'italic',
                    }}
                    aria-hidden="true"
                  >
                    {prompt}
                  </p>
                )}

                {isFuture && (
                  <p
                    className="absolute pointer-events-none font-hand text-center w-full"
                    style={{
                      top: '40px',
                      color: 'var(--color-ink-faint)',
                      fontSize: '18px',
                    }}
                    aria-hidden="true"
                  >
                    ✦ This page is waiting for you ✦
                  </p>
                )}

                {/* The textarea */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  disabled={isFuture}
                  spellCheck
                  autoFocus={isToday}
                  className="w-full outline-none resize-none"
                  style={{
                    /* Lined-paper background: horizontal rules every LINE_HEIGHT px */
                    backgroundImage: `linear-gradient(
                      transparent ${LINE_HEIGHT - 1}px,
                      rgba(139,139,122,0.18) ${LINE_HEIGHT - 1}px
                    )`,
                    backgroundSize: `100% ${LINE_HEIGHT}px`,
                    backgroundAttachment: 'local',

                    /* Text sits on the lines */
                    fontFamily: 'var(--font-hand)',
                    fontSize: '20px',
                    lineHeight: `${LINE_HEIGHT}px`,
                    color: 'var(--color-ink)',

                    /* Indented past the red margin line */
                    paddingLeft: '52px',
                    paddingRight: '8px',
                    paddingTop: '4px',
                    paddingBottom: `${LINE_HEIGHT * 6}px`,

                    /* Tall enough for comfortable writing */
                    minHeight: `${LINE_HEIGHT * 18}px`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: isFuture ? 'not-allowed' : 'text',
                    opacity: isFuture ? 0.45 : 1,
                  }}
                  aria-label={`Journal entry for ${date}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar: mood + word count */}
        {!isLoading && (
          <div
            className="flex-shrink-0 flex items-center justify-between px-6 py-3"
            style={{ borderTop: '1px solid var(--color-paper-ruled)' }}
          >
            {/* Mood selector */}
            <div className="flex items-center gap-1">
              <span className="font-body text-xs mr-2" style={{ color: 'var(--color-ink-faint)' }}>
                Mood
              </span>
              {MOODS.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  onClick={() => handleMoodChange(value)}
                  disabled={isFuture}
                  title={label}
                  className="rounded-full transition-transform"
                  style={{
                    fontSize: '20px',
                    lineHeight: 1,
                    padding: '4px',
                    transform: mood === value ? 'scale(1.25)' : 'scale(1)',
                    opacity: mood !== null && mood !== value ? 0.4 : 1,
                    filter: mood === value ? 'none' : 'grayscale(0.3)',
                  }}
                  aria-label={label}
                  aria-pressed={mood === value}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Word count */}
            <span className="font-hand text-sm" style={{ color: 'var(--color-ink-faint)' }}>
              {words} {words === 1 ? 'word' : 'words'}
            </span>
          </div>
        )}
      </div>

      {/* ── Right: calendar (desktop only) ────────────────────────────────── */}
      <aside
        className="hidden xl:flex flex-col gap-4 p-5 flex-shrink-0"
        style={{
          width: '220px',
          borderLeft: '1px solid var(--color-paper-ruled)',
        }}
      >
        <p className="font-hand text-base" style={{ color: 'var(--color-ink-faint)' }}>
          ✦ Entries
        </p>
        <EntryCalendar
          selectedDate={date}
          onSelect={setDate}
        />

        {/* Writing streak hint */}
        <div
          className="mt-auto p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-paper-dark)',
            border: '1px solid var(--color-paper-ruled)',
          }}
        >
          <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--color-ink-faint)' }}>
            Dots mark days you've written. Click any date to revisit it.
          </p>
        </div>
      </aside>
    </div>
  );
}
