import { google } from '@ai-sdk/google';
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
      model: google('gemini-1.5-flash'),
      prompt,
    });

    return NextResponse.json({ advice: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
