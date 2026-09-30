import React, { useState } from 'react';
import { Bot, Send, X, ShieldAlert, Check, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolUsed?: string;
  toolResult?: any;
  requiresConfirmation?: boolean;
  confirmationPayload?: any;
}

export const CopilotModal: React.FC<CopilotModalProps> = ({ isOpen, onClose, onRefreshData }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello Dominic. I am Fleet Copilot, restricted to verified fleet intelligence operations. I can summarize fleet health, query highest risk vehicles, explain telemetry anomalies, or schedule maintenance actions with your confirmation.',
    }
  ]);

  if (!isOpen) return null;

  async function handleSend(queryText?: string) {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await api.queryCopilot(q);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          toolUsed: res.tool_used,
          toolResult: res.tool_result,
          requiresConfirmation: res.requires_confirmation,
          confirmationPayload: res.confirmation_payload
        }
      ]);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error executing query: ${err.message || 'Operation failed'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(msg: Message) {
    if (!msg.confirmationPayload) return;
    setLoading(true);
    try {
      const res = await api.queryCopilot(
        'Confirm maintenance action creation',
        true,
        msg.confirmationPayload
      );
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          toolUsed: res.tool_used,
          toolResult: res.tool_result
        }
      ]);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Confirmation failed: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span>Fleet Copilot</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                  ALLOWLIST ENFORCED
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Read-only default • Explicit write confirmation • Full audit trail</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3.5 ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-850 border border-slate-800 text-slate-200'
                }`}
              >
                {/* Tool Tag */}
                {m.toolUsed && (
                  <div className="mb-2 flex items-center space-x-1.5 text-[10px] font-mono text-sky-400 bg-slate-900/80 px-2 py-0.5 rounded border border-sky-500/20 w-fit">
                    <Sparkles className="w-3 h-3" />
                    <span>Executed tool: {m.toolUsed}()</span>
                  </div>
                )}

                <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                {/* Confirmation Box for Write Tools */}
                {m.requiresConfirmation && m.confirmationPayload && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-200 space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Write Action Requires Confirmation</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-300">
                      Vehicle: {m.confirmationPayload.vin} • Type: {m.confirmationPayload.action_type} • Priority: {m.confirmationPayload.priority}
                    </div>
                    <button
                      onClick={() => handleConfirm(m)}
                      disabled={loading}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs flex items-center space-x-1 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Schedule</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              <span>Copilot evaluating allowlisted tools...</span>
            </div>
          )}
        </div>

        {/* Suggested Queries Chips */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 text-[10px] font-mono whitespace-nowrap">Suggested:</span>
          <button
            onClick={() => handleSend('Which vehicles are at highest risk right now?')}
            className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 whitespace-nowrap transition-colors"
          >
            Highest risk vehicles
          </button>
          <button
            onClick={() => handleSend('Give me a summary of current fleet operations')}
            className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 whitespace-nowrap transition-colors"
          >
            Fleet health summary
          </button>
          <button
            onClick={() => handleSend('Schedule maintenance for highest risk vehicle')}
            className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 whitespace-nowrap transition-colors"
          >
            Schedule repair
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-850 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask Copilot about vehicle telemetry, risk explanations, or dispatch actions..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
