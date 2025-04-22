// code-explainer/src/app/api/detect-language/route.js
import { NextResponse } from 'next/server';

// Define OpenRouter API details
const OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free"; // Using Claude 3 Opus for detection

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code || code.trim().length < 10) { // Add a basic check for minimum code length
      return NextResponse.json({ error: 'Code snippet is too short or missing.' }, { status: 400 });
    }

    // IMPORTANT: Use OPENROUTER_API_KEY in your .env.local file
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error("OpenRouter API Key not found. Please set OPENROUTER_API_KEY environment variable.");
        return NextResponse.json({ error: 'Server configuration error: Missing API Key.' }, { status: 500 });
    }

    // Limit the code sent for detection
    const snippet = code.substring(0, 2000);

    const systemPrompt = `Identify the primary programming language of the following code snippet. Respond with only the name of the language (e.g., Python, JavaScript, Java).`;
    const userPrompt = `Code Snippet:\n\`\`\`\n${snippet}\n\`\`\``;


    const apiResponse = await fetch(OPENROUTER_API_ENDPOINT, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            // Recommended headers by OpenRouter
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", // Set your app URL in .env.local
            "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "Code Explainer", // Set your app name in .env.local
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 20, // Limit response size for language name
            temperature: 0.1, // Low temperature for deterministic output
        }),
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error("OpenRouter API Error:", apiResponse.status, errorBody);
        throw new Error(`OpenRouter API request failed: ${apiResponse.statusText}`);
    }

    const result = await apiResponse.json();

    let detectedLanguage = "Unknown"; // Default
    if (result.choices && result.choices.length > 0 && result.choices[0].message?.content) {
        detectedLanguage = result.choices[0].message.content.trim();
    } else {
        console.warn("Could not extract language from OpenRouter response. Full response object:", result);
    }

    // --- Keep the existing validation/cleanup ---
    if (detectedLanguage.includes('\n')) {
        detectedLanguage = detectedLanguage.split('\n')[0].trim();
    }
    const commonLanguages = ["Python", "JavaScript", "Java", "C++", "C#", "Go", "Ruby", "PHP", "Swift", "Kotlin", "TypeScript", "Unknown"];
    const foundLang = commonLanguages.find(lang => lang.toLowerCase() === detectedLanguage.toLowerCase());
    detectedLanguage = foundLang || detectedLanguage;
    // --- End of validation/cleanup ---

    return NextResponse.json({ suggestedLanguage: detectedLanguage });

  } catch (error) {
    console.error("Error in /api/detect-language:", error);
    return NextResponse.json({ error: 'Failed to detect language.' }, { status: 500 });
  }
}