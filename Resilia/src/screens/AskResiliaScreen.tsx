/**
 * Resilia Screen 2: Ask Resilia
 * AI-assisted question answering with dual engine:
 * 1. Cloud Gemini 3.8 Flash with structured grounded retrieval when online
 * 2. Deterministic local retrieval over IndexedDB records and NDRRMC knowledge when offline
 * Strictly obeys Principle 4: Unknown information remains unknown; never invent emergency facts.
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Cpu,
  HelpCircle,
  Info,
  Radio,
  Send,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AIQuestionResponse } from '../types';
import { askResilia } from '../services/agents/askService';

const EXAMPLE_QUESTIONS = [
  'Which evacuation center is accessible to wheelchair users?',
  'What is the current Marikina River alert level and evacuation threshold?',
  'Where can we get clean drinking water or relief food packs in Malanday?',
  'What are the emergency hotlines for Marikina Rescue 161?',
  'What is the standard emergency go-bag checklist for flood evacuation?',
];

export const AskResiliaScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIQuestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (questionText: string) => {
    if (!questionText.trim()) return;
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      setResponse(await askResilia(questionText));
    } catch (localErr: any) {
      setError('Failed to query local database: ' + localErr.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Intro Header */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900">Ask Resilia</h2>
            <p className="text-xs text-neutral-500">
              Operational information retrieval with supporting evidence and verification status.
            </p>
          </div>
        </div>

        {/* Query Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(query);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about wheelchair shelters, river alert level, water supplies..."
            className="flex-1 bg-neutral-50 border border-neutral-300 rounded-2xl px-4 py-3 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>

        {/* Example Prompt Chips */}
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
            Suggested Operational Queries:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(q);
                  handleSubmit(q);
                }}
                className="text-left text-xs px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-900 border border-neutral-200 text-neutral-700 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
          <div className="font-bold text-sm text-neutral-800">Searching Community Ground Truth...</div>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Retrieving structured records, checking wheelchair accessibility tags, occupancy thresholds, and evidence provenance.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Response Card */}
      {response && !isLoading && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 space-y-5">
          {/* Engine & Freshness Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 text-xs">
            <div className="flex items-center gap-2">
              {response.isOffline ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-300 font-semibold">
                  <WifiOff className="w-3.5 h-3.5 text-neutral-500" />
                  Local Offline Retrieval
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  Google Gemini 3.8 Flash (Server-Side)
                </span>
              )}

              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[11px] font-medium border border-teal-200">
                Intent: {response.intent}
              </span>
            </div>

            <div className="text-[11px] text-neutral-500">
              Verification: <span className="font-semibold text-emerald-700">{response.verificationStatus}</span>
            </div>
          </div>

          {/* Answer Body */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-neutral-900">Answer & Operational Findings:</h3>
            <div className="text-neutral-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
              {response.answer}
            </div>
          </div>

          {/* AI Evidence Citations (Principle 3: AI recommendations must include supporting evidence) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Supporting Evidence Record IDs
              </div>
              {response.evidenceRecordIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {response.evidenceRecordIds.map((id, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-md bg-white border border-emerald-300 text-emerald-900 font-mono text-[11px] shadow-2xs"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 italic">No specific database records cited.</p>
              )}
              <p className="text-[11px] text-emerald-800 pt-1">
                {response.confidenceExplanation}
              </p>
            </div>

            {/* Uncertainties & Safety Caveats (Principle 4) */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                Recognized Uncertainties
              </div>
              {response.uncertainties.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-amber-900 text-[11px]">
                  {response.uncertainties.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-neutral-500 text-[11px] italic">
                  Information matched strictly to verified local community registries.
                </p>
              )}
              {response.proposedActions.length > 0 && (
                <div className="pt-2 border-t border-amber-200/60">
                  <span className="font-semibold text-amber-950 block mb-1">Recommended Next Step:</span>
                  <div className="text-[11px] text-amber-900">
                    {response.proposedActions.join(' ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
