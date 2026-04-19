import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'Failed to get AI response';
};

const sampleQueries = [
  "What are the top threats this week?",
  "Summarize all critical incidents",
  "Show lateral movement patterns",
  "Which IPs have appeared in multiple incidents?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-query`;

export const QueryInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (query?: string) => {
    const text = query || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    const apiMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, mode: 'query' }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'AI service error' }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response stream');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const upsertAssistant = (content: string) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content, timestamp: new Date() }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              upsertAssistant(assistantContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              upsertAssistant(assistantContent);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: unknown) {
      console.error('AI query error:', e);
      toast.error(getErrorMessage(e));
      // Remove the user message if no assistant response was generated
      if (!assistantContent) {
        setMessages(prev => prev.filter(m => m.id !== userMsg.id));
      }
    } finally {
      setIsLoading(false);
    }
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
          RAG-Powered AI Query
        </h2>
        <Sparkles className="h-3 w-3 text-primary ml-1" />
        <span className="ml-auto text-[10px] text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">Live AI</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Ask RAGIS about your security incidents — powered by real AI & live data</p>
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
                  {msg.role === 'assistant' && <Brain className="h-3 w-3 text-primary" />}
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {msg.role === 'user' ? 'You' : 'RAGIS AI'}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/90">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-foreground/90">{msg.content}</p>
                )}
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground p-3"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs">RAGIS is analyzing...</span>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
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
            disabled={isLoading}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
