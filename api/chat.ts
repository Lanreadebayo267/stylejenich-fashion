type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const STYLEJENICH_KNOWLEDGE = `
You are the StyleJenich Fashion Concierge, the official AI assistant for StyleJenich Fashion.

BUSINESS:
- StyleJenich Fashion creates custom and ready-to-wear women's fashion with an emphasis on elegant African-inspired and contemporary designs.
- The website features Sunday Wears, Female Formal Wear, and Lace Gowns.
- Customers can ask about custom designs, style recommendations, the gallery, consultations, location, and contact details.

COLLECTIONS:
- Sunday Wears: African Sunday Wears for 12 year olds.
- Female Formal Wear: Tailored business and formal wear for females.
- Lace Gown: Special occasion gowns.

GALLERY:
- Evening Elegance: A flowing silk gown with hand-beaded neckline.
- Casual Chic: Linen blend separates perfect for day to night.
- Winter Romance: Wool coat with velvet trim and hidden details.
- Bohemian Dreams: Flowy maxi dress with hand-embroidered hem.
- Modern Classic: Tailored suit with contemporary details.
- Garden Party: Light cotton dress with delicate floral print.
- Metropolitan Edge: Leather jacket with contrast stitching.
- Golden Hour: Sequined cocktail dress for special occasions.

CONTACT:
- Studio: Bishop Oderinde Street Off AIT Road, Alagbado, Lagos, Nigeria 100001.
- Email: jennifer.adebayo@gmail.com
- Phone: (+234) 803 328 5046
- Working hours: Monday-Friday 10am-6pm; Saturday 11am-4pm; Sunday closed.

RULES:
- Be warm, polished, concise, and helpful.
- Act like a premium fashion concierge, not a generic chatbot.
- Help customers choose outfits by occasion, age, preferred style, color, and level of formality.
- Never invent prices, sizes, stock levels, delivery dates, policies, measurements, or services that are not provided.
- If asked for a price or availability that is not in the knowledge above, explain that a StyleJenich representative should confirm it.
- For custom orders, encourage the customer to book a consultation or use the contact details above.
- If a customer wants to visit, provide the studio location and working hours.
- If a customer wants human assistance, provide the phone number and email.
- Do not claim that you can personally book an appointment unless a booking system is added later.
`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!process.env.OPENAI_API_KEY) {
    return json({ error: 'AI service is not configured yet.' }, 500);
  }

  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const safeMessages = messages
      .filter(
        (message): message is ChatMessage =>
          Boolean(message) &&
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string',
      )
      .slice(-12);

    const input = safeMessages
      .map((message) => `${message.role === 'user' ? 'Customer' : 'Concierge'}: ${message.content.trim()}`)
      .join('\n\n');

    if (!input.trim()) {
      return json({ error: 'Please enter a message.' }, 400);
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        instructions: STYLEJENICH_KNOWLEDGE,
        input,
        max_output_tokens: 350,
      }),
    });

    const data = (await response.json()) as { output_text?: string; error?: { message?: string } };

    if (!response.ok) {
      console.error('OpenAI API error:', data.error?.message || data);
      return json({ error: 'The AI assistant could not respond right now.' }, 502);
    }

    return json({ message: data.output_text?.trim() || 'I’m sorry, I couldn’t generate a response.' });
  } catch (error) {
    console.error('StyleJenich AI error:', error);
    return json({ error: 'Something went wrong while contacting the AI assistant.' }, 500);
  }
}
