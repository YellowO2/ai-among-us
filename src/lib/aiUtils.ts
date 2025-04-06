import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

/**
 * Generates an AI response to a given question using Google's Gemini LLM
 * via a server-side API route for security
 * 
 * @param question The question to answer
 * @param humanAnswers Array of human answers to use as context
 * @returns A human-like response from the AI
 */
export const generateAIAnswer = async (question: string, humanAnswers: string[] = []): Promise<string> => {
  try {
    const response = await fetch('/api/generate-ai-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    const fallbackResponses = [
      "I've thought about this quite a bit. I'd say the most logical approach would be to analyze all options first.",
      "This is an interesting question that requires careful consideration of human values and priorities.",
      "Based on my personal experiences, I would approach this with both emotion and logic in mind.",
      "I find this question fascinating from a philosophical perspective. My analysis suggests several possibilities.",
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
};
