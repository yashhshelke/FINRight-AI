import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportsAPI, type FinancialReport } from "@/lib/api/reports";
import { FileText, Plus, Calendar, TrendingUp, Download } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/reports")({
  component: Reports,
});

function Reports() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => ReportsAPI.list(),
    staleTime: 5 * 60 * 1000,
  });

  const generateMutation = useMutation({
    mutationFn: () => ReportsAPI.generate(),
    onMutate: () => setGenerating(true),
    onSettled: () => setGenerating(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case "monthly": return "Monthly Report";
      case "money_replay": return "Money Replay";
      case "weekly": return "Weekly Report";
      default: return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generated financial reports and insights."
        action={
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {generating ? "Generating..." : "Generate Report"}
          </button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><Skeleton className="h-32 w-full" /></Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium">No reports yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Generate your first financial report to get an AI-powered analysis of your spending, savings, and financial health.
            </p>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generating}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-foreground disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {generating ? "Generating..." : "Generate First Report"}
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report: FinancialReport) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </>
  );
}

function ReportCard({ report }: { report: FinancialReport }) {
  const [expanded, setExpanded] = useState(false);

  const data = report.data || {};
  const highlights = data.highlights || data.summary || data.slides;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand/20 to-brand-light/20 grid place-items-center">
            <FileText className="h-5 w-5 text-brand-light" />
          </div>
          <div>
            <h3 className="text-sm font-medium line-clamp-1">{report.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface text-muted-foreground">
                {getTypeLabel(report.report_type)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span>{formatDate(report.created_at)}</span>
      </div>

      {highlights && (
        <div className="mt-3">
          {Array.isArray(highlights) ? (
            <ul className="space-y-1.5">
              {highlights.slice(0, expanded ? undefined : 3).map((item: any, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mt-0.5 text-brand-light shrink-0" />
                  <span>{typeof item === "string" ? item : item.headline || item.title || JSON.stringify(item)}</span>
                </li>
              ))}
            </ul>
          ) : typeof highlights === "string" ? (
            <p className="text-xs text-muted-foreground">{highlights}</p>
          ) : null}
          {Array.isArray(highlights) && highlights.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs text-brand-light hover:underline"
            >
              {expanded ? "Show less" : `+${highlights.length - 3} more`}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function getTypeLabel(type: string) {
  switch (type) {
    case "monthly": return "Monthly";
    case "money_replay": return "Replay";
    case "weekly": return "Weekly";
    default: return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
