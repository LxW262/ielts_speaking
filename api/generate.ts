import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chineseInput, part, question } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key is missing!");
      return res.status(500).json({ error: 'API key is missing. Please configure GEMINI_API_KEY in your environment.' });
    }

    // Use process.env.GEMINI_API_KEY (Server-side only)
    const ai = new GoogleGenAI({ apiKey });
    
    let partSpecificGuidelines = "";
    if (part === 'Part 1') {
      partSpecificGuidelines = `
- **Part 1 Focus**: Keep it concise, natural, and direct. Answer the question clearly based strictly on the user's input, add a brief supporting detail, and stop. Aim for 2-3 sentences. Do not over-complicate it or make it overly chatty.`;
    } else if (part === 'Part 2') {
      partSpecificGuidelines = `
- **Part 2 Focus**: A long turn (approx. 1.5 - 2 minutes spoken). Tell a coherent story or give a detailed description based on the user's input. Well-structured with an introduction, body, and conclusion.`;
    } else {
      partSpecificGuidelines = `
- **Part 3 Focus**: Analytical and detailed. Discuss broader issues, give reasons, and provide examples based on the user's input. Aim for 4-6 well-developed sentences.`;
    }

    const prompt = `
You are an expert IELTS speaking examiner helping a candidate prepare.
The user has provided a Chinese answer or instructions.
Your task is to translate and adapt this input into a high-scoring, natural English spoken response suitable for an IELTS exam.
Additionally, you must extract or generate 3-5 "keywords or key phrases" (关键词/关键句) from your English response. These should be difficult-to-translate concepts, native idiomatic expressions, or crucial vocabulary that the user might struggle to remember.

Guidelines:
1. **Base on User Input**: You MUST base your answer strictly on the user's Chinese input. If they provide instructions in brackets (e.g., [make up a story about...]), follow them creatively.
2. **Natural but Exam-Appropriate**: The tone should be authentic and natural, but remember this is an exam setting. Avoid excessive slang, overly casual colloquialisms, or forced filler words (like "you know", "I mean", "well"). Speak clearly and naturally like a proficient, confident language learner.
3. **Appropriate Vocabulary**: Use accurate and idiomatic vocabulary. Prioritize sounding natural and unpretentious over forcing excessively complex "big words".
4. **Length & Style**: ${partSpecificGuidelines}
5. **Tone & Delivery**: Engaging and expressive. Use punctuation like commas and periods for natural breath pauses, so the text-to-speech engine reads it smoothly.

Input Details:
- IELTS Part: ${part}
- Question (if any): ${question || 'Not provided'}
- User's Chinese Answer & Instructions: ${chineseInput}

Return your response in JSON format exactly like this:
{
  "englishResponse": "The full spoken English text here...",
  "keywords": ["key phrase 1", "key phrase 2", "idiom 3"]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    console.log("Gemini API raw response:", jsonStr);
    
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw string:", jsonStr);
      parsed = {};
    }
    
    res.status(200).json({
      englishResponse: parsed.englishResponse || "Sorry, I couldn't generate a response.",
      keywords: parsed.keywords || []
    });
  } catch (error) {
    console.error("Error in generate API:", error);
    res.status(500).json({ error: 'Failed to generate response', details: error instanceof Error ? error.message : String(error) });
  }
}
