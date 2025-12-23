import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini client
// "Nano Banana" alias maps to 'gemini-2.5-flash-image'
const ai = new GoogleGenAI({ apiKey });
const MODEL_NAME = 'gemini-2.5-flash-image';

export interface AIResponse {
  text: string;
  image?: string;
}

export const generateResponse = async (
  prompt: string,
  base64Image?: string
): Promise<AIResponse> => {
  if (!apiKey) {
    return { text: "Please configure your API Key to talk to the AI Buddy." };
  }

  try {
    let response: GenerateContentResponse;

    const parts: any[] = [];
    
    if (base64Image) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      });
    }
    
    parts.push({ text: prompt });

    response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction: "You are a helpful, encouraging AI Buddy in a digital wellbeing app called Unscroller. You can also generate simple, artistic watercolor-style images if requested by the user. Keep your text responses concise, friendly, and supportive.",
      }
    });

    let text = "";
    let image: string | undefined;

    // Iterate through parts to find text and images (Nano Banana returns images in parts)
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          text += part.text;
        }
        if (part.inlineData) {
          image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    return { 
      text: text || "I'm having trouble thinking right now.", 
      image 
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Sorry, I couldn't connect to the server." };
  }
};