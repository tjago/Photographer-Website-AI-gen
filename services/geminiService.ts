
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGalleryCommentary = async (title: string, subtitle: string): Promise<string> => {
  if (!process.env.API_KEY) return `Witness the profound beauty of ${title}. ${subtitle}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short, poetic, 2-sentence atmosphere-setting description for a photography gallery titled "${title}" with the subtitle "${subtitle}". Focus on sensory details like light, water, and texture.`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 100,
      }
    });
    return response.text?.trim() || `The essence of ${title} captured in light.`;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Explore the visual journey of ${title}.`;
  }
};
