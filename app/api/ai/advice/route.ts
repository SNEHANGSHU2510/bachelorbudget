import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { budget, stats, categories } = await req.json();

    const prompt = `
      You are a smart personal finance advisor for a bachelor/student. 
      Analyze the following spending data and give one paragraph of highly actionable, specific advice.
      Budget: ${budget.total_amount} ${budget.currency} for ${budget.duration_days} days.
      Spent: ${stats.totalSpent} ${budget.currency}.
      Categories: ${JSON.stringify(categories)}

      Keep it concise, supportive, but direct. If they are overspending, suggest exactly where to cut.
    `;

    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt,
    });

    return NextResponse.json({ advice: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
