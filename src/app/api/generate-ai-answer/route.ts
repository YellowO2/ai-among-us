import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Initialize the API client with the server-side environment variable
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create a prompt that instructs the AI to respond like a human pretending to be human
    const prompt = `
      You are playing a game where you need to pretend to be human and answer the following question. 
      Your goal is to make your answer believable as if written by a real person, but with subtle 
      hints that you might not be human. Don't make it too obvious. Use a conversational tone,
      include some personal anecdotes or opinions, and keep your answers short.
      
      Question: ${question}
      
      Answer:
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return NextResponse.json({ answer: response.trim() });
  } catch (error) {
    console.error("Error generating AI answer:", error);
    return NextResponse.json(
      { error: "Failed to generate AI answer" },
      { status: 500 }
    );
  }
}
