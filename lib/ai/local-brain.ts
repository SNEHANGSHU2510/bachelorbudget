import { pipeline, env } from '@xenova/transformers';

// Configuration for web deployment
env.allowLocalModels = false;
env.useBrowserCache = true;

// The trained knowledge base (extracted from your JSONL)
// This is your "Trained Model's Memory"
const KNOWLEDGE_BASE = [
  {
    q: "I just spent 172 on Biriyani. Am I still safe for the week?",
    a: "Spending ₹172 on one meal is 34% of your total budget. While the Biriyani was likely worth it, you now have only ₹328 left. Stick to 'Morning Maggie' (₹63) or Tea (₹24) for the next 2 days to re-balance your daily limit."
  },
  {
    q: "I have INR 50 left and 2 days to go. Help!",
    a: "CRITICAL AUSTERITY: You are in Strict Mode. With ₹50 left for 2 days, your limit is ₹25/day. This covers exactly one Juice (₹20) or one Tea (₹24). Bypassing all reserves—no more Biriyani until your next budget cycle."
  },
  {
    q: "Which category am I overspending on?",
    a: "Looking at your history, your 'Meals' category is your biggest drain. You have frequent high-cost entries like Biriyani (₹172). If you pivot toward home-cooked Maggie (₹63) for 60% of your cycle, you could save ₹150+ per budget."
  },
  {
    q: "How can I save more this week?",
    a: "You have several 'Drink' and 'Juice' entries (₹20-₹30 each). While small, these occur daily. Consolidating these small expenses or swapping them for homemade tea could free up ₹100 over 4 days."
  },
  {
    q: "Is INR 30 for a drink worth it?",
    a: "In isolation, ₹30 is fine. However, your history shows high beverage frequency. If you're on a ₹500 budget, spending ₹90 on drinks is nearly 20% of your total funds. Try to limit drinks to once daily."
  },
  {
    q: "I spent INR 63 on Morning Maggie. Is that a good save?",
    a: "Yes! ₹63 is 50% cheaper than your average meal cost. By choosing Maggie over Biriyani today, you just 'earned' back ₹100+ into your carry-forward reserve. This gives you extra breathing room."
  },
  {
    q: "I have INR 103 remaining for 2 days. What is my limit?",
    a: "Your limit is strictly ₹51.5 per day. This is a tight threshold. You can afford one simple meal (₹35) and one small beverage (₹15). Avoid any 'Other' expenses today to survive the cycle."
  },
  {
    q: "I have 0 remaining but 1 day left.",
    a: "LOCKDOWN TRIGGERED: You have reached 100% depletion. No further expenses are possible. Please close this budget and generate your Final Invoice to analyze where the leakage occurred."
  },
  {
    q: "Wealth and long term saving.",
    a: "Wealth starts with budget discipline. If you can manage INR 500 with 100% accuracy, you can manage INR 50,000. Use BachelorBudget as your training ground for future financial freedom."
  }
];

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    // We use a tiny, fast model: all-MiniLM-L6-v2
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

function cosineSimilarity(view1: number[], view2: number[]) {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  for (let i = 0; i < view1.length; i++) {
    dotProduct += view1[i] * view2[i];
    mag1 += view1[i] * view1[i];
    mag2 += view1[i] * view2[i];
  }
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

export async function getLocalAdvice(query: string): Promise<string> {
  try {
    const pipe = await getExtractor();
    
    // 1. Convert user query to a math vector (the ML part)
    const output = await pipe(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data) as number[];

    let bestMatch = KNOWLEDGE_BASE[0];
    let maxSimilarity = -1;

    // 2. Compare query vector against all "Known Scenarios" in your memory
    for (const item of KNOWLEDGE_BASE) {
      const itemOutput = await pipe(item.q, { pooling: 'mean', normalize: true });
      const itemVector = Array.from(itemOutput.data) as number[];
      
      const similarity = cosineSimilarity(queryVector, itemVector);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = item;
      }
    }

    // 3. Synthesize advice (If similarity is low, we give a general warning)
    if (maxSimilarity < 0.5) {
      return "I'm analyzing your situation. Based on your general spending habits, the best move right now is to prioritize 'Necessities' (Food) over 'Wants' (Drinks/Splurges). Check your 'Austerity Limit' on the dashboard.";
    }

    return bestMatch.a;
  } catch (err) {
    console.error("Local ML Brain Error:", err);
    return "The local brain is warming up. Please ensure your budget is healthy and check your daily limit on the main screen.";
  }
}
