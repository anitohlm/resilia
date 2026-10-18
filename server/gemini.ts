/**
 * Resilia Server-Side Google Gen AI SDK Client
 * Follows Google AI Studio build guidelines:
 * - Server-side only (never expose GEMINI_API_KEY to browser)
 * - Uses @google/genai modern SDK
 * - Sets User-Agent: 'aistudio-build'
 * - Uses supported model 'gemini-3.8-flash'
 */

import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export const GEMINI_MODEL = 'gemini-3.8-flash';
