import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    const apiKey =
      body.customKey ||
      process.env.GROQ_API_KEY ||
      process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Groq API key is missing. Add GROQ_API_KEY to your .env.local or paste it in Settings.' },
        { status: 500 }
      );
    }

    const systemText = body.system || 'You are a helpful assistant.';
    const userText =
      body.messages?.[0]?.content || body.prompt || body.text || 'Generate a presentation';

    const groqPayload = {
      model: body.model || 'llama-3.3-70b-versatile',   // fast + large context
      messages: [
        { role: 'system', content: systemText },
        { role: 'user',   content: userText },
      ],
      max_tokens:   body.max_tokens || 2000,
      temperature:  body.temperature ?? 0.7,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(groqPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API Error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Groq API error', details: data },
        { status: response.status }
      );
    }

    const generatedText =
      data.choices?.[0]?.message?.content || 'No response generated.';

    // Return in the same shape page.tsx already expects
    return NextResponse.json({ content: [{ text: generatedText }] });

  } catch (error) {
    console.error('Groq Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Groq API', details: error.message },
      { status: 500 }
    );
  }
}
