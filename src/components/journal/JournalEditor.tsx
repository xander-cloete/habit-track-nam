'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import EntryCalendar from './EntryCalendar';
import type { JournalEntry } from '@/lib/db/schema';

// ── Constants ─────────────────────────────────────────────────────────────────
const LINE_HEIGHT = 34; // px — must match CSS background-size

// Matches --color-paper-dark (#F5EDD8) — same tone the calendar card uses
const PAPER_BG     = 'var(--color-paper-dark)';
const RULE_COLOR   = 'rgba(150,175,215,0.42)';   // light blue ruling
const MARGIN_COLOR = 'rgba(200,60,50,0.28)';      // pale red margin line (lined style only)

// Paper texture asset (placed in /public)
const PAPER_TEXTURE = "url('/paper_texture.jpg')";

// Shared style applied to every surface that should look like physical paper.
// multiply blend mode layers the near-white grain over the cream base colour,
// darkening only where fibre texture exists — perfectly subtle.
const PAPER_STYLE: React.CSSProperties = {
  backgroundColor:   PAPER_BG,
  backgroundImage:   PAPER_TEXTURE,
  backgroundSize:    '520px',
  backgroundRepeat:  'repeat',
  backgroundBlendMode: 'multiply',
};

// ── Page styles ────────────────────────────────────────────────────────────────
type PageStyle = 'lined' | 'grid' | 'plain';
const DEFAULT_PAGE_STYLE: PageStyle = 'lined';

const PAGE_STYLE_OPTIONS: { id: PageStyle; icon: string; label: string }[] = [
  { id: 'lined', icon: '≡', label: 'Lined' },
  { id: 'grid',  icon: '⊞', label: 'Grid'  },
  { id: 'plain', icon: '□', label: 'Plain' },
];

// Returns the full CSS background properties for the writing textarea.
// Each style stacks ruling gradient(s) ON TOP of the paper texture so the
// grain shows through between lines — exactly like writing on real paper.
function getPageBgStyle(style: PageStyle): React.CSSProperties {
  switch (style) {
    case 'lined':
      return {
        backgroundColor:   PAPER_BG,
        backgroundImage:   `linear-gradient(transparent ${LINE_HEIGHT - 1}px, ${RULE_COLOR} ${LINE_HEIGHT - 1}px), ${PAPER_TEXTURE}`,
        backgroundSize:    `100% ${LINE_HEIGHT}px, 520px`,
        backgroundRepeat:  'repeat, repeat',
        backgroundAttachment: 'local, local',
        backgroundBlendMode: 'normal, multiply',
      };
    case 'grid':
      return {
        backgroundColor:   PAPER_BG,
        backgroundImage:   [
          `linear-gradient(${RULE_COLOR} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${RULE_COLOR} 1px, transparent 1px)`,
          PAPER_TEXTURE,
        ].join(', '),
        backgroundSize:    `${LINE_HEIGHT}px ${LINE_HEIGHT}px, ${LINE_HEIGHT}px ${LINE_HEIGHT}px, 520px`,
        backgroundRepeat:  'repeat, repeat, repeat',
        backgroundAttachment: 'local, local, local',
        backgroundBlendMode: 'normal, normal, multiply',
      };
    case 'plain':
      return {
        backgroundColor:   PAPER_BG,
        backgroundImage:   PAPER_TEXTURE,
        backgroundSize:    '520px',
        backgroundRepeat:  'repeat',
        backgroundAttachment: 'local',
        backgroundBlendMode: 'multiply',
      };
  }
}

// ── Fonts (handwriting options) ───────────────────────────────────────────────
const FONTS = [
  { id: 'caveat',       label: 'Caveat',       cssVar: 'var(--font-caveat)'       },
  { id: 'kalam',        label: 'Kalam',        cssVar: 'var(--font-kalam)'        },
  { id: 'indie-flower', label: 'Indie Flower', cssVar: 'var(--font-indie-flower)' },
  { id: 'patrick-hand', label: 'Patrick Hand', cssVar: 'var(--font-patrick-hand)' },
  { id: 'satisfy',      label: 'Satisfy',      cssVar: 'var(--font-satisfy)'      },
] as const;
type FontId = typeof FONTS[number]['id'];
const DEFAULT_FONT: FontId = 'caveat';

