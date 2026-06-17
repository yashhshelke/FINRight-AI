import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Wifi, Trash2, Loader2, X } from "lucide-react";
import { useState } from "react";
import { CardsAPI } from "@/lib/api/settings";

export const Route = createFileRoute("/app/cards")({
  component: Cards,
});

const GRADIENTS = [
  "from-brand to-brand-light",
  "from-foreground/80 to-foreground/40",
  "from-cta to-warning",
  "from-brand-light to-success",
  "from-error to-cta",
];

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}

function Cards() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [active, setActive] = useState(0);
  const [newCard, setNewCard] = useState({
    number: "", holder: "", expiry: "", cvv: "", type: "Visa" as "Visa" | "Mastercard", colorIdx: 0,
  });

  const { data: rawCards, isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => CardsAPI.list(),
    staleTime: 5 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: (d: Parameters<typeof CardsAPI.add>[0]) => CardsAPI.add(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      setShowAdd(false);
      setNewCard({ number: "", holder: "", expiry: "", cvv: "", type: "Visa", colorIdx: 0 });
      setActive(0);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => CardsAPI.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cards"] }); setActive(0); },
  });

  const cards = rawCards ?? [];

  function handleAdd() {
    if (!newCard.number || !newCard.holder || !newCard.expiry) return;
    addMutation.mutate({
      card_number: newCard.number,
      card_holder: newCard.holder,
      expiry: newCard.expiry,
      card_type: newCard.type,
      gradient_index: newCard.colorIdx,
    });
  }

  return (
    <>
      <PageHeader
        title="Cards"
        subtitle="Beautiful, programmable cards for every part of your life."
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-foreground"
          >
            <Plus className="h-4 w-4" /> New card
          </button>
        }
      />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[1.586/1] rounded-2xl" />)}
        </div>
      ) : cards.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="text-muted-foreground mb-3 text-4xl">💳</div>
          <p className="text-sm text-muted-foreground">No cards added yet.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-foreground"
          >
            <Plus className="h-4 w-4" /> Add your first card
          </button>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((c: any, i: number) => {
              const grad = GRADIENTS[c.gradient_index ?? i % GRADIENTS.length];
              return (
                <div key={c.id} className="space-y-3">
                  <div
                    className={`aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${grad} p-5 text-background relative overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] cursor-pointer`}
                    onClick={() => setActive(i)}
                  >
                    <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at top right, white 0%, transparent 60%)" }} />
                    <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="text-display text-xl">Finexa</div>
                        <Wifi className="h-5 w-5 rotate-90 opacity-80" />
                      </div>
                      <div>
                        <div className="text-sm opacity-80">{c.card_holder}</div>
                        <div className="mt-2 text-display text-xl tracking-[0.2em]">
                          •••• {c.last4}
                        </div>
                        <div className="mt-1 flex justify-between text-xs opacity-70">
                          <span>{c.card_type}</span>
                          <span>Expires {c.expiry}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{c.card_type} •••• {c.last4}</span>
                    <button
                      onClick={() => removeMutation.mutate(c.id)}
                      disabled={removeMutation.isPending}
                      className="p-1.5 text-muted-foreground hover:text-error rounded-lg"
                    >
                      {removeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add Card Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl md:rounded-2xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-display text-xl">Add New Card</h3>
              <button onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></button>
            </div>

            {/* Live preview */}
            <div className={`aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${GRADIENTS[newCard.colorIdx]} p-4 text-background mb-5 relative overflow-hidden`}>
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="text-display text-lg">Finexa</div>
                  <Wifi className="h-4 w-4 rotate-90 opacity-80" />
                </div>
                <div>
                  <div className="text-display text-lg tracking-[0.2em]">
                    {newCard.number || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex justify-between mt-1 text-xs opacity-80">
                    <span>{newCard.holder || "FULL NAME"}</span>
                    <span>{newCard.expiry || "MM/YY"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Color picker */}
            <div className="flex gap-2 mb-4">
              {GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setNewCard({ ...newCard, colorIdx: i })}
                  className={`h-7 w-7 rounded-full bg-gradient-to-br ${g} transition-all ${newCard.colorIdx === i ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
                />
              ))}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Card number</label>
                <input
                  value={newCard.number}
                  maxLength={19}
                  placeholder="1234 5678 9012 3456"
                  onChange={(e) => setNewCard({ ...newCard, number: formatCardNumber(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cardholder name</label>
                <input
                  value={newCard.holder}
                  placeholder="FULL NAME"
                  onChange={(e) => setNewCard({ ...newCard, holder: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Expiry (MM/YY)</label>
                  <input
                    value={newCard.expiry}
                    maxLength={5}
                    placeholder="08/28"
                    onChange={(e) => setNewCard({ ...newCard, expiry: formatExpiry(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">CVV</label>
                  <input
                    type="password"
                    value={newCard.cvv}
                    maxLength={4}
                    placeholder="•••"
                    onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Card type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Visa", "Mastercard"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewCard({ ...newCard, type: t })}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${newCard.type === t ? "bg-foreground text-background" : "border border-border text-muted-foreground"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={addMutation.isPending || !newCard.number || !newCard.holder || !newCard.expiry}
              className="w-full rounded-lg bg-cta py-2.5 text-sm font-medium text-cta-foreground disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {addMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : "Add Card"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
