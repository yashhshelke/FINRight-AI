import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, Bot, User, FileText, X, TrendingUp, PieChart, ShieldCheck } from 'lucide-react';
import { AIAPI } from '@/lib/api';

const C = {
  teal: '#003d3d', sage: '#cdface', charcoal: '#2a2b2f', rust: '#b05b36',
  cream: '#f5eee2', white: '#ffffff', border: 'rgba(42,43,47,0.1)',
  muted: 'rgba(42,43,47,0.45)', rustLight: 'rgba(176,91,54,0.1)',
  sageLight: 'rgba(205,250,206,0.35)',
};

type Message = {
  id: number; role: 'user' | 'assistant'; text: string;
  attachment?: { name: string }; sources?: { document_name: string; preview: string; relevance_score: number }[];
  chips?: string[]; time: string; loading?: boolean;
};

const initialMessages: Message[] = [{
  id: 1, role: 'assistant', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  text: "Hi! I'm your Finexa AI financial assistant. I can analyze your invoices, track spending patterns, and give personalized money insights.\n\nUpload a document or ask me anything!",
  chips: ['Analyze my spending', 'Budget tips', 'Upload invoice'],
}];

const quickPrompts = [
  { icon: TrendingUp, text: 'Spending trends' },
  { icon: PieChart, text: 'Budget analysis' },
  { icon: ShieldCheck, text: 'Saving tips' },
];

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load global chat history
    AIAPI.getHistory().then((history) => {
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages(initialMessages);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() && !attachedFile) return;
    const userMsg: Message = {
      id: Date.now(), role: 'user', text: input || 'Uploaded a file',
      attachment: attachedFile ? { name: attachedFile.name } : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    const question = input;
    setInput('');
    setIsTyping(true);

    try {
      // If file attached, upload first
      if (attachedFile) {
        await AIAPI.processDocument(attachedFile);
        setAttachedFile(null);
      }

      // RAG chat (global context, searches all user documents)
      const res = await AIAPI.chat(question || 'I just uploaded a document. What can you tell me about it?');
      const aiMsg: Message = {
        id: Date.now() + 1, role: 'assistant', text: res.answer,
        sources: res.sources,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        id: Date.now() + 1, role: 'assistant',
        text: `Sorry, I encountered an error: ${e.message}. Please try again.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ background: C.cream, height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Outfit, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 16px', background: C.teal, flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: C.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={20} color={C.white} />
          </div>
          <div>
            <p style={{ color: C.white, fontWeight: 600, fontSize: 17, margin: 0, fontFamily: 'Playfair Display, serif' }}>
              Finexa <em style={{ color: C.sage, fontStyle: 'italic' }}>AI</em>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.sage }} />
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>Active · Powered by RAG</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div style={{ background: C.white, padding: '10px 24px', display: 'flex', gap: 8, overflowX: 'auto', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {quickPrompts.map((q) => {
          const Icon = q.icon;
          return (
            <button key={q.text} onClick={() => setInput(q.text)} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', background: C.sageLight, borderRadius: 20, padding: '7px 14px', border: `1px solid rgba(0,61,61,0.15)`, cursor: 'pointer' }}>
              <Icon size={12} color={C.teal} />
              <span style={{ color: C.teal, fontSize: 12, fontWeight: 500 }}>{q.text}</span>
            </button>
          );
        })}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: msg.role === 'assistant' ? C.teal : C.rust, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {msg.role === 'assistant' ? <Bot size={14} color={C.white} /> : <User size={14} color={C.white} />}
              </div>
              <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {msg.attachment && (
                  <div style={{ background: C.rustLight, borderRadius: 10, padding: '8px 12px', border: `1px solid rgba(176,91,54,0.2)`, display: 'flex', alignItems: 'center', gap: 8, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <FileText size={14} color={C.rust} />
                    <span style={{ color: C.charcoal, fontSize: 12 }}>{msg.attachment.name}</span>
                  </div>
                )}
                <div style={{ background: msg.role === 'assistant' ? C.white : C.teal, borderRadius: msg.role === 'assistant' ? '4px 18px 18px 18px' : '18px 4px 18px 18px', padding: '13px 16px', border: msg.role === 'assistant' ? `1px solid ${C.border}` : 'none', boxShadow: '0 2px 12px rgba(42,43,47,0.08)' }}>
                  <p style={{ color: msg.role === 'assistant' ? C.charcoal : C.white, fontSize: 13, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {msg.sources.map((src, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.sageLight, borderRadius: 6, padding: '4px 8px', border: `1px solid rgba(0,61,61,0.15)` }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.teal, flexShrink: 0 }} />
                          <span style={{ color: C.teal, fontSize: 10, fontWeight: 500 }}>Source: {src.document_name} ({Math.round(src.relevance_score * 100)}% match)</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.chips && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {msg.chips.map((chip) => (
                        <button key={chip} onClick={() => setInput(chip)} style={{ background: C.cream, borderRadius: 20, padding: '5px 12px', border: `1px solid rgba(0,61,61,0.15)`, cursor: 'pointer' }}>
                          <span style={{ color: C.teal, fontSize: 11 }}>{chip}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ color: C.muted, fontSize: 10, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} color={C.white} />
              </div>
              <div style={{ background: C.white, borderRadius: '4px 18px 18px 18px', padding: '16px 18px', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, animation: 'typingBounce 1s infinite', animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '14px 24px 24px', background: C.white, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {attachedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, background: C.rustLight, borderRadius: 10, padding: '7px 12px', border: `1px solid rgba(176,91,54,0.2)` }}>
              <FileText size={13} color={C.rust} />
              <span style={{ color: C.charcoal, fontSize: 12, flex: 1 }}>{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={13} color={C.muted} />
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.cream, borderRadius: 24, padding: '10px 10px 10px 18px', border: `1px solid rgba(0,61,61,0.15)` }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything about your finances..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.charcoal, fontSize: 14, fontFamily: 'Outfit, sans-serif' }}
            />
            <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); }} />
            <button onClick={() => fileRef.current?.click()} style={{ width: 36, height: 36, borderRadius: 11, cursor: 'pointer', background: C.rustLight, border: `1px solid rgba(176,91,54,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Paperclip size={15} color={C.rust} />
            </button>
            <button onClick={sendMessage} disabled={isTyping} style={{ width: 36, height: 36, borderRadius: 11, cursor: 'pointer', background: C.teal, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(0,61,61,0.35)', opacity: isTyping ? 0.6 : 1 }}>
              <Send size={15} color={C.white} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
