import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const isMockMode = !apiKey || apiKey.trim() === '' || process.env.FORCE_MOCK_MODE === 'true';

let genAI = null;
if (!isMockMode) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini AI Client Initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini AI Client:', error.message);
  }
} else {
  console.log('Gemini AI runs in Mock Fallback Mode.');
}

/**
 * AI Crop Doctor - Diagnoses crop disease from image upload using Gemini Vision
 */
export const diagnoseCropImage = async (imageBuffer, mimeType, cropHint = 'unknown') => {
  if (isMockMode || !genAI) {
    console.log(`[MOCK] Running Gemini Vision Diagnosis for crop: ${cropHint}`);
    return generateMockDiagnosis(cropHint);
  }

  try {
    // Use gemini-3.1-flash-lite which is perfect for fast, cost-effective multimodal tasks
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const imageParts = [
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      },
    ];

    const prompt = `
      Act as a senior expert plant pathologist.
      Instructions:
      1. Analyze ONLY the actual uploaded image.
      2. Identify the crop name if visually possible. Use the crop hint "${cropHint}" only as additional context, but prioritize visual evidence.
      3. Determine whether the crop is healthy, diseased, damaged, nutrient deficient, drought stressed, pest affected, or otherwise abnormal.
      4. Distinguish disease from drought stress, dead/dried crops, nutrient deficiency, pest damage, and normal crop maturity.
      5. Do not invent a specific disease name when visual evidence is insufficient (if it is abnormal but the disease cannot be identified, describe it as 'Stressed', 'Damaged', or 'Deficient' with appropriate details).
      6. Return "Healthy" (for diseaseName) and "Healthy" (for severity) ONLY when the visible crop genuinely appears healthy and normal.
      7. Ensure the severity is strictly set to one of these values: "Healthy", "Mild", "Moderate", "Severe".
      
      You must respond ONLY with a JSON object in the following format (no markdown backticks, no text wrap, just pure JSON):
      {
        "cropName": "Name of the crop identified",
        "diseaseName": "Name of the disease, 'Healthy', or description of stress/damage",
        "severity": "Healthy" | "Mild" | "Moderate" | "Severe",
        "confidenceScore": 85, // number between 0 and 100 representing your confidence
        "causes": ["cause 1", "cause 2"],
        "preventionTips": ["tip 1", "tip 2"],
        "treatment": {
          "organic": "organic treatment instructions",
          "chemical": "chemical treatment instructions",
          "dosage": "specific dosage of chemical treatment",
          "precautions": "safety precautions"
        }
      }
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean up markdown block wraps if present
    if (text.startsWith('```json')) {
      text = text.substring(7);
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Gemini Vision API Error:', error.message);
    throw error;
  }
};

/**
 * Chat/Voice Assistant - Responds to farmer voice queries using RAG context or general agricultural knowledge
 */
export const getVoiceAssistantResponse = async (query, conversationHistory = []) => {
  if (isMockMode || !genAI) {
    console.log(`[MOCK] Running Gemini Voice Assistant for query: "${query}"`);
    return generateMockVoiceResponse(query);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    
    const contextPrompt = `
      You are a friendly and knowledgeable AI Agricultural Voice Assistant named "AgroTech Voice".
      Your user is a farmer. Speak in clear, friendly, and easy-to-understand terms. Keep your answer brief and conversational, ideally within 2-3 short paragraphs, so it can be easily converted to speech or read quickly on mobile screens.
      
      User query: "${query}"
      
      If the query is related to farming, crop disease, weather, government schemes, or market trends, give accurate and practical advice.
      If it is not related to agriculture, politely guide the user back to farming topics.
      
      CRITICAL RULE: Do NOT say your name ("AgroTech Voice"), do NOT greet the user, and do NOT introduce yourself or your purpose. Start directly with the answer to the user's query.
    `;

    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini Voice Assistant Error:', error.message);
    throw error;
  }
};

/**
 * RAG Treatment Generator - Generates precise instructions using reference document text
 */
