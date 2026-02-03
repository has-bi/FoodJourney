import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ExtractedPlaceInfo } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function extractPlaceInfo(mapsLink: string): Promise<ExtractedPlaceInfo> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `
You are a helpful assistant that extracts restaurant/cafe information from Google Maps links.
Given this Google Maps link, extract the following information:

Link: ${mapsLink}

Please analyze the link and return a JSON object with this exact structure:
{
  "name": "restaurant/cafe name extracted from the link",
  "cuisine": "type of cuisine (e.g., Japanese, Italian, Indonesian, Cafe, etc.)",
  "priceRange": "$ or $$ or $$$ or $$$$",
  "topMenus": ["recommended menu 1", "recommended menu 2", "recommended menu 3"],
  "worstReview": "a brief critical review point or concern (max 100 chars)"
}

Important notes:
- Extract the place name from the URL if visible
- If cuisine type is not clear, make a reasonable guess based on the name
- For price range, use: $ (cheap), $$ (moderate), $$$ (expensive), $$$$ (luxury)
- For topMenus, suggest 3 typical dishes for this type of restaurant
- For worstReview, make up a realistic concern (e.g., "Can get crowded on weekends", "Parking can be difficult")
- If any field cannot be determined, use "N/A"

Return only valid JSON, no additional text.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    return {
      name: parsed.name || "Unknown Place",
      cuisine: parsed.cuisine || "N/A",
      priceRange: parsed.priceRange || "$$",
      topMenus: Array.isArray(parsed.topMenus) ? parsed.topMenus : [],
      worstReview: parsed.worstReview || "N/A",
    };
  } catch (error) {
    console.error("Gemini extraction error:", error);

    // Fallback: try to extract name from URL
    const nameMatch = mapsLink.match(/place\/([^/]+)/);
    const extractedName = nameMatch
      ? decodeURIComponent(nameMatch[1]).replace(/\+/g, " ")
      : "Unknown Place";

    return {
      name: extractedName,
      cuisine: "N/A",
      priceRange: "$$",
      topMenus: [],
      worstReview: "Could not extract details",
    };
  }
}

export function isValidMapsLink(link: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?google\.(com|[a-z]{2,3})\/maps/,
    /^https?:\/\/maps\.google\.(com|[a-z]{2,3})/,
    /^https?:\/\/goo\.gl\/maps/,
    /^https?:\/\/maps\.app\.goo\.gl/,
  ];

  return patterns.some(pattern => pattern.test(link));
}
