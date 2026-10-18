/**
 * Resident Ask Resilia Chat Interface
 * Clean conversational interface with progressive disclosure:
 * Answers questions about shelter, supplies, and safety protocols using
 * shared server Gemini (online) or local deterministic engine (offline).
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Cpu,
  Info,
  Send,
  User,
  WifiOff,
} from 'lucide-react';
import { AskResiliaIcon } from '../../components/icons/ResidentIcons';
import { Card, PrimaryButton, ScreenHeader, Spinner } from './ui';
import { askResilia } from '../../services/agents/askService';
import { AIQuestionResponse } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  responseObj?: AIQuestionResponse;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  'Where is the nearest evacuation center?',
  'Where can I get drinking water?',
  'How do I request evacuation assistance?',
  'Which shelters are accessible?',
  'What should I prepare for an emergency?',
];

export const ResidentAsk: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: 'Hello, I am your Resilia Assistant. You can ask me about open evacuation centers, relief supply distribution, road conditions, or emergency preparation steps. Even when the internet is disconnected, I can retrieve verified local records.',
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || isLoading) return;

    setError(null);
    setInputQuery('');

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const resp = await askResilia(q);
      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: resp.answer,
        responseObj: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve an answer at this moment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <ScreenHeader
        title="Ask Resilia"
        subtitle="Get answers about shelter, supplies, and safety protocols"
        onBack={onBack}
      />

      {/* Chat Transcript */}
      <Card className="p-4 sm:p-5 min-h-[420px] flex flex-col justify-between space-y-4 bg-rs-card shadow-xs">
        <div className="space-y-4 overflow-y-auto max-h-[550px] pr-1">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-rs-forest text-white flex items-center justify-center shrink-0 mt-1">
                    <AskResiliaIcon className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-[15px] leading-relaxed ${
                    isUser
                      ? 'bg-rs-primary text-white rounded-br-xs'
                      : 'bg-rs-bg text-rs-text border border-rs-border rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Operational Grounding Metadata */}
                  {m.responseObj && (
                    <div className="mt-3 pt-3 border-t border-rs-border/60 text-xs space-y-2 text-rs-muted">
                      <div className="flex flex-wrap items-center gap-1.5 font-medium">
                        {m.responseObj.isOffline ? (
                          <span className="inline-flex items-center gap-1 text-rs-text bg-rs-card px-2 py-0.5 rounded border border-rs-border">
                            <WifiOff className="w-3 h-3 text-rs-muted" /> Local Offline Records
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rs-primary bg-rs-tint px-2 py-0.5 rounded">
                            <Cpu className="w-3 h-3" /> Server AI (Connected)
                          </span>
                        )}
                        <span>• Verification: {m.responseObj.verificationStatus}</span>
                      </div>

                      {m.responseObj.evidenceRecordIds && m.responseObj.evidenceRecordIds.length > 0 && (
                        <div className="text-[11px]">
                          <span className="font-semibold text-rs-text">Sources: </span>
                          {m.responseObj.evidenceRecordIds.join(', ')}
                        </div>
                      )}

                      {m.responseObj.uncertainties && m.responseObj.uncertainties.length > 0 && (
                        <div className="p-2 rounded bg-amber-50 text-amber-900 border border-amber-200/60 text-[11px] space-y-0.5">
                          <span className="font-semibold flex items-center gap-1">
                            <Info className="w-3 h-3 text-amber-700" /> Caution / Uncertainty:
                          </span>
                          <ul className="list-disc list-inside">
                            {m.responseObj.uncertainties.map((u, i) => (
                              <li key={i}>{u}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isUser ? 'text-white/80 text-right' : 'text-rs-muted text-left'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-rs-tint text-rs-primary flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-rs-forest text-white flex items-center justify-center shrink-0">
                <AskResiliaIcon className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-rs-bg border border-rs-border rounded-bl-xs text-sm">
                <Spinner label="Checking verified records..." />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Suggested Queries Chips */}
        <div className="pt-2 border-t border-rs-border/60">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {SUGGESTED_QUESTIONS.map((sq) => (
              <button
                key={sq}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(sq)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-rs-bg hover:bg-rs-tint hover:text-rs-primary-dark border border-rs-border text-rs-text whitespace-nowrap transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputQuery);
            }}
            className="flex gap-2 mt-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 min-h-[48px] px-4 rounded-xl border border-rs-border bg-rs-bg text-base text-rs-text placeholder:text-rs-muted focus:outline-none focus:ring-2 focus:ring-rs-primary focus:bg-rs-card transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="w-12 h-12 rounded-full bg-rs-primary hover:bg-rs-primary-dark disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs"
              aria-label="Send question"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
};
