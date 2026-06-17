import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Flame, Trophy, Target as TargetIcon,
  CheckCircle2, Lock, Shield, Star, Zap,
} from "lucide-react";
import { GamificationAPI } from "@/lib/api/gamification";

export const Route = createFileRoute("/app/challenges")({
  component: Challenges,
});

const BADGE_ICONS = [Shield, Star, Flame, Zap, TargetIcon, Trophy];

function Challenges() {
  const qc = useQueryClient();

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["gamification-summary"],
    queryFn: () => GamificationAPI.getSummary(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: myChallenges, isLoading: chalLoading } = useQuery({
    queryKey: ["my-challenges"],
    queryFn: () => GamificationAPI.getMyChallenges(),
    staleTime: 2 * 60 * 1000,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => GamificationAPI.toggleChallenge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-challenges"] });
      qc.invalidateQueries({ queryKey: ["gamification-summary"] });
    },
  });

  const challenges = myChallenges?.results ?? [];
  const allBadges = summary?.badges?.all ?? [];
  const earnedIds = new Set((summary?.badges?.earned ?? []).map((b: any) => b.badge ?? b.id));
  const completedCount = summary?.challenges?.completed ?? 0;
  const totalCount = summary?.challenges?.total ?? 0;
  const maxStreak = summary?.challenges?.max_streak ?? 0;

  return (
    <>
      <PageHeader title="Challenges" subtitle="Tiny wins, compounded." />

      {/* Header stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <div className="flex items-center gap-2 text-cta">
            <Flame className="h-5 w-5" />
            <span className="text-sm">Current streak</span>
          </div>
          <div className="mt-2 text-display text-5xl">
            {sumLoading ? "—" : maxStreak}{" "}
            <span className="text-xl text-muted-foreground">days</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-warning">
            <Trophy className="h-5 w-5" />
            <span className="text-sm">Completed</span>
          </div>
          <div className="mt-2 text-display text-5xl">
            {sumLoading ? "—" : completedCount}
            <span className="text-xl text-muted-foreground"> / {totalCount}</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-brand-light">
            <TargetIcon className="h-5 w-5" />
            <span className="text-sm">Active challenges</span>
          </div>
          <div className="mt-2 text-display text-5xl">
            {sumLoading ? "—" : totalCount - completedCount}
            <span className="text-xl text-muted-foreground"> remaining</span>
          </div>
        </Card>
      </div>

      {/* Challenge cards */}
      {chalLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><Skeleton className="h-36 w-full" /></Card>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <Card className="py-16 text-center">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">No challenges yet. They will appear here automatically.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((uc: any) => {
            const ch = uc.challenge || uc;
            const isDone = uc.completed;
            const streak = uc.streak ?? 0;
            return (
              <Card key={uc.id}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`h-11 w-11 rounded-xl grid place-items-center text-xl ${isDone ? "bg-success/20" : "bg-gradient-to-br from-brand to-brand-light"}`}>
                    {ch.icon || "🎯"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-display text-lg truncate">{ch.name || ch.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {ch.description || ""} · {ch.points ?? 50} pts
                    </div>
                  </div>
                </div>

                {streak > 0 && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs text-cta">
                    <Flame className="h-3.5 w-3.5" /> {streak} day streak
                  </div>
                )}

                <button
                  onClick={() => toggleMutation.mutate(uc.id)}
                  disabled={toggleMutation.isPending}
                  className={`w-full rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    isDone
                      ? "bg-success/15 text-success border border-success/30"
                      : "border border-border text-muted-foreground hover:border-brand-light hover:text-foreground"
                  }`}
                >
                  {isDone ? <><CheckCircle2 className="h-4 w-4" /> Completed</> : "Mark complete"}
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Badges */}
      {allBadges.length > 0 && (
        <Card className="mt-6">
          <div className="text-display text-lg mb-4">Badges</div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {allBadges.slice(0, 12).map((badge: any, i: number) => {
              const unlocked = earnedIds.has(badge.id);
              const Icon = BADGE_ICONS[i % BADGE_ICONS.length];
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-opacity ${unlocked ? "border-brand-light/30 bg-brand/5" : "border-border opacity-40"}`}
                >
                  <div className={`h-10 w-10 rounded-full grid place-items-center ${unlocked ? "bg-gradient-to-br from-warning to-cta" : "bg-surface"}`}>
                    {unlocked ? <Icon className="h-5 w-5 text-background" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="text-[10px] leading-tight">{badge.name}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
