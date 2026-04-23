import { GoogleGenAI } from '@google/genai';

const SLEEP_BEFORE_RETRY_MS = 2000;
const MAX_RETRIES = 3;

/**
 * Robust AI Generation Service with Retry and Fallback logic
 * Fixes: RESOURCE_EXHAUSTED (429) errors
 */
export const generateWithRetry = async (
  apiKey: string,
  prompt: string,
  options: { model?: string; search?: boolean } = {}
) => {
  const models = [
    options.model || 'gemini-3-flash-preview',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite-preview'
  ];

  const ai = new GoogleGenAI({ apiKey });

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    for (const modelName of models) {
      try {
        const model = ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: options.search ? { tools: [{ googleSearch: {} }] } : undefined
        });

        const response = await model;
        if (!response.text) throw new Error('Empty response from AI');
        
        return response.text;
      } catch (err: any) {
        const isRateLimit = err?.message?.includes('429') || err?.message?.includes('exhausted');
        const isHighDemand = err?.message?.includes('high demand');
        const isQuota = err?.message?.includes('quota');
        const isNotFound = err?.message?.includes('404') || err?.message?.includes('not found');
        
        console.warn(`Attempt ${attempt + 1} with model ${modelName} failed:`, err.message);

        // Try the next model in the list
        if (isRateLimit || isHighDemand || isQuota || isNotFound) {
           if (modelName === models[models.length - 1]) {
             // If we're at the last model, wait before the next attempt
             await new Promise(r => setTimeout(r, SLEEP_BEFORE_RETRY_MS * (attempt + 1)));
           }
           continue; // Move to next model
        }

        // For other errors, just throw
        throw err;
      }
    }
  }

  throw new Error('All models and retry attempts exhausted. Please try again in few minutes.');
};
