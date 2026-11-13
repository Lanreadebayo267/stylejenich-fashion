import { FormEvent, ReactElement, useEffect, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  time: string;
  error?: boolean;
};

const CONTACT = {
  phoneHref: 'tel:+2348033285046',
  email: 'jennifer.adebayo@gmail.com',
  address: 'Bishop Oderinde Street Off AIT Road, Alagbado, Lagos, Nigeria 100001',
};

const MAP_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}`;

const QUICK_PROMPTS = [
  'How do I place a custom order?',
  'What do you need to quote my outfit?',
  'How does payment work?',
  'Do you deliver to my city?',
];

const now = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const makeStarter = (): Message => ({
  role: 'assistant',
  content:
    'Welcome to StyleJenich Fashion. Tell me the occasion, style or outfit you have in mind and I’ll help you find the right look.',
  time: now(),
});

type IconName = 'refresh' | 'close' | 'phone' | 'mail' | 'pin' | 'send';

/** Small inline icons, so the widget does not depend on an icon font loading. */
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactElement> = {
    refresh: (
      <>
        <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
        <path d="M21 3v5h-5" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
  };

  return (
    <svg
      className="sj-ai-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/** Renders **bold** text without using innerHTML. */
function renderInline(text: string): Array<string | ReactElement> {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.length > 4 && part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

/** Turns plain assistant text into paragraphs and bullet lists. */
function MessageBody({ text }: { text: string }) {
  const blocks: ReactElement[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(paragraph.join(' '))}</p>);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {list.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const rawLine of text.replace(/\r/g, '').split('\n')) {
    const line = rawLine.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);

    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
    } else if (!line) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }

  flushParagraph();
  flushList();

  return <>{blocks}</>;
}

function StyleJenichAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [makeStarter()]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, loading, open]);

  // Put the cursor in the message box when the chat opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape closes the chat.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const requestReply = async (history: Message[]) => {
    setLoading(true);

    try {
      const payload = history
        .filter((message) => !message.error)
        .map(({ role, content }) => ({ role, content }));

      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
      const response = await fetch(`${apiBaseUrl}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      });

      let data: { message?: string; error?: string } = {};
      try {
        data = (await response.json()) as { message?: string; error?: string };
      } catch {
        // The server answered with something that is not JSON.
      }

      if (!response.ok) {
        throw new Error(data.error || 'The assistant could not be reached.');
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.message || 'Sorry, I could not respond just now. Please try again.',
          time: now(),
        },
      ]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Something went wrong.';
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `${reason} Try again, or reach the team with the buttons above.`,
          time: now(),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (text = input) => {
    const content = text.trim();
    if (!content || loading) return;

    const next: Message[] = [...messages, { role: 'user', content, time: now() }];
    setMessages(next);
    setInput('');
    void requestReply(next);
  };

  const retry = () => {
    if (loading) return;
    const history = messages.filter((message) => !message.error);
    setMessages(history);
    void requestReply(history);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage();
  };

  const resetChat = () => {
    setMessages([makeStarter()]);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <>
      <button
        className="sj-ai-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open StyleJenich AI fashion concierge"
      >
        <span className="sj-ai-trigger-icon" aria-hidden="true">
          ✦
        </span>
        <span>StyleJenich AI</span>
      </button>

      {open && (
        <div className="sj-ai-overlay" role="presentation" onClick={() => setOpen(false)}>
          <section
            className="sj-ai-panel"
            role="dialog"
            aria-modal="true"
            aria-label="StyleJenich AI fashion concierge"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Plain divs on purpose: the site styles <header> and <nav> globally. */}
            <div className="sj-ai-header">
              <div className="sj-ai-brand">
                <span className="sj-ai-monogram" aria-hidden="true">
                  SJ
                </span>
                <div>
                  <h2>StyleJenich AI</h2>
                  <p>Ask about orders, fittings and delivery</p>
                </div>
              </div>
              <div className="sj-ai-header-actions">
                <button type="button" onClick={resetChat} aria-label="Start a new chat" title="New chat">
                  <Icon name="refresh" />
                </button>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" title="Close">
                  <Icon name="close" />
                </button>
              </div>
            </div>

            <div className="sj-ai-stitch" aria-hidden="true" />

            <div className="sj-ai-team" role="group" aria-label="Contact the StyleJenich team">
              <a href={CONTACT.phoneHref}>
                <Icon name="phone" />
                Call
              </a>
              <a href={`mailto:${CONTACT.email}`}>
                <Icon name="mail" />
                Email
              </a>
              <a href={MAP_HREF} target="_blank" rel="noopener noreferrer">
                <Icon name="pin" />
                Directions
              </a>
            </div>

            <div className="sj-ai-messages" aria-live="polite">
              {messages.map((message, index) => {
                const isLast = index === messages.length - 1;
                return (
                  <div key={`${message.role}-${index}`} className={`sj-ai-row ${message.role}`}>
                    <div className={`sj-ai-message ${message.role}${message.error ? ' error' : ''}`}>
                      <MessageBody text={message.content} />
                      {message.error && isLast && (
                        <button type="button" className="sj-ai-retry" onClick={retry} disabled={loading}>
                          <Icon name="refresh" />
                          Try again
                        </button>
                      )}
                    </div>
                    <span className="sj-ai-time">{message.time}</span>
                  </div>
                );
              })}

              {loading && (
                <div className="sj-ai-row assistant">
                  <div className="sj-ai-message assistant sj-ai-typing" role="status" aria-label="The assistant is typing">
                    <span className="sj-ai-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {messages.length === 1 && (
              <div className="sj-ai-quick-prompts">
                {QUICK_PROMPTS.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form className="sj-ai-form" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about styles, orders or delivery"
                aria-label="Message StyleJenich AI"
                maxLength={500}
                autoComplete="off"
                enterKeyHint="send"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">
                <Icon name="send" />
              </button>
            </form>
            <p className="sj-ai-disclaimer">Replies come from an AI assistant. The team confirms prices and dates.</p>
          </section>
        </div>
      )}
    </>
  );
}

export default StyleJenichAI;