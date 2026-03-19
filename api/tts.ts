import { GoogleGenAI, Modality } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key is missing!");
      return res.status(500).json({ error: 'API key is missing.' });
    }

    // Use process.env.GEMINI_API_KEY (Server-side only)
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Failed to generate audio");
    }
    
    res.status(200).json({ audio: base64Audio });
  } catch (error) {
    console.error("Error in TTS API:", error);
    res.status(500).json({ error: 'Failed to generate TTS' });
  }
}
