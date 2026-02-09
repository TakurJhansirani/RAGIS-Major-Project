import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const sampleQueries = [
  "What are the top threats this week?",
  "Has IP 185.220.101.34 appeared before?",
  "Summarize all critical incidents today",
  "Show lateral movement patterns",
];

const mockResponses: Record<string, string> = {
  "What are the top threats this week?":
    "This week's top threats are: **1) Lateral Movement** (3 incidents, targeting Domain Controllers), **2) Spear-Phishing** (5 campaigns detected, 2 targeting executives), **3) Data Exfiltration** (2 incidents with 4.1GB total outbound transfer). Critical finding: The lateral movement incidents correlate with credentials compromised in Monday's phishing campaign (INC-2024-0831).",
  "Has IP 185.220.101.34 appeared before?":
    "Yes. IP **185.220.101.34** has appeared in **3 prior incidents** over the past 30 days:\n- INC-2024-0846: Phishing campaign (today)\n- INC-2024-0798: Spam relay (Dec 8)\n- INC-2024-0756: Credential stuffing (Dec 1)\n\nThis IP is associated with a known Tor exit node and is listed in 4 threat intelligence feeds. **Recommendation:** Add to permanent block list.",
  default:
    "Based on my analysis of the current incident data and historical knowledge base, I've identified the relevant patterns. The RAG pipeline retrieved 12 similar historical incidents to provide context. Would you like me to generate a detailed report or drill down into specific indicators?",
};

export const QueryInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = (query?: string) => {
    const text = query || input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const aiResponse = mockResponses[text] || mockResponses.default;
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: aiResponse,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-xl border border-border bg-card flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Brain className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Natural Language Query
        </h2>
        <Sparkles className="h-3 w-3 text-primary ml-1" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Ask RAGIS about your security incidents</p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              {sampleQueries.map((query) => (
                <button
                  key={query}
                  onClick={() => handleSend(query)}
                  className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-left text-secondary-foreground hover:bg-secondary hover:border-primary/30 transition-all duration-200"
                >
                  <Sparkles className="inline h-3 w-3 text-primary mr-1.5" />
                  {query}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-lg p-3',
                  msg.role === 'user'
                    ? 'bg-primary/10 border border-primary/20 ml-8'
                    : 'bg-secondary/50 border border-border mr-4'
                )}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  {msg.role === 'ai' && <Brain className="h-3 w-3 text-primary" />}
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {msg.role === 'user' ? 'You' : 'RAGIS AI'}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{msg.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about incidents, threats, IPs..."
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
