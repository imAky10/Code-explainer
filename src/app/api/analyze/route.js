// code-explainer/src/app/api/analyze/route.js
import { NextResponse } from 'next/server';

// Define OpenRouter API details
const OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL_LANGUAGE_MISMATCH = "google/gemini-2.0-flash-exp:free"; // Or your preferred Gemini model on OpenRouter
const OPENROUTER_MODEL_ANALYSIS = "google/gemini-2.0-flash-exp:free"; // Using a free model for analysis

export async function POST(request) {
  try {
    const { code, language, detailLevel, languageManuallySelected } = await request.json(); // Get flags

    // Add check for detailLevel
    if (!code || !language || !detailLevel) {
      // Use a more specific error message for missing input
      return NextResponse.json({ error: 'Missing required fields: code, language, or detail level.' }, { status: 400 });
    }

    // IMPORTANT: Use OPENROUTER_API_KEY in your .env.local file
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OpenRouter API Key not found. Please set OPENROUTER_API_KEY environment variable.");
      // Specific error for missing API key
      return NextResponse.json({ error: 'API Key is missing. Please configure the server environment.' }, { status: 500 });
    }

    // Determine explanation instructions based on detailLevel
    let explanationInstructions = "";
    if (detailLevel === 'detailed') {
      explanationInstructions = `
    *   Provide a **detailed, step-by-step breakdown** of the code's functionality.
    *   Explain the purpose of each major block, function, or class.
    *   Describe the logic flow, key variables, data structures, and algorithms used.
    *   Mention potential edge cases or important assumptions made by the code.
    *   Use markdown formatting (headings, subheadings, lists, code blocks) extensively for clarity.`;
    } else { // Default to summary
      explanationInstructions = `
    *   Provide a **brief, high-level summary** of what the code does (e.g., 2-4 sentences).
    *   Focus *only* on the main purpose and overall functionality.
    *   Avoid going into step-by-step details or explaining individual lines unless absolutely necessary for the summary.
    *   Use minimal markdown formatting (perhaps a short list if needed).`;
    }

    // --- Condition 3: Pre-analysis Language Mismatch Check (Conditional) ---
    if (languageManuallySelected) {
      console.log(`User manually selected ${language}, performing pre-analysis language check...`);
      // Use the original language detection prompt for the pre-check
      const languageCheckPrompt = `Identify the primary programming language of the following code snippet. Respond with only the name of the language (e.g., Python, JavaScript, Java). If the language cannot be determined confidently, respond with "Unknown".`;
      const languageCheckMessages = [
          { role: "system", content: languageCheckPrompt },
          { role: "user", content: `\`\`\`\n${code.substring(0, 1000)}\n\`\`\`` }
      ];

      const langCheckResponse = await fetch(OPENROUTER_API_ENDPOINT, {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
              "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "Code Explainer - Lang Check",
          },
          body: JSON.stringify({
              model: OPENROUTER_MODEL_LANGUAGE_MISMATCH, // Use the same model or a faster one if preferred
              messages: languageCheckMessages,
              max_tokens: 20, // Allow slightly more tokens for language name
              temperature: 0.1,
          }),
      });

      if (!langCheckResponse.ok) {
          // If the check itself fails, proceed but log warning
          console.warn("Language check API call failed. Proceeding with user-selected language anyway.");
      } else {
          const langCheckResult = await langCheckResponse.json();
          const preCheckDetectedLang = langCheckResult.choices?.[0]?.message?.content?.trim();

          // Compare pre-check result with user-selected language (case-insensitive)
          if (preCheckDetectedLang && preCheckDetectedLang.toLowerCase() !== "unknown" && preCheckDetectedLang.toLowerCase() !== language.toLowerCase()) {
               return NextResponse.json({ error: `The code language appears to be ${preCheckDetectedLang}, which differs from the selected language (${language}). Please double-check your selection.` }, { status: 400 });
          }
          // Proceed if languages match, or if pre-check was inconclusive ("Unknown", empty, etc.)
      }
    } else {
        console.log(`Proceeding with suggested/default language ${language}. Skipping pre-analysis check.`);
    }
    // --- End of Language Mismatch Check ---


    // Refined system prompt incorporating detail instructions
    const systemPrompt = `You are an expert code explainer. Analyze the following ${language} code snippet. Provide ONLY the explanation based on the requested detail level.

**Explanation:**
${explanationInstructions}

*   Structure the explanation using clear headings and subheadings where appropriate (especially for detailed explanations).
*   Use bullet points for lists of functionalities, steps, or features.
*   If relevant, include brief code snippets within the explanation using markdown code blocks to illustrate specific points.
*   Format the entire explanation using Markdown for readability.
*   When referring to specific code elements (like variable names, function names, keywords, etc.) within the explanation, wrap them in backticks (\`like_this\`).
*   Focus only on providing a complete and thorough explanation of the entire code snippet as requested for detailed explanations. Do not generate docstrings or any other sections.`;

    const userPrompt = `Here is the code:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``;

    console.log(`Sending request to OpenRouter for ${language} code analysis (${detailLevel})...`);

    const apiResponse = await fetch(OPENROUTER_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "Code Explainer",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL_ANALYSIS,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: detailLevel === 'summary' ? 1000 : 5000, // Adjusted max_tokens based on detail level
        temperature: 0.5,
        // Removed stream: true
      }),
    });

    // Handle specific API response errors
    if (!apiResponse.ok) {
        let errorMsg = `API request failed with status ${apiResponse.status}: ${apiResponse.statusText}`;
        try {
            const errorBody = await apiResponse.json(); // Try parsing JSON error from OpenRouter/Model
            console.error("OpenRouter API Error Body:", errorBody);
            // Customize message based on common status codes
            if (apiResponse.status === 400) {
                errorMsg = "The request was malformed. Please check the input code or language.";
            } else if (apiResponse.status === 401) {
                errorMsg = "Authentication failed. Please check the API Key.";
            } else if (apiResponse.status === 429) {
                errorMsg = "API rate limit exceeded or quota finished. Please try again later or check your plan.";
            } else if (apiResponse.status >= 500) {
                errorMsg = "The AI service encountered an internal error. Please try again later.";
            } else {
                 errorMsg = errorBody?.error?.message || errorMsg; // Use message from body if available
            }
        } catch (parseError) {
            // If error body isn't JSON, use the text
            console.error("Could not parse error body as JSON:", parseError);
        }
        console.error("OpenRouter API Error:", errorMsg);
        // Throw specific error message to be caught below
        throw new Error(errorMsg);
    }

    // Process the full JSON response
    const result = await apiResponse.json();
    let text = ""; // Default to empty string

    if (result.choices && result.choices.length > 0 && result.choices[0].message?.content) {
      text = result.choices[0].message.content;
    } else {
      console.warn("Could not extract content from OpenRouter response:", result);
    }

    console.log("Received response from OpenRouter.");

    // Simplified parsing: Assume the entire response content is the explanation
    let explanation = text.trim();
    // Optional: Remove potential leading "**Explanation:**" if the model adds it redundantly
    explanation = explanation.replace(/^\*\*Explanation:\*\*\s*/, '').trim();

    if (!explanation) {
        explanation = "Could not generate explanation."; // Provide a default message if empty
        console.warn("Generated explanation was empty.");
    }

    // Return only the explanation as a standard JSON response
    return NextResponse.json({ explanation });


  } catch (error) {
    // Log the full error for server-side debugging
    console.error("Error in /api/analyze:", error);
    // Return the specific error message caught from the try block or a generic one
    const clientErrorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during analysis.';
    // Determine appropriate status code (default to 500)
    // Added check for mismatch error and inconclusive check error
    const statusCode = error.message.includes("API Key") ? 500 :
                       error.message.includes("required fields") ? 400 :
                       error.message.includes("code language appears to be") ? 400 : // Adjusted message check
                       error.message.includes("Could not reliably confirm") ? 400 : // This might not be thrown anymore
                       error.message.includes("API issue") ? 503 : 500;
    return NextResponse.json({ error: clientErrorMessage }, { status: statusCode });
  }
}