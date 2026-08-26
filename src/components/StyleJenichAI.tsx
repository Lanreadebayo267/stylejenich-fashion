import { FormEvent, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const STARTER_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Welcome to StyleJenich Fashion. I’m your fashion concierge. Tell me the occasion, style, or outfit you have in mind and I’ll help you find the right look.",
};

const QUICK_PROMPTS = [
  'I need an outfit for a wedding',
  'What formal wear do you offer?',
  'Tell me about custom designs',
  'How can I book a consultation?',
];

function StyleJenichAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([STARTER_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text = input) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage: Message = { role: 'user', content };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Unable to reach the AI assistant.');
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.message || 'I’m sorry, I could not respond right now.' },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setMessages((current) => [...current, { role: 'assistant', content: message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const resetChat = () => {
    setMessages([STARTER_MESSAGE]);
    setInput('');
  };

  return (
    <>
      <button
        className="sj-ai-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open StyleJenich AI fashion concierge"
      >
        <span className="sj-ai-trigger-icon">✦</span>
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
            <header className="sj-ai-header">
              <div>
                <span className="sj-ai-eyebrow">Your Fashion Concierge</span>
                <h2>StyleJenich AI</h2>
              </div>
              <div className="sj-ai-header-actions">
                <button type="button" onClick={resetChat} aria-label="Start a new chat">
                  ↻
                </button>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
                  ×
                </button>
              </div>
            </header>

            <div className="sj-ai-messages" aria-live="polite">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`sj-ai-message ${message.role}`}>
                  {message.content}
                </div>
              ))}
              {loading && <div className="sj-ai-message assistant sj-ai-typing">Thinking...</div>}
            </div>

            {messages.length === 1 && (
              <div className="sj-ai-quick-prompts">
                {QUICK_PROMPTS.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => void sendMessage(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form className="sj-ai-form" onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about styles, occasions, or consultations..."
                aria-label="Message StyleJenich AI"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">
                ↑
              </button>
            </form>
            <p className="sj-ai-disclaimer">AI assistance • For confirmed prices and appointments, contact StyleJenich.</p>
          </section>
        </div>
      )}
    </>
  );
}

export default StyleJenichAI;
