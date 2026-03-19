export async function generateIELTSResponse(chineseInput: string, part: string, question?: string): Promise<{ englishResponse: string, keywords: string[] }> {
  try {
    const response = await fetch('/api/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chineseInput, part, question }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      englishResponse: data.englishResponse || "Sorry, I couldn't generate a response.",
      keywords: data.keywords || []
    };
  } catch (e) {
    console.error("Failed to generate response", e);
    return {
      englishResponse: `Sorry, I couldn't generate a response. Error: ${e instanceof Error ? e.message : String(e)}`,
      keywords: []
    };
  }
}

export async function generateTTS(text: string): Promise<string> {
  const response = await fetch('/api/v1/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.audio) {
    throw new Error("Failed to generate audio");
  }
  
  return data.audio;
}

export async function generateKeywords(englishResponse: string): Promise<string[]> {
  try {
    const response = await fetch('/api/v1/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ englishResponse }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.keywords || [];
  } catch (e) {
    console.error("Failed to extract keywords", e);
    return [];
  }
}
