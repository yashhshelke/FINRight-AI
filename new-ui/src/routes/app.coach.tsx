import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, Paperclip, Send, FileText,
  BookOpen, TrendingUp, Wallet, Target, MessageSquare, Clock,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { AIAPI } from "@/lib/api/ai";

export const Route = createFileRoute("/app/coach")({
  component: Coach,
});

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: { document_name: string; relevance_score: number }[];
  attachment?: string;
  time: string;
}

const QUICK_PROMPTS = [
  { i: Wallet, t: "Where did my money go this month?" },
  { i: Target, t: "Am I on track with my savings goals?" },
  { i: TrendingUp, t: "How do I increase my savings rate?" },
  { i: BookOpen, t: "Explain 50/30/20 rule" },
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Coach() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const assistantIdRef = useRef<string>("");

  // Load chat history from Django backend
  const { data: history } = useQuery({
    queryKey: ["chat-history"],
    queryFn: () => AIAPI.getHistory(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (history && history.length > 0) {
      setMessages(
        history.map((m: any) => ({
          id: String(m.id),
          role: m.role === "assistant" ? "assistant" : "user",
          text: m.text || m.content || "",
          time: m.time || now(),
        }))
      );
    } else {
      setMessages([{
        id: "seed",
        role: "assistant",
        text: "Hi! I'm your Finexa AI coach. I have full context of your transactions and goals. Ask me anything about your finances.",
        time: now(),
      }]);
    }
  }, [history]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const sendMessage = useCallback(async (text: string, file?: File | null) => {
    if (!text.trim() && !file) return;
    if (busy) return;

    let docId: number | undefined;
    let finalText = text;

    // Handle file upload first
    if (file) {
      setBusy(true);
      try {
        const res = await AIAPI.processDocument(file);
        docId = res.document_id;
        if (!finalText) finalText = "I just uploaded a document. What can you tell me about it?";
      } catch {
        setMessages((prev) => [...prev, {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: "Failed to upload the file. Please try again.",
          time: now(),
        }]);
        setBusy(false);
        return;
      }
    }

    if (!finalText) return;

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: finalText,
      attachment: file?.name,
      time: now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedFile(null);
    setBusy(true);

    // Create placeholder AI message for streaming
    const aId = `a-${Date.now()}`;
    assistantIdRef.current = aId;
    setMessages((prev) => [...prev, { id: aId, role: "assistant", text: "", time: now() }]);

    // WebSocket streaming
    if (wsRef.current) wsRef.current.close();
    const wsUrl = AIAPI.getChatWebSocketUrl(docId);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ question: finalText, document_id: docId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "token") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aId ? { ...m, text: m.text + data.text } : m
            )
          );
        } else if (data.type === "done") {
          if (data.complete) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aId ? { ...m, text: data.complete, sources: data.sources } : m
              )
            );
          }
          setBusy(false);
          ws.close();
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onerror = () => {
      // Fallback to HTTP if WS fails
      AIAPI.chat(finalText, docId)
        .then((res) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aId ? { ...m, text: res.answer, sources: res.sources } : m
            )
          );
        })
        .catch(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aId ? { ...m, text: "Sorry, I couldn't reach the server. Please try again." } : m
            )
          );
        })
        .finally(() => setBusy(false));
    };

    ws.onclose = () => { setBusy(false); };
  }, [busy]);

  function send(text: string) {
    sendMessage(text, attachedFile);
    setAttachedFile(null);
  }

  return (
    <>
      <PageHeader title="AI Coach" subtitle="Your private financial guide. Always context-aware." />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="flex flex-col p-0 overflow-hidden min-h-[60vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[65vh]">
            {messages.map((m) => {
              const isAi = m.role === "assistant";
              return (
                <div key={m.id} className={`flex gap-3 ${isAi ? "" : "flex-row-reverse"}`}>
                  <div className={`h-8 w-8 shrink-0 rounded-full grid place-items-center ${isAi ? "bg-gradient-to-br from-brand-light to-brand" : "bg-surface"}`}>
                    {isAi ? <Sparkles className="h-4 w-4 text-background" /> : <span className="text-xs">U</span>}
                  </div>
                  <div className="max-w-[80%] space-y-1">
                    {m.attachment && (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{m.attachment}</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${isAi ? "bg-surface/60 text-foreground" : "bg-foreground text-background"}`}>
                      {m.text || (isAi && busy ? "…" : "")}
                    </div>
                    {m.sources && m.sources.length > 0 && (
                      <div className="space-y-1 mt-1">
                        {m.sources.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            {s.document_name} · {Math.round(s.relevance_score * 100)}% match
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground px-1">{m.time}</div>
                  </div>
                </div>
              );
            })}

            {busy && (
              <div className="flex gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-brand-light to-brand grid place-items-center">
                  <Sparkles className="h-4 w-4 text-background" />
                </div>
                <div className="rounded-2xl bg-surface/60 px-4 py-3 text-sm flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            {attachedFile && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs">
                <FileText className="h-3.5 w-3.5" />
                <span className="flex-1 truncate">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-error">✕</button>
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface/60 p-2">
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); }} />
              <button onClick={() => fileRef.current?.click()} className="rounded-lg p-2 text-muted-foreground hover:text-foreground">
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Ask anything about your money…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
              <button
                onClick={() => send(input)}
                disabled={busy}
                className="rounded-lg bg-cta p-2 text-cta-foreground disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Quick prompts</div>
            <div className="space-y-2">
              {QUICK_PROMPTS.map(({ i: Ic, t }) => (
                <button
                  key={t}
                  onClick={() => send(t)}
                  disabled={busy}
                  className="flex w-full items-start gap-2 rounded-lg border border-border p-3 text-left text-sm hover:bg-foreground/[0.03] disabled:opacity-50"
                >
                  <Ic className="h-4 w-4 mt-0.5 text-brand-light shrink-0" />
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </Card>
          <ChatSessionsPicker />
          <Card>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Context</div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Transactions indexed
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Uploaded documents
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Goals tracked
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ─── Chat Sessions Picker ──────────────────────────────────────────────── */
function ChatSessionsPicker() {
  const { data: sessions } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => AIAPI.getChatSessions(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const sessionList = Array.isArray(sessions) ? sessions : sessions?.results ?? [];

  if (sessionList.length === 0) return null;

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Sessions</div>
      </div>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {sessionList.slice(0, 8).map((s: any) => (
          <div
            key={s.id}
            className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-xs hover:bg-foreground/[0.03] cursor-pointer"
          >
            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate">{s.title || `Session ${s.id}`}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {s.updated_at ? timeAgo(s.updated_at) : ""}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
