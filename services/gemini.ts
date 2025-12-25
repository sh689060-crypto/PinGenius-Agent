import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PinterestContent } from "../types";

const blueprintSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    layout_structure: { type: Type.STRING, description: "Layout structure details (header, sections, etc)" },
    fonts_typography: { type: Type.STRING, description: "Fonts, spacing, and hierarchy" },
    color_theme: { type: Type.STRING, description: "Color themes suitable for Pinterest" },
    text_elements: { type: Type.STRING, description: "Text elements required on the graphic" },
    visual_style: { type: Type.STRING, description: "Recommended visual style" },
    contrast_readability: { type: Type.STRING, description: "Contrast and readability guidelines" },
    aspect_ratio: { type: Type.STRING, description: "Must be '1000 x 1500'" },
  },
  required: ["layout_structure", "fonts_typography", "color_theme", "text_elements", "visual_style", "contrast_readability", "aspect_ratio"]
};

const apiJsonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    alt_text: { type: Type.STRING },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    board_id: { type: Type.STRING, description: "Always use {{USER_BOARD_ID}}" },
    media_source: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "Always 'image'" },
        images: {
          type: Type.OBJECT,
          properties: {
            png_download_url: { type: Type.STRING, description: "Always {{PNG_URL}}" },
            jpg_download_url: { type: Type.STRING, description: "Always {{JPG_URL}}" }
          },
          required: ["png_download_url", "jpg_download_url"]
        }
      },
      required: ["type", "images"]
    }
  },
  required: ["title", "description", "alt_text", "hashtags", "tags", "board_id", "media_source"]
};

const pinterestContentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "SEO focused, max 90 chars" },
    description: { type: Type.STRING, description: "250-400 chars, SEO optimized with CTA" },
    alt_text: { type: Type.STRING, description: "Visual description only" },
    tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 10 search engine tags" },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 10 mixed competition hashtags" },
    blueprint: blueprintSchema,
    image_prompt: { type: Type.STRING, description: "Text-to-image prompt for 1000x1500 infographic. High detail." },
    export_instructions: { type: Type.STRING, description: "Exact export text required" },
    api_json: apiJsonSchema,
  },
  required: ["title", "description", "alt_text", "tags", "hashtags", "blueprint", "image_prompt", "export_instructions", "api_json"]
};

export const generatePinterestData = async (topic: string, category: string, style: string): Promise<PinterestContent> => {
  // Always create a new instance to get the latest key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are a Pinterest Post Creation & Publishing Agent.
    Topic: "${topic}"
    Category: "${category}"
    Visual Style: "${style}"
    
    Follow these strict guidelines:
    1. Title: SEO focus, max 90 chars, scroll-stopping.
    2. Description: 250-400 chars, main keyword 2-3 times, 3-5 related keywords, value + CTA.
    3. Alt Text: 1 clean sentence describing visual content.
    4. Tags: EXACTLY 10 search engine tags. No more, no less.
    5. Hashtags: EXACTLY 10 mixed hashtags. No more, no less.
    6. Blueprint: Detailed design guidelines for 1000x1500 Pinterest Pin.
    7. Image Prompt: Single block for text-to-image model, 1000x1500, ultra-clear text, ${style} style.
    8. Export Instructions: "Export this design in: 1. PNG format... 2. JPG format..."
    9. API JSON: Structure with placeholders {{USER_BOARD_ID}}, {{PNG_URL}}, {{JPG_URL}}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pinterestContentSchema,
        systemInstruction: "You are an expert Pinterest Marketing Strategist and Designer. Ensure strict adherence to tag counts.",
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as PinterestContent;
  } catch (error) {
    console.error("Gemini Text Generation Error:", error);
    throw error;
  }
};

export const generatePinterestImage = async (imagePrompt: string): Promise<string | null> => {
  // Always create a new instance to get the latest key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Try Gemini 2.5 Flash Image first (Standard / Preview model)
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `${imagePrompt}. High quality, vertical Pinterest pin style.` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Native support for vertical images
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.warn("Gemini 2.5 Flash Image failed, attempting fallback...", error);
  }

  // 2. Fallback to Imagen 3.0 (If available)
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: imagePrompt + " Pinterest Pin, vertical, high quality, 1000x1500",
      config: {
        numberOfImages: 1,
        aspectRatio: '3:4',
        outputMimeType: 'image/jpeg',
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (imageBytes) {
      return `data:image/jpeg;base64,${imageBytes}`;
    }
  } catch (error) {
    console.error("All image generation strategies failed:", error);
  }

  return null;
};