// ── Pen colours (Uniball Micro palette) ───────────────────────────────────────
const PEN_COLORS = [
  { id: 'black', label: 'Black',      hex: '#1A1A1A' },
  { id: 'grey',  label: 'Grey',       hex: '#6B7280' },
  { id: 'blue',  label: 'Blue',       hex: '#1740A8' },
  { id: 'green', label: 'Dark Green', hex: '#15592B' },
  { id: 'red',   label: 'Red',        hex: '#BE1B1B' },
] as const;

type PenColorId = typeof PEN_COLORS[number]['id'];
const DEFAULT_PEN: PenColorId = 'black';

// ── Moods ─────────────────────────────────────────────────────────────────────
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

function formatDateStamp(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

// ── Writing prompts shown when page is blank ──────────────────────────────────
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

  const [date, setDate]                 = useState(today);
  const [content, setContent]           = useState('');
  const [mood, setMood]                 = useState<number | null>(null);
  const [saveStatus, setSaveStatus]     = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLoading, setIsLoading]       = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [promptIndex]                   = useState(() => Math.floor(Math.random() * WRITING_PROMPTS.length));

  // Preferences (loaded from localStorage on client mount)
  const [penColor,  setPenColor]  = useState<PenColorId>(DEFAULT_PEN);
  const [pageStyle, setPageStyle] = useState<PageStyle>(DEFAULT_PAGE_STYLE);
  const [fontId,    setFontId]    = useState<FontId>(DEFAULT_FONT);

  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const saveTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved      = useRef<{ content: string; mood: number | null }>({ content: '', mood: null });
  // Always-fresh refs so the unmount cleanup never reads stale closure values
  const latestContent  = useRef(content);
  const latestMood     = useRef(mood);
  latestContent.current = content;
  latestMood.current    = mood;

  // Load preferences from localStorage (client-only, avoids hydration mismatch)
  useEffect(() => {
    const savedPen   = localStorage.getItem('journal_pen_color') as PenColorId | null;
    const savedPage  = localStorage.getItem('journal_page_style') as PageStyle | null;
    const savedFont  = localStorage.getItem('journal_font') as FontId | null;
    if (savedPen  && PEN_COLORS.find((c) => c.id === savedPen))              setPenColor(savedPen);
    if (savedPage && PAGE_STYLE_OPTIONS.find((s) => s.id === savedPage))     setPageStyle(savedPage);
    if (savedFont && FONTS.find((f) => f.id === savedFont))                  setFontId(savedFont);
  }, []);

  function selectPenColor(id: PenColorId) {
    setPenColor(id);
    localStorage.setItem('journal_pen_color', id);
    textareaRef.current?.focus();
  }

  function selectPageStyle(id: PageStyle) {
    setPageStyle(id);
    localStorage.setItem('journal_page_style', id);
    textareaRef.current?.focus();
  }

  function selectFont(id: FontId) {
    setFontId(id);
    localStorage.setItem('journal_font', id);
    textareaRef.current?.focus();
  }

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
    const next = mood === val ? null : val;
    setMood(next);
    scheduleAutoSave(content, next);
  }

  // Save on unmount / date change.
  // Uses latestContent/latestMood refs instead of closing over state directly,
  // so the cleanup always flushes whatever the user last typed — not a stale snapshot.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        void save(latestContent.current, latestMood.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const oldestAllowed = addDays(today, -30);
  const isToday  = date === today;
  const isFuture = date > today;
  const isPast30 = date <= oldestAllowed;
  const words    = wordCount(content);
  const prompt   = WRITING_PROMPTS[promptIndex] ?? WRITING_PROMPTS[0]!;

  const inkColor   = PEN_COLORS.find((c) => c.id === penColor)?.hex ?? '#1A1A1A';
  const fontCssVar = FONTS.find((f) => f.id === fontId)?.cssVar ?? 'var(--font-caveat)';

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ ...PAPER_STYLE }}
    >
      {/* ── Left: writing area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-3 gap-4"
          style={{
            ...PAPER_STYLE,
            borderBottom: '1px solid rgba(150,175,215,0.35)',
          }}
        >
          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate((d) => addDays(d, -1))}
              disabled={isPast30}
              className="font-hand text-xl px-2 py-1 rounded"
              style={{ color: isPast30 ? 'var(--color-paper-ruled)' : 'var(--color-ink-faint)' }}
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

          {/* Right: today button + save status */}
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
            <span className="font-body text-xs" style={{ color: 'var(--color-ink-faint)', minWidth: '48px' }}>
              {saveStatus === 'saving' ? '✏️ Saving…' :
               saveStatus === 'saved'  ? '✓ Saved'   :
               saveStatus === 'error'  ? '⚠ Error'   : ''}
            </span>
          </div>
        </div>

        {/* Calendar dropdown */}
        {showCalendar && (
          <div
            className="absolute z-30 mt-14 ml-6 shadow-lg"
            style={{ top: 'auto' }}
          >
            <EntryCalendar
              selectedDate={date}
              oldestDate={oldestAllowed}
              onSelect={(d) => { setDate(d); setShowCalendar(false); }}
            />
          </div>
        )}

        {/* ── The journal page itself ──────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ ...PAPER_STYLE }}
        >
          <div className="max-w-2xl mx-auto px-6 py-8">

            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-3 animate-pulse">
                {[100, 85, 93, 70, 88].map((w, i) => (
                  <div
                    key={i}
                    className="rounded"
                    style={{ height: '22px', width: `${w}%`, backgroundColor: RULE_COLOR }}
                  />
                ))}
              </div>
            )}

            {/* Writing surface */}
            {!isLoading && (
              <div className="relative">

                {/* Red margin line — lined style only */}
                {pageStyle === 'lined' && (
                  <div
                    className="absolute top-0 bottom-0"
                    style={{
                      left: '44px',
                      width: '1px',
                      backgroundColor: MARGIN_COLOR,
                      pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                  />
                )}

                {/* Placeholder prompt */}
                {content === '' && !isFuture && (
                  <p
                    className="absolute pointer-events-none font-hand"
                    style={{
                      top: '4px',
                      left: pageStyle === 'lined' ? '52px' : '20px',
                      color: 'rgba(100,116,139,0.45)',
                      fontSize: '19px',
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
                      color: 'rgba(100,116,139,0.4)',
                      fontSize: '18px',
                    }}
                    aria-hidden="true"
                  >
                    ✦ This page is waiting for you ✦
                  </p>
                )}

                {/* ── Textarea ── */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  disabled={isFuture}
                  spellCheck
                  autoFocus={isToday}
                  className="w-full outline-none resize-none"
                  style={{
                    ...getPageBgStyle(pageStyle),

                    fontFamily: fontCssVar,
                    fontSize: '19px',
                    fontWeight: '400',
                    lineHeight: `${LINE_HEIGHT}px`,
                    letterSpacing: '-0.01em',
                    color: inkColor,

                    paddingLeft: pageStyle === 'lined' ? '52px' : '20px',
                    paddingRight: '20px',
                    paddingTop: '4px',
                    paddingBottom: `${LINE_HEIGHT * 6}px`,
                    minHeight: `${LINE_HEIGHT * 18}px`,

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

        {/* ── Bottom bar ──────────────────────────────────────────────────────── */}
        {!isLoading && (
          <div
            className="flex-shrink-0 flex items-center justify-between px-6 py-3 gap-4 flex-wrap"
            style={{
              ...PAPER_STYLE,
              borderTop: '1px solid rgba(150,175,215,0.35)',
            }}
          >
            {/* Left group: pen colour + page style */}
            <div className="flex items-center gap-4">

              {/* Pen colour picker */}
              <div className="flex items-center gap-2">
                <span className="font-body text-xs" style={{ color: 'var(--color-ink-faint)' }}>
                  Pen
                </span>
                {PEN_COLORS.map(({ id, label, hex }) => (
                  <button
                    key={id}
                    onClick={() => selectPenColor(id)}
                    title={label}
                    aria-label={label}
                    aria-pressed={penColor === id}
                    className="rounded-full transition-transform"
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: hex,
                      border: penColor === id ? `2px solid ${hex}` : '2px solid transparent',
                      outline: penColor === id ? `2px solid ${hex}` : '2px solid transparent',
                      outlineOffset: '2px',
                      transform: penColor === id ? 'scale(1.2)' : 'scale(1)',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>

              {/* Divider */}
              <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(150,175,215,0.4)' }} />

              {/* Page style selector */}
              <div className="flex items-center gap-1">
                <span className="font-body text-xs mr-1" style={{ color: 'var(--color-ink-faint)' }}>
                  Page
                </span>
                {PAGE_STYLE_OPTIONS.map(({ id, icon, label }) => (
                  <button
                    key={id}
                    onClick={() => selectPageStyle(id)}
                    title={label}
                    aria-label={label}
                    aria-pressed={pageStyle === id}
                    className="font-hand transition-all"
                    style={{
                      fontSize: '14px',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: pageStyle === id ? 'var(--color-accent-light)' : 'transparent',
                      color: pageStyle === id ? 'var(--color-accent)' : 'var(--color-ink-faint)',
                      border: pageStyle === id ? '1px solid var(--color-accent)' : '1px solid transparent',
                      borderRadius: '4px',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Centre: mood selector */}
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

            {/* Right group: font picker + word count */}
            <div className="flex items-center gap-3">

              {/* Font picker — "Aa" in each font's own typeface */}
              <div className="flex items-center gap-1">
                <span className="font-body text-xs mr-1" style={{ color: 'var(--color-ink-faint)' }}>
                  Font
                </span>
                {FONTS.map(({ id, label, cssVar }) => (
                  <button
                    key={id}
                    onClick={() => selectFont(id)}
                    title={label}
                    aria-label={label}
                    aria-pressed={fontId === id}
                    className="transition-all"
                    style={{
                      fontFamily: cssVar,
                      fontSize: '14px',
                      lineHeight: 1,
                      padding: '3px 6px',
                      borderRadius: '4px',
                      backgroundColor: fontId === id ? 'var(--color-accent-light)' : 'transparent',
                      color: fontId === id ? 'var(--color-accent)' : 'var(--color-ink-faint)',
                      border: fontId === id ? '1px solid var(--color-accent)' : '1px solid transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Aa
                  </button>
                ))}
              </div>

              {/* Word count */}
              <span className="font-hand text-sm" style={{ color: 'var(--color-ink-faint)' }}>
                {words} {words === 1 ? 'word' : 'words'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Right sidebar: calendar (desktop only) ───────────────────────────── */}
      <aside
        className="hidden xl:flex flex-col gap-4 p-5 flex-shrink-0"
        style={{
          ...PAPER_STYLE,
          width: '220px',
          borderLeft: '1px solid rgba(150,175,215,0.35)',
        }}
      >
        <p className="font-hand text-base" style={{ color: 'var(--color-ink-faint)' }}>
          ✦ Entries
        </p>
        <EntryCalendar
          selectedDate={date}
          oldestDate={oldestAllowed}
          onSelect={setDate}
        />

        <div
          className="mt-auto p-3 rounded-lg"
          style={{
            backgroundColor: 'rgba(150,175,215,0.1)',
            border: '1px solid rgba(150,175,215,0.3)',
          }}
        >
          <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--color-ink-faint)' }}>
            Dots mark days you&apos;ve written. Click any date to revisit it.
          </p>
        </div>
      </aside>
    </div>
  );
}
