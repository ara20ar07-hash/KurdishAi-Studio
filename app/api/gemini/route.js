import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    // 1. FIX: Check BOTH env variable names so it never comes up empty
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is completely missing from your environment setup." }, { status: 500 });
    }

    // 2. FIX: Fallback safety so it doesn't crash if body.messages is empty
    const promptText = body.messages?.[0]?.content || body.prompt || body.text || "Generate a presentation";

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: body.system || "You are a helpful assistant." }]
      },
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        maxOutputTokens: body.max_tokens || 8000,
      }
    };

    // Passing the key securely from the backend server
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(geminiPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error Response:", data);
      return NextResponse.json({ error: data.error?.message || data }, { status: response.status });
    }

    // Safely parse out the text response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text generated.";
    return NextResponse.json({ content: [{ text: generatedText }] });
    
  } catch (error) {
    console.error("Server Bridge Error:", error);
    // 3. FIX: Send the actual error message back to the browser so we can read it
    return NextResponse.json({ error: "Failed to connect to Gemini API", details: error.message }, { status: 500 });
  }
}