'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_PROMPTS = [
  "How am I doing this week?",
  "Help me stay consistent with my habits.",
  "I'm struggling with motivation today.",
  "What should I focus on right now?",
];

export default function CoachingChat() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError]           = useState('');
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const inputRef                    = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setError('');
    const userMessage: Message = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsStreaming(true);

    // Placeholder for streaming assistant response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        // Update the last (assistant) message in state
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: accumulated },
        ]);
      }
    } catch (err) {
      setError('Could not reach the coach. Please try again.');
      // Remove empty placeholder
      setMessages((prev) => prev.slice(0, -1));
      console.error('[CoachingChat]', err);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 64px)' }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-paper-ruled)' }}
      >
        <h1 className="font-hand text-2xl" style={{ color: 'var(--color-ink)' }}>
          💬 Coaching Chat
        </h1>
        <p className="font-body text-xs mt-0.5" style={{ color: 'var(--color-ink-faint)' }}>
          Your AI habit coach — ask anything about your habits, goals, or routine.
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center pb-10">
            {/* Welcome */}
            <div>
              <p className="font-hand text-3xl mb-1" style={{ color: 'var(--color-accent)' }}>
                ✦
              </p>
              <p className="font-hand text-xl" style={{ color: 'var(--color-ink)' }}>
                Hey — I'm your coach.
              </p>
              <p className="font-body text-sm mt-1" style={{ color: 'var(--color-ink-faint)' }}>
                Ask me anything about your habits, goals, or how to make progress today.
              </p>
            </div>

            {/* Starter prompts */}
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void sendMessage(prompt)}
                  className="font-body text-sm px-4 py-2.5 rounded-xl text-left transition-colors"
                  style={{
                    backgroundColor: 'var(--color-paper-dark)',
                    border: '1.5px solid var(--color-paper-ruled)',
                    color: 'var(--color-ink)',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Assistant avatar dot */}
            {msg.role === 'assistant' && (
              <div
                className="flex-shrink-0 flex items-end justify-center mr-2 mb-1"
                aria-hidden="true"
              >
                <div
                  className="rounded-full flex items-center justify-center font-hand text-xs"
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'var(--color-accent)',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  ✦
                </div>
              </div>
            )}

            <div
              className="max-w-[78%] px-4 py-2.5 rounded-2xl"
              style={
                msg.role === 'user'
                  ? {
                      backgroundColor: 'var(--color-accent)',
                      color: '#ffffff',
                      borderBottomRightRadius: '4px',
                    }
                  : {
                      backgroundColor: 'var(--color-paper-dark)',
                      border: '1px solid var(--color-paper-ruled)',
                      color: 'var(--color-ink)',
                      borderBottomLeftRadius: '4px',
                    }
              }
            >
              {msg.content === '' && isStreaming ? (
                /* Typing indicator */
                <span className="flex items-center gap-1 py-1" aria-label="Typing">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="rounded-full"
                      style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: 'var(--color-ink-faint)',
                        animation: `bounce 1.2s ease-in-out ${dot * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </span>
              ) : (
                <p
                  className="font-body text-sm whitespace-pre-wrap leading-relaxed"
                  style={{
                    color: msg.role === 'user' ? '#ffffff' : 'var(--color-ink)',
                  }}
                >
                  {msg.content}
                  {/* Streaming cursor on last assistant message */}
                  {msg.role === 'assistant' && isStreaming && i === messages.length - 1 && (
                    <span
                      className="inline-block ml-px align-middle"
                      style={{
                        width: '2px',
                        height: '1em',
                        backgroundColor: 'var(--color-ink-faint)',
                        animation: 'blink 0.9s step-end infinite',
                      }}
                      aria-hidden="true"
                    />
                  )}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Error */}
        {error && (
          <p className="text-center font-body text-sm" style={{ color: '#C0392B' }}>
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{ borderTop: '1px solid var(--color-paper-ruled)', backgroundColor: 'var(--color-paper)' }}
      >
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach anything…  (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 font-body text-sm px-4 py-2.5 rounded-xl outline-none resize-none"
            style={{
              backgroundColor: 'var(--color-paper-dark)',
              border: '1.5px solid var(--color-paper-ruled)',
              color: 'var(--color-ink)',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={() => void sendMessage(input)}
            disabled={isStreaming || !input.trim()}
            className="flex-shrink-0 font-body text-sm px-4 py-2.5 rounded-xl"
            style={{
              backgroundColor:
                isStreaming || !input.trim() ? 'var(--color-paper-ruled)' : 'var(--color-accent)',
              color: isStreaming || !input.trim() ? 'var(--color-ink-faint)' : '#ffffff',
              cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            {isStreaming ? '…' : 'Send'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
