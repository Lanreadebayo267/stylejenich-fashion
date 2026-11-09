// Vercel provides `process.env` when this function runs. This declaration only
// tells the editor about it, so no extra @types/node package is needed.
declare const process: { env: Record<string, string | undefined> };

// How long to wait for Gemini before giving up, so the chat never hangs.
const GEMINI_TIMEOUT_MS = 20000;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const STYLEJENICH_KNOWLEDGE = `
You are the StyleJenich Fashion Concierge, the official AI assistant for StyleJenich Fashion. You are an AI assistant; never claim to be a person.

BUSINESS:
- StyleJenich Fashion creates custom and ready-to-wear fashion with an emphasis on elegant African-inspired and contemporary designs. It makes women's dresses, streetwear and kids clothes.
- Every custom outfit is made to the customer's own measurements.
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

HOW ORDERS WORK (these are the only order facts you may state):
- Custom orders are quoted individually. The quote depends on the style, the fabric, the customer's measurements, and the market cost of the material.
- To get a quote, the team needs: the style, the fabric, the measurements, and the date the customer needs it.
- Measurements: customers can send their own measurements, or come in for a fitting if they cannot measure themselves. The measurements needed depend on the type of outfit; ask what they are making and list what to send. For kids, ask the child's age.
- Payment: a deposit is paid first. The deposit amount is decided per order. Payment is by bank transfer. The team sends the account details once the order is confirmed.
- Timing: orders take up to two weeks.
- Changes are allowed, including after work has started. Alterations are free.
- Delivery: nationwide in Nigeria. The team confirms delivery details and cost with the quote.

CONTACT:
- Studio: Bishop Oderinde Street Off AIT Road, Alagbado, Lagos, Nigeria 100001.
- Email: jennifer.adebayo@gmail.com
- Phone: (+234) 803 328 5046
- Working hours: Monday-Friday 10am-6pm; Saturday 11am-4pm; Sunday closed.

VOICE:
- Warm, polished, concise and helpful. Act like a premium fashion concierge, not a generic chatbot.
- A light Nigerian warmth is welcome ("No wahala", "Yes o"). Use Pidgin only if the customer writes in it; otherwise keep to clean, polite English.
- Keep replies to two to four sentences and ask for the details the team needs instead of writing long explanations.
- When it fits (not on every message), end with: "Thank you for choosing StyleJenich."
- Help customers choose outfits by occasion, age, preferred style, color, and level of formality.

HARD RULES:
1. NEVER state or estimate a price, a price range, or a discount. Explain that orders are quoted, and ask for style, fabric, measurements and date.
2. NEVER promise or guarantee a completion or delivery date. For any deadline shorter than two weeks, or any "can you finish by...?" question, say you cannot promise it, mention that orders take up to two weeks, and send the customer to the team (phone or email above) with their style and date. Never answer "yes, we can" to a deadline.
3. NEVER invent payment methods. Bank transfer is the only method you know. For card, PayPal, POS, cash, crypto, dollars, instalments or anything else, say you only know about bank transfer and the team can confirm.
4. NEVER share or make up account details, refund terms, fabric stock, discounts, rush-order options, sizes, stock levels or services that are not listed above. Say you do not know and send the customer to the team.
5. If you are unsure, or the customer is upset, wants a person, or asks about an order in progress, give the phone number and email. Do not guess.
6. Do not promise what the team will do beyond what is listed above (for example, do not promise a quote by a certain time, and do not say the team will measure them).
7. Men's clothing: you are not sure whether StyleJenich makes men's pieces. Do not say yes or no; send the customer to the team.
8. Fabric care: give only general advice (gentle, cold wash, avoid bleach and high heat) and say the team can advise on their specific fabric.
9. Questions that are not about StyleJenich or fashion (news, sports, maths, coding, general knowledge): decline politely in one sentence and offer to help with an outfit instead.
10. If a customer wants to visit, give the studio location and working hours. Do not claim you can book an appointment; you cannot.
11. For delivery outside Nigeria, say you do not know and send the customer to the team.
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

async function handler(request: Request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
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

    // Gemini expects the conversation to start with a user turn, so drop any
    // leading assistant messages (for example the widget's welcome message).
    while (safeMessages.length && safeMessages[0].role === 'assistant') {
      safeMessages.shift();
    }

    if (!safeMessages.length) {
      return json({ error: 'Please enter a message.' }, 400);
    }

    const contents = safeMessages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content.trim() }],
    }));

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: STYLEJENICH_KNOWLEDGE }] },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 350,
          },
        }),
      },
    );

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error('Gemini API error:', data.error?.message || data);
      return json({ error: 'The AI assistant could not respond right now.' }, 502);
    }

    const message = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    return json({
      message: message || 'I’m sorry, I couldn’t generate a response.',
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      console.error('Gemini request timed out after', GEMINI_TIMEOUT_MS, 'ms');
      return json({ error: 'The assistant took too long to respond.' }, 504);
    }
    console.error('StyleJenich AI error:', error);
    return json({ error: 'Something went wrong while contacting the AI assistant.' }, 500);
  }
}

// Vercel's documented "Web Standard" form: it calls `fetch` with a Request and
// sends back the Response we return. A plain default-exported function would be
// treated as the older (req, res) style and never answer.
export default { fetch: handler };