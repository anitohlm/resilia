/**
 * Shared "Ask Resilia" question pipeline.
 * 1. Server-side Gemini (grounded on community records) when the backend is reachable.
 * 2. Deterministic local retrieval over IndexedDB when offline or the server fails.
 * Never fabricates answers: both engines return their own evidence and uncertainties.
 */

import { AIQuestionResponse } from '../../types';
import { LocalAgentOrchestrator } from './localOrchestrator';
import { syncClient } from '../offline/syncClient';

export async function askResilia(questionText: string): Promise<AIQuestionResponse> {
  const isOffline = syncClient.getStatus() === 'OFFLINE' || syncClient.isSimulatingOffline();

  if (!isOffline) {
    try {
      // Strict client timeout so upstream model delays never freeze the UI;
      // falls back to local ground truth immediately.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3200);
      const res = await fetch('/api/v1/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: questionText }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return (await res.json()) as AIQuestionResponse;
      }
      console.warn('Cloud AI endpoint non-200, activating local retrieval');
    } catch (err: any) {
      console.warn('Cloud AI unreachable, falling back to local database:', err?.message);
    }
  }

  return LocalAgentOrchestrator.answerQuestion(questionText);
}