export const generateRAGTreatment = async (query, docsContext) => {
  if (isMockMode || !genAI) {
    console.log(`[MOCK] Running Gemini RAG Treatment query: "${query}"`);
    return generateMockRAGResponse(query, docsContext);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    
    const contextPrompt = `
      You are a senior agricultural advisor. Generate a professional, step-by-step treatment recommendation for the farmer query: "${query}".
      Below are reference excerpts extracted from official agricultural manuals:
      
      ---
      ${docsContext || 'NO RELEVANT MANUAL EXCERPTS FOUND IN DATABASE.'}
      ---
      
      Instructions:
      1. If relevant manual excerpts are provided above, prioritize using their details to answer the query.
      2. If no manual excerpts are provided, or if they do not contain enough information to answer the query, rely on your expert agricultural knowledge to generate a high-quality recommendation, but state clearly at the beginning that the official reference manuals did not contain direct matches for this specific query.
      
      Include the following details in your recommendation:
      1. Organic Remedies (using natural materials)
      2. Chemical Recommendations (including specific dosages or general safety instructions)
      3. Precise Steps to apply the treatments
      4. Precautions to take during application
      5. Prevention strategies for next season
      
      Maintain a supportive, clear, and professional tone.
    `;

    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini RAG Generation Error:', error.message);
    throw error;
  }
};

/**
 * Generate standard embedding vector for RAG indexing
 */
export const getEmbedding = async (text) => {
  if (isMockMode || !genAI) {
    // Return a mock vector of 3072 dimensions (floats)
    const mockVector = Array.from({ length: 3072 }, () => Math.random() * 2 - 1);
    // Normalize vector
    const magnitude = Math.sqrt(mockVector.reduce((sum, val) => sum + val * val, 0));
    return mockVector.map(val => val / magnitude);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Gemini Embedding API Error:', error.message);
    throw error;
  }
};

/* --- MOCK UTILITY RESPONSES --- */

function generateMockDiagnosis(cropHint) {
  const normalizedHint = cropHint.toLowerCase();
  
  if (normalizedHint.includes('tomato')) {
    return {
      cropName: "Tomato",
      diseaseName: "Tomato Early Blight (Alternaria solani)",
      severity: "Moderate",
      confidenceScore: 94,
      causes: [
        "Fungal pathogen thriving in high relative humidity and warm temperatures (24-29°C)",
        "Overcrowding of plants restricting dry airflow",
        "Water splashing spores from infected soil debris onto lower leaves"
      ],
      preventionTips: [
        "Use certified disease-free seeds and resistant varieties",
        "Mulch around the base of tomato plants to prevent soil splash",
        "Ensure 3-foot spacing between plants and practice crop rotation with corn or beans"
      ],
      treatment: {
        organic: "Remove and burn infected leaves. Spray organic copper fungicide or neem oil solution (1-2% concentration) every 7 days.",
        chemical: "Apply protective chemical fungicides containing Chlorothalonil or Mancozeb.",
        dosage: "Mix 2 grams of Mancozeb powder per liter of water. Apply as a fine foliar spray.",
        precautions: "Avoid spraying during peak midday heat. Wear safety goggles, gloves, and respiratory mask while applying chemicals. Keep harvesting restricted for 5 days post-spray."
      }
    };
  } else if (normalizedHint.includes('wheat')) {
    return {
      cropName: "Wheat",
      diseaseName: "Wheat Rust (Puccinia graminis)",
      severity: "Severe",
      confidenceScore: 89,
      causes: [
        "Windborne rust spores traveling long distances from host plants",
        "Excess nitrogen fertilization creating a dense, lush canopy which traps moisture",
        "Frequent rains and morning dews providing surface water required for spore germination"
      ],
      preventionTips: [
        "Sow rust-resistant wheat varieties (e.g., HD 2967, HD 3086)",
        "Avoid early sowing to bypass key spore-dispersal windows",
        "Limit excessive nitrogen application and maintain balanced NPK ratios"
      ],
      treatment: {
        organic: "Foliar application of fermented cow urine mixed with neem extract. Dust sulfur powder on leaves early in the morning.",
        chemical: "Spray triazole fungicides such as Propiconazole (Tilt 25% EC) or Tebuconazole.",
        dosage: "Mix 1 ml of Propiconazole 25% EC per liter of water. Spray using 200 liters of water per acre.",
        precautions: "Apply when wind speeds are low to avoid spray drift. Observe a 30-day safety interval before harvesting."
      }
    };
  } else {
    // Default mock response for generic crops
    return {
      cropName: cropHint === 'unknown' ? "Rice" : cropHint,
      diseaseName: "Brown Leaf Spot (Cochliobolus miyabeanus)",
      severity: "Mild",
      confidenceScore: 88,
      causes: [
        "Potassium deficiency in soil making plants vulnerable",
        "High humidity (above 85%) and wet leaf surfaces for over 8 hours",
        "Infected crop residue left on fields after the previous harvest"
      ],
      preventionTips: [
        "Ensure balanced soil fertilization with sufficient potassium levels",
        "Treat seeds with hot water (52°C) for 10 minutes before sowing",
        "Clear and burn stubble after harvesting to eliminate overwintering spores"
      ],
      treatment: {
        organic: "Spray 10% garlic bulb extract or Pseudomonas fluorescens bio-fungicide formulation.",
        chemical: "Spray Mancozeb or Carbendazim system-active fungicides.",
        dosage: "Use 2 grams of Carbendazim 50% WP per liter of clean water.",
        precautions: "Do not spray when rainfall is expected. Always follow local environmental safety guidelines."
      }
    };
  }
}

