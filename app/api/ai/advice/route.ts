import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const prompt = `
      You are a smart personal finance advisor for a bachelor/student. 
      Analyze the financial condition described below and give actionable, specific advice.
      User's Condition/Question: "${message}"

      Keep it concise, supportive, and direct. Use markdown formatting to make the answer highly readable.
    `;

    const { text } = await generateText({
      model: groq('llama-3.1-70b-versatile'),
      prompt,
    });

    return NextResponse.json({ advice: text });
  } catch (error: unknown) {
    console.error("AI Error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
