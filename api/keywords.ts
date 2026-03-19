import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { englishResponse } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key is missing!");
      return res.status(500).json({ error: 'API key is missing. Please configure GEMINI_API_KEY in your environment.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
You are an expert English teacher.
The user has provided an English response for an IELTS speaking test.
Your task is to extract or generate 3-5 "keywords or key phrases" (关键词/关键句) from this English response. These should be difficult-to-translate concepts, native idiomatic expressions, or crucial vocabulary.

English Response:
${englishResponse}

Return your response in JSON format exactly like this:
{
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
    
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw string:", jsonStr);
      parsed = {};
    }
    
    res.status(200).json({
      keywords: parsed.keywords || []
    });
  } catch (error) {
    console.error("Error in keywords API:", error);
    res.status(500).json({ error: 'Failed to extract keywords', details: error instanceof Error ? error.message : String(error) });
  }
}
