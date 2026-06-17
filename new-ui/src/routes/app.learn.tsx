import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { BookOpen, Search, Sparkles, Loader2, Play, X, Brain, Award, Info, TrendingUp, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIAPI } from "@/lib/api/ai";
import { educationCards, videoLessons, advisoryQuiz } from "@/lib/education-data";

export const Route = createFileRoute("/app/learn")({
  component: Learn,
});

function Learn() {
  const [q, setQ] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSources, setAiSources] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = ["All", ...new Set(educationCards.map((c) => c.category))];
  const filteredCards = activeCategory && activeCategory !== "All"
    ? educationCards.filter((c) => c.category === activeCategory)
    : educationCards;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setAiLoading(true);
    setAiAnswer("");
    setAiSources([]);
    try {
      const res = await AIAPI.searchKnowledge(q);
      if (res.results?.length > 0) {
        setAiAnswer(res.results.map((r: any) => r.content || r.text || r.title).join("\n\n"));
        setAiSources(res.results);
      } else {
        const chatRes = await AIAPI.chat(q);
        setAiAnswer(chatRes.answer);
        setAiSources(chatRes.sources ?? []);
      }
    } catch {
      setAiAnswer("Could not fetch an answer. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Financial Education" subtitle="Learn, practice, grow your financial IQ." />

      {/* Search */}
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); if (!e.target.value) { setAiAnswer(""); setAiSources([]); } }}
            placeholder="Search knowledge base or ask a question..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <button type="submit" disabled={aiLoading || !q.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs disabled:opacity-50">
            {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {aiLoading ? "Thinking..." : "Ask AI"}
          </button>
        </form>
        {(aiAnswer || aiLoading) && (
          <div className="mt-4 rounded-xl border border-border bg-surface/40 p-4">
            <div className="flex items-center gap-2 mb-2 text-xs text-brand-light font-medium">
              <Sparkles className="h-3.5 w-3.5" /> AI Answer
            </div>
            {aiLoading ? (
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:240ms]" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
            )}
          </div>
        )}
      </Card>

      {/* Video Lessons */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand/10 border border-brand/20 grid place-items-center">
              <TrendingUp className="h-4 w-4 text-brand-light" />
            </div>
            <div>
              <div className="text-display text-lg">Video Masterclasses</div>
              <div className="text-xs text-muted-foreground">Advanced strategies for wealth building</div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {videoLessons.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Flip Cards */}
        <div className="lg:col-span-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat === "All" ? null : cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  (!activeCategory && cat === "All") || activeCategory === cat
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCards.map((card) => (
              <FlipCard key={card.id} card={card} />
            ))}
          </div>
        </div>

        {/* Sidebar: Quiz */}
        <div className="lg:col-span-4">
          <AdvisoryQuiz />
        </div>
      </div>
    </>
  );
}