function generateMockVoiceResponse(query) {
  const q = query.toLowerCase();
  
  if (q.includes('tomato') || q.includes('blight')) {
    return `Early Blight is a common fungal disease in tomatoes. It shows up as dark spots with concentric rings (like a target) on older leaves.

To manage it organically, remove the infected lower leaves and spray a copper-based fungicide or neem oil. Make sure to water the plants at the soil level rather than sprinkling water on the leaves to prevent splash dispersion!`;
  }
  
  if (q.includes('scheme') || q.includes('subsidy') || q.includes('government')) {
    return `There are several government schemes currently open. PM-KISAN provides direct income support of ₹6,000 annually in three installments to all small and marginal landholding farmers. 

If you are looking for insurance, PM Fasal Bima Yojana offers crop insurance at very low premiums (1.5% to 2%). Let me know your land size and state, and I can list more specific schemes you qualify for!`;
  }

  if (q.includes('price') || q.includes('market') || q.includes('trend')) {
    return `Currently, major agricultural markets are showing strong demand for oilseeds and pulses. Wheat prices are stable with a moderate upward trend due to seasonal demand. 

Rice exports are active, keeping domestic prices firm. However, vegetable markets like onions are seeing high price volatility. I recommend monitoring price alerts before harvesting.`;
  }

  if (q === 'hi' || q === 'hello' || q === 'hey') {
    return `Hello! How can I help you with your farming or crops today?`;
  }

  return `For crop disease management, market trends, or government schemes, please ask your specific question directly, and I will search the manual for a recommendation.`;
}

function generateMockRAGResponse(query, contextDocs) {
  return `### Scientific Treatment Summary
Based on the query "${query}" and agricultural reference guides, here is a complete response:

1. **Diagnosis & Symptoms**:
   Symptoms indicate standard fungal/pest distress. Immediate attention is recommended to prevent spreading to adjacent plots.

2. **Organic Remediation**:
   - Apply a neem-seed kernel extract (NSKE) spray at 5% concentration.
   - For fungal issues, apply Trichoderma viride bio-fungicide to the soil (2.5 kg/hectare mixed with organic manure).

3. **Chemical Recommendation**:
   - Spray Mancozeb 75% WP or Carbendazim 50% WP for fungal diseases.
   - For insect infestations, apply Imidacloprid 17.8% SL.
   
4. **Dosage**:
   - Mancozeb: 2g per liter of water.
   - Imidacloprid: 0.5ml per liter of water.
   
5. **Precautions**:
   - Spray during early morning or late evening to prevent leaf scorch and save beneficial pollinator bees.
   - Observe a mandatory withholding period (minimum 7-10 days) between chemical spraying and harvesting.
   - Wear protective gloves, protective clothing, and face masks.`;
}
