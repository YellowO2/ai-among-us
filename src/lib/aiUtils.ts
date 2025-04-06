import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

/**
 * Generates an AI response to a given question using Google's Gemini LLM
 * with human answers as context to help the AI blend in
 *
 * @param question The question to answer
 * @param humanAnswers Optional array of human answers to the same question
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
    const fallbackResponses = ["idk", "hmmm", "Time Out"];

    return fallbackResponses[
      Math.floor(Math.random() * fallbackResponses.length)
    ];
  }
};