/* --- Video Card --- */
function VideoCard({ video }: { video: typeof videoLessons[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div onClick={() => setOpen(true)}
        className="flex-shrink-0 w-64 rounded-2xl border border-border bg-surface/40 overflow-hidden cursor-pointer group hover:border-brand-light/30 transition-colors">
        <div className="relative h-36 bg-background overflow-hidden">
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity group-hover:scale-105 duration-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur grid place-items-center border border-white/10 group-hover:border-brand-light/40 transition-colors">
              <Play className="h-5 w-5 text-white fill-white/20 ml-0.5" />
            </div>
          </div>
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-brand/20 backdrop-blur border border-brand/30 rounded text-[9px] font-bold text-brand-light uppercase tracking-widest">
            {video.category}
          </div>
        </div>
        <div className="p-3">
          <h4 className="text-sm font-medium leading-snug line-clamp-2">{video.title}</h4>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
            <Play className="h-3 w-3" /> {video.duration}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border border-border shadow-2xl">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              <button onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10">
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* --- Flip Card --- */
function FlipCard({ card }: { card: typeof educationCards[0] }) {
  const [flipped, setFlipped] = useState(false);
  const diffColor = card.difficulty === "Beginner" ? "text-success" : card.difficulty === "Intermediate" ? "text-brand-light" : "text-error";

  return (
    <div className="relative h-56 cursor-pointer" style={{ perspective: "1200px" }} onClick={() => setFlipped(!flipped)}>
      <motion.div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 25 }}>
        {/* Front */}
        <div className="absolute inset-0 rounded-2xl border border-border bg-surface/60 p-5 flex flex-col justify-between backdrop-blur"
          style={{ backfaceVisibility: "hidden" }}>
          <div className="flex items-start justify-between">
            <div className="h-8 w-8 rounded-lg bg-brand/10 border border-brand/20 grid place-items-center">
              <BookOpen className="h-4 w-4 text-brand-light" />
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-bold uppercase tracking-widest ${diffColor}`}>{card.difficulty}</span>
              <div className="text-[10px] text-muted-foreground mt-0.5">{card.category}</div>
            </div>
          </div>
          <div>
            <h3 className="text-base font-medium leading-tight">{card.question}</h3>
            <div className="mt-3 text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-light animate-pulse" />
              Click to reveal answer
            </div>
          </div>
        </div>
        {/* Back */}
        <div className="absolute inset-0 rounded-2xl border border-border bg-surface/80 p-5 flex flex-col backdrop-blur"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-light mb-3">Answer</div>
          <p className="text-sm leading-relaxed text-muted-foreground flex-1 overflow-y-auto">{card.answer}</p>
          <div className="mt-3 text-[9px] text-muted-foreground uppercase tracking-widest">Click to flip back</div>
        </div>
      </motion.div>
    </div>
  );
}

/* --- Advisory Quiz --- */
function AdvisoryQuiz() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [showRationale, setShowRationale] = useState(false);

  function handleSelect(idx: number) {
    if (showRationale) return;
    setSelected(idx);
    setShowRationale(true);
    if (idx === advisoryQuiz[step].answer) setScore((s) => s + 1);
    setTimeout(() => {
      if (step < advisoryQuiz.length - 1) {
        setStep(step + 1);
        setSelected(null);
        setShowRationale(false);
      } else {
        setDone(true);
      }
    }, 2200);
  }

  function reset() {
    setStep(0);
    setScore(0);
    setDone(false);
    setSelected(null);
    setShowRationale(false);
  }

  if (done) {
    return (
      <Card>
        <div className="text-center space-y-4 py-4">
          <div className="h-14 w-14 rounded-full bg-brand/10 border border-brand/20 grid place-items-center mx-auto">
            <Award className="h-7 w-7 text-brand-light" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Assessment Complete</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Advisory IQ: <span className="text-brand-light font-bold">{Math.round((score / advisoryQuiz.length) * 100)}%</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {score === advisoryQuiz.length
              ? "Elite strategic comprehension. You possess institutional-grade financial literacy."
              : "Solid foundations. Consider reviewing the education cards above for areas to strengthen."}
          </p>
          <button onClick={reset}
            className="w-full py-2 border border-border rounded-xl text-xs font-medium hover:bg-surface transition-colors">
            Retake Assessment
          </button>
        </div>
      </Card>
    );
  }

  const current = advisoryQuiz[step];
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-brand-light" />
          <span className="text-sm font-medium">Advisory IQ</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{step + 1} / {advisoryQuiz.length}</span>
      </div>
      <h4 className="text-sm font-medium leading-relaxed mb-4">{current.question}</h4>
      <div className="space-y-2">
        {current.options.map((opt, idx) => (
          <button key={idx} onClick={() => handleSelect(idx)}
            className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
              selected === idx
                ? idx === current.answer ? "bg-success/10 border-success/40 text-success" : "bg-error/10 border-error/40 text-error"
                : showRationale && idx === current.answer ? "bg-success/10 border-success/40 text-success"
                : "border-border hover:border-foreground/20 text-muted-foreground"
            }`}>
            {opt}
          </button>
        ))}
      </div>
      {showRationale && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-xl border border-brand/10 bg-brand/5 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-brand-light mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">{current.rationale}</p>
        </motion.div>
      )}
    </Card>
  );
}
