import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateIELTSResponse(chineseInput: string, part: string, question?: string): Promise<{ englishResponse: string, keywords: string[] }> {
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
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    const jsonStr = response.text?.trim() || "{}";
    const parsed = JSON.parse(jsonStr);
    return {
      englishResponse: parsed.englishResponse || "Sorry, I couldn't generate a response.",
      keywords: parsed.keywords || []
    };
  } catch (e) {
    console.error("Failed to parse JSON response", e);
    return {
      englishResponse: response.text?.trim() || "Sorry, I couldn't generate a response.",
      keywords: []
    };
  }
}

export async function generateTTS(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck is a good clear voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Failed to generate audio");
  }
  return base64Audio;
}
