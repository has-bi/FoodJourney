import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ExtractedPlaceInfo } from "./types";

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Extract place name from URL
function extractPlaceName(url: string): string {
  const patterns = [
    /place\/([^/@]+)/,
    /\/maps\/.*?\/([^/@]+)@/,
    /q=([^&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return decodeURIComponent(match[1]).replace(/\+/g, " ");
    }
  }
  return "Unknown Place";
}

// Extract coordinates from URL for better location context
function extractCoordinates(url: string): { lat: number; lng: number } | null {
  const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return null;
}

export async function extractPlaceInfo(
  mapsLink: string
): Promise<ExtractedPlaceInfo> {
  const placeName = extractPlaceName(mapsLink);
  const coordinates = extractCoordinates(mapsLink);

  if (!genAI) {
    console.warn("GEMINI_API_KEY is missing. Using fallback place data.");
    return {
      name: placeName,
      cuisine: "Not available",
      area: "Not available",
      priceRange: "Not available",
      priceCategory: "moderate",
      signatureMenus: [],
      rating: null,
      reviewCount: null,
      commonComplaint: "No complaints found",
      waitTime: "Not available",
      parkingInfo: "Not available",
      operatingHours: "Not available",
      confidence: "low",
    };
  }

  // Use Gemini 2.5-flash with Google Search grounding
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} }] as never,
  });

  // Build location context
  const locationContext = coordinates
    ? `Location coordinates: ${coordinates.lat}, ${coordinates.lng} (Jakarta area, Indonesia)`
    : "Location: Indonesia";

  const prompt = `
You are a restaurant research assistant with access to Google Search. Your task is to find REAL, VERIFIED information about a restaurant in Indonesia.

## RESTAURANT TO RESEARCH
- Name: "${placeName}"
- Google Maps URL: ${mapsLink}
- ${locationContext}

## RESEARCH INSTRUCTIONS

Use Google Search to find accurate information. Search for:
1. "${placeName}" restaurant Jakarta/Indonesia - for general info
2. "${placeName}" menu harga - for menu and prices
3. "${placeName}" review - for customer reviews
4. "${placeName}" jam buka - for operating hours

## INFORMATION TO COLLECT

### Basic Info
- Official restaurant name (verify spelling)
- Type of cuisine (Indonesian, Japanese, Western, Cafe, etc.)
- Location area (district/neighborhood like Senayan, Kemang, PIK, etc.)

### Pricing (MUST be in Indonesian Rupiah)
- Price range per person (format: "30.000-50.000 IDR" or "50-100k IDR")
- Price category based on per-person cost:
  * budget: < 50.000 IDR
  * moderate: 50.000 - 150.000 IDR
  * expensive: 150.000 - 300.000 IDR
  * premium: > 300.000 IDR

### Menu Items
Find 5-7 actual menu items with real prices. Look for:
- Signature dishes / best sellers
- Most reviewed items
- Format each as: {"name": "Dish Name", "price": "XX.000"}

### Quality Metrics
- Google Maps rating (1-5 stars)
- Number of reviews
- Common positive feedback
- Common complaints/concerns

### Practical Information
- Operating hours (format: "10:00 - 22:00" or "10 AM - 10 PM")
- Parking availability and cost if available
- Typical wait time during peak hours
- Reservation needed? (yes/no/recommended)

## OUTPUT FORMAT

Return a JSON object with this structure:
{
  "name": "Verified Restaurant Name",
  "cuisine": "Cuisine Type",
  "area": "District/Neighborhood",
  "priceRange": "XX.000 - XX.000 IDR",
  "priceCategory": "budget|moderate|expensive|premium",
  "signatureMenus": [
    {"name": "Menu Item 1", "price": "XX.000"},
    {"name": "Menu Item 2", "price": "XX.000"}
  ],
  "rating": 4.5,
  "reviewCount": 500,
  "highlights": "Brief positive highlights from reviews",
  "commonComplaint": "Most common concern from reviews",
  "operatingHours": "Opening - Closing time",
  "parkingInfo": "Parking availability details",
  "waitTime": "Typical wait during peak hours",
  "reservationNeeded": "yes|no|recommended",
  "confidence": "high|medium|low",
  "sources": ["Source 1", "Source 2"]
}

## IMPORTANT RULES
1. ONLY include information found in search results - NO hallucination
2. If you cannot find specific info, use "Not available"
3. Prices MUST be in Indonesian Rupiah (IDR)
4. Rating must be a number between 1-5, or null if not found
5. Include sources to verify the information

Return ONLY the JSON object.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("=== GEMINI RESPONSE ===");
    console.log("Raw text:", text);

    // Check for grounding metadata
    const candidates = response.candidates;
    if (candidates && candidates[0]?.groundingMetadata) {
      console.log("Grounding sources used:", candidates[0].groundingMetadata);
    }

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("Parsed data:", JSON.stringify(parsed, null, 2));

    // Parse rating and reviewCount as numbers
    const rating =
      typeof parsed.rating === "number"
        ? parsed.rating
        : parseFloat(parsed.rating);
    const reviewCount =
      typeof parsed.reviewCount === "number"
        ? parsed.reviewCount
        : parseInt(parsed.reviewCount);

    // Map to our ExtractedPlaceInfo type
    return {
      name: parsed.name || placeName,
      cuisine: parsed.cuisine || "Not available",
      area: parsed.area || "Not available",
      priceRange: parsed.priceRange || "Not available",
      priceCategory: parsed.priceCategory || "moderate",
      signatureMenus: Array.isArray(parsed.signatureMenus)
        ? parsed.signatureMenus
            .filter((m: { name?: string }) => m && m.name)
            .map((m: { name: string; price?: string }) => ({
              name: m.name,
              price: m.price || undefined,
            }))
        : [],
      rating: !isNaN(rating) && rating > 0 && rating <= 5 ? rating : null,
      reviewCount: !isNaN(reviewCount) && reviewCount > 0 ? reviewCount : null,
      commonComplaint: parsed.commonComplaint || "No complaints found",
      waitTime: parsed.waitTime || "Not available",
      parkingInfo: parsed.parkingInfo || "Not available",
      operatingHours: parsed.operatingHours || "Not available",
      confidence: parsed.confidence || "low",
    };
  } catch (error) {
    console.error("Gemini extraction error:", error);

    // Return minimal data without hallucination
    return {
      name: placeName,
      cuisine: "Not available",
      area: "Not available",
      priceRange: "Not available",
      priceCategory: "moderate",
      signatureMenus: [],
      rating: null,
      reviewCount: null,
      commonComplaint: "No complaints found",
      waitTime: "Not available",
      parkingInfo: "Not available",
      operatingHours: "Not available",
      confidence: "low",
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

  return patterns.some((pattern) => pattern.test(link));
}
