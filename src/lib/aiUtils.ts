// Initialize the Gemini API client

/**
 * Generates an AI response to a given question using Google's Gemini LLM
 * via a server-side API route for security
 *
 * @param question The question to answer
 * @param humanAnswers Array of human answers to use as context
 * @returns A human-like response from the AI
 */
export const generateAIAnswer = async (
  question: string,
  humanAnswers: string[] = []
): Promise<string> => {
  try {
    const response = await fetch("/api/generate-ai-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, humanAnswers }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error("Error generating AI answer:", error);

    // Fallback responses in case the API call fails
    const fallbackResponses = ["idk", "not sure", "hard to say"];

    return fallbackResponses[
      Math.floor(Math.random() * fallbackResponses.length)
    ];
  }
};
