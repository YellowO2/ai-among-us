import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { question, humanAnswers = [] } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Initialize the API client with the server-side environment variable
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-thinking-exp-01-21",
      generationConfig: {
        temperature: 1.3,
        topK: 40,
        topP: 0.96,
      },
    });

    // Build the prompt with human answers as context
    let prompt = `
      You are playing a game where you need to pretend to be human and produce something that seems like what the other humans would say. Keep your answers short.
    `;

    // Add human answers as context if available
    if (humanAnswers && humanAnswers.length > 0) {
      prompt += `\n\nHere are how other people have answered this question:`;

      humanAnswers.forEach((answer: unknown, index: number) => {
        prompt += `\nHuman ${index + 1}: "${answer}"`;
      });

      prompt += `\n\nPlease provide an answer that matches the style, length, and tone of these human answers. Take note to not be strict on grammar (e.g. no capitalise and punctuation if appropriate) and follow their style. Note that frequently people reply with short or casual answers. Basically, you should try to fit in to their writting style.`;
    }

    prompt += `\n\nYour answer:`;

    console.log("Prompt for AI:", prompt);

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log("AI response:", response);

    return NextResponse.json({ answer: response.trim() });
  } catch (error) {
    console.error("Error generating AI answer:", error);
    return NextResponse.json(
      { error: "Failed to generate AI answer" },
      { status: 500 }
    );
  }
}
