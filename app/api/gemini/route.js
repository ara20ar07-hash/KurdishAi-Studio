import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    // Ensure the key exists in environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is missing in .env.local" }, { status: 500 });
    }

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: body.system || "You are a helpful assistant." }]
      },
      contents: [{
        parts: [{ text: body.messages[0].content }]
      }],
      generationConfig: {
        maxOutputTokens: body.max_tokens || 8000,
      }
    };

    // Passing the key as a query parameter securely from the backend server
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
      return NextResponse.json({ error: data }, { status: response.status });
    }

    // Safely parse out the text response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text generated.";
    return NextResponse.json({ content: [{ text: generatedText }] });
    
  } catch (error) {
    console.error("Server Bridge Error:", error);
    return NextResponse.json({ error: "Failed to connect to Gemini API" }, { status: 500 });
  }
